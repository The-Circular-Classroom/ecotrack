import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/inventory/brands/[id] - Get a single brand supplier.
 * PATCH /api/inventory/brands/[id] - Update a brand supplier.
 * DELETE /api/inventory/brands/[id] - Delete a brand supplier.
 * SchoolStaff+ role required.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('GET /api/inventory/brands/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const brandId = parseInt(id, 10)
  if (isNaN(brandId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Brand ID must be a valid integer' },
      { status: 400 }
    )
  }

  const brand = await prisma.brandSupplier.findUnique({
    where: { id: brandId }
  })

  if (!brand) {
    return NextResponse.json(
      { error: 'not_found', message: 'Brand not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: brand })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('PATCH /api/inventory/brands/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const brandId = parseInt(id, 10)
  if (isNaN(brandId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Brand ID must be a valid integer' },
      { status: 400 }
    )
  }

  let body: { brandSupplier?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { brandSupplier } = body
  if (!brandSupplier) {
    return NextResponse.json(
      { error: 'missing_field', message: 'brandSupplier is required' },
      { status: 400 }
    )
  }

  try {
    const updated = await prisma.brandSupplier.update({
      where: { id: brandId },
      data: { brandSupplier }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to update brand' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('DELETE /api/inventory/brands/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const brandId = parseInt(id, 10)
  if (isNaN(brandId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Brand ID must be a valid integer' },
      { status: 400 }
    )
  }

  try {
    // Check validation checks from brandController.js
    const categories = await prisma.sizeCategory.findMany({
      where: { brandSupplierId: brandId },
      include: {
        itemTypes: true,
        sizeOptions: {
          include: {
            transactions: true,
            inventoryBalances: true,
          }
        }
      }
    })

    if (categories.some((c) => c.itemTypes.length > 0)) {
      return NextResponse.json(
        {
          error: 'conflict',
          message: 'Cannot delete this brand — its size categories are referenced by existing item type presets. Remove those presets first.'
        },
        { status: 409 }
      )
    }

    if (
      categories.some((c) =>
        c.sizeOptions.some(
          (o) => o.transactions.length > 0 || o.inventoryBalances.length > 0
        )
      )
    ) {
      return NextResponse.json(
        {
          error: 'conflict',
          message: 'Cannot delete this brand — its size options are referenced by existing transactions or inventory records.'
        },
        { status: 409 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.sizeOption.deleteMany({
        where: { sizeCategory: { brandSupplierId: brandId } }
      })
      await tx.sizeCategory.deleteMany({
        where: { brandSupplierId: brandId }
      })
      await tx.brandSupplier.delete({
        where: { id: brandId }
      })
    })

    return NextResponse.json({ success: true, message: 'Brand deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to delete brand' },
      { status: 500 }
    )
  }
}
