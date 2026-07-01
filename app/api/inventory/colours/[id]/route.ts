import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/inventory/colours/[id] - Get a single colour.
 * PATCH /api/inventory/colours/[id] - Update a colour.
 * DELETE /api/inventory/colours/[id] - Delete a colour.
 * SchoolStaff+ role required.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('GET /api/inventory/colours/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const colourId = parseInt(id, 10)
  if (isNaN(colourId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Colour ID must be a valid integer' },
      { status: 400 }
    )
  }

  const colour = await prisma.colour.findUnique({
    where: { id: colourId }
  })

  if (!colour) {
    return NextResponse.json(
      { error: 'not_found', message: 'Colour not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: colour })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('PATCH /api/inventory/colours/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const colourId = parseInt(id, 10)
  if (isNaN(colourId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Colour ID must be a valid integer' },
      { status: 400 }
    )
  }

  let body: { colour_name?: string; hexcode?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (body.colour_name !== undefined) updates.colourName = body.colour_name
  if (body.hexcode !== undefined) updates.hexcode = body.hexcode

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'invalid_body', message: 'At least one field must be provided' },
      { status: 400 }
    )
  }

  try {
    const updated = await prisma.colour.update({
      where: { id: colourId },
      data: updates
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to update colour' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('DELETE /api/inventory/colours/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const colourId = parseInt(id, 10)
  if (isNaN(colourId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Colour ID must be a valid integer' },
      { status: 400 }
    )
  }

  try {
    await prisma.colour.delete({
      where: { id: colourId }
    })

    return NextResponse.json({ success: true, message: 'Colour deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to delete colour' },
      { status: 500 }
    )
  }
}
