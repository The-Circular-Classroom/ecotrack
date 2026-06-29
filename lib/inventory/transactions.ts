/**
 * Transaction state machine for inventory item status transitions.
 *
 * Enforces valid status flows:
 * - Active statuses (ForSale, ForRepurpose, GeneralOffice) can transition to other statuses
 * - Terminal statuses (Sold, Repurposed, Disposed) have no outgoing transitions
 * - Initial donations (from === null) are always valid
 */

export type ItemStatus =
  | 'ForSale'
  | 'ForRepurpose'
  | 'GeneralOffice'
  | 'Sold'
  | 'Repurposed'
  | 'Disposed'

/** Terminal statuses — no outgoing transitions allowed */
export const TERMINAL_STATUSES: ItemStatus[] = ['Sold', 'Repurposed', 'Disposed']

/** Active statuses — can transition to other statuses */
export const ACTIVE_STATUSES: ItemStatus[] = ['ForSale', 'ForRepurpose', 'GeneralOffice']

/** All possible status values */
export const ALL_STATUSES: ItemStatus[] = [...ACTIVE_STATUSES, ...TERMINAL_STATUSES]

/** Map of allowed transitions from each status */
export const ALLOWED_TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  ForSale: ['Sold', 'ForRepurpose', 'Disposed', 'GeneralOffice'],
  ForRepurpose: ['Repurposed', 'ForSale', 'Disposed'],
  GeneralOffice: ['ForSale', 'ForRepurpose', 'Disposed'],
  Sold: [],        // terminal
  Repurposed: [],  // terminal
  Disposed: [],    // terminal
}

/**
 * Validates whether a status transition is allowed.
 *
 * @param from - The current status (null for initial donation)
 * @param to - The target status
 * @returns true if the transition is valid
 */
export function isValidTransition(from: ItemStatus | null, to: ItemStatus): boolean {
  // Initial donation — always valid
  if (from === null) return true
  // Terminal statuses have no outgoing transitions
  if (TERMINAL_STATUSES.includes(from)) return false
  // Check if the target is in the allowed set for the source status
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}
