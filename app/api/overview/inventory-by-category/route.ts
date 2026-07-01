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
    const balances = await prisma.inventoryBalance.findMany({
      where: {
        quantity: { gt: 0 },
        itemStatus: { in: ['GeneralOffice', 'ForSale', 'ForRepurpose', 'Disposed'] }
      },
      select: {
        quantity: true,
        itemStatus: true,
        storedAt: true,
        itemType: {
          select: {
            category: {
              select: { id: true, categoryName: true, weightKg: true }
            }
          }
        }
      }
    })

    const categoryMap: Record<number, any> = {}

    for (const balance of balances) {
      const category = balance.itemType?.category
      if (!category) continue

      const qty = balance.quantity ?? 0
      const categoryWeight = Number(category.weightKg || 0)
      const weightKg = categoryWeight * qty
      const status = balance.itemStatus

      if (!categoryMap[category.id]) {
        categoryMap[category.id] = {
          categoryId: category.id,
          categoryName: category.categoryName,
          totalPieces: 0,
          totalWeightKg: 0,
          schoolStock: 0,
          psg: 0,
          repurposing: 0,
          waste: 0,
        }
      }

      const entry = categoryMap[category.id]
      entry.totalPieces += qty
      entry.totalWeightKg += weightKg

      if (status === 'GeneralOffice' && balance.storedAt === 'School') {
        entry.schoolStock += qty
      } else if (status === 'ForSale' && balance.storedAt === 'School') {
        entry.psg += qty
      } else if (status === 'ForRepurpose' && balance.storedAt === 'TCC') {
        entry.repurposing += qty
      } else if (status === 'Disposed' && balance.storedAt === 'Exited') {
        entry.waste += qty
      }
    }

    const result = Object.values(categoryMap)
      .map((category: any) => ({
        ...category,
        totalWeightKg: Number(category.totalWeightKg.toFixed(3))
      }))
      .sort((a: any, b: any) => b.totalPieces - a.totalPieces)

    return NextResponse.json({
      success: true,
      message: 'Inventory by category with group breakdown retrieved successfully',
      data: result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'database_error', message: error?.message || 'Failed to fetch inventory by category' },
      { status: 500 }
    )
  }
}
