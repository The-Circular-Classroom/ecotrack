import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/analytics/assembly/styles/[id] - Update a style name.
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
  const styleId = parseInt(id, 10)
  if (!Number.isInteger(styleId) || styleId < 1) {
    return NextResponse.json(
      { error: 'validation_error', message: 'styleId must be a valid positive integer' },
      { status: 400 }
    )
  }

  let body: { styleName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Request body must be valid JSON' },
      { status: 400 }
    )
  }

  const styleName = typeof body.styleName === 'string' ? body.styleName.trim() : ''
  if (!styleName) {
    return NextResponse.json(
      { error: 'validation_error', message: 'styleName is required' },
      { status: 400 }
    )
  }

  if (styleName.length > 50) {
    return NextResponse.json(
      { error: 'validation_error', message: 'styleName must not exceed 50 characters' },
      { status: 400 }
    )
  }

  const existing = await prisma.style.findUnique({ where: { id: styleId } })
  if (!existing) {
    return NextResponse.json(
      { error: 'not_found', message: 'Style not found' },
      { status: 404 }
    )
  }

  // Check for duplicate name
  const duplicate = await prisma.style.findFirst({
    where: {
      id: { not: styleId },
      styleName: { equals: styleName, mode: 'insensitive' },
    },
  })

  if (duplicate) {
    return NextResponse.json(
      { error: 'conflict', message: 'Style already exists' },
      { status: 409 }
    )
  }

  const updated = await prisma.style.update({
    where: { id: styleId },
    data: { styleName },
  })

  return NextResponse.json({ success: true, message: 'Style updated successfully', data: updated })
}

/**
 * DELETE /api/analytics/assembly/styles/[id] - Delete a style.
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
  const styleId = parseInt(id, 10)
  if (!Number.isInteger(styleId) || styleId < 1) {
    return NextResponse.json(
      { error: 'validation_error', message: 'styleId must be a valid positive integer' },
      { status: 400 }
    )
  }

  const existing = await prisma.style.findUnique({ where: { id: styleId } })
  if (!existing) {
    return NextResponse.json(
      { error: 'not_found', message: 'Style not found' },
      { status: 404 }
    )
  }

  try {
    await prisma.style.delete({ where: { id: styleId } })
    return NextResponse.json({ success: true, message: 'Style deleted successfully' })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        { error: 'conflict', message: 'Cannot delete style because it is assigned to one or more products' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to delete style' },
      { status: 500 }
    )
  }
}
