import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/inventory/categories/[id] - Get a single category.
 * PATCH /api/inventory/categories/[id] - Update a category.
 * DELETE /api/inventory/categories/[id] - Delete a category.
 * SchoolStaff+ role required.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('GET /api/inventory/categories/[id]')
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

  const category = await prisma.category.findUnique({
    where: { id: categoryId }
  })

  if (!category) {
    return NextResponse.json(
      { error: 'not_found', message: 'Category not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: category })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('PATCH /api/inventory/categories/[id]')
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

  let body: { category_name?: string; weight_kg?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (body.category_name !== undefined) updates.categoryName = body.category_name
  if (body.weight_kg !== undefined) updates.weightKg = body.weight_kg

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'invalid_body', message: 'At least one field must be provided' },
      { status: 400 }
    )
  }

  try {
    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: updates
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('DELETE /api/inventory/categories/[id]')
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
    await prisma.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({ success: true, message: 'Category deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to delete category. It might be referenced by other records.' },
      { status: 500 }
    )
  }
}
