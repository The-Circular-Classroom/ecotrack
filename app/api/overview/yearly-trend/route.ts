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

  const { searchParams } = new URL(request.url)
  const currentYear = new Date().getFullYear()
  const startYear = parseInt(searchParams.get('startYear') || '', 10) || (currentYear - 5)
  const endYear = parseInt(searchParams.get('endYear') || '', 10) || currentYear

  if (startYear > endYear) {
    return NextResponse.json(
      { error: 'invalid_range', message: 'startYear must be less than or equal to endYear' },
      { status: 400 }
    )
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: new Date(Date.UTC(startYear, 0, 1)),
          lt: new Date(Date.UTC(endYear + 1, 0, 1))
        },
        transactionType: { in: ['DonationIn', 'Sale', 'Repurposing', 'Disposal'] }
      },
      select: {
        transactionType: true,
        quantity: true,
        transactionDate: true,
        itemType: {
          select: {
            category: { select: { weightKg: true } }
          }
        }
      }
    })

    const yearMap: Record<number, any> = {}
    for (let y = startYear; y <= endYear; y++) {
      yearMap[y] = {
        year: y,
        donated: 0,
        sold: 0,
        repurposed: 0,
        disposed: 0,
        totalWeightKg: 0,
      }
    }

    for (const tx of transactions) {
      const year = new Date(tx.transactionDate).getUTCFullYear()
      if (!yearMap[year]) continue

      const qty = tx.quantity ?? 0
      const categoryWeight = Number(tx.itemType?.category?.weightKg || 0)
      const weightKg = categoryWeight * qty

      yearMap[year].totalWeightKg += weightKg

      switch (tx.transactionType) {
        case 'DonationIn':
          yearMap[year].donated += qty
          break
        case 'Sale':
          yearMap[year].sold += qty
          break
        case 'Repurposing':
          yearMap[year].repurposed += qty
          break
        case 'Disposal':
          yearMap[year].disposed += qty
          break
      }
    }

    const result = Object.values(yearMap).map((entry: any) => ({
      ...entry,
      totalWeightKg: Number(entry.totalWeightKg.toFixed(3))
    }))

    return NextResponse.json({
      success: true,
      message: 'Yearly trend retrieved successfully',
      data: {
        filters: { startYear, endYear },
        years: result
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'database_error', message: error?.message || 'Failed to fetch yearly trend' },
      { status: 500 }
    )
  }
}
