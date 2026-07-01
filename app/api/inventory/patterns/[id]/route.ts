import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/inventory/patterns/[id] - Get a single pattern.
 * PATCH /api/inventory/patterns/[id] - Update a pattern.
 * DELETE /api/inventory/patterns/[id] - Delete a pattern.
 * SchoolStaff+ role required.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('GET /api/inventory/patterns/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const patternId = parseInt(id, 10)
  if (isNaN(patternId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Pattern ID must be a valid integer' },
      { status: 400 }
    )
  }

  const pattern = await prisma.pattern.findUnique({
    where: { id: patternId }
  })

  if (!pattern) {
    return NextResponse.json(
      { error: 'not_found', message: 'Pattern not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: pattern })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('PATCH /api/inventory/patterns/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const patternId = parseInt(id, 10)
  if (isNaN(patternId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Pattern ID must be a valid integer' },
      { status: 400 }
    )
  }

  let body: { pattern_name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (body.pattern_name !== undefined) updates.patternName = body.pattern_name

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'invalid_body', message: 'At least one field must be provided' },
      { status: 400 }
    )
  }

  try {
    const updated = await prisma.pattern.update({
      where: { id: patternId },
      data: updates
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to update pattern' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('DELETE /api/inventory/patterns/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const patternId = parseInt(id, 10)
  if (isNaN(patternId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Pattern ID must be a valid integer' },
      { status: 400 }
    )
  }

  try {
    await prisma.pattern.delete({
      where: { id: patternId }
    })

    return NextResponse.json({ success: true, message: 'Pattern deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to delete pattern' },
      { status: 500 }
    )
  }
}
