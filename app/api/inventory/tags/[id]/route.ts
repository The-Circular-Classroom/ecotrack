import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/inventory/tags/[id] - Get a single tag.
 * PATCH /api/inventory/tags/[id] - Update a tag.
 * DELETE /api/inventory/tags/[id] - Delete a tag.
 * SchoolStaff+ role required.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('GET /api/inventory/tags/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const tagId = parseInt(id, 10)
  if (isNaN(tagId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Tag ID must be a valid integer' },
      { status: 400 }
    )
  }

  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    include: {
      createdBy: { select: { id: true, fullName: true, email: true } }
    }
  })

  if (!tag) {
    return NextResponse.json(
      { error: 'not_found', message: 'Tag not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: tag })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('PATCH /api/inventory/tags/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const tagId = parseInt(id, 10)
  if (isNaN(tagId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Tag ID must be a valid integer' },
      { status: 400 }
    )
  }

  let body: { tag_name?: string; is_active?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (body.tag_name !== undefined) updates.tagName = body.tag_name
  if (body.is_active !== undefined) updates.isActive = body.is_active

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'invalid_body', message: 'At least one field must be provided' },
      { status: 400 }
    )
  }

  try {
    const updated = await prisma.tag.update({
      where: { id: tagId },
      data: updates
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to update tag' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('DELETE /api/inventory/tags/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const tagId = parseInt(id, 10)
  if (isNaN(tagId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Tag ID must be a valid integer' },
      { status: 400 }
    )
  }

  try {
    // Check if tag is referenced by item types
    const itemTypeTags = await prisma.itemTypeTag.findMany({
      where: { tagId }
    })

    if (itemTypeTags.length > 0) {
      return NextResponse.json(
        { error: 'conflict', message: 'Cannot delete tag that is associated with item types' },
        { status: 409 }
      )
    }

    await prisma.tag.delete({
      where: { id: tagId }
    })

    return NextResponse.json({ success: true, message: 'Tag deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}
