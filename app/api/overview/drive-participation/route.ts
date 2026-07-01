import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get('year')
  const year = yearParam ? parseInt(yearParam, 10) : undefined

  try {
    const totalSchools = await prisma.school.count()

    const driveWhere: any = {}
    if (year) {
      driveWhere.startDate = {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1))
      }
    }

    const drives = await prisma.donationDrive.findMany({
      where: driveWhere,
      include: {
        school: true
      }
    })

    const schoolMap: Record<number, any> = {}
    for (const drive of drives) {
      if (!drive.school) continue
      const sid = drive.school.id

      if (!schoolMap[sid]) {
        schoolMap[sid] = {
          schoolId: sid,
          schoolName: drive.school.schoolName,
          isCooperating: drive.school.isCooperating,
          driveCount: 0,
          drives: []
        }
      }

      schoolMap[sid].driveCount += 1
      schoolMap[sid].drives.push({
        driveId: drive.id,
        driveName: drive.driveName,
        startDate: drive.startDate.toISOString(),
        endDate: drive.endDate.toISOString(),
        isActive: drive.startDate <= new Date() && drive.endDate >= new Date()
      })
    }

    const participatingSchools = Object.values(schoolMap).sort((a: any, b: any) =>
      a.schoolName.localeCompare(b.schoolName)
    )

    const participatingCount = participatingSchools.length
    const participationRate =
      totalSchools > 0
        ? Number(((participatingCount / totalSchools) * 100).toFixed(2))
        : 0

    return NextResponse.json({
      success: true,
      message: 'Drive participation summary retrieved successfully',
      data: {
        filters: { year },
        totalSchools,
        participatingCount,
        nonParticipatingCount: totalSchools - participatingCount,
        participationRate,
        schools: participatingSchools
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'database_error', message: error?.message || 'Failed to fetch drive participation summary' },
      { status: 500 }
    )
  }
}
