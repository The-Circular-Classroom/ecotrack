/**
 * Deletion guard logic for item types.
 *
 * An item type cannot be deleted if it has associated transactions
 * or inventory balance records.
 *
 * Requirements: 8.1
 */

/**
 * Determines whether deletion of an item type should be blocked.
 *
 * @param transactionCount - Number of transactions associated with the item type
 * @param balanceCount - Number of inventory balance records associated with the item type
 * @returns true if deletion should be blocked, false if safe to delete
 */
export function shouldBlockDeletion(transactionCount: number, balanceCount: number): boolean {
  return transactionCount > 0 || balanceCount > 0
}
