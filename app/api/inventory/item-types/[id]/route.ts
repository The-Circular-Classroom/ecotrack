import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/inventory/item-types/[id] - Get a single item type.
 * SchoolStaff+ role required.
 * Requirements: 8.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const { id } = await params
  const itemTypeId = parseInt(id, 10)
  if (isNaN(itemTypeId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Item type ID must be a number' },
      { status: 400 }
    )
  }

  const itemType = await prisma.itemType.findUnique({
    where: { id: itemTypeId },
    include: {
      school: { select: { id: true, schoolName: true } },
      category: { select: { id: true, categoryName: true } },
      primaryColour: { select: { id: true, colourName: true } },
      secondaryColour: { select: { id: true, colourName: true } },
      pattern: { select: { id: true, patternName: true } },
      material: { select: { id: true, materialName: true } },
      sizeCategory: {
        select: {
          id: true,
          sizeType: true,
          sizeOptions: { select: { id: true, sizeName: true, sortOrder: true } },
        },
      },
    },
  })

  if (!itemType) {
    return NextResponse.json(
      { error: 'not_found', message: 'Item type not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ itemType })
}

/**
 * PATCH /api/inventory/item-types/[id] - Update an item type.
 * SchoolStaff+ role required.
 * Requirements: 8.1
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const { id } = await params
  const itemTypeId = parseInt(id, 10)
  if (isNaN(itemTypeId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Item type ID must be a number' },
      { status: 400 }
    )
  }

  let body: {
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

  // Build update data from provided fields
  const data: Record<string, unknown> = {}
  if (body.categoryId !== undefined) data.categoryId = body.categoryId
  if (body.primaryColourId !== undefined) data.primaryColourId = body.primaryColourId
  if (body.secondaryColourId !== undefined) data.secondaryColourId = body.secondaryColourId
  if (body.patternId !== undefined) data.patternId = body.patternId
  if (body.materialId !== undefined) data.materialId = body.materialId
  if (body.sizeCategoryId !== undefined) data.sizeCategoryId = body.sizeCategoryId
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl
  if (body.gender !== undefined) {
    const validGenders = ['Unisex', 'Male', 'Female']
    if (validGenders.includes(body.gender)) {
      data.gender = body.gender
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: 'no_fields', message: 'No valid fields to update' },
      { status: 400 }
    )
  }

  try {
    const itemType = await prisma.itemType.update({
      where: { id: itemTypeId },
      data,
      include: {
        school: { select: { id: true, schoolName: true } },
        category: { select: { id: true, categoryName: true } },
        primaryColour: { select: { id: true, colourName: true } },
        sizeCategory: { select: { id: true, sizeType: true } },
      },
    })

    return NextResponse.json({ itemType })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: 'not_found', message: 'Item type not found' },
        { status: 404 }
      )
    }
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        { error: 'invalid_reference', message: 'One or more referenced entities do not exist' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to update item type' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/inventory/item-types/[id] - Delete an item type.
 * Rejects deletion if item type has associated transactions or inventory balances.
 * SchoolStaff+ role required.
 * Requirements: 8.1 (deletion guard)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const { id } = await params
  const itemTypeId = parseInt(id, 10)
  if (isNaN(itemTypeId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Item type ID must be a number' },
      { status: 400 }
    )
  }

  // Check if item type exists
  const itemType = await prisma.itemType.findUnique({
    where: { id: itemTypeId },
  })

  if (!itemType) {
    return NextResponse.json(
      { error: 'not_found', message: 'Item type not found' },
      { status: 404 }
    )
  }

  // Deletion guard: check for associated transactions or balances
  const [transactionCount, balanceCount] = await Promise.all([
    prisma.transaction.count({ where: { itemTypeId } }),
    prisma.inventoryBalance.count({ where: { itemTypeId } }),
  ])

  if (transactionCount > 0 || balanceCount > 0) {
    return NextResponse.json(
      {
        error: 'deletion_blocked',
        message: 'Cannot delete item type with associated transactions or inventory balances',
        details: {
          transactions: transactionCount,
          balances: balanceCount,
        },
      },
      { status: 422 }
    )
  }

  await prisma.itemType.delete({ where: { id: itemTypeId } })

  return NextResponse.json({ success: true, message: 'Item type deleted' })
}
