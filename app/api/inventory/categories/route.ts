import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/inventory/categories - List all categories.
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

  const categories = await prisma.category.findMany({
    orderBy: { categoryName: 'asc' },
  })

  return NextResponse.json({ categories })
}

/**
 * POST /api/inventory/categories - Create a new category.
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

  let body: { categoryName?: string; weightKg?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { categoryName, weightKg } = body

  if (!categoryName || weightKg === undefined || weightKg === null) {
    return NextResponse.json(
      { error: 'missing_field', message: 'categoryName and weightKg are required' },
      { status: 400 }
    )
  }

  try {
    const category = await prisma.category.create({
      data: { categoryName, weightKg },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'conflict', message: 'A category with this name already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to create category' },
      { status: 500 }
    )
  }
}
