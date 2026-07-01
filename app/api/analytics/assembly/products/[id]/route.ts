import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/analytics/assembly/products/[id] - Update an assembly product name.
 * Admin role required.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'Admin')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  const { id } = await params
  const productId = parseInt(id, 10)
  if (!Number.isInteger(productId) || productId < 1) {
    return NextResponse.json(
      { error: 'validation_error', message: 'productId must be a valid positive integer' },
      { status: 400 }
    )
  }

  let body: { productName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Request body must be valid JSON' },
      { status: 400 }
    )
  }

  const productName = typeof body.productName === 'string' ? body.productName.trim() : ''
  if (!productName) {
    return NextResponse.json(
      { error: 'validation_error', message: 'productName is required' },
      { status: 400 }
    )
  }

  if (productName.length > 50) {
    return NextResponse.json(
      { error: 'validation_error', message: 'productName must not exceed 50 characters' },
      { status: 400 }
    )
  }

  const existing = await prisma.product.findUnique({ where: { id: productId } })
  if (!existing) {
    return NextResponse.json(
      { error: 'not_found', message: 'Product not found' },
      { status: 404 }
    )
  }

  // Check for duplicate name within the same school and product type
  const duplicate = await prisma.product.findFirst({
    where: {
      id: { not: productId },
      schoolId: existing.schoolId,
      productTypeId: existing.productTypeId,
      productName: { equals: productName, mode: 'insensitive' },
    },
  })

  if (duplicate) {
    return NextResponse.json(
      { error: 'conflict', message: 'A product with the same name and product type already exists for this school' },
      { status: 409 }
    )
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { productName },
    include: {
      productType: true,
      school: { select: { id: true, schoolName: true } },
      productStyles: { include: { style: true } },
    },
  })

  return NextResponse.json({ success: true, message: 'Product updated successfully', data: updated })
}

/**
 * DELETE /api/analytics/assembly/products/[id] - Delete an assembly product.
 * Admin role required.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'Admin')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  const { id } = await params
  const productId = parseInt(id, 10)
  if (!Number.isInteger(productId) || productId < 1) {
    return NextResponse.json(
      { error: 'validation_error', message: 'productId must be a valid positive integer' },
      { status: 400 }
    )
  }

  const existing = await prisma.product.findUnique({ where: { id: productId } })
  if (!existing) {
    return NextResponse.json(
      { error: 'not_found', message: 'Product not found' },
      { status: 404 }
    )
  }

  try {
    await prisma.product.delete({ where: { id: productId } })
    return NextResponse.json({ success: true, message: 'Product deleted successfully' })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        { error: 'conflict', message: 'Cannot delete product because it is referenced by styles, recipes, or transactions' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
