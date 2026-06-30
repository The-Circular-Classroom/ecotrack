import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/schools - Fetch all schools ordered by name.
 * Used by CreateUserModal dropdown for school selection.
 * Accessible to any authenticated user (middleware enforces auth).
 * Requirements: 2.8, 3.1
 */
export async function GET() {
  try {
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

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to fetch schools' },
      { status: 500 }
    )
  }
}
