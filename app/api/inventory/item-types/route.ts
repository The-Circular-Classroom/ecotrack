import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { clampPageSize } from '@/lib/pagination'
import { prisma } from '@/lib/prisma/client'
import { getUniformImageUrl } from '@/lib/inventory/uniformImageUrl'

/**
 * GET /api/inventory/item-types - List item types with pagination.
 * SchoolStaff+ role required.
 * Requirements: 8.1, 8.2
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
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const rawPageSize = parseInt(searchParams.get('pageSize') || '', 10)
  const pageSize = clampPageSize(isNaN(rawPageSize) ? null : rawPageSize)
  const schoolId = searchParams.get('schoolId')
    ? parseInt(searchParams.get('schoolId')!, 10)
    : undefined

  const where = schoolId ? { schoolId } : {}

  const [itemTypes, total] = await Promise.all([
    prisma.itemType.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdDate: 'desc' },
      include: {
        school: { select: { id: true, schoolName: true } },
        category: { select: { id: true, categoryName: true } },
        primaryColour: { select: { id: true, colourName: true } },
        secondaryColour: { select: { id: true, colourName: true } },
        pattern: { select: { id: true, patternName: true } },
        material: { select: { id: true, materialName: true } },
        sizeCategory: { select: { id: true, sizeType: true } },
      },
    }),
    prisma.itemType.count({ where }),
  ])

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const enrichedItemTypes = itemTypes.map((itemType) => ({
    ...itemType,
    imageUrl: getUniformImageUrl(
      supabaseUrl,
      itemType.category?.categoryName ?? null,
      itemType.primaryColour?.colourName ?? null,
      itemType.imageUrl
    ),
  }))

  return NextResponse.json({
    itemTypes: enrichedItemTypes,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  })
}

/**
 * POST /api/inventory/item-types - Create a new item type.
 * SchoolStaff+ role required.
 * Requirements: 8.1
 */
export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  let body: {
    schoolId?: number
    categoryId?: number
    primaryColourId?: number
    secondaryColourId?: number | null
    patternId?: number | null
    materialId?: number | null
    sizeCategoryId?: number
    gender?: string
    imageUrl?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { schoolId, categoryId, primaryColourId, sizeCategoryId, gender } = body

  if (!schoolId || !categoryId || !primaryColourId || !sizeCategoryId) {
    return NextResponse.json(
      {
        error: 'missing_field',
        message: 'schoolId, categoryId, primaryColourId, and sizeCategoryId are required',
      },
      { status: 400 }
    )
  }

  const validGenders = ['Unisex', 'Male', 'Female']
  const genderValue = gender && validGenders.includes(gender) ? gender : 'Unisex'

  try {
    const itemType = await prisma.itemType.create({
      data: {
        schoolId,
        categoryId,
        primaryColourId,
        secondaryColourId: body.secondaryColourId ?? null,
        patternId: body.patternId ?? null,
        materialId: body.materialId ?? null,
        sizeCategoryId,
        gender: genderValue as 'Unisex' | 'Male' | 'Female',
        imageUrl: body.imageUrl ?? null,
      },
      include: {
        school: { select: { id: true, schoolName: true } },
        category: { select: { id: true, categoryName: true } },
        primaryColour: { select: { id: true, colourName: true } },
        sizeCategory: { select: { id: true, sizeType: true } },
      },
    })

    return NextResponse.json({ itemType }, { status: 201 })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        { error: 'invalid_reference', message: 'One or more referenced entities do not exist' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to create item type' },
      { status: 500 }
    )
  }
}
