import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/assembly/product-types - Create a new product type.
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/assembly/product-types')
  const role = request.headers.get('x-user-role')

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  let body: { typeName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body', message: 'Invalid JSON body' }, { status: 400 })
  }

  const { typeName } = body
  if (!typeName) {
    return NextResponse.json({ error: 'missing_field', message: 'typeName is required' }, { status: 400 })
  }

  try {
    const type = await prisma.productType.create({
      data: { typeName },
      select: { id: true, typeName: true }
    })

    return NextResponse.json({ success: true, data: type }, { status: 201 })
  } catch (error: any) {
    logger.error('Error creating product type', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
