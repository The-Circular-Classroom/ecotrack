import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ schoolId: string }>
}

/**
 * GET /api/donation-drive/school/[schoolId] - Fetch all donation drives associated with a school.
 * Scoped to PsgVolunteer+
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('GET /api/donation-drive/school/[schoolId]')
  const role = request.headers.get('x-user-role')
  const { schoolId: schoolIdRaw } = await params

  if (!requireRole(role, 'PsgVolunteer')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'PsgVolunteer access required' },
      { status: 403 }
    )
  }

  const schoolId = parseInt(schoolIdRaw, 10)
  if (isNaN(schoolId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'School ID must be a valid integer' },
      { status: 400 }
    )
  }

  try {
    const drives = await prisma.donationDrive.findMany({
      where: { schoolId },
      include: {
        school: { select: { id: true, schoolName: true } },
        createdBy: { select: { id: true, fullName: true, email: true } }
      },
      orderBy: { startDate: 'desc' }
    })

    return NextResponse.json({ success: true, data: drives })
  } catch (error) {
    logger.error('Database error fetching school donation drives', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to fetch donation drives' },
      { status: 500 }
    )
  }
}
