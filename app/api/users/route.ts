import { NextRequest, NextResponse } from 'next/server'
import { requireRole, isValidRole } from '@/lib/auth/roles'
import { clampPageSize } from '@/lib/pagination'
import { prisma } from '@/lib/prisma/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createApiLogger } from '@/lib/logger'

/**
 * GET /api/users - List users with pagination and optional email filter.
 * Admin-only endpoint.
 * Requirements: 4.2, 3.4, 3.5
 */
export async function GET(request: NextRequest) {
  const logger = createApiLogger('GET /api/users');
  const role = request.headers.get('x-user-role')
  logger.info('Request received', { role });

  if (!requireRole(role, 'Admin')) {
    logger.warn('Forbidden: insufficient role', { role });
    return NextResponse.json(
      { error: 'forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const rawPageSize = parseInt(searchParams.get('pageSize') || '', 10)
  const pageSize = clampPageSize(isNaN(rawPageSize) ? null : rawPageSize)
  const search = searchParams.get('search') || searchParams.get('q') || searchParams.get('email') || undefined
  logger.debug('Query params', { page, pageSize, search });

  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phoneNumber: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  logger.debug('Querying Prisma for users');
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdDate: 'desc' },
    }),
    prisma.user.count({ where }),
  ])

  logger.info('Response sent', { status: 200, total, page, pageSize });
  return NextResponse.json({
    users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  })
}

/**
 * POST /api/users - Create a new user.
 * Admin-only endpoint.
 * Requirements: 4.1, 4.7, 3.4, 3.5
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/users');
  const role = request.headers.get('x-user-role')
  logger.info('Request received', { role });

  if (!requireRole(role, 'Admin')) {
    logger.warn('Forbidden: insufficient role', { role });
    return NextResponse.json(
      { error: 'forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  let body: { email?: string; role?: string; schoolId?: number; firstName?: string; lastName?: string }
  try {
    body = await request.json()
  } catch {
    logger.warn('Invalid JSON body');
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { email, role: userRole, schoolId, firstName, lastName } = body
  logger.debug('Create user request', { email, userRole, schoolId });

  if (!email) {
    logger.warn('Validation failed: missing email');
    return NextResponse.json(
      { error: 'missing_field', message: 'Email is required' },
      { status: 400 }
    )
  }

  if (!userRole) {
    logger.warn('Validation failed: missing role');
    return NextResponse.json(
      { error: 'missing_field', message: 'Role is required' },
      { status: 400 }
    )
  }

  // Validate role value (Requirement 3.7)
  if (!isValidRole(userRole)) {
    logger.warn('Validation failed: invalid role', { userRole });
    return NextResponse.json(
      {
        error: 'invalid_role',
        message: 'Invalid role. Must be one of: Admin, SchoolStaff, PsgVolunteer, Parent',
      },
      { status: 400 }
    )
  }

  logger.debug('Validation passed');

  // Generate a temporary password (minimum 12 characters)
  const tempPassword = generateTempPassword()

  // Create user in Supabase Auth
  logger.debug('Creating user in Supabase Auth', { email });
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    app_metadata: { role: userRole, force_password_change: true },
    user_metadata: {
      first_name: firstName || '',
      last_name: lastName || '',
      full_name: [firstName, lastName].filter(Boolean).join(' '),
    },
  })

  if (authError) {
    if (authError.message?.toLowerCase().includes('already') || authError.status === 422) {
      logger.warn('Duplicate email in Supabase', { email });
      return NextResponse.json(
        { error: 'duplicate_email', message: 'Email is already in use' },
        { status: 409 }
      )
    }
    logger.error('Supabase createUser failed', { error: authError.message });
    return NextResponse.json(
      { error: 'auth_error', message: 'Failed to create user in auth system' },
      { status: 500 }
    )
  }

  logger.info('Supabase user created', { userId: authUser.user.id, email });

  // Create corresponding DB record
  try {
    logger.debug('Creating Prisma user record');
    const user = await prisma.user.create({
      data: {
        supabaseAuthId: authUser.user.id,
        email,
        role: userRole as 'Admin' | 'SchoolStaff' | 'PsgVolunteer' | 'Parent',
        firstName: firstName || null,
        lastName: lastName || null,
        fullName: [firstName, lastName].filter(Boolean).join(' ') || null,
        isActive: true,
        schoolId: schoolId || null,
        userFlags: {
          onboarding_completed: false,
          must_change_password: true,
        },
      },
    })

    logger.info('Response sent', { status: 201, userId: user.id });
    return NextResponse.json({ user }, { status: 201 })
  } catch (dbError: unknown) {
    // Roll back auth user creation on DB failure
    logger.error('Prisma user creation failed, rolling back Supabase user', { error: (dbError as Error).message });
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)

    const error = dbError as { code?: string }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'duplicate_email', message: 'Email is already in use' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to create user record' },
      { status: 500 }
    )
  }
}

/**
 * Generate a temporary password with minimum 12 characters.
 * Contains uppercase, lowercase, digits, and special characters.
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
