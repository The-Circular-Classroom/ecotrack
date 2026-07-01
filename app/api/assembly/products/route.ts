import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

/**
 * GET /api/assembly/products - Fetch all products grouped by school with recipe structures.
 * POST /api/assembly/products - Create a new product.
 */
export async function GET(request: NextRequest) {
  const logger = createApiLogger('GET /api/assembly/products')
  const role = request.headers.get('x-user-role')

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const schoolIdParam = searchParams.get('schoolId')
  const schoolId = schoolIdParam ? parseInt(schoolIdParam, 10) : undefined

  try {
    const where = schoolId ? { schoolId } : {}
    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { school: { schoolName: 'asc' } },
        { productName: 'asc' }
      ],
      include: {
        school: { select: { id: true, schoolName: true } },
        productType: { select: { id: true, typeName: true } },
        productStyles: {
          include: {
            style: { select: { id: true, styleName: true } },
            productRecipes: {
              include: {
                recipeIngredients: {
                  include: {
                    itemType: {
                      select: {
                        id: true,
                        gender: true,
                        school: { select: { id: true, schoolName: true } },
                        category: { select: { id: true, categoryName: true } },
                        primaryColour: { select: { colourName: true, hexcode: true } },
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: products })
  } catch (error: any) {
    logger.error('Error fetching assembly products', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/assembly/products')
  const role = request.headers.get('x-user-role')

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  let body: { schoolId: number; productName: string; productTypeId: number; styleId: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body', message: 'Invalid JSON body' }, { status: 400 })
  }

  const { schoolId, productName, productTypeId, styleId } = body
  if (!schoolId || !productName || !productTypeId || !styleId) {
    return NextResponse.json({ error: 'missing_field', message: 'schoolId, productName, productTypeId, and styleId are required' }, { status: 400 })
  }

  try {
    const product = await prisma.product.create({
      data: {
        schoolId,
        productName,
        productTypeId,
        productStyles: {
          create: {
            styleId
          }
        }
      },
      include: {
        school: { select: { id: true, schoolName: true } },
        productType: { select: { id: true, typeName: true } },
        productStyles: {
          include: {
            style: { select: { id: true, styleName: true } }
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error: any) {
    logger.error('Error creating product', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
