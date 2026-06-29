import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/inventory/patterns - List all patterns.
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

  const patterns = await prisma.pattern.findMany({
    orderBy: { patternName: 'asc' },
  })

  return NextResponse.json({ patterns })
}

/**
 * POST /api/inventory/patterns - Create a new pattern.
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

  let body: { patternName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { patternName } = body

  if (!patternName) {
    return NextResponse.json(
      { error: 'missing_field', message: 'patternName is required' },
      { status: 400 }
    )
  }

  try {
    const pattern = await prisma.pattern.create({
      data: { patternName },
    })

    return NextResponse.json({ pattern }, { status: 201 })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'conflict', message: 'A pattern with this name already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to create pattern' },
      { status: 500 }
    )
  }
}
