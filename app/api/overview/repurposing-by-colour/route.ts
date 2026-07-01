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
        itemStatus: 'ForRepurpose',
        quantity: { gt: 0 }
      },
      select: {
        quantity: true,
        itemType: {
          select: {
            primaryColour: {
              select: { id: true, colourName: true, hexcode: true }
            },
            category: {
              select: { weightKg: true }
            }
          }
        }
      }
    })

    const colourMap: Record<number, any> = {}

    for (const balance of balances) {
      const colour = balance.itemType?.primaryColour
      if (!colour) continue

      const qty = balance.quantity ?? 0
      const categoryWeight = Number(balance.itemType?.category?.weightKg || 0)
      const weightKg = categoryWeight * qty

      if (!colourMap[colour.id]) {
        colourMap[colour.id] = {
          colourId: colour.id,
          colourName: colour.colourName,
          hexcode: colour.hexcode,
          totalPieces: 0,
          totalWeightKg: 0,
        }
      }

      colourMap[colour.id].totalPieces += qty
      colourMap[colour.id].totalWeightKg += weightKg
    }

    const result = Object.values(colourMap)
      .map((colour: any) => ({
        ...colour,
        totalWeightKg: Number(colour.totalWeightKg.toFixed(3))
      }))
      .sort((a: any, b: any) => b.totalPieces - a.totalPieces)

    const grandTotal = result.reduce((sum, c) => sum + c.totalPieces, 0)
    const grandWeightKg = Number(
      result.reduce((sum, c) => sum + c.totalWeightKg, 0).toFixed(3)
    )

    return NextResponse.json({
      success: true,
      message: 'Repurposing materials by colour retrieved successfully',
      data: {
        grandTotal,
        grandWeightKg,
        colours: result
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'database_error', message: error?.message || 'Failed to fetch repurposing by colour' },
      { status: 500 }
    )
  }
}
