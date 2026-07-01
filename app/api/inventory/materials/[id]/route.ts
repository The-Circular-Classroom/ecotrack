import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/inventory/materials/[id] - Get a single material.
 * PATCH /api/inventory/materials/[id] - Update a material.
 * DELETE /api/inventory/materials/[id] - Delete a material.
 * SchoolStaff+ role required.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('GET /api/inventory/materials/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const materialId = parseInt(id, 10)
  if (isNaN(materialId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Material ID must be a valid integer' },
      { status: 400 }
    )
  }

  const material = await prisma.material.findUnique({
    where: { id: materialId }
  })

  if (!material) {
    return NextResponse.json(
      { error: 'not_found', message: 'Material not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: material })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('PATCH /api/inventory/materials/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const materialId = parseInt(id, 10)
  if (isNaN(materialId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Material ID must be a valid integer' },
      { status: 400 }
    )
  }

  let body: { material_name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (body.material_name !== undefined) updates.materialName = body.material_name

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'invalid_body', message: 'At least one field must be provided' },
      { status: 400 }
    )
  }

  try {
    const updated = await prisma.material.update({
      where: { id: materialId },
      data: updates
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to update material' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('DELETE /api/inventory/materials/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const materialId = parseInt(id, 10)
  if (isNaN(materialId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'Material ID must be a valid integer' },
      { status: 400 }
    )
  }

  try {
    await prisma.material.delete({
      where: { id: materialId }
    })

    return NextResponse.json({ success: true, message: 'Material deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to delete material' },
      { status: 500 }
    )
  }
}
