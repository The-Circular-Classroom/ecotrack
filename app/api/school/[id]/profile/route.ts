import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole } from '@/lib/auth/roles'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/school/[id]/profile - Get school details and contacts (school staff + PSG volunteers).
 * Accessible to ParentSupportGroup (PsgVolunteer) and above.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('GET /api/school/[id]/profile')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  logger.info('Request received', { id, role })

  if (!requireRole(role, 'PsgVolunteer')) {
    logger.warn('Forbidden: insufficient role', { role })
    return NextResponse.json(
      { error: 'forbidden', message: 'PSG Volunteer or above access required' },
      { status: 403 }
    )
  }

  const schoolId = parseInt(id, 10)
  if (isNaN(schoolId)) {
    logger.warn('Invalid school ID', { id })
    return NextResponse.json(
      { error: 'invalid_id', message: 'School ID must be a valid integer' },
      { status: 400 }
    )
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        users: {
          where: {
            isActive: true,
            role: { in: ['SchoolStaff', 'PsgVolunteer'] }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            role: true
          },
          orderBy: { role: 'asc' }
        }
      }
    })

    if (!school) {
      logger.warn('School not found', { schoolId })
      return NextResponse.json(
        { error: 'not_found', message: 'School not found' },
        { status: 404 }
      )
    }

    const schoolStaff = school.users
      .filter((u) => u.role === 'SchoolStaff')
      .map((u) => ({
        id: u.id,
        name: u.fullName ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
        email: u.email,
        phoneNumber: u.phoneNumber ?? null,
        role: 'School Staff',
      }))

    const psgVolunteers = school.users
      .filter((u) => u.role === 'PsgVolunteer')
      .map((u) => ({
        id: u.id,
        name: u.fullName ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
        email: u.email,
        phoneNumber: u.phoneNumber ?? null,
        role: 'PSG Volunteer',
      }))

    logger.info('Response sent', { status: 200, schoolId })
    return NextResponse.json({
      success: true,
      message: 'School profile retrieved successfully',
      data: {
        schoolId: school.id,
        schoolName: school.schoolName,
        address: school.address,
        mrtDesc: school.mrtDesc,
        postalCode: school.postalCode,
        mainlevelCode: school.mainlevelCode,
        natureCode: school.natureCode,
        zoneCode: school.zoneCode,
        status: school.status,
        logoUrl: school.logoUrl || `/api/school/${school.id}/logo`,
        isCooperating: school.isCooperating,
        contacts: {
          schoolStaff,
          psgVolunteers,
        }
      }
    })
  } catch (err) {
    logger.error('Database error fetching school profile', {
      error: err instanceof Error ? err.message : String(err)
    })
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to fetch school profile' },
      { status: 500 }
    )
  }
}
