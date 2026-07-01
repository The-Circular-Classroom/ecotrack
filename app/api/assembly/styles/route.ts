import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/assembly/styles - Create a new style.
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/assembly/styles')
  const role = request.headers.get('x-user-role')

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
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
    const style = await prisma.style.create({
      data: { styleName },
      select: { id: true, styleName: true }
    })

    return NextResponse.json({ success: true, data: style }, { status: 201 })
  } catch (error: any) {
    logger.error('Error creating style', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
