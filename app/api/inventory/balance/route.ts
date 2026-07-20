import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { getUniformImageUrl } from '@/lib/inventory/uniformImageUrl'

/**
 * GET /api/inventory/balance - Overview endpoint returning inventory balances where quantity > 0.
 * Groups by itemType, size, status, and storage location.
 * SchoolStaff+ role required.
 * Requirements: 8.5
 */
export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'PsgVolunteer')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'PsgVolunteer access required' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const schoolId = searchParams.get('schoolId')
    ? parseInt(searchParams.get('schoolId')!, 10)
    : undefined
  const itemStatus = searchParams.get('itemStatus') || undefined
  const storedAt = searchParams.get('storedAt') || undefined

  // Build filter with quantity > 0
  const where: Record<string, unknown> = {
    quantity: { gt: 0 },
  }

  if (schoolId) {
    where.itemType = { schoolId }
  }

  if (itemStatus) {
    where.itemStatus = itemStatus
  }

  if (storedAt) {
    where.storedAt = storedAt
  }

  const balances = await prisma.inventoryBalance.findMany({
    where,
    include: {
      itemType: {
        select: {
          id: true,
          gender: true,
          imageUrl: true,
          school: { select: { id: true, schoolName: true, logoUrl: true } },
          category: { select: { id: true, categoryName: true } },
          primaryColour: { select: { id: true, colourName: true, hexcode: true } },
        },
      },
      sizeOption: {
        select: {
          id: true,
          sizeName: true,
          sizeClass: true,
        },
      },
    },
    orderBy: [
      { itemTypeId: 'asc' },
      { sizeOptionId: 'asc' },
      { itemStatus: 'asc' },
      { storedAt: 'asc' },
    ],
  })

  // Enrich balances: resolve imageUrl from storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const enrichedBalances = balances.map((balance) => {
    const itemType = balance.itemType as any
    if (itemType) {
      const categoryName = itemType.category?.categoryName ?? null
      const colourName = itemType.primaryColour?.colourName ?? null
      itemType.imageUrl = getUniformImageUrl(supabaseUrl, categoryName, colourName, itemType.imageUrl)
    }
    return balance
  })

  return NextResponse.json({
    balances: enrichedBalances,
    total: enrichedBalances.length,
  })
}

