import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { calculateAssemblyPlan } from '@/lib/analytics/assembly'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/assembly/calculate
 * Runs optimal assembly plan calculation based on target quantities.
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/assembly/calculate')
  const role = request.headers.get('x-user-role')

  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json({ error: 'forbidden', message: 'SchoolStaff access required' }, { status: 403 })
  }

  let body: { requests?: Array<{ schoolId: number; productId: number; targetQuantity: number }> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'validation_error', message: 'Invalid JSON body' }, { status: 400 })
  }

  const { requests } = body
  if (!requests || !Array.isArray(requests) || requests.length === 0) {
    return NextResponse.json({ error: 'validation_error', message: 'requests must be a non-empty array' }, { status: 400 })
  }

  // Parse requests into a target quantities map productStyleId -> targetQuantity
  // Wait, let's look up productStyleId associated with each productId!
  // In the legacy requests, each request specifies: schoolId, productId, targetQuantity.
  // Wait! In the new Next.js assembly library, targetQuantities is Record<number, number> mapping productStyleId -> targetQuantity.
  // Let's resolve the productStyleId for each productId.
  try {
    const productIds = requests.map((r) => r.productId)
    const productStyles = await prisma.productStyle.findMany({
      where: { productId: { in: productIds } },
      select: { id: true, productId: true }
    })

    const targetQuantities: Record<number, number> = {}
    for (const r of requests) {
      const style = productStyles.find((s) => s.productId === r.productId)
      if (style) {
        targetQuantities[style.id] = r.targetQuantity
      }
    }

    const plan = await calculateAssemblyPlan(prisma, targetQuantities)

    // Wait! Let's format the response to match the school-based structure expected by the frontend.
    // In legacy, the response is schoolResults: Array of { school: { id, schoolName }, products: Array of { productId, productName, targetQuantity, actualMade, shortfall, ingredients: ... }, totalMade, totalTargeted, wasteSummary }.
    // Let's construct that response!
    // Group planned items by schoolId
    const schoolGroups: Record<number, {
      school: { id: number; schoolName: string }
      products: any[]
      totalMade: number
      totalTargeted: number
      wasteSummary: any[]
    }> = {}

    // We need to resolve school names
    const schools = await prisma.school.findMany({
      select: { id: true, schoolName: true }
    })

    // Get stock balances to calculate waste/utilization
    const stockMap: Record<string, number> = {}
    const balances = await prisma.inventoryBalance.findMany({
      where: {
        itemStatus: 'ForRepurpose',
        quantity: { gt: 0 }
      },
      select: {
        itemTypeId: true,
        quantity: true,
        sizeOption: { select: { sizeClass: true } }
      }
    })

    for (const b of balances) {
      const key = `${b.itemTypeId}_${b.sizeOption?.sizeClass ?? 'ALL'}`
      stockMap[key] = (stockMap[key] ?? 0) + b.quantity
    }

    // Process plan items
    for (const item of plan.items) {
      // Find schoolId for this product
      const product = await prisma.product.findUnique({
        where: { id: item.productStyleId }, // In Next.js projections, productStyleId is used
        select: { schoolId: true }
      })
      const schoolId = product?.schoolId ?? 0
      const schoolObj = schools.find((s) => s.id === schoolId)
      const schoolName = schoolObj?.schoolName ?? 'Unknown School'

      if (!schoolGroups[schoolId]) {
        schoolGroups[schoolId] = {
          school: { id: schoolId, schoolName },
          products: [],
          totalMade: 0,
          totalTargeted: 0,
          wasteSummary: []
        }
      }

      const mappedProduct = {
        productId: item.productStyleId,
        productName: item.productName,
        targetQuantity: item.requested,
        actualMade: item.planned,
        shortfall: item.shortfall,
        ingredients: item.ingredients.map((ing) => ({
          itemTypeId: ing.itemTypeId,
          sizeClass: ing.sizeClass,
          categoryName: ing.categoryName,
          qtyConsumed: ing.consumed,
          qtyAvailable: ing.availableStock,
          qtyLeftover: ing.remaining
        }))
      }

      schoolGroups[schoolId].products.push(mappedProduct)
      schoolGroups[schoolId].totalMade += item.planned
      schoolGroups[schoolId].totalTargeted += item.requested
    }

    // Build waste summary per school
    for (const group of Object.values(schoolGroups)) {
      const wasteMap: Record<string, any> = {}
      for (const prod of group.products) {
        for (const ing of prod.ingredients) {
          const key = `${ing.itemTypeId}_${ing.sizeClass ?? 'ALL'}`
          if (!wasteMap[key]) {
            wasteMap[key] = {
              itemTypeId: ing.itemTypeId,
              sizeClass: ing.sizeClass,
              categoryName: ing.categoryName,
              qtyAvailable: ing.qtyAvailable,
              qtyConsumed: 0
            }
          }
          wasteMap[key].qtyConsumed += ing.qtyConsumed
        }
      }

      group.wasteSummary = Object.values(wasteMap).map((w) => ({
        ...w,
        qtyLeftover: Math.max(0, w.qtyAvailable - w.qtyConsumed),
        utilizationPct: w.qtyAvailable > 0 ? Math.round((w.qtyConsumed / w.qtyAvailable) * 100) : 0
      }))
    }

    return NextResponse.json({
      success: true,
      message: 'Assembly plan calculated successfully',
      data: Object.values(schoolGroups)
    })
  } catch (error: any) {
    logger.error('Error calculating assembly plan', { error: error.message })
    return NextResponse.json({ error: 'calculation_error', message: error.message }, { status: 500 })
  }
}
