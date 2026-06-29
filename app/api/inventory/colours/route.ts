import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/inventory/colours - List all colours.
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

  const colours = await prisma.colour.findMany({
    orderBy: { colourName: 'asc' },
  })

  return NextResponse.json({ colours })
}

/**
 * POST /api/inventory/colours - Create a new colour.
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

  let body: { colourName?: string; hexcode?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { colourName, hexcode } = body

  if (!colourName || !hexcode) {
    return NextResponse.json(
      { error: 'missing_field', message: 'colourName and hexcode are required' },
      { status: 400 }
    )
  }

  try {
    const colour = await prisma.colour.create({
      data: { colourName, hexcode },
    })

    return NextResponse.json({ colour }, { status: 201 })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'conflict', message: 'A colour with this name or hexcode already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to create colour' },
      { status: 500 }
    )
  }
}
