import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('GET /api/school/[id]/collaborations')
  const role = request.headers.get('x-user-role')
  const { id: schoolIdRaw } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
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
    const partnerships = await prisma.schoolPartnership.findMany({
      where: { schoolId },
      orderBy: { yearConducted: 'desc' }
    })

    const byYear: Record<string, any[]> = {}
    for (const p of partnerships) {
      const year = p.yearConducted ? String(p.yearConducted) : 'Year unknown'
      if (!byYear[year]) byYear[year] = []
      byYear[year].push({
        id: p.id,
        activityName: p.activityName,
        remarks: p.remarks
      })
    }

    const byYearArray = Object.entries(byYear)
      .sort(([a], [b]) => {
        if (a === 'Year unknown') return 1
        if (b === 'Year unknown') return -1
        return Number(b) - Number(a)
      })
      .map(([year, activities]) => ({ year, activities }))

    return NextResponse.json({
      success: true,
      message: 'School collaborations retrieved successfully',
      data: {
        schoolId,
        total: partnerships.length,
        collaborations: partnerships.map((p) => ({
          id: p.id,
          activityName: p.activityName,
          yearConducted: p.yearConducted,
          remarks: p.remarks
        })),
        byYear: byYearArray
      }
    })
  } catch (error: any) {
    logger.error('Database error fetching school collaborations', { error: error?.message })
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to fetch collaborations' },
      { status: 500 }
    )
  }
}
