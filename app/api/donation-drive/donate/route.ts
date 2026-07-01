import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

// Valid enum values from prisma schema
type StorageLocation = 'School' | 'TCC' | 'Exited'
type ItemStatus = 'GeneralOffice' | 'ForSale' | 'Sold' | 'ForRepurpose' | 'Repurposed' | 'Disposed'
type TransactionType = 'DonationIn' | 'Transfer' | 'StatusChange' | 'Sale' | 'Repurposing' | 'Disposal'

const VALID_STATUSES: ItemStatus[] = ['GeneralOffice', 'ForSale', 'Sold', 'ForRepurpose', 'Repurposed', 'Disposed']
const TERMINAL_STATUSES: ItemStatus[] = ['Sold', 'Repurposed', 'Disposed']

function getExpectedTransactionType(from_status: ItemStatus, to_status: ItemStatus) {
  if (from_status === 'ForSale' && to_status === 'Sold') return { type: 'Sale' as TransactionType, indirect: false }
  if (from_status === 'ForRepurpose' && to_status === 'Repurposed') return { type: 'Repurposing' as TransactionType, indirect: false }
  if (to_status === 'Disposed') return { type: 'Disposal' as TransactionType, indirect: false }
  if (from_status === 'ForSale' && to_status === 'ForRepurpose') return { type: 'StatusChange' as TransactionType, indirect: false }
  if (from_status === 'ForRepurpose' && to_status === 'ForSale') return { type: 'StatusChange' as TransactionType, indirect: false }
  if (from_status === 'ForSale' && to_status === 'GeneralOffice') return { type: 'StatusChange' as TransactionType, indirect: false }
  if (from_status === 'GeneralOffice' && to_status === 'ForSale') return { type: 'StatusChange' as TransactionType, indirect: false }
  if (from_status === 'ForRepurpose' && to_status === 'GeneralOffice') return { type: 'StatusChange' as TransactionType, indirect: false }
  if (from_status === 'GeneralOffice' && to_status === 'ForRepurpose') return { type: 'StatusChange' as TransactionType, indirect: false }

  if (from_status === 'ForRepurpose' && to_status === 'Sold') return { type: 'Sale' as TransactionType, indirect: true, via: 'ForSale' as ItemStatus }
  if (from_status === 'ForSale' && to_status === 'Repurposed') return { type: 'Repurposing' as TransactionType, indirect: true, via: 'ForRepurpose' as ItemStatus }
  if (from_status === 'GeneralOffice' && to_status === 'Sold') return { type: 'Sale' as TransactionType, indirect: true, via: 'ForSale' as ItemStatus }

  return null
}

interface TransactionStep {
  from_stored_at?: StorageLocation | null
  to_stored_at?: StorageLocation | null
  from_status?: ItemStatus | null
  to_status: ItemStatus
  quantity: number
  transaction_type: TransactionType
  remarks?: string | null
  item_type_id: number
  size_option_id: number
  donation_drive_id?: number | null
  user_id: number
}

function resolveTransactionSteps(data: {
  from_stored_at?: StorageLocation | null
  to_stored_at?: StorageLocation | null
  from_status?: ItemStatus | null
  to_status: ItemStatus
  quantity: number
  transaction_type: TransactionType
  remarks?: string | null
  item_type_id: number
  size_option_id: number
  donation_drive_id?: number | null
  user_id: number
}): TransactionStep[] {
  const { from_status, to_status, from_stored_at, to_stored_at, transaction_type } = data

  if (transaction_type === 'DonationIn') {
    if (!to_status) throw new Error('DonationIn requires to_status')
    if (!to_stored_at) throw new Error('DonationIn requires to_stored_at')
    if (TERMINAL_STATUSES.includes(to_status)) {
      throw new Error(`Cannot donate directly into terminal status: ${to_status}`)
    }
    if (to_status === 'GeneralOffice') {
      return [
        { ...data, transaction_type: 'DonationIn' as TransactionType, to_status: 'ForSale' as ItemStatus },
        {
          ...data,
          transaction_type: 'StatusChange' as TransactionType,
          from_status: 'ForSale' as ItemStatus,
          to_status: 'GeneralOffice' as ItemStatus,
          from_stored_at: data.to_stored_at,
        },
      ]
    }
    return [{ ...data, transaction_type: 'DonationIn' as TransactionType }]
  }

  if (!from_status || TERMINAL_STATUSES.includes(from_status)) {
    throw new Error(`Cannot transition from terminal or missing status: ${from_status}`)
  }

  if (!VALID_STATUSES.includes(from_status) || !VALID_STATUSES.includes(to_status)) {
    throw new Error(`Invalid status values`)
  }

  const statusChanged = from_status !== to_status
  const locationChanged = from_stored_at && to_stored_at && from_stored_at !== to_stored_at

  if (!statusChanged && !locationChanged) {
    throw new Error('No status or location change detected')
  }

  if (!statusChanged && locationChanged) {
    return [{
      ...data,
      transaction_type: 'Transfer' as TransactionType,
      to_status: from_status,
    }]
  }

  const expected = getExpectedTransactionType(from_status, to_status)
  if (!expected) {
    throw new Error(`Invalid status transition: ${from_status} → ${to_status}`)
  }

  // Handle direct transitions
  if (!expected.indirect) {
    const step = {
      ...data,
      transaction_type: expected.type,
      to_stored_at: expected.type === 'Sale' ? 'Exited' as StorageLocation : expected.type === 'Repurposing' ? 'TCC' as StorageLocation : expected.type === 'Disposal' ? 'Exited' as StorageLocation : (to_stored_at || from_stored_at),
    }

    if (!locationChanged || TERMINAL_STATUSES.includes(to_status)) {
      return [step]
    }

    const stepAtOrigin = {
      ...step,
      to_stored_at: from_stored_at,
    }

    const transferStep = {
      ...data,
      transaction_type: 'Transfer' as TransactionType,
      from_status: to_status,
      to_status: to_status,
      from_stored_at: from_stored_at,
      to_stored_at: to_stored_at,
    }

    return [stepAtOrigin, transferStep]
  }

  // Handle indirect transitions
  if (expected.indirect && expected.via) {
    if (from_status === 'ForRepurpose' && to_status === 'Sold') {
      return resolveTransactionSteps({
        ...data,
        to_status: 'ForSale' as ItemStatus,
        transaction_type: 'StatusChange' as TransactionType
      }).concat(
        resolveTransactionSteps({
          ...data,
          from_status: 'ForSale' as ItemStatus,
          to_status: 'Sold' as ItemStatus,
          transaction_type: 'Sale' as TransactionType
        })
      )
    }

    if (from_status === 'ForSale' && to_status === 'Repurposed') {
      return resolveTransactionSteps({
        ...data,
        to_status: 'ForRepurpose' as ItemStatus,
        transaction_type: 'StatusChange' as TransactionType
      }).concat(
        resolveTransactionSteps({
          ...data,
          from_status: 'ForRepurpose' as ItemStatus,
          to_status: 'Repurposed' as ItemStatus,
          transaction_type: 'Repurposing' as TransactionType
        })
      )
    }

    if (from_status === 'GeneralOffice' && to_status === 'Sold') {
      return resolveTransactionSteps({
        ...data,
        to_status: 'ForSale' as ItemStatus,
        transaction_type: 'StatusChange' as TransactionType
      }).concat(
        resolveTransactionSteps({
          ...data,
          from_status: 'ForSale' as ItemStatus,
          to_status: 'Sold' as ItemStatus,
          transaction_type: 'Sale' as TransactionType
        })
      )
    }
  }

  throw new Error(`Invalid status transition: ${from_status} → ${to_status}`)
}

async function incrementBalance(tx: any, itemTypeId: number, sizeOptionId: number, status: ItemStatus, storedAt: StorageLocation, quantity: number) {
  return tx.inventoryBalance.upsert({
    where: {
      itemTypeId_sizeOptionId_itemStatus_storedAt: {
        itemTypeId,
        sizeOptionId,
        itemStatus: status,
        storedAt,
      },
    },
    update: {
      quantity: { increment: quantity },
    },
    create: {
      itemTypeId,
      sizeOptionId,
      itemStatus: status,
      storedAt,
      quantity,
    },
  })
}

async function decrementBalance(tx: any, itemTypeId: number, sizeOptionId: number, status: ItemStatus, storedAt: StorageLocation, quantity: number) {
  const existing = await tx.inventoryBalance.findUnique({
    where: {
      itemTypeId_sizeOptionId_itemStatus_storedAt: {
        itemTypeId,
        sizeOptionId,
        itemStatus: status,
        storedAt,
      },
    },
  })

  if (!existing || existing.quantity < quantity) {
    throw new Error(`Insufficient inventory: have ${existing?.quantity ?? 0}, requested ${quantity}`)
  }

  return tx.inventoryBalance.update({
    where: { id: existing.id },
    data: {
      quantity: { decrement: quantity },
    },
  })
}

async function applyInventoryEffect(tx: any, step: any) {
  const { item_type_id, size_option_id, quantity } = step

  switch (step.transaction_type) {
    case 'DonationIn':
      await incrementBalance(tx, item_type_id, size_option_id, step.to_status, step.to_stored_at, quantity)
      break
    case 'Transfer':
      await decrementBalance(tx, item_type_id, size_option_id, step.from_status, step.from_stored_at, quantity)
      await incrementBalance(tx, item_type_id, size_option_id, step.from_status, step.to_stored_at, quantity)
      break
    case 'StatusChange':
      await decrementBalance(tx, item_type_id, size_option_id, step.from_status, step.from_stored_at, quantity)
      await incrementBalance(tx, item_type_id, size_option_id, step.to_status, step.to_stored_at, quantity)
      break
    case 'Sale':
      await decrementBalance(tx, item_type_id, size_option_id, step.from_status, step.from_stored_at, quantity)
      await incrementBalance(tx, item_type_id, size_option_id, 'Sold' as ItemStatus, 'Exited' as StorageLocation, quantity)
      break
    case 'Repurposing':
      await decrementBalance(tx, item_type_id, size_option_id, step.from_status, step.from_stored_at, quantity)
      await incrementBalance(tx, item_type_id, size_option_id, 'Repurposed' as ItemStatus, 'TCC' as StorageLocation, quantity)
      break
    case 'Disposal':
      await decrementBalance(tx, item_type_id, size_option_id, step.from_status, step.from_stored_at, quantity)
      await incrementBalance(tx, item_type_id, size_option_id, 'Disposed' as ItemStatus, 'Exited' as StorageLocation, quantity)
      break
    default:
      throw new Error(`Unknown transaction type: ${step.transaction_type}`)
  }
}

/**
 * POST /api/donation-drive/donate
 * Creates donation transaction and registers inventory balance updates.
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/donation-drive/donate')
  const role = request.headers.get('x-user-role')
  const authUserId = request.headers.get('x-user-id')

  if (!requireRole(role, 'PsgVolunteer')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'PSG Volunteer access required' },
      { status: 403 }
    )
  }

  if (!authUserId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Authentication required' },
      { status: 401 }
    )
  }

  let body: {
    from_stored_at?: StorageLocation | null
    to_stored_at?: StorageLocation | null
    from_status?: ItemStatus | null
    to_status: ItemStatus
    quantity: number
    transaction_type: TransactionType
    remarks?: string | null
    item_type_id: number
    donation_drive_id?: number | null
    size_name: string
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
    from_stored_at,
    to_stored_at,
    from_status,
    to_status,
    quantity,
    transaction_type,
    remarks,
    item_type_id,
    donation_drive_id,
    size_name
  } = body

  if (!to_status || !quantity || !transaction_type || !item_type_id || !size_name) {
    return NextResponse.json(
      { error: 'missing_field', message: 'to_status, quantity, transaction_type, item_type_id, and size_name are required' },
      { status: 400 }
    )
  }

  try {
    // Resolve user primary key from authUserId
    const user = await prisma.user.findUnique({
      where: { supabaseAuthId: authUserId }
    })
    if (!user) {
      return NextResponse.json({ error: 'not_found', message: 'User not found' }, { status: 404 })
    }

    // Verify ItemType exists
    const itemType = await prisma.itemType.findUnique({
      where: { id: item_type_id },
      include: {
        sizeCategory: {
          include: { sizeOptions: true }
        }
      }
    })

    if (!itemType) {
      return NextResponse.json({ error: 'not_found', message: 'Item type not found' }, { status: 404 })
    }

    // Verify size option
    const sizeOption = itemType.sizeCategory.sizeOptions.find((o) => o.sizeName === size_name)
    if (!sizeOption) {
      return NextResponse.json({ error: 'not_found', message: `Size option '${size_name}' not found for item type` }, { status: 404 })
    }

    // Verify donation drive exists if provided
    if (donation_drive_id) {
      const drive = await prisma.donationDrive.findUnique({
        where: { id: donation_drive_id }
      })
      if (!drive) {
        return NextResponse.json({ error: 'not_found', message: 'Donation drive not found' }, { status: 404 })
      }
    }

    // Resolve atomic transaction steps
    const steps = resolveTransactionSteps({
      from_stored_at: from_stored_at ?? null,
      to_stored_at: to_stored_at ?? null,
      from_status: from_status ?? null,
      to_status,
      quantity,
      transaction_type,
      remarks: remarks ?? null,
      item_type_id,
      size_option_id: sizeOption.id,
      donation_drive_id: donation_drive_id ?? null,
      user_id: user.id
    })

    // Execute atomic steps inside db transaction
    const results = await prisma.$transaction(async (tx) => {
      const txns = []
      for (const step of steps) {
        const txn = await tx.transaction.create({
          data: {
            fromStoredAt: step.from_stored_at,
            toStoredAt: step.to_stored_at,
            fromStatus: step.from_status,
            toStatus: step.to_status,
            quantity: step.quantity,
            transactionType: step.transaction_type,
            remarks: step.remarks,
            itemTypeId: step.item_type_id,
            sizeOptionId: step.size_option_id,
            donationDriveId: step.donation_drive_id,
            userId: step.user_id,
          }
        })
        await applyInventoryEffect(tx, step)
        txns.push(txn)
      }
      return txns
    })

    return NextResponse.json({ success: true, message: 'Donation added successfully', data: results })
  } catch (error: any) {
    logger.error('Error creating donation details', { error: error.message })
    return NextResponse.json({ error: 'donation_error', message: error.message }, { status: 500 })
  }
}
