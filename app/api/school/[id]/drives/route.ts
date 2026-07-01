import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('GET /api/school/[id]/drives')
  const role = request.headers.get('x-user-role')
  const { id: schoolIdRaw } = await params

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
        createdBy: { select: { id: true, fullName: true, role: true } }
      },
      orderBy: { startDate: 'desc' }
    })

    const now = new Date()
    const result = drives.map((drive) => {
      const start = new Date(drive.startDate)
      const end = new Date(drive.endDate)
      const isActive = start <= now && end >= now
      const isUpcoming = start > now
      const isCompleted = end < now

      return {
        driveId: drive.id,
        driveName: drive.driveName,
        startDate: drive.startDate.toISOString(),
        endDate: drive.endDate.toISOString(),
        location: drive.location,
        status: isActive ? 'active' : isUpcoming ? 'upcoming' : 'completed',
        isActive,
        isUpcoming,
        isCompleted,
        createdBy: drive.createdBy
          ? {
              id: drive.createdBy.id,
              name: drive.createdBy.fullName,
              role: drive.createdBy.role,
            }
          : null,
      }
    })

    const summary = {
      total: result.length,
      active: result.filter((d) => d.isActive).length,
      upcoming: result.filter((d) => d.isUpcoming).length,
      completed: result.filter((d) => d.isCompleted).length,
    }

    return NextResponse.json({
      success: true,
      message: 'School drive list retrieved successfully',
      data: { summary, drives: result },
    })
  } catch (error: any) {
    logger.error('Database error fetching school drives', { error: error?.message })
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to fetch drives' },
      { status: 500 }
    )
  }
}
