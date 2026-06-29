import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/inventory/brands - List all brand suppliers.
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

  const brands = await prisma.brandSupplier.findMany({
    orderBy: { brandSupplier: 'asc' },
  })

  return NextResponse.json({ brands })
}

/**
 * POST /api/inventory/brands - Create a new brand supplier.
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
    const brand = await prisma.brandSupplier.create({
      data: { brandSupplier },
    })

    return NextResponse.json({ brand }, { status: 201 })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'conflict', message: 'A brand supplier with this name already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to create brand supplier' },
      { status: 500 }
    )
  }
}
