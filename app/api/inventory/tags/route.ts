import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/inventory/tags - List all tags.
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

  const tags = await prisma.tag.findMany({
    orderBy: { tagName: 'asc' },
    include: {
      createdBy: { select: { id: true, fullName: true, email: true } },
    },
  })

  return NextResponse.json({ tags })
}

/**
 * POST /api/inventory/tags - Create a new tag.
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

  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'User ID not found in request' },
      { status: 401 }
    )
  }

  let body: { tagName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { tagName } = body

  if (!tagName) {
    return NextResponse.json(
      { error: 'missing_field', message: 'tagName is required' },
      { status: 400 }
    )
  }

  // Look up the user's DB record from the Supabase auth ID
  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: userId },
    select: { id: true },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'user_not_found', message: 'User record not found in database' },
      { status: 404 }
    )
  }

  try {
    const tag = await prisma.tag.create({
      data: {
        tagName,
        createdByUserId: user.id,
      },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    })

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'conflict', message: 'A tag with this name already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to create tag' },
      { status: 500 }
    )
  }
}
