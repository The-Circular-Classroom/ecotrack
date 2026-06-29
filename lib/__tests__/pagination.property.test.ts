/**
 * Property 6: Pagination bounds clamping
 * Feature: aws-to-vercel-supabase-migration, Property 6: Pagination bounds clamping
 *
 * For any integer provided as pageSize, the effective page size SHALL be clamped
 * to the range [1, 100]. If pageSize is omitted or invalid, the effective page
 * size SHALL be 20.
 *
 * **Validates: Requirements 4.2**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { clampPageSize } from '../pagination'

describe('Feature: aws-to-vercel-supabase-migration, Property 6: Pagination bounds clamping', () => {
  it('should always return a value in [1, 100] for any integer input', () => {
    fc.assert(
      fc.property(fc.integer(), (input) => {
        const result = clampPageSize(input)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(100)
      }),
      { numRuns: 100 }
    )
  })

  it('should clamp values greater than 100 to exactly 100', () => {
    fc.assert(
      fc.property(fc.integer({ min: 101 }), (input) => {
        const result = clampPageSize(input)
        expect(result).toBe(100)
      }),
      { numRuns: 100 }
    )
  })

  it('should clamp values less than 1 to exactly 1', () => {
    fc.assert(
      fc.property(fc.integer({ max: 0 }), (input) => {
        const result = clampPageSize(input)
        expect(result).toBe(1)
      }),
      { numRuns: 100 }
    )
  })

  it('should return 20 for null, undefined, or NaN inputs', () => {
    expect(clampPageSize(null)).toBe(20)
    expect(clampPageSize(undefined)).toBe(20)
    expect(clampPageSize(NaN)).toBe(20)
  })

  it('should return the input unchanged when it is within [1, 100]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (input) => {
        const result = clampPageSize(input)
        expect(result).toBe(input)
      }),
      { numRuns: 100 }
    )
  })
})
