import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/inventory/sizes - List all size categories with their options.
 * SchoolStaff+ role required.
 * Requirements: 8.4
 */
export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const sizeCategories = await prisma.sizeCategory.findMany({
    orderBy: { id: 'asc' },
    include: {
      brandSupplier: { select: { id: true, brandSupplier: true } },
      sizeOptions: {
        orderBy: { sortOrder: 'asc' },
        select: { id: true, sizeName: true, sizeClass: true, sortOrder: true },
      },
    },
  })

  return NextResponse.json({ sizeCategories })
}

/**
 * POST /api/inventory/sizes - Create a new size category with optional size options.
 * SchoolStaff+ role required.
 * Requirements: 8.4
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
    sizeType?: string
    brandSupplierId?: number | null
    sizeOptions?: Array<{ sizeName: string; sizeClass?: string; sortOrder: number }>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { sizeType, brandSupplierId, sizeOptions } = body

  const validSizeTypes = ['Alphabetical', 'Numerical', 'OneSize']
  if (!sizeType || !validSizeTypes.includes(sizeType)) {
    return NextResponse.json(
      {
        error: 'missing_field',
        message: 'sizeType is required and must be one of: Alphabetical, Numerical, OneSize',
      },
      { status: 400 }
    )
  }

  try {
    const sizeCategory = await prisma.sizeCategory.create({
      data: {
        sizeType: sizeType as 'Alphabetical' | 'Numerical' | 'OneSize',
        brandSupplierId: brandSupplierId ?? null,
        ...(sizeOptions && sizeOptions.length > 0
          ? {
              sizeOptions: {
                create: sizeOptions.map((opt) => ({
                  sizeName: opt.sizeName,
                  sizeClass: (opt.sizeClass as 'S' | 'L') || 'S',
                  sortOrder: opt.sortOrder,
                })),
              },
            }
          : {}),
      },
      include: {
        brandSupplier: { select: { id: true, brandSupplier: true } },
        sizeOptions: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, sizeName: true, sizeClass: true, sortOrder: true },
        },
      },
    })

    return NextResponse.json({ sizeCategory }, { status: 201 })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        { error: 'invalid_reference', message: 'Referenced brand supplier does not exist' },
        { status: 400 }
      )
    }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'conflict', message: 'A size option with this name already exists in this category' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to create size category' },
      { status: 500 }
    )
  }
}
