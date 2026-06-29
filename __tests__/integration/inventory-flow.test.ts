/**
 * Integration test: Inventory Flow
 *
 * Tests the end-to-end inventory management flow through multiple modules:
 *   create item type → create transaction → verify balance
 *
 * Mocks Prisma but tests the business logic flow through the
 * transaction state machine, balance manager, and deletion guard.
 *
 * Validates: Requirements 8.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isValidTransition,
  TERMINAL_STATUSES,
  ACTIVE_STATUSES,
  ALLOWED_TRANSITIONS,
  type ItemStatus,
} from '@/lib/inventory/transactions'
import {
  updateInventoryBalance,
  validateBalanceUpdate,
  type BalanceUpdateParams,
  type StorageLocation,
} from '@/lib/inventory/balance'
import { shouldBlockDeletion } from '@/lib/inventory/deletion-guard'
import { requireRole } from '@/lib/auth/roles'

// Helper: create mock Prisma for balance operations
function createMockPrismaForBalance(options: {
  existingBalance?: number
} = {}) {
  const { existingBalance = 10 } = options

  const mockTx = {
    inventoryBalance: {
      findUnique: vi.fn().mockResolvedValue(
        existingBalance > 0
          ? { quantity: existingBalance }
          : null
      ),
      update: vi.fn().mockResolvedValue({ quantity: existingBalance }),
      upsert: vi.fn().mockResolvedValue({ quantity: existingBalance }),
    },
  }

  return {
    $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => fn(mockTx)),
    _tx: mockTx,
  } as any
}

describe('Inventory Flow Integration: create item type → transaction → verify balance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Step 1: Authorization — only SchoolStaff+ can manage inventory', () => {
    it('SchoolStaff has access to inventory endpoints', () => {
      expect(requireRole('SchoolStaff', 'SchoolStaff')).toBe(true)
      expect(requireRole('Admin', 'SchoolStaff')).toBe(true)
    })

    it('Parent and PsgVolunteer cannot access inventory endpoints', () => {
      expect(requireRole('Parent', 'SchoolStaff')).toBe(false)
      expect(requireRole('PsgVolunteer', 'SchoolStaff')).toBe(false)
    })
  })

  describe('Step 2: Item type creation — validation and references', () => {
    it('new item type has no transactions or balances (can be deleted)', () => {
      // Fresh item type has no associations
      expect(shouldBlockDeletion(0, 0)).toBe(false)
    })

    it('item type with transactions cannot be deleted', () => {
      expect(shouldBlockDeletion(1, 0)).toBe(true)
      expect(shouldBlockDeletion(5, 0)).toBe(true)
    })

    it('item type with balance records cannot be deleted', () => {
      expect(shouldBlockDeletion(0, 1)).toBe(true)
      expect(shouldBlockDeletion(0, 3)).toBe(true)
    })

    it('item type with both transactions and balances cannot be deleted', () => {
      expect(shouldBlockDeletion(3, 2)).toBe(true)
    })
  })

  describe('Step 3: Transaction state machine — status transitions', () => {
    it('allows initial donation (null → any status)', () => {
      for (const status of ACTIVE_STATUSES) {
        expect(isValidTransition(null, status)).toBe(true)
      }
      // Even terminal statuses are valid for initial donation
      for (const status of TERMINAL_STATUSES) {
        expect(isValidTransition(null, status)).toBe(true)
      }
    })

    it('allows valid transitions from ForSale', () => {
      const allowedFromForSale = ALLOWED_TRANSITIONS['ForSale']
      for (const target of allowedFromForSale) {
        expect(isValidTransition('ForSale', target)).toBe(true)
      }
    })

    it('blocks transitions from terminal statuses', () => {
      for (const terminal of TERMINAL_STATUSES) {
        for (const target of [...ACTIVE_STATUSES, ...TERMINAL_STATUSES]) {
          expect(isValidTransition(terminal, target)).toBe(false)
        }
      }
    })

    it('blocks invalid transitions (ForSale → ForSale is not allowed)', () => {
      // Self-transition is not in the allowed list
      expect(isValidTransition('ForSale', 'ForSale')).toBe(false)
    })

    it('allows ForRepurpose → Repurposed (logical final status)', () => {
      expect(isValidTransition('ForRepurpose', 'Repurposed')).toBe(true)
    })

    it('allows GeneralOffice → ForSale (moving items to sale)', () => {
      expect(isValidTransition('GeneralOffice', 'ForSale')).toBe(true)
    })
  })

  describe('Step 4: Balance updates — ensure non-negative constraint', () => {
    it('validates that balance stays non-negative', () => {
      expect(validateBalanceUpdate(10, 5)).toBe(true)  // 10 - 5 = 5 ✓
      expect(validateBalanceUpdate(10, 10)).toBe(true) // 10 - 10 = 0 ✓
      expect(validateBalanceUpdate(10, 11)).toBe(false) // 10 - 11 = -1 ✗
      expect(validateBalanceUpdate(0, 1)).toBe(false)   // 0 - 1 = -1 ✗
      expect(validateBalanceUpdate(0, 0)).toBe(true)    // 0 - 0 = 0 ✓
    })

    it('increments balance for initial donation (no fromStatus)', async () => {
      const mockPrisma = createMockPrismaForBalance()
      const params: BalanceUpdateParams = {
        itemTypeId: 1,
        sizeOptionId: 7,
        toStatus: 'ForSale',
        toStoredAt: 'TCC',
        quantity: 5,
      }

      const result = await updateInventoryBalance(mockPrisma, params)

      expect(result.success).toBe(true)
      // Only upsert should be called (no decrement needed for initial donation)
      expect(mockPrisma._tx.inventoryBalance.upsert).toHaveBeenCalledTimes(1)
      expect(mockPrisma._tx.inventoryBalance.findUnique).not.toHaveBeenCalled()
    })

    it('decrements source and increments destination for status change', async () => {
      const mockPrisma = createMockPrismaForBalance({ existingBalance: 10 })
      const params: BalanceUpdateParams = {
        itemTypeId: 1,
        sizeOptionId: 7,
        fromStatus: 'ForSale',
        toStatus: 'Sold',
        fromStoredAt: 'TCC',
        toStoredAt: 'TCC',
        quantity: 3,
      }

      const result = await updateInventoryBalance(mockPrisma, params)

      expect(result.success).toBe(true)
      // findUnique to check current balance
      expect(mockPrisma._tx.inventoryBalance.findUnique).toHaveBeenCalledTimes(1)
      // update to decrement source
      expect(mockPrisma._tx.inventoryBalance.update).toHaveBeenCalledTimes(1)
      // upsert to increment destination
      expect(mockPrisma._tx.inventoryBalance.upsert).toHaveBeenCalledTimes(1)
    })

    it('returns error when transaction would cause balance underflow', async () => {
      const mockPrisma = createMockPrismaForBalance({ existingBalance: 2 })
      const params: BalanceUpdateParams = {
        itemTypeId: 1,
        sizeOptionId: 7,
        fromStatus: 'ForSale',
        toStatus: 'Sold',
        fromStoredAt: 'TCC',
        toStoredAt: 'TCC',
        quantity: 5, // More than available (2)
      }

      const result = await updateInventoryBalance(mockPrisma, params)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('balance_underflow')
        expect(result.error.itemTypeId).toBe(1)
        expect(result.error.sizeOptionId).toBe(7)
        expect(result.error.currentQuantity).toBe(2)
        expect(result.error.requestedQuantity).toBe(5)
      }
    })

    it('returns error when source balance does not exist (quantity 0)', async () => {
      const mockPrisma = createMockPrismaForBalance()
      // Override findUnique to return null (no existing balance)
      mockPrisma._tx.inventoryBalance.findUnique.mockResolvedValue(null)

      const params: BalanceUpdateParams = {
        itemTypeId: 1,
        sizeOptionId: 7,
        fromStatus: 'ForSale',
        toStatus: 'Sold',
        fromStoredAt: 'TCC',
        toStoredAt: 'TCC',
        quantity: 1,
      }

      const result = await updateInventoryBalance(mockPrisma, params)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('balance_underflow')
        expect(result.error.currentQuantity).toBe(0)
        expect(result.error.requestedQuantity).toBe(1)
      }
    })
  })

  describe('Full end-to-end flow: create item → donate → transfer → sell → verify', () => {
    it('simulates complete inventory lifecycle through all modules', async () => {
      // Step 1: Verify authorization for SchoolStaff
      expect(requireRole('SchoolStaff', 'SchoolStaff')).toBe(true)

      // Step 2: Item type creation — new item has no associations
      const newItemTypeId = 42
      expect(shouldBlockDeletion(0, 0)).toBe(false) // can still be deleted

      // Step 3: Initial donation (null → ForSale) — always valid
      expect(isValidTransition(null, 'ForSale')).toBe(true)

      // Create the initial balance via donation
      const mockPrisma1 = createMockPrismaForBalance()
      const donationResult = await updateInventoryBalance(mockPrisma1, {
        itemTypeId: newItemTypeId,
        sizeOptionId: 1,
        toStatus: 'ForSale',
        toStoredAt: 'School',
        quantity: 10,
      })
      expect(donationResult.success).toBe(true)

      // Step 4: After donation, item type has transactions — cannot delete
      expect(shouldBlockDeletion(1, 1)).toBe(true)

      // Step 5: Transfer some items (ForSale → ForRepurpose)
      expect(isValidTransition('ForSale', 'ForRepurpose')).toBe(true)

      const mockPrisma2 = createMockPrismaForBalance({ existingBalance: 10 })
      const transferResult = await updateInventoryBalance(mockPrisma2, {
        itemTypeId: newItemTypeId,
        sizeOptionId: 1,
        fromStatus: 'ForSale',
        toStatus: 'ForRepurpose',
        fromStoredAt: 'School',
        toStoredAt: 'TCC',
        quantity: 3,
      })
      expect(transferResult.success).toBe(true)

      // Step 6: Sell some items (ForSale → Sold)
      expect(isValidTransition('ForSale', 'Sold')).toBe(true)

      const mockPrisma3 = createMockPrismaForBalance({ existingBalance: 7 }) // 10 - 3 = 7 remaining
      const saleResult = await updateInventoryBalance(mockPrisma3, {
        itemTypeId: newItemTypeId,
        sizeOptionId: 1,
        fromStatus: 'ForSale',
        toStatus: 'Sold',
        fromStoredAt: 'School',
        toStoredAt: 'School',
        quantity: 2,
      })
      expect(saleResult.success).toBe(true)

      // Step 7: Attempt invalid transition (Sold → ForSale) — should be blocked
      expect(isValidTransition('Sold', 'ForSale')).toBe(false)

      // Step 8: Attempt to sell more than available — should underflow
      const mockPrisma4 = createMockPrismaForBalance({ existingBalance: 5 }) // 7 - 2 = 5 remaining
      const underflowResult = await updateInventoryBalance(mockPrisma4, {
        itemTypeId: newItemTypeId,
        sizeOptionId: 1,
        fromStatus: 'ForSale',
        toStatus: 'Sold',
        fromStoredAt: 'School',
        toStoredAt: 'School',
        quantity: 6, // Only 5 available
      })
      expect(underflowResult.success).toBe(false)
      if (!underflowResult.success) {
        expect(underflowResult.error.type).toBe('balance_underflow')
        expect(underflowResult.error.currentQuantity).toBe(5)
        expect(underflowResult.error.requestedQuantity).toBe(6)
      }
    })

    it('simulates repurposing flow: ForRepurpose → Repurposed', async () => {
      // Validate the transition is allowed
      expect(isValidTransition('ForRepurpose', 'Repurposed')).toBe(true)

      const mockPrisma = createMockPrismaForBalance({ existingBalance: 3 })
      const result = await updateInventoryBalance(mockPrisma, {
        itemTypeId: 10,
        sizeOptionId: 2,
        fromStatus: 'ForRepurpose',
        toStatus: 'Repurposed',
        fromStoredAt: 'TCC',
        toStoredAt: 'Exited',
        quantity: 3,
      })

      expect(result.success).toBe(true)

      // After repurposing, items are in terminal state — can't transition again
      expect(isValidTransition('Repurposed', 'ForSale')).toBe(false)
      expect(isValidTransition('Repurposed', 'Disposed')).toBe(false)
    })

    it('simulates disposal flow: GeneralOffice → Disposed', async () => {
      expect(isValidTransition('GeneralOffice', 'Disposed')).toBe(true)

      const mockPrisma = createMockPrismaForBalance({ existingBalance: 5 })
      const result = await updateInventoryBalance(mockPrisma, {
        itemTypeId: 15,
        sizeOptionId: 3,
        fromStatus: 'GeneralOffice',
        toStatus: 'Disposed',
        fromStoredAt: 'School',
        toStoredAt: 'Exited',
        quantity: 5,
      })

      expect(result.success).toBe(true)

      // Disposed is terminal
      expect(isValidTransition('Disposed', 'ForSale')).toBe(false)
    })
  })
})
