import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  try {
    const [recipes, repurposeStock] = await Promise.all([
      prisma.productRecipe.findMany({
        select: {
          id: true,
          recipeName: true,
          productStyle: {
            select: {
              product: {
                select: {
                  id: true,
                  productName: true,
                  school: { select: { id: true, schoolName: true } },
                  productType: { select: { typeName: true } }
                }
              },
              style: { select: { styleName: true } }
            }
          },
          recipeIngredients: {
            select: {
              id: true,
              quantityRequired: true,
              sizeClass: true,
              itemType: {
                select: {
                  id: true,
                  schoolId: true,
                  category: { select: { id: true, categoryName: true } },
                  primaryColour: { select: { id: true, colourName: true, hexcode: true } }
                }
              }
            }
          }
        }
      }),
      prisma.inventoryBalance.findMany({
        where: {
          itemStatus: 'ForRepurpose',
          quantity: { gt: 0 }
        },
        select: {
          quantity: true,
          itemType: {
            select: {
              id: true,
              schoolId: true,
              category: { select: { id: true, categoryName: true } },
              primaryColour: { select: { id: true, colourName: true } }
            }
          },
          sizeOption: {
            select: { sizeClass: true }
          }
        }
      })
    ])

    const stockLookup: Record<number, { S: number; L: number; any: number }> = {}
    for (const balance of repurposeStock) {
      const itemTypeId = balance.itemType?.id
      if (!itemTypeId) continue

      const sizeClass = balance.sizeOption?.sizeClass || 'any'
      const qty = balance.quantity ?? 0

      if (!stockLookup[itemTypeId]) {
        stockLookup[itemTypeId] = { S: 0, L: 0, any: 0 }
      }

      if (sizeClass === 'S' || sizeClass === 'L') {
        stockLookup[itemTypeId][sizeClass] += qty
      }
      stockLookup[itemTypeId].any += qty
    }

    const projections = recipes
      .map((recipe) => {
        const ingredients = recipe.recipeIngredients ?? []

        if (!ingredients.length) {
          return {
            recipeId: recipe.id,
            recipeName: recipe.recipeName,
            productName: recipe.productStyle?.product?.productName ?? 'Unknown',
            styleName: recipe.productStyle?.style?.styleName ?? null,
            productType: recipe.productStyle?.product?.productType?.typeName ?? null,
            school: recipe.productStyle?.product?.school ?? null,
            estimatedUnits: 0,
            limitingIngredient: null,
            ingredients: []
          }
        }

        let minPossible = Infinity
        let limitingIngredient = null

        const ingredientDetails = ingredients.map((ingredient) => {
          const itemTypeId = ingredient.itemType?.id
          const qtyRequired = Number(ingredient.quantityRequired || 0)
          const sizeClass = ingredient.sizeClass

          if (!itemTypeId || qtyRequired <= 0) {
            return {
              itemTypeId,
              categoryName: ingredient.itemType?.category?.categoryName ?? 'Unknown',
              colourName: ingredient.itemType?.primaryColour?.colourName ?? null,
              hexcode: ingredient.itemType?.primaryColour?.hexcode ?? null,
              sizeClass,
              quantityRequired: qtyRequired,
              availableStock: 0,
              possibleUnits: 0
            }
          }

          const stock = stockLookup[itemTypeId]
          const available = stock
            ? (sizeClass === 'S' || sizeClass === 'L')
              ? stock[sizeClass]
              : stock.any
            : 0

          const possible = Math.floor(available / qtyRequired)

          if (possible < minPossible) {
            minPossible = possible
            limitingIngredient = ingredient.itemType?.category?.categoryName ?? 'Unknown'
          }

          return {
            itemTypeId,
            categoryName: ingredient.itemType?.category?.categoryName ?? 'Unknown',
            colourName: ingredient.itemType?.primaryColour?.colourName ?? null,
            hexcode: ingredient.itemType?.primaryColour?.hexcode ?? null,
            sizeClass,
            quantityRequired: qtyRequired,
            availableStock: available,
            possibleUnits: possible
          }
        })

        const estimatedUnits = minPossible === Infinity ? 0 : minPossible

        return {
          recipeId: recipe.id,
          recipeName: recipe.recipeName,
          productName: recipe.productStyle?.product?.productName ?? 'Unknown',
          styleName: recipe.productStyle?.style?.styleName ?? null,
          productType: recipe.productStyle?.product?.productType?.typeName ?? null,
          school: recipe.productStyle?.product?.school ?? null,
          estimatedUnits,
          limitingIngredient: estimatedUnits > 0 ? limitingIngredient : null,
          ingredients: ingredientDetails
        }
      })
      .sort((a, b) => b.estimatedUnits - a.estimatedUnits)

    const totalEstimatedProducts = projections.reduce(
      (sum, p) => sum + p.estimatedUnits,
      0
    )

    return NextResponse.json({
      success: true,
      message: 'Product projections retrieved successfully',
      data: {
        totalEstimatedProducts,
        projections
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'database_error', message: error?.message || 'Failed to fetch product projections' },
      { status: 500 }
    )
  }
}
