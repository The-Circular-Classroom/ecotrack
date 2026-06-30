import { NextRequest, NextResponse } from 'next/server'
import { requireRole, isValidRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * POST /api/users/create - Create a new user with role and school assignment.
 * Admin-only endpoint.
 * Requirements: 2.8, 3.1, 3.5
 */
export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'Admin')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  let body: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    assignedRole?: string
    schoolId?: number
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { firstName, lastName, email, phone, assignedRole, schoolId } = body

  if (!email) {
    return NextResponse.json(
      { error: 'missing_field', message: 'Email is required' },
      { status: 400 }
    )
  }

  if (!assignedRole) {
    return NextResponse.json(
      { error: 'missing_field', message: 'Assigned role is required' },
      { status: 400 }
    )
  }

  if (!isValidRole(assignedRole)) {
    return NextResponse.json(
      {
        error: 'invalid_role',
        message: 'Invalid role. Must be one of: Admin, SchoolStaff, PsgVolunteer, Parent',
      },
      { status: 400 }
    )
  }

  // Generate a temporary password (minimum 12 characters)
  const tempPassword = generateTempPassword()

  // Create user in Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    app_metadata: { role: assignedRole },
    user_metadata: {
      first_name: firstName || '',
      last_name: lastName || '',
      full_name: [firstName, lastName].filter(Boolean).join(' '),
      phone: phone || '',
    },
  })

  if (authError) {
    if (authError.message?.toLowerCase().includes('already') || authError.status === 422) {
      return NextResponse.json(
        { error: 'duplicate_email', message: 'Email is already in use' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'auth_error', message: 'Failed to create user in auth system' },
      { status: 500 }
    )
  }

  // Create corresponding DB record
  try {
    const user = await prisma.user.create({
      data: {
        supabaseAuthId: authUser.user.id,
        email,
        role: assignedRole as 'Admin' | 'SchoolStaff' | 'PsgVolunteer' | 'Parent',
        firstName: firstName || null,
        lastName: lastName || null,
        fullName: [firstName, lastName].filter(Boolean).join(' ') || null,
        isActive: true,
        schoolId: schoolId || null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          schoolId: user.schoolId,
          isActive: user.isActive,
        },
      },
      { status: 201 }
    )
  } catch (dbError: unknown) {
    // Roll back auth user creation on DB failure
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
