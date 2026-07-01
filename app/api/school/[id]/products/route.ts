import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('GET /api/school/[id]/products')
  const role = request.headers.get('x-user-role')
  const { id: schoolIdRaw } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const schoolId = parseInt(schoolIdRaw, 10)
  if (isNaN(schoolId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'School ID must be a valid integer' },
      { status: 400 }
    )
  }

  try {
    const products = await prisma.product.findMany({
      where: { schoolId },
      include: {
        productType: true,
        productStyles: {
          include: {
            style: true,
            productRecipes: true
          }
        }
      },
      orderBy: { createdDate: 'desc' }
    })

    const result = products.map((product) => {
      const totalRecipes = product.productStyles.reduce(
        (sum, style) => sum + (style.productRecipes?.length ?? 0), 0
      )
      const totalStyles = product.productStyles.length

      return {
        productId: product.id,
        productName: product.productName,
        productType: product.productType?.typeName ?? null,
        createdDate: product.createdDate.toISOString(),
        totalStyles,
        totalRecipes,
        styles: product.productStyles.map((style) => ({
          styleId: style.id,
          styleName: style.style?.styleName ?? null,
          imageUrl: style.imageUrl,
          createdDate: style.createdDate.toISOString(),
          lastUpdated: style.lastUpdated.toISOString(),
          recipes: style.productRecipes.map((recipe) => ({
            recipeId: recipe.id,
            recipeName: recipe.recipeName,
            createdDate: recipe.createdDate.toISOString()
          }))
        }))
      }
    })

    return NextResponse.json({
      success: true,
      message: 'School products retrieved successfully',
      data: {
        schoolId,
        totalProducts: result.length,
        totalStyles: result.reduce((sum, p) => sum + p.totalStyles, 0),
        totalRecipes: result.reduce((sum, p) => sum + p.totalRecipes, 0),
        products: result
      }
    })
  } catch (error: any) {
    logger.error('Database error fetching school products', { error: error?.message })
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
