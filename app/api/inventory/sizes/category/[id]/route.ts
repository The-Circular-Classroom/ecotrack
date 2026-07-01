import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/inventory/sizes/category/[id] - Update a size category.
 * DELETE /api/inventory/sizes/category/[id] - Delete a size category.
 * SchoolStaff+ role required.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('PATCH /api/inventory/sizes/category/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const categoryId = parseInt(id, 10)
  if (isNaN(categoryId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Category ID must be a valid integer' },
      { status: 400 }
    )
  }

  let body: { brandSupplierId?: number | null; sizeType?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (body.brandSupplierId !== undefined) updates.brandSupplierId = body.brandSupplierId
  if (body.sizeType !== undefined) updates.sizeType = body.sizeType

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'invalid_body', message: 'At least one field must be provided' },
      { status: 400 }
    )
  }

  try {
    const updated = await prisma.sizeCategory.update({
      where: { id: categoryId },
      data: updates
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to update size category' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('DELETE /api/inventory/sizes/category/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const categoryId = parseInt(id, 10)
  if (isNaN(categoryId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Category ID must be a valid integer' },
      { status: 400 }
    )
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.sizeOption.deleteMany({
        where: { sizeCategoryId: categoryId }
      })
      await tx.sizeCategory.delete({
        where: { id: categoryId }
      })
    })

    return NextResponse.json({ success: true, message: 'Size category deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to delete size category' },
      { status: 500 }
    )
  }
}
