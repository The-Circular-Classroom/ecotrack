import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

/**
 * GET /api/schools - Fetch all schools ordered by name.
 * Used by CreateUserModal dropdown for school selection.
 * Accessible to any authenticated user (middleware enforces auth).
 * Requirements: 2.8, 3.1
 */
export async function GET() {
  const logger = createApiLogger('GET /api/schools');
  try {
    logger.info('Request received');
    logger.debug('Querying Prisma for schools');

    const schools = await prisma.school.findMany({
      orderBy: { schoolName: 'asc' },
    })

    const data = schools.map((school) => ({
      id: school.id,
      name: school.schoolName,
      address: school.address,
      postalCode: school.postalCode,
      zoneCode: school.zoneCode,
      status: school.status,
      isCooperating: school.isCooperating,
    }))

    logger.info('Response sent', { status: 200, count: data.length });
    return NextResponse.json({ data })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to fetch schools' },
      { status: 500 }
    )
  }
}
