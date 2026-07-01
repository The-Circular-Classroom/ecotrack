import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

/**
 * GET /api/assembly/product-options - Get list of product types and styles options.
 */
export async function GET(request: NextRequest) {
  const logger = createApiLogger('GET /api/assembly/product-options')
  const role = request.headers.get('x-user-role')

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  try {
    const [productTypes, styles] = await Promise.all([
      prisma.productType.findMany({ orderBy: { typeName: 'asc' } }),
      prisma.style.findMany({ orderBy: { styleName: 'asc' } })
    ])

    return NextResponse.json({
      success: true,
      data: {
        productTypes,
        styles
      }
    })
  } catch (error: any) {
    logger.error('Error fetching product options', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
