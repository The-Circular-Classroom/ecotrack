import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/inventory/sizes/option/[id] - Update a size option.
 * DELETE /api/inventory/sizes/option/[id] - Delete a size option.
 * SchoolStaff+ role required.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('PATCH /api/inventory/sizes/option/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const optionId = parseInt(id, 10)
  if (isNaN(optionId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Option ID must be a valid integer' },
      { status: 400 }
    )
  }

  let body: { size_category_id?: number; size_name?: string; size_class?: string; sort_order?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (body.size_category_id !== undefined) updates.sizeCategoryId = Number(body.size_category_id)
  if (body.size_name !== undefined) updates.sizeName = body.size_name
  if (body.size_class !== undefined) updates.sizeClass = body.size_class
  if (body.sort_order !== undefined) updates.sortOrder = Number(body.sort_order)

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'invalid_body', message: 'At least one field must be provided' },
      { status: 400 }
    )
  }

  try {
    const updated = await prisma.sizeOption.update({
      where: { id: optionId },
      data: updates
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to update size option' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('DELETE /api/inventory/sizes/option/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const optionId = parseInt(id, 10)
  if (isNaN(optionId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Option ID must be a valid integer' },
      { status: 400 }
    )
  }

  try {
    await prisma.sizeOption.delete({
      where: { id: optionId }
    })

    return NextResponse.json({ success: true, message: 'Size option deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to delete size option' },
      { status: 500 }
    )
  }
}
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('GET /api/inventory/sizes/option/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const optionId = parseInt(id, 10)
  if (isNaN(optionId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Option ID must be a valid integer' },
      { status: 400 }
    )
  }

  const opt = await prisma.sizeOption.findUnique({
    where: { id: optionId }
  })

  if (!opt) {
    return NextResponse.json(
      { error: 'not_found', message: 'Size option not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: opt })
}
