/**
 * Property 17: Transaction state machine
 * Feature: aws-to-vercel-supabase-migration, Property 17: Transaction state machine
 *
 * For any (fromStatus, toStatus) pair, the transition validation function SHALL accept the
 * transition if and only if: (a) fromStatus is null (initial donation), or (b) fromStatus is
 * not a terminal status AND toStatus is in the allowed transitions set for fromStatus.
 * Terminal statuses (Sold, Repurposed, Disposed) SHALL have no valid outgoing transitions.
 *
 * **Validates: Requirements 8.3, 8.7**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  type ItemStatus,
  ALL_STATUSES,
  TERMINAL_STATUSES,
  ACTIVE_STATUSES,
  ALLOWED_TRANSITIONS,
  isValidTransition,
} from '../transactions'

/** Arbitrary that generates any valid ItemStatus */
const statusArb = fc.constantFrom<ItemStatus>(...ALL_STATUSES)

/** Arbitrary that generates ItemStatus | null (representing from status including initial donation) */
const fromStatusArb = fc.oneof(
  fc.constant(null as ItemStatus | null),
  statusArb.map((s) => s as ItemStatus | null)
)

describe('Feature: aws-to-vercel-supabase-migration, Property 17: Transaction state machine', () => {
  describe('Property A: Initial donations (null from) are always valid', () => {
    it('should accept any target status when fromStatus is null', () => {
      fc.assert(
        fc.property(statusArb, (toStatus: ItemStatus) => {
          expect(isValidTransition(null, toStatus)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property B: Terminal statuses have no valid outgoing transitions', () => {
    it('should reject all transitions from terminal statuses (Sold, Repurposed, Disposed)', () => {
      const terminalArb = fc.constantFrom<ItemStatus>(...TERMINAL_STATUSES)

      fc.assert(
        fc.property(terminalArb, statusArb, (fromStatus: ItemStatus, toStatus: ItemStatus) => {
          expect(isValidTransition(fromStatus, toStatus)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property C: Active statuses only allow transitions in ALLOWED_TRANSITIONS map', () => {
    it('should accept a transition from an active status if and only if toStatus is in the allowed set', () => {
      const activeArb = fc.constantFrom<ItemStatus>(...ACTIVE_STATUSES)

      fc.assert(
        fc.property(activeArb, statusArb, (fromStatus: ItemStatus, toStatus: ItemStatus) => {
          const isAllowed = ALLOWED_TRANSITIONS[fromStatus].includes(toStatus)
          expect(isValidTransition(fromStatus, toStatus)).toBe(isAllowed)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Combined: For any (from, to) pair, result matches the spec exactly', () => {
    it('should match the full spec for any (fromStatus, toStatus) pair', () => {
      fc.assert(
        fc.property(fromStatusArb, statusArb, (fromStatus: ItemStatus | null, toStatus: ItemStatus) => {
          const result = isValidTransition(fromStatus, toStatus)

          // Compute expected result from spec:
          // (a) fromStatus is null → always valid
          if (fromStatus === null) {
            expect(result).toBe(true)
            return
          }

          // (b) fromStatus is terminal → always invalid
          if (TERMINAL_STATUSES.includes(fromStatus)) {
            expect(result).toBe(false)
            return
          }

          // (c) fromStatus is active → valid iff toStatus is in ALLOWED_TRANSITIONS[fromStatus]
          const expected = ALLOWED_TRANSITIONS[fromStatus].includes(toStatus)
          expect(result).toBe(expected)
        }),
        { numRuns: 100 }
      )
    })
  })
})
