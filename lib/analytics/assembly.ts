/**
 * Assembly analytics — repurposed product projections and assembly plan calculations.
 *
 * Provides functions to project how many products can be assembled from current
 * "ForRepurpose" inventory stock, and to calculate an assembly plan given target
 * quantities while never exceeding what available stock supports (Property 20).
 */

import { PrismaClient } from '@/lib/prisma/generated/client/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RepurposeProjection {
  productStyleId: number
  productName: string
  styleName: string
  schoolId: number | null
  schoolName: string | null
  maxProducible: number
  ingredients: IngredientProjection[]
}

export interface IngredientProjection {
  itemTypeId: number
  categoryName: string
  quantityRequired: number
  sizeClass: string | null
  availableStock: number
  maxUnitsSupported: number
}

export interface AssemblyPlanItem {
  productStyleId: number
  productName: string
  styleName: string
  requested: number
  planned: number
  shortfall: number
  ingredients: PlannedIngredient[]
}

export interface PlannedIngredient {
  itemTypeId: number
  categoryName: string
  quantityRequired: number
  sizeClass: string | null
  availableStock: number
  consumed: number
  remaining: number
}

export interface AssemblyPlanResult {
  items: AssemblyPlanItem[]
  totalRequested: number
  totalPlanned: number
}

// ─── Pure functions (exported for property testing) ───────────────────────────

/**
 * Calculates the maximum number of units that can be produced given the
 * requested amount, available stock, and quantity of that ingredient needed
 * per unit of product.
 *
 * Returns min(requested, Math.floor(availableStock / quantityPerUnit))
 *
 * This ensures the plan never exceeds what stock can support (Property 20).
 *
 * @param requested - The number of units the user wants to produce
 * @param availableStock - The total available inventory for this ingredient
 * @param quantityPerUnit - How many units of this ingredient are needed per product
 * @returns The maximum number of products producible, capped at requested
 */
export function calculateMaxProducible(
  requested: number,
  availableStock: number,
  quantityPerUnit: number
): number {
  if (quantityPerUnit <= 0) return requested
  if (availableStock <= 0) return 0
  if (requested <= 0) return 0

  const stockSupports = Math.floor(availableStock / quantityPerUnit)
  return Math.min(requested, stockSupports)
}

// ─── Database-dependent functions ─────────────────────────────────────────────

/**
 * Fetches repurpose projections showing how many units of each product style
 * could be assembled from current "ForRepurpose" status inventory.
 *
 * For each product style with recipes, calculates the maximum producible
 * quantity based on the bottleneck ingredient (the one with lowest stock
 * relative to its required quantity).
 *
 * @param prisma - Prisma client instance
 * @param schoolId - Optional school filter
 * @returns Array of projections per product style
 */
export async function getRepurposeProjections(
  prisma: PrismaClient,
  schoolId?: number
): Promise<RepurposeProjection[]> {
  // Fetch product styles with their recipes and ingredients
  const productStyleFilter = schoolId
    ? { product: { schoolId } }
    : {}

  const productStyles = await prisma.productStyle.findMany({
    where: {
      ...productStyleFilter,
      productRecipes: { some: {} },
    },
    include: {
      style: { select: { styleName: true } },
      product: {
        select: {
          productName: true,
          schoolId: true,
          school: { select: { schoolName: true } },
        },
      },
      productRecipes: {
        include: {
          recipeIngredients: {
            include: {
              itemType: {
                select: {
                  id: true,
                  category: { select: { categoryName: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  // Get ForRepurpose stock for relevant item types
  const allItemTypeIds = new Set<number>()
  for (const ps of productStyles) {
    for (const recipe of ps.productRecipes) {
      for (const ing of recipe.recipeIngredients) {
        allItemTypeIds.add(ing.itemTypeId)
      }
    }
  }

  const stockMap = await buildForRepurposeStockMap(prisma, Array.from(allItemTypeIds))

  // Calculate projections
  const projections: RepurposeProjection[] = []

  for (const ps of productStyles) {
    // Find the best recipe (the one that can produce the most units)
    let bestMax = 0
    let bestIngredients: IngredientProjection[] = []

    for (const recipe of ps.productRecipes) {
      const ingredients: IngredientProjection[] = []
      let recipeMax = Infinity

      for (const ing of recipe.recipeIngredients) {
        const quantityRequired = Number(ing.quantityRequired)
        const available = getStockForIngredient(
          stockMap,
          ing.itemTypeId,
          ing.sizeClass
        )

        const maxUnits = quantityRequired > 0
          ? Math.floor(available / quantityRequired)
          : Infinity

        recipeMax = Math.min(recipeMax, maxUnits)

        ingredients.push({
          itemTypeId: ing.itemTypeId,
          categoryName: ing.itemType.category.categoryName,
          quantityRequired,
          sizeClass: ing.sizeClass,
          availableStock: available,
          maxUnitsSupported: maxUnits === Infinity ? 0 : maxUnits,
        })
      }

      if (recipe.recipeIngredients.length === 0) {
        recipeMax = 0
      }

      if (recipeMax > bestMax) {
        bestMax = recipeMax
        bestIngredients = ingredients
      }
    }

    projections.push({
      productStyleId: ps.id,
      productName: ps.product.productName,
      styleName: ps.style.styleName,
      schoolId: ps.product.schoolId,
      schoolName: ps.product.school?.schoolName ?? null,
      maxProducible: bestMax === Infinity ? 0 : bestMax,
      ingredients: bestIngredients,
    })
  }

  return projections
}

/**
 * Calculates an assembly plan given target quantities per product style.
 *
 * For each product style, looks up recipes and their ingredients, checks available
 * ForRepurpose stock, and determines how many can actually be produced.
 *
 * The plan NEVER specifies producing more units than available stock supports
 * (Property 20: Assembly plan feasibility).
 *
 * @param prisma - Prisma client instance
 * @param targetQuantities - Map of productStyleId → desired quantity
 * @returns Assembly plan with actual planned quantities capped by stock
 */
export async function calculateAssemblyPlan(
  prisma: PrismaClient,
  targetQuantities: Record<number, number>
): Promise<AssemblyPlanResult> {
  const productStyleIds = Object.keys(targetQuantities).map(Number)

  if (productStyleIds.length === 0) {
    return { items: [], totalRequested: 0, totalPlanned: 0 }
  }

  // Fetch product styles with recipes
  const productStyles = await prisma.productStyle.findMany({
    where: { id: { in: productStyleIds } },
    include: {
      style: { select: { styleName: true } },
      product: {
        select: {
          productName: true,
          schoolId: true,
        },
      },
      productRecipes: {
        include: {
          recipeIngredients: {
            include: {
              itemType: {
                select: {
                  id: true,
                  category: { select: { categoryName: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  // Collect all item type IDs for stock lookup
  const allItemTypeIds = new Set<number>()
  for (const ps of productStyles) {
    for (const recipe of ps.productRecipes) {
      for (const ing of recipe.recipeIngredients) {
        allItemTypeIds.add(ing.itemTypeId)
      }
    }
  }

  const stockMap = await buildForRepurposeStockMap(prisma, Array.from(allItemTypeIds))

  // Track consumed stock across all products to avoid double-counting
  const consumedStock: Record<string, number> = {}

  const items: AssemblyPlanItem[] = []
  let totalRequested = 0
  let totalPlanned = 0

  for (const ps of productStyles) {
    const requested = targetQuantities[ps.id] ?? 0
    totalRequested += requested

    if (requested <= 0 || ps.productRecipes.length === 0) {
      items.push({
        productStyleId: ps.id,
        productName: ps.product.productName,
        styleName: ps.style.styleName,
        requested,
        planned: 0,
        shortfall: requested,
        ingredients: [],
      })
      continue
    }

    // Find the recipe that yields the most given current remaining stock
    let bestPlanned = 0
    let bestIngredients: PlannedIngredient[] = []

    for (const recipe of ps.productRecipes) {
      // Calculate max producible for this recipe considering already-consumed stock
      let recipeMax = requested

      for (const ing of recipe.recipeIngredients) {
        const quantityRequired = Number(ing.quantityRequired)
        const stockKey = ingredientStockKey(ing.itemTypeId, ing.sizeClass)
        const totalAvailable = getStockForIngredient(stockMap, ing.itemTypeId, ing.sizeClass)
        const alreadyConsumed = consumedStock[stockKey] ?? 0
        const remainingAvailable = Math.max(0, totalAvailable - alreadyConsumed)

        recipeMax = calculateMaxProducible(recipeMax, remainingAvailable, quantityRequired)
      }

      if (recipeMax > bestPlanned) {
        bestPlanned = recipeMax
        bestIngredients = recipe.recipeIngredients.map((ing) => {
          const quantityRequired = Number(ing.quantityRequired)
          const stockKey = ingredientStockKey(ing.itemTypeId, ing.sizeClass)
          const totalAvailable = getStockForIngredient(stockMap, ing.itemTypeId, ing.sizeClass)
          const alreadyConsumed = consumedStock[stockKey] ?? 0
          const remainingAvailable = Math.max(0, totalAvailable - alreadyConsumed)
          const consumed = recipeMax * quantityRequired

          return {
            itemTypeId: ing.itemTypeId,
            categoryName: ing.itemType.category.categoryName,
            quantityRequired,
            sizeClass: ing.sizeClass,
            availableStock: remainingAvailable,
            consumed,
            remaining: Math.max(0, remainingAvailable - consumed),
          }
        })
      }
    }

    // Commit consumed stock for the best recipe
    if (bestPlanned > 0 && bestIngredients.length > 0) {
      for (const ing of bestIngredients) {
        const stockKey = ingredientStockKey(ing.itemTypeId, ing.sizeClass)
        consumedStock[stockKey] = (consumedStock[stockKey] ?? 0) + ing.consumed
      }
    }

    totalPlanned += bestPlanned

    items.push({
      productStyleId: ps.id,
      productName: ps.product.productName,
      styleName: ps.style.styleName,
      requested,
      planned: bestPlanned,
      shortfall: Math.max(0, requested - bestPlanned),
      ingredients: bestIngredients,
    })
  }

  return { items, totalRequested, totalPlanned }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function ingredientStockKey(itemTypeId: number, sizeClass: string | null): string {
  return `${itemTypeId}_${sizeClass ?? 'ALL'}`
}

/**
 * Builds a stock map for ForRepurpose items keyed by itemTypeId and sizeClass.
 */
async function buildForRepurposeStockMap(
  prisma: PrismaClient,
  itemTypeIds: number[]
): Promise<Record<string, number>> {
  if (itemTypeIds.length === 0) return {}

  const balances = await prisma.inventoryBalance.findMany({
    where: {
      itemTypeId: { in: itemTypeIds },
      itemStatus: 'ForRepurpose',
      quantity: { gt: 0 },
    },
    select: {
      itemTypeId: true,
      quantity: true,
      sizeOption: { select: { sizeClass: true } },
    },
  })

  const stockMap: Record<string, number> = {}

  for (const b of balances) {
    const sizeClass = b.sizeOption?.sizeClass ?? null
    const key = ingredientStockKey(b.itemTypeId, sizeClass)
    stockMap[key] = (stockMap[key] ?? 0) + b.quantity

    // Also track an ALL key for ingredients that don't specify a sizeClass
    const allKey = ingredientStockKey(b.itemTypeId, null)
    if (sizeClass !== null) {
      stockMap[allKey] = (stockMap[allKey] ?? 0) + b.quantity
    }
  }

  return stockMap
}

/**
 * Gets available stock for a specific ingredient (itemTypeId + sizeClass).
 * If sizeClass is null, returns total across all size classes.
 */
function getStockForIngredient(
  stockMap: Record<string, number>,
  itemTypeId: number,
  sizeClass: string | null
): number {
  const key = ingredientStockKey(itemTypeId, sizeClass)
  return stockMap[key] ?? 0
}
