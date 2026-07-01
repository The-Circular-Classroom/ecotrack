import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/analytics/assembly/product-types/[id] - Update a product type name.
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
  const productTypeId = parseInt(id, 10)
  if (!Number.isInteger(productTypeId) || productTypeId < 1) {
    return NextResponse.json(
      { error: 'validation_error', message: 'productTypeId must be a valid positive integer' },
      { status: 400 }
    )
  }

  let body: { typeName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Request body must be valid JSON' },
      { status: 400 }
    )
  }

  const typeName = typeof body.typeName === 'string' ? body.typeName.trim() : ''
  if (!typeName) {
    return NextResponse.json(
      { error: 'validation_error', message: 'typeName is required' },
      { status: 400 }
    )
  }

  if (typeName.length > 50) {
    return NextResponse.json(
      { error: 'validation_error', message: 'typeName must not exceed 50 characters' },
      { status: 400 }
    )
  }

  const existing = await prisma.productType.findUnique({ where: { id: productTypeId } })
  if (!existing) {
    return NextResponse.json(
      { error: 'not_found', message: 'Product type not found' },
      { status: 404 }
    )
  }

  // Check for duplicate name
  const duplicate = await prisma.productType.findFirst({
    where: {
      id: { not: productTypeId },
      typeName: { equals: typeName, mode: 'insensitive' },
    },
  })

  if (duplicate) {
    return NextResponse.json(
      { error: 'conflict', message: 'Product type already exists' },
      { status: 409 }
    )
  }

  const updated = await prisma.productType.update({
    where: { id: productTypeId },
    data: { typeName },
  })

  return NextResponse.json({ success: true, message: 'Product type updated successfully', data: updated })
}

/**
 * DELETE /api/analytics/assembly/product-types/[id] - Delete a product type.
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
  const productTypeId = parseInt(id, 10)
  if (!Number.isInteger(productTypeId) || productTypeId < 1) {
    return NextResponse.json(
      { error: 'validation_error', message: 'productTypeId must be a valid positive integer' },
      { status: 400 }
    )
  }

  const existing = await prisma.productType.findUnique({ where: { id: productTypeId } })
  if (!existing) {
    return NextResponse.json(
      { error: 'not_found', message: 'Product type not found' },
      { status: 404 }
    )
  }

  try {
    await prisma.productType.delete({ where: { id: productTypeId } })
    return NextResponse.json({ success: true, message: 'Product type deleted successfully' })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        { error: 'conflict', message: 'Cannot delete product type because it is assigned to one or more products' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to delete product type' },
      { status: 500 }
    )
  }
}
