import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/assembly/product-types/[id] - Update product type name.
 * DELETE /api/assembly/product-types/[id] - Delete product type.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('PUT /api/assembly/product-types/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  const productTypeId = parseInt(id, 10)
  if (isNaN(productTypeId)) {
    return NextResponse.json({ error: 'invalid_id', message: 'Product Type ID must be a valid integer' }, { status: 400 })
  }

  let body: { typeName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body', message: 'Invalid JSON body' }, { status: 400 })
  }

  const { typeName } = body
  if (!typeName) {
    return NextResponse.json({ error: 'missing_field', message: 'typeName is required' }, { status: 400 })
  }

  try {
    const updated = await prisma.productType.update({
      where: { id: productTypeId },
      data: { typeName },
      select: { id: true, typeName: true }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    logger.error('Error updating product type', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('DELETE /api/assembly/product-types/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  const productTypeId = parseInt(id, 10)
  if (isNaN(productTypeId)) {
    return NextResponse.json({ error: 'invalid_id', message: 'Product Type ID must be a valid integer' }, { status: 400 })
  }

  try {
    await prisma.productType.delete({
      where: { id: productTypeId }
    })

    return NextResponse.json({ success: true, message: 'Product type deleted successfully' })
  } catch (error: any) {
    logger.error('Error deleting product type', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
