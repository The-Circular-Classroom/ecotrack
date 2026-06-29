/**
 * Property 16: Item type deletion guard
 * Feature: aws-to-vercel-supabase-migration, Property 16: Item type deletion guard
 *
 * For any item type, if it has at least one associated transaction record or at least one
 * associated inventory balance record, then a deletion request for that item type SHALL be
 * rejected with an error.
 *
 * **Validates: Requirements 8.1**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { shouldBlockDeletion } from '../deletion-guard'

/** Arbitrary for non-negative integers representing counts */
const countArb = fc.nat({ max: 10000 })

/** Arbitrary for positive integers (at least 1) */
const positiveCountArb = fc.integer({ min: 1, max: 10000 })

describe('Feature: aws-to-vercel-supabase-migration, Property 16: Item type deletion guard', () => {
  describe('Property A: Deletion is blocked when transactionCount >= 1 OR balanceCount >= 1', () => {
    it('should block deletion when transactionCount >= 1 (regardless of balanceCount)', () => {
      fc.assert(
        fc.property(positiveCountArb, countArb, (transactionCount: number, balanceCount: number) => {
          expect(shouldBlockDeletion(transactionCount, balanceCount)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('should block deletion when balanceCount >= 1 (regardless of transactionCount)', () => {
      fc.assert(
        fc.property(countArb, positiveCountArb, (transactionCount: number, balanceCount: number) => {
          expect(shouldBlockDeletion(transactionCount, balanceCount)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('should block deletion when both transactionCount >= 1 and balanceCount >= 1', () => {
      fc.assert(
        fc.property(positiveCountArb, positiveCountArb, (transactionCount: number, balanceCount: number) => {
          expect(shouldBlockDeletion(transactionCount, balanceCount)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property B: Deletion is allowed when transactionCount === 0 AND balanceCount === 0', () => {
    it('should allow deletion when both counts are zero', () => {
      expect(shouldBlockDeletion(0, 0)).toBe(false)
    })
  })

  describe('Combined: For any (transactionCount, balanceCount) pair, result matches the spec exactly', () => {
    it('should block if and only if transactionCount > 0 or balanceCount > 0', () => {
      fc.assert(
        fc.property(countArb, countArb, (transactionCount: number, balanceCount: number) => {
          const result = shouldBlockDeletion(transactionCount, balanceCount)
          const expected = transactionCount > 0 || balanceCount > 0
          expect(result).toBe(expected)
        }),
        { numRuns: 100 }
      )
    })
  })
})
