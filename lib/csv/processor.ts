/**
 * CSV Approval Processor — writes validated CSV data to the database atomically.
 *
 * When an admin approves a validated CSV file:
 * 1. Creates Transaction records for each row (type "DonationIn", fromStatus null)
 * 2. Upserts InventoryBalance records (increments quantity)
 * 3. All within a single Prisma $transaction for atomicity
 * 4. On success: moves file from validated/ to processed/ in Supabase Storage
 * 5. On failure: keeps file in validated/, returns error details
 *
 * Email notification to the approver is handled by the calling route, not this function.
 */

import type { PrismaClient } from '@prisma/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ParsedRow } from './parser'

export interface ProcessingResult {
  success: boolean
  transactionsCreated: number
  balancesUpdated: number
  error?: string
}

/**
 * Processes an approved CSV file by creating Transaction and InventoryBalance records atomically.
 *
 * @param rows - The parsed and validated CSV rows
 * @param prisma - Prisma client instance
 * @param supabase - Supabase client instance (for storage file move)
 * @param filePath - Current path in storage (e.g., "validated/filename.csv")
 * @param approverId - User ID of the approver (for audit purposes)
 * @returns ProcessingResult indicating success or failure with details
 */
export async function processApprovedCsv(
  rows: ParsedRow[],
  prisma: PrismaClient,
  supabase: SupabaseClient,
  filePath: string,
  approverId: string
): Promise<ProcessingResult> {
  let transactionsCreated = 0
  let balancesUpdated = 0

  try {
    // Perform all database operations atomically in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      const balanceKeys = new Set<string>()

      for (const row of rows) {
        const itemTypeId = parseInt(row.item_type_id, 10)
        const userId = parseInt(row.user_id, 10)
        const donationDriveId = parseInt(row.donation_drive_id, 10)
        const quantity = parseInt(row.quantity, 10)
        const toStoredAt = mapStorageLocation(row.to_stored_at)
        const toStatus = mapItemStatus(row.to_status)

        // Look up the size option for this item type and size name
        const itemType = await tx.itemType.findUniqueOrThrow({
          where: { id: itemTypeId },
          select: { sizeCategoryId: true },
        })

        const sizeOption = await tx.sizeOption.findFirstOrThrow({
          where: {
            sizeCategoryId: itemType.sizeCategoryId,
            sizeName: row.size_name,
          },
          select: { id: true },
        })

        // Create Transaction record — DonationIn with null fromStatus
        await tx.transaction.create({
          data: {
            itemTypeId,
            sizeOptionId: sizeOption.id,
            userId,
            donationDriveId,
            quantity,
            transactionType: 'DonationIn',
            fromStatus: null,
            toStatus,
            fromStoredAt: null,
            toStoredAt,
          },
        })

        transactionsCreated++

        // Upsert InventoryBalance — increment quantity for the destination
        const balanceKey = `${itemTypeId}-${sizeOption.id}-${toStatus}-${toStoredAt}`
        await tx.inventoryBalance.upsert({
          where: {
            itemTypeId_sizeOptionId_itemStatus_storedAt: {
              itemTypeId,
              sizeOptionId: sizeOption.id,
              itemStatus: toStatus,
              storedAt: toStoredAt,
            },
          },
          update: {
            quantity: { increment: quantity },
          },
          create: {
            itemTypeId,
            sizeOptionId: sizeOption.id,
            itemStatus: toStatus,
            storedAt: toStoredAt,
            quantity,
          },
        })

        if (!balanceKeys.has(balanceKey)) {
          balanceKeys.add(balanceKey)
          balancesUpdated++
        }
      }

      return { transactionsCreated, balancesUpdated }
    })

    transactionsCreated = result.transactionsCreated
    balancesUpdated = result.balancesUpdated

    // On success: move file from validated/ to processed/
    const moveResult = await moveFileToProcessed(supabase, filePath)
    if (!moveResult.success) {
      // File move failed but DB writes succeeded — log warning but still report success
      // The data is committed; the file location is a secondary concern
      return {
        success: true,
        transactionsCreated,
        balancesUpdated,
        error: `Database records created successfully but file move failed: ${moveResult.error}`,
      }
    }

    return {
      success: true,
      transactionsCreated,
      balancesUpdated,
    }
  } catch (error) {
    // On failure: Prisma $transaction automatically rolls back all DB changes.
    // File remains in validated/ (no move was attempted or move is skipped).
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during CSV processing'

    return {
      success: false,
      transactionsCreated: 0,
      balancesUpdated: 0,
      error: errorMessage,
    }
  }
}

/**
 * Moves a file from its current location (validated/) to the processed/ folder.
 */
async function moveFileToProcessed(
  supabase: SupabaseClient,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  // Replace the "validated/" prefix with "processed/"
  const destinationPath = filePath.replace(/^validated\//, 'processed/')

  const { error } = await supabase.storage
    .from('donations')
    .move(filePath, destinationPath)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Maps CSV storage location strings to the StorageLocation enum values.
 */
function mapStorageLocation(value: string): 'School' | 'TCC' | 'Exited' {
  const normalized = value.toLowerCase().trim()
  switch (normalized) {
    case 'school':
      return 'School'
    case 'tcc':
      return 'TCC'
    case 'exited':
      return 'Exited'
    default:
      return 'School'
  }
}

/**
 * Maps CSV status strings to the ItemStatus enum values.
 */
function mapItemStatus(
  value: string
): 'ForSale' | 'ForRepurpose' | 'GeneralOffice' | 'Sold' | 'Repurposed' | 'Disposed' {
  const normalized = value.toLowerCase().trim()
  switch (normalized) {
    case 'for_sale':
    case 'forsale':
      return 'ForSale'
    case 'for_repurpose':
    case 'for_repurposing':
    case 'forrepurpose':
      return 'ForRepurpose'
    case 'general_office':
    case 'generaloffice':
      return 'GeneralOffice'
    case 'sold':
      return 'Sold'
    case 'repurposed':
      return 'Repurposed'
    case 'disposed':
      return 'Disposed'
    default:
      return 'ForSale'
  }
}
