import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/assembly/recipes/[id] - Update a recipe.
 * DELETE /api/assembly/recipes/[id] - Delete a recipe.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('PUT /api/assembly/recipes/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  const recipeId = parseInt(id, 10)
  if (isNaN(recipeId)) {
    return NextResponse.json({ error: 'invalid_id', message: 'Recipe ID must be a valid integer' }, { status: 400 })
  }

  let body: {
    recipeName?: string
    ingredients?: Array<{ itemTypeId: number; quantityRequired: number; sizeClass?: 'S' | 'L' | null }>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body', message: 'Invalid JSON body' }, { status: 400 })
  }

  const { recipeName, ingredients } = body
  if (!recipeName || !ingredients || !Array.isArray(ingredients)) {
    return NextResponse.json({ error: 'missing_field', message: 'recipeName and ingredients array are required' }, { status: 400 })
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Clear out existing recipe ingredients first
      await tx.recipeIngredient.deleteMany({
        where: { recipeId }
      })

      return tx.productRecipe.update({
        where: { id: recipeId },
        data: {
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
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    logger.error('Error updating recipe', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('DELETE /api/assembly/recipes/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  const recipeId = parseInt(id, 10)
  if (isNaN(recipeId)) {
    return NextResponse.json({ error: 'invalid_id', message: 'Recipe ID must be a valid integer' }, { status: 400 })
  }

  try {
    await prisma.productRecipe.delete({
      where: { id: recipeId }
    })

    return NextResponse.json({ success: true, message: 'Recipe deleted successfully' })
  } catch (error: any) {
    logger.error('Error deleting recipe', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('GET /api/assembly/recipes/[id]')
  const role = request.headers.get('x-user-role')
  const { id } = await params

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  const recipeId = parseInt(id, 10)
  if (isNaN(recipeId)) {
    return NextResponse.json({ error: 'invalid_id', message: 'Recipe ID must be a valid integer' }, { status: 400 })
  }

  try {
    const recipe = await prisma.productRecipe.findUnique({
      where: { id: recipeId },
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

    if (!recipe) {
      return NextResponse.json({ error: 'not_found', message: 'Recipe not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: recipe })
  } catch (error: any) {
    logger.error('Error fetching recipe', { error: error.message })
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
