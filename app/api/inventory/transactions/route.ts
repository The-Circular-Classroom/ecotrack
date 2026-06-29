import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { isValidTransition, type ItemStatus } from '@/lib/inventory/transactions'
import { updateInventoryBalance, type StorageLocation } from '@/lib/inventory/balance'

/**
 * POST /api/inventory/transactions - Create a transaction with state validation and atomic balance update.
 * SchoolStaff+ role required.
 * Requirements: 8.3, 8.5, 8.6, 8.7
 */
export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  let body: {
    itemTypeId?: number
    sizeOptionId?: number
    fromStatus?: string | null
    toStatus?: string
    fromStoredAt?: string | null
    toStoredAt?: string
    quantity?: number
    transactionType?: string
    donationDriveId?: number | null
    userId?: number
    remarks?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const {
    itemTypeId,
    sizeOptionId,
    toStatus,
    toStoredAt,
    quantity,
    transactionType,
    userId,
  } = body

  // Validate required fields
  if (!itemTypeId || !sizeOptionId || !toStatus || !toStoredAt || !quantity || !transactionType || !userId) {
    return NextResponse.json(
      {
        error: 'missing_field',
        message: 'itemTypeId, sizeOptionId, toStatus, toStoredAt, quantity, transactionType, and userId are required',
      },
      { status: 400 }
    )
  }

  if (quantity <= 0) {
    return NextResponse.json(
      { error: 'invalid_quantity', message: 'Quantity must be greater than zero' },
      { status: 400 }
    )
  }

  // Validate status values
  const validStatuses: ItemStatus[] = ['ForSale', 'ForRepurpose', 'GeneralOffice', 'Sold', 'Repurposed', 'Disposed']
  const validStorageLocations: StorageLocation[] = ['School', 'TCC', 'Exited']
  const validTransactionTypes = ['DonationIn', 'Transfer', 'StatusChange', 'Sale', 'Repurposing', 'Disposal']

  if (!validStatuses.includes(toStatus as ItemStatus)) {
    return NextResponse.json(
      { error: 'invalid_status', message: `Invalid toStatus. Must be one of: ${validStatuses.join(', ')}` },
      { status: 400 }
    )
  }

  if (!validStorageLocations.includes(toStoredAt as StorageLocation)) {
    return NextResponse.json(
      { error: 'invalid_storage', message: `Invalid toStoredAt. Must be one of: ${validStorageLocations.join(', ')}` },
      { status: 400 }
    )
  }

  if (!validTransactionTypes.includes(transactionType)) {
    return NextResponse.json(
      { error: 'invalid_transaction_type', message: `Invalid transactionType. Must be one of: ${validTransactionTypes.join(', ')}` },
      { status: 400 }
    )
  }

  const fromStatus = body.fromStatus as ItemStatus | null | undefined
  const fromStoredAt = body.fromStoredAt as StorageLocation | null | undefined

  // Validate state transition (Requirement 8.3, 8.7)
  if (!isValidTransition(fromStatus ?? null, toStatus as ItemStatus)) {
    return NextResponse.json(
      {
        error: 'invalid_transition',
        message: `Invalid state transition from '${fromStatus ?? 'null'}' to '${toStatus}'`,
        details: {
          fromStatus: fromStatus ?? null,
          toStatus,
        },
      },
      { status: 422 }
    )
  }

  // Validate fromStoredAt is provided when fromStatus is provided
  if (fromStatus && !fromStoredAt) {
    return NextResponse.json(
      { error: 'missing_field', message: 'fromStoredAt is required when fromStatus is provided' },
      { status: 400 }
    )
  }

  // Validate fromStoredAt value if provided
  if (fromStoredAt && !validStorageLocations.includes(fromStoredAt)) {
    return NextResponse.json(
      { error: 'invalid_storage', message: `Invalid fromStoredAt. Must be one of: ${validStorageLocations.join(', ')}` },
      { status: 400 }
    )
  }

  // Atomic balance update (Requirement 8.5, 8.6)
  const balanceResult = await updateInventoryBalance(prisma, {
    itemTypeId,
    sizeOptionId,
    fromStatus: fromStatus ?? undefined,
    toStatus: toStatus as ItemStatus,
    fromStoredAt: fromStoredAt ?? undefined,
    toStoredAt: toStoredAt as StorageLocation,
    quantity,
  })

  if (!balanceResult.success) {
    return NextResponse.json(
      {
        error: 'balance_underflow',
        message: 'Transaction would reduce inventory balance below zero',
        details: balanceResult.error,
      },
      { status: 422 }
    )
  }

  // Create the transaction record
  try {
    const transaction = await prisma.transaction.create({
      data: {
        itemTypeId,
        sizeOptionId,
        fromStatus: fromStatus ? (fromStatus as ItemStatus) : null,
        toStatus: toStatus as ItemStatus,
        fromStoredAt: fromStoredAt ? (fromStoredAt as StorageLocation) : null,
        toStoredAt: toStoredAt as StorageLocation,
        quantity,
        transactionType: transactionType as 'DonationIn' | 'Transfer' | 'StatusChange' | 'Sale' | 'Repurposing' | 'Disposal',
        donationDriveId: body.donationDriveId ?? null,
        userId,
        remarks: body.remarks ?? null,
      },
      include: {
        itemType: { select: { id: true } },
        sizeOption: { select: { id: true, sizeName: true } },
      },
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        { error: 'invalid_reference', message: 'One or more referenced entities do not exist' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
