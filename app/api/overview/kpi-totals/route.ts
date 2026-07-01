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
              select: { weightKg: true }
            }
          }
        }
      }
    })

    const totals = {
      totalPieces: 0,
      schoolStock: 0,
      psg: 0,
      repurposing: 0,
      waste: 0,
      totalWeightKg: 0,
    }

    for (const balance of balances) {
      const qty = balance.quantity ?? 0
      const categoryWeight = Number(balance.itemType?.category?.weightKg || 0)
      const weightKg = categoryWeight * qty
      const status = balance.itemStatus

      totals.totalPieces += qty
      totals.totalWeightKg += weightKg

      if (status === 'GeneralOffice' && balance.storedAt === 'School') {
        totals.schoolStock += qty
      } else if (status === 'ForSale' && balance.storedAt === 'School') {
        totals.psg += qty
      } else if (status === 'ForRepurpose' && balance.storedAt === 'TCC') {
        totals.repurposing += qty
      } else if (status === 'Disposed' && balance.storedAt === 'Exited') {
        totals.waste += qty
      }
    }

    totals.totalWeightKg = Number(totals.totalWeightKg.toFixed(3))

    return NextResponse.json({
      success: true,
      message: 'Network KPI totals retrieved successfully',
      data: totals,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'database_error', message: error?.message || 'Failed to fetch KPI totals' },
      { status: 500 }
    )
  }
}
