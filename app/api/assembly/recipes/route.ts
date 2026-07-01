import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/assembly/recipes - Create a new recipe.
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/assembly/recipes')
  const role = request.headers.get('x-user-role')

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  let body: {
    productStyleId?: number
    recipeName?: string
    ingredients?: Array<{ itemTypeId: number; quantityRequired: number; sizeClass?: 'S' | 'L' | null }>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body', message: 'Invalid JSON body' }, { status: 400 })
  }

  const { productStyleId, recipeName, ingredients } = body
  if (!productStyleId || !recipeName || !ingredients || !Array.isArray(ingredients)) {
    return NextResponse.json({ error: 'missing_field', message: 'productStyleId, recipeName, and ingredients array are required' }, { status: 400 })
  }

  try {
    const recipe = await prisma.productRecipe.create({
      data: {
        productStyleId,
        recipeName,
        recipeIngredients: {
          create: ingredients.map((ing) => ({
            itemTypeId: ing.itemTypeId,
            quantityRequired: ing.quantityRequired,
            sizeClass: ing.sizeClass ?? null
          }))
        }
      },
      include: {
        recipeIngredients: {
          include: {
            itemType: {
              select: {
                id: true,
                category: { select: { id: true, categoryName: true } },
                school: { select: { id: true, schoolName: true } }
              }
            }
          }
        },
        productStyle: {
          include: {
            product: { select: { id: true, productName: true, schoolId: true } },
            style: { select: { id: true, styleName: true } }
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: recipe }, { status: 201 })
  } catch (error: any) {
    logger.error('Error creating recipe', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
