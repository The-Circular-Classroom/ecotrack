import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/inventory/materials - List all materials.
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

  const materials = await prisma.material.findMany({
    orderBy: { materialName: 'asc' },
  })

  return NextResponse.json({ materials })
}

/**
 * POST /api/inventory/materials - Create a new material.
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

  let body: { materialName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { materialName } = body

  if (!materialName) {
    return NextResponse.json(
      { error: 'missing_field', message: 'materialName is required' },
      { status: 400 }
    )
  }

  try {
    const material = await prisma.material.create({
      data: { materialName },
    })

    return NextResponse.json({ material }, { status: 201 })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'conflict', message: 'A material with this name already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to create material' },
      { status: 500 }
    )
  }
}
