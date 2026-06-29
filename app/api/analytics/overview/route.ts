import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { getSchoolOverview, getPlatformOverview } from '@/lib/analytics/overview'

/**
 * GET /api/analytics/overview - Overview statistics endpoint.
 * If ?schoolId is provided, returns school-level overview.
 * Otherwise, returns platform-wide overview.
 *
 * Query params: schoolId (optional)
 * SchoolStaff+ role required.
 * Requirements: 9.3, 9.5
 */
export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const schoolIdParam = searchParams.get('schoolId')

  if (schoolIdParam) {
    const schoolId = parseInt(schoolIdParam, 10)
    if (isNaN(schoolId) || schoolId < 1) {
      return NextResponse.json(
        { error: 'validation_error', message: 'schoolId must be a positive integer' },
        { status: 400 }
      )
    }

    try {
      const overview = await getSchoolOverview(prisma, schoolId)
      return NextResponse.json(overview)
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return NextResponse.json(
          { error: 'not_found', message: `School with id ${schoolId} not found` },
          { status: 404 }
        )
      }
      throw error
    }
  }

  const overview = await getPlatformOverview(prisma)
  return NextResponse.json(overview)
}
