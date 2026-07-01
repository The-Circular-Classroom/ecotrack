import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/assembly/styles/[id] - Update style name.
 * DELETE /api/assembly/styles/[id] - Delete style.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('PUT /api/assembly/styles/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  const styleId = parseInt(id, 10)
  if (isNaN(styleId)) {
    return NextResponse.json({ error: 'invalid_id', message: 'Style ID must be a valid integer' }, { status: 400 })
  }

  let body: { styleName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body', message: 'Invalid JSON body' }, { status: 400 })
  }

  const { styleName } = body
  if (!styleName) {
    return NextResponse.json({ error: 'missing_field', message: 'styleName is required' }, { status: 400 })
  }

  try {
    const updated = await prisma.style.update({
      where: { id: styleId },
      data: { styleName },
      select: { id: true, styleName: true }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    logger.error('Error updating style', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('DELETE /api/assembly/styles/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  const styleId = parseInt(id, 10)
  if (isNaN(styleId)) {
    return NextResponse.json({ error: 'invalid_id', message: 'Style ID must be a valid integer' }, { status: 400 })
  }

  try {
    await prisma.style.delete({
      where: { id: styleId }
    })

    return NextResponse.json({ success: true, message: 'Style deleted successfully' })
  } catch (error: any) {
    logger.error('Error deleting style', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
