/**
 * Inventory balance manager — atomic inventory updates with underflow protection.
 *
 * Handles incrementing and decrementing inventory balances when transactions occur.
 * Uses Prisma $transaction for atomicity and validates that balances never go below zero.
 */

import { PrismaClient } from '@/lib/prisma/generated/client/client'
import type { ItemStatus } from './transactions'

export type StorageLocation = 'School' | 'TCC' | 'Exited'

export interface BalanceUpdateParams {
  itemTypeId: number
  sizeOptionId: number
  fromStatus?: ItemStatus
  toStatus: ItemStatus
  fromStoredAt?: StorageLocation
  toStoredAt: StorageLocation
  quantity: number
}

export interface BalanceError {
  type: 'balance_underflow'
  itemTypeId: number
  sizeOptionId: number
  currentQuantity: number
  requestedQuantity: number
}

export type BalanceResult = { success: true } | { success: false; error: BalanceError }

/**
 * Pure validation function — checks if a balance update would cause an underflow.
 * Can be tested without a database connection.
 *
 * @param currentQuantity - The current inventory balance
 * @param requestedQuantity - The quantity to decrement
 * @returns true if the update is valid (no underflow)
 */
export function validateBalanceUpdate(currentQuantity: number, requestedQuantity: number): boolean {
  return currentQuantity >= requestedQuantity
}

/**
 * Atomically updates inventory balances for a transaction.
 *
 * If there is a fromStatus (not an initial donation):
 *   - Decrements the balance for (itemType, size, fromStatus, fromStoredAt)
 *   - Returns an error if the decrement would reduce the balance below zero
 *
 * Always increments (or creates) the balance for (itemType, size, toStatus, toStoredAt).
 *
 * All operations are performed within a Prisma $transaction for atomicity.
 *
 * @param prisma - Prisma client instance
 * @param params - Balance update parameters
 * @returns BalanceResult indicating success or underflow error
 */
export async function updateInventoryBalance(
  prisma: PrismaClient,
  params: BalanceUpdateParams
): Promise<BalanceResult> {
  const { itemTypeId, sizeOptionId, fromStatus, toStatus, fromStoredAt, toStoredAt, quantity } = params

  return prisma.$transaction(async (tx) => {
    // If there's a fromStatus, we need to decrement the source balance
    if (fromStatus && fromStoredAt) {
      const sourceBalance = await tx.inventoryBalance.findUnique({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId,
            sizeOptionId,
            itemStatus: fromStatus,
            storedAt: fromStoredAt,
          },
        },
      })

      const currentQuantity = sourceBalance?.quantity ?? 0

      if (!validateBalanceUpdate(currentQuantity, quantity)) {
        return {
          success: false as const,
          error: {
            type: 'balance_underflow' as const,
            itemTypeId,
            sizeOptionId,
            currentQuantity,
            requestedQuantity: quantity,
          },
        }
      }

      // Decrement the source balance
      await tx.inventoryBalance.update({
        where: {
          itemTypeId_sizeOptionId_itemStatus_storedAt: {
            itemTypeId,
            sizeOptionId,
            itemStatus: fromStatus,
            storedAt: fromStoredAt,
          },
        },
        data: {
          quantity: { decrement: quantity },
        },
      })
    }

    // Increment (or create) the destination balance
    await tx.inventoryBalance.upsert({
      where: {
        itemTypeId_sizeOptionId_itemStatus_storedAt: {
          itemTypeId,
          sizeOptionId,
          itemStatus: toStatus,
          storedAt: toStoredAt,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        itemTypeId,
        sizeOptionId,
        itemStatus: toStatus,
        storedAt: toStoredAt,
        quantity,
      },
    })

    return { success: true as const }
  })
}
