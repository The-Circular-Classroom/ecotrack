import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/assembly/products/[id] - Update product name.
 * DELETE /api/assembly/products/[id] - Delete product.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('PUT /api/assembly/products/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  const productId = parseInt(id, 10)
  if (isNaN(productId)) {
    return NextResponse.json({ error: 'invalid_id', message: 'Product ID must be a valid integer' }, { status: 400 })
  }

  let body: { productName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body', message: 'Invalid JSON body' }, { status: 400 })
  }

  const { productName } = body
  if (!productName) {
    return NextResponse.json({ error: 'missing_field', message: 'productName is required' }, { status: 400 })
  }

  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { productName },
      include: {
        school: { select: { id: true, schoolName: true } },
        productType: { select: { id: true, typeName: true } }
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    logger.error('Error updating product', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('DELETE /api/assembly/products/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  const productId = parseInt(id, 10)
  if (isNaN(productId)) {
    return NextResponse.json({ error: 'invalid_id', message: 'Product ID must be a valid integer' }, { status: 400 })
  }

  try {
    await prisma.product.delete({
      where: { id: productId }
    })

    return NextResponse.json({ success: true, message: 'Product deleted successfully' })
  } catch (error: any) {
    logger.error('Error deleting product', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
