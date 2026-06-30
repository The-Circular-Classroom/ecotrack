import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

/**
 * GET /api/users/list - Paginated user list with optional username/email filter.
 * Admin-only endpoint used by the Users DataGrid page.
 * Requirements: 2.8, 3.1
 */
export async function GET(request: NextRequest) {
  const logger = createApiLogger('GET /api/users/list');
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
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10))
  const username = searchParams.get('username') || ''
  logger.debug('Query params', { page, limit, username });

  const skip = (page - 1) * limit
  const take = limit

  // Build where filter: search by email or name if username param provided
  const where = username
    ? {
        OR: [
          { email: { contains: username, mode: 'insensitive' as const } },
          { firstName: { contains: username, mode: 'insensitive' as const } },
          { lastName: { contains: username, mode: 'insensitive' as const } },
          { fullName: { contains: username, mode: 'insensitive' as const } },
        ],
      }
    : {}

  logger.debug('Querying Prisma for users');
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdDate: 'desc' },
      include: {
        school: {
          select: { id: true, schoolName: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  const data = users.map((user) => ({
    id: user.id,
    username: user.email,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    role: user.role,
    schoolId: user.schoolId,
    schoolName: user.school?.schoolName || null,
    isActive: user.isActive,
    createdAt: user.createdDate,
  }))

  logger.info('Response sent', { status: 200, total, page, limit, resultCount: data.length });
  return NextResponse.json({
    data,
    total,
    page,
    limit,
  })
}
