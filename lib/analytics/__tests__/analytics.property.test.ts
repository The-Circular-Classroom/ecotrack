/**
 * Property 20: Assembly plan feasibility
 * Property 21: Analytics filter parameter validation
 *
 * Feature: aws-to-vercel-supabase-migration, Property 20: Assembly plan feasibility
 * Feature: aws-to-vercel-supabase-migration, Property 21: Analytics filter parameter validation
 *
 * Property 20: For any assembly plan calculation given current stock levels and recipe
 * requirements, the plan SHALL never specify producing more units of a product than the
 * available ingredient stock can support.
 *
 * Property 21: For any analytics request filter, the validation function SHALL reject with
 * a 400 response if: the year is not a positive integer, OR any month value is outside
 * [1, 12], OR startMonth is greater than endMonth.
 *
 * **Validates: Requirements 9.2, 9.6**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { calculateMaxProducible } from '../assembly'
import { validateCollectionFilter, CollectionFilter } from '../collection'

// ─── Arbitraries for Property 20 ─────────────────────────────────────────────

/** Arbitrary for requested units (positive integer) */
const requestedArb = fc.integer({ min: 0, max: 10000 })

/** Arbitrary for available stock (non-negative integer) */
const availableStockArb = fc.integer({ min: 0, max: 100000 })

/** Arbitrary for quantity per unit (positive integer, at least 1) */
const quantityPerUnitArb = fc.integer({ min: 1, max: 100 })

// ─── Arbitraries for Property 21 ─────────────────────────────────────────────

/** Arbitrary for a valid year (positive integer) */
const validYearArb = fc.integer({ min: 1, max: 9999 })

/** Arbitrary for a valid month (1-12) */
const validMonthArb = fc.integer({ min: 1, max: 12 })

/** Arbitrary for an invalid year (non-positive or non-integer) */
const invalidYearArb = fc.oneof(
  fc.integer({ min: -10000, max: 0 }),
  fc.double({ min: 0.1, max: 9999.9, noNaN: true, noDefaultInfinity: true }).filter((n) => !Number.isInteger(n))
)

/** Arbitrary for an invalid month (outside 1-12 or non-integer) */
const invalidMonthArb = fc.oneof(
  fc.integer({ min: -100, max: 0 }),
  fc.integer({ min: 13, max: 100 }),
  fc.double({ min: 0.1, max: 12.9, noNaN: true, noDefaultInfinity: true }).filter((n) => !Number.isInteger(n))
)

// ─── Property 20: Assembly plan feasibility ──────────────────────────────────

describe('Feature: aws-to-vercel-supabase-migration, Property 20: Assembly plan feasibility', () => {
  it('calculateMaxProducible SHALL never return more than requested', () => {
    fc.assert(
      fc.property(
        requestedArb,
        availableStockArb,
        quantityPerUnitArb,
        (requested: number, availableStock: number, quantityPerUnit: number) => {
          const result = calculateMaxProducible(requested, availableStock, quantityPerUnit)
          expect(result).toBeLessThanOrEqual(requested)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('calculateMaxProducible SHALL never exceed what available stock can support', () => {
    fc.assert(
      fc.property(
        requestedArb,
        availableStockArb,
        quantityPerUnitArb,
        (requested: number, availableStock: number, quantityPerUnit: number) => {
          const result = calculateMaxProducible(requested, availableStock, quantityPerUnit)

          // result * quantityPerUnit must not exceed availableStock
          expect(result * quantityPerUnit).toBeLessThanOrEqual(availableStock)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('calculateMaxProducible SHALL return 0 when availableStock is 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        quantityPerUnitArb,
        (requested: number, quantityPerUnit: number) => {
          const result = calculateMaxProducible(requested, 0, quantityPerUnit)
          expect(result).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('calculateMaxProducible SHALL return 0 when requested is 0', () => {
    fc.assert(
      fc.property(
        availableStockArb,
        quantityPerUnitArb,
        (availableStock: number, quantityPerUnit: number) => {
          const result = calculateMaxProducible(0, availableStock, quantityPerUnit)
          expect(result).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('calculateMaxProducible SHALL equal min(requested, floor(availableStock / quantityPerUnit)) for positive inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 100000 }),
        quantityPerUnitArb,
        (requested: number, availableStock: number, quantityPerUnit: number) => {
          const result = calculateMaxProducible(requested, availableStock, quantityPerUnit)
          const expected = Math.min(requested, Math.floor(availableStock / quantityPerUnit))
          expect(result).toBe(expected)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 21: Analytics filter parameter validation ──────────────────────

describe('Feature: aws-to-vercel-supabase-migration, Property 21: Analytics filter parameter validation', () => {
  it('SHALL accept filters with valid year and no month constraints', () => {
    fc.assert(
      fc.property(validYearArb, (year: number) => {
        const filter: CollectionFilter = { year }
        const result = validateCollectionFilter(filter)
        expect(result).toBeNull()
      }),
      { numRuns: 100 }
    )
  })

  it('SHALL accept filters with valid year and valid month range', () => {
    fc.assert(
      fc.property(
        validYearArb,
        validMonthArb,
        validMonthArb,
        (year: number, m1: number, m2: number) => {
          // Ensure startMonth <= endMonth
          const startMonth = Math.min(m1, m2)
          const endMonth = Math.max(m1, m2)

          const filter: CollectionFilter = { year, startMonth, endMonth }
          const result = validateCollectionFilter(filter)
          expect(result).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL reject filters with invalid year (non-positive or non-integer)', () => {
    fc.assert(
      fc.property(invalidYearArb, (year: number) => {
        const filter: CollectionFilter = { year }
        const result = validateCollectionFilter(filter)
        expect(result).not.toBeNull()
        expect(result!.field).toBe('year')
      }),
      { numRuns: 100 }
    )
  })

  it('SHALL reject filters with invalid startMonth (outside 1-12)', () => {
    fc.assert(
      fc.property(
        validYearArb,
        invalidMonthArb,
        (year: number, startMonth: number) => {
          const filter: CollectionFilter = { year, startMonth }
          const result = validateCollectionFilter(filter)
          expect(result).not.toBeNull()
          expect(result!.field).toBe('startMonth')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL reject filters with invalid endMonth (outside 1-12)', () => {
    fc.assert(
      fc.property(
        validYearArb,
        invalidMonthArb,
        (year: number, endMonth: number) => {
          const filter: CollectionFilter = { year, endMonth }
          const result = validateCollectionFilter(filter)
          expect(result).not.toBeNull()
          expect(result!.field).toBe('endMonth')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL reject filters where startMonth > endMonth', () => {
    fc.assert(
      fc.property(
        validYearArb,
        validMonthArb,
        validMonthArb,
        (year: number, m1: number, m2: number) => {
          // Ensure startMonth > endMonth
          fc.pre(m1 !== m2)
          const startMonth = Math.max(m1, m2)
          const endMonth = Math.min(m1, m2)

          const filter: CollectionFilter = { year, startMonth, endMonth }
          const result = validateCollectionFilter(filter)
          expect(result).not.toBeNull()
          expect(result!.field).toBe('startMonth')
        }
      ),
      { numRuns: 100 }
    )
  })
})
