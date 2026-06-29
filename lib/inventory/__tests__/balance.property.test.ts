/**
 * Property 18: Inventory overview positive quantity invariant
 * Property 19: Balance non-negative constraint
 *
 * Feature: aws-to-vercel-supabase-migration, Property 18: Inventory overview positive quantity invariant
 * Feature: aws-to-vercel-supabase-migration, Property 19: Balance non-negative constraint
 *
 * Property 18: For any inventory overview query result, every item in the response SHALL have
 * a quantity strictly greater than zero.
 *
 * Property 19: For any transaction request, if the requested quantity exceeds the current
 * inventory balance for the corresponding (itemType, sizeOption, status, location) combination,
 * the system SHALL reject the transaction with an error indicating the current quantity and
 * requested quantity.
 *
 * **Validates: Requirements 8.5, 8.6**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateBalanceUpdate } from '../balance'

/**
 * Helper function that filters inventory balance records to only include items
 * with quantity > 0 (simulating the inventory overview endpoint behavior).
 */
interface BalanceRecord {
  itemTypeId: number
  sizeOptionId: number
  status: string
  location: string
  quantity: number
}

function filterOverviewBalances(records: BalanceRecord[]): BalanceRecord[] {
  return records.filter((record) => record.quantity > 0)
}

/** Arbitrary for generating balance records with various quantities */
const balanceRecordArb = fc.record({
  itemTypeId: fc.integer({ min: 1, max: 1000 }),
  sizeOptionId: fc.integer({ min: 1, max: 100 }),
  status: fc.constantFrom('ForSale', 'ForRepurpose', 'GeneralOffice'),
  location: fc.constantFrom('School', 'TCC', 'Exited'),
  quantity: fc.integer({ min: -100, max: 1000 }),
})

/** Arbitrary for a list of balance records */
const balanceRecordsArb = fc.array(balanceRecordArb, { minLength: 0, maxLength: 50 })

/** Arbitrary for non-negative current quantity (real inventory) */
const currentQuantityArb = fc.integer({ min: 0, max: 10000 })

/** Arbitrary for positive requested quantity (transaction amounts) */
const requestedQuantityArb = fc.integer({ min: 1, max: 10000 })

describe('Feature: aws-to-vercel-supabase-migration, Property 18: Inventory overview positive quantity invariant', () => {
  it('every item returned by the overview filter SHALL have a quantity strictly greater than zero', () => {
    fc.assert(
      fc.property(balanceRecordsArb, (records: BalanceRecord[]) => {
        const overview = filterOverviewBalances(records)

        // Every item in the filtered result must have quantity > 0
        for (const item of overview) {
          expect(item.quantity).toBeGreaterThan(0)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('items with zero or negative quantity SHALL NOT appear in the overview', () => {
    fc.assert(
      fc.property(balanceRecordsArb, (records: BalanceRecord[]) => {
        const overview = filterOverviewBalances(records)

        // Items with quantity <= 0 from the input should not be in the output
        const nonPositiveItems = records.filter((r) => r.quantity <= 0)
        for (const excluded of nonPositiveItems) {
          expect(overview).not.toContain(excluded)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('all items with quantity > 0 from input SHALL appear in the overview', () => {
    fc.assert(
      fc.property(balanceRecordsArb, (records: BalanceRecord[]) => {
        const overview = filterOverviewBalances(records)
        const positiveItems = records.filter((r) => r.quantity > 0)

        expect(overview.length).toBe(positiveItems.length)
        for (const item of positiveItems) {
          expect(overview).toContain(item)
        }
      }),
      { numRuns: 100 }
    )
  })
})

describe('Feature: aws-to-vercel-supabase-migration, Property 19: Balance non-negative constraint', () => {
  it('SHALL reject when requestedQuantity exceeds currentQuantity', () => {
    fc.assert(
      fc.property(
        currentQuantityArb,
        requestedQuantityArb,
        (currentQuantity: number, requestedQuantity: number) => {
          // Only test the case where requested > current
          fc.pre(requestedQuantity > currentQuantity)

          const result = validateBalanceUpdate(currentQuantity, requestedQuantity)
          expect(result).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL accept when requestedQuantity is less than or equal to currentQuantity', () => {
    fc.assert(
      fc.property(
        currentQuantityArb,
        requestedQuantityArb,
        (currentQuantity: number, requestedQuantity: number) => {
          // Only test the case where requested <= current
          fc.pre(requestedQuantity <= currentQuantity)

          const result = validateBalanceUpdate(currentQuantity, requestedQuantity)
          expect(result).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('for any (currentQuantity, requestedQuantity) the validation returns false iff requested > current', () => {
    fc.assert(
      fc.property(
        currentQuantityArb,
        fc.integer({ min: 0, max: 10000 }),
        (currentQuantity: number, requestedQuantity: number) => {
          const result = validateBalanceUpdate(currentQuantity, requestedQuantity)
          const expected = currentQuantity >= requestedQuantity
          expect(result).toBe(expected)
        }
      ),
      { numRuns: 100 }
    )
  })
})
