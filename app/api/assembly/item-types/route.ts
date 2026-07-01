import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

/**
 * GET /api/assembly/item-types?schoolId=1 - Fetch item types for a school.
 */
export async function GET(request: NextRequest) {
  const logger = createApiLogger('GET /api/assembly/item-types')
  const role = request.headers.get('x-user-role')

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const schoolIdParam = searchParams.get('schoolId')
  if (!schoolIdParam) {
    return NextResponse.json({ error: 'missing_query', message: 'schoolId parameter is required' }, { status: 400 })
  }

  const schoolId = parseInt(schoolIdParam, 10)
  if (isNaN(schoolId)) {
    return NextResponse.json({ error: 'invalid_id', message: 'schoolId must be a valid integer' }, { status: 400 })
  }

  try {
    const itemTypes = await prisma.itemType.findMany({
      where: { schoolId },
      orderBy: [
        { category: { categoryName: 'asc' } },
        { id: 'asc' }
      ],
      select: {
        id: true,
        schoolId: true,
        gender: true,
        imageUrl: true,
        createdDate: true,
        category: { select: { id: true, categoryName: true } },
        sizeCategory: {
          select: {
            id: true,
            sizeType: true,
            sizeOptions: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, sizeName: true, sizeClass: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: itemTypes })
  } catch (error: any) {
    logger.error('Error fetching item types by school', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
