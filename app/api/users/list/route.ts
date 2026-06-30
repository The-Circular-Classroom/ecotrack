import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/users/list - Paginated user list with optional username/email filter.
 * Admin-only endpoint used by the Users DataGrid page.
 * Requirements: 2.8, 3.1
 */
export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'Admin')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10))
  const username = searchParams.get('username') || ''

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

  return NextResponse.json({
    data,
    total,
    page,
    limit,
  })
}
