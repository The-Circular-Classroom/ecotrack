import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

/**
 * GET /api/school/psg - Fetch the school details for the currently logged-in user.
 * Used by non-admin users to resolve their associated school.
 * Extracts user ID from x-user-id header set by the proxy/middleware.
 */
export async function GET(request: NextRequest) {
  const logger = createApiLogger('GET /api/school/psg')
  const userId = request.headers.get('x-user-id')

  logger.info('Request received', { userId })

  if (!userId) {
    logger.warn('Unauthorized: missing x-user-id header')
    return NextResponse.json(
      { error: 'unauthorized', message: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // Look up the user's school association
    const user = await prisma.user.findUnique({
      where: { supabaseAuthId: userId },
      include: { school: true }
    })

    if (!user) {
      logger.warn('User not found in DB', { userId })
      return NextResponse.json(
        { error: 'not_found', message: 'User record not found' },
        { status: 404 }
      )
    }

    if (!user.school) {
      logger.warn('User has no school assigned', { userId })
      return NextResponse.json(
        { error: 'not_found', message: 'No school assigned to this user' },
        { status: 404 }
      )
    }

    const schoolData = {
      id: user.school.id,
      schoolName: user.school.schoolName,
      address: user.school.address,
      mrtDesc: user.school.mrtDesc,
      postalCode: user.school.postalCode,
      zoneCode: user.school.zoneCode,
      status: user.school.status,
      logoUrl: user.school.logoUrl,
      isCooperating: user.school.isCooperating,
    }

    logger.info('Response sent', { status: 200, schoolId: user.school.id })
    return NextResponse.json({ data: schoolData })
  } catch (err) {
    logger.error('Database error fetching user school', {
      error: err instanceof Error ? err.message : String(err)
    })
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to fetch school details' },
      { status: 500 }
    )
  }
}
