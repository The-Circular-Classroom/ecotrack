import { describe, it, expect } from 'vitest'
import {
  isValidTransition,
  TERMINAL_STATUSES,
  ACTIVE_STATUSES,
  ALL_STATUSES,
  ALLOWED_TRANSITIONS,
  type ItemStatus,
} from './transactions'

describe('Transaction State Machine', () => {
  describe('exports', () => {
    it('exports TERMINAL_STATUSES with correct values', () => {
      expect(TERMINAL_STATUSES).toEqual(['Sold', 'Repurposed', 'Disposed'])
    })

    it('exports ACTIVE_STATUSES with correct values', () => {
      expect(ACTIVE_STATUSES).toEqual(['ForSale', 'ForRepurpose', 'GeneralOffice'])
    })

    it('exports ALL_STATUSES containing all 6 statuses', () => {
      expect(ALL_STATUSES).toHaveLength(6)
      expect(ALL_STATUSES).toContain('ForSale')
      expect(ALL_STATUSES).toContain('ForRepurpose')
      expect(ALL_STATUSES).toContain('GeneralOffice')
      expect(ALL_STATUSES).toContain('Sold')
      expect(ALL_STATUSES).toContain('Repurposed')
      expect(ALL_STATUSES).toContain('Disposed')
    })

    it('exports ALLOWED_TRANSITIONS map for all statuses', () => {
      for (const status of ALL_STATUSES) {
        expect(ALLOWED_TRANSITIONS[status]).toBeDefined()
      }
    })
  })

  describe('isValidTransition', () => {
    it('allows initial donations (from null) to any status', () => {
      for (const status of ALL_STATUSES) {
        expect(isValidTransition(null, status)).toBe(true)
      }
    })

    it('rejects transitions from terminal statuses', () => {
      for (const terminal of TERMINAL_STATUSES) {
        for (const target of ALL_STATUSES) {
          expect(isValidTransition(terminal, target)).toBe(false)
        }
      }
    })

    it('allows ForSale to transition to Sold, ForRepurpose, Disposed, GeneralOffice', () => {
      const allowed: ItemStatus[] = ['Sold', 'ForRepurpose', 'Disposed', 'GeneralOffice']
      for (const target of allowed) {
        expect(isValidTransition('ForSale', target)).toBe(true)
      }
    })

    it('rejects ForSale transitioning to itself or Repurposed', () => {
      expect(isValidTransition('ForSale', 'ForSale')).toBe(false)
      expect(isValidTransition('ForSale', 'Repurposed')).toBe(false)
    })

    it('allows ForRepurpose to transition to Repurposed, ForSale, Disposed', () => {
      const allowed: ItemStatus[] = ['Repurposed', 'ForSale', 'Disposed']
      for (const target of allowed) {
        expect(isValidTransition('ForRepurpose', target)).toBe(true)
      }
    })

    it('rejects ForRepurpose transitioning to itself, GeneralOffice, or Sold', () => {
      expect(isValidTransition('ForRepurpose', 'ForRepurpose')).toBe(false)
      expect(isValidTransition('ForRepurpose', 'GeneralOffice')).toBe(false)
      expect(isValidTransition('ForRepurpose', 'Sold')).toBe(false)
    })

    it('allows GeneralOffice to transition to ForSale, ForRepurpose, Disposed', () => {
      const allowed: ItemStatus[] = ['ForSale', 'ForRepurpose', 'Disposed']
      for (const target of allowed) {
        expect(isValidTransition('GeneralOffice', target)).toBe(true)
      }
    })

    it('rejects GeneralOffice transitioning to itself, Sold, or Repurposed', () => {
      expect(isValidTransition('GeneralOffice', 'GeneralOffice')).toBe(false)
      expect(isValidTransition('GeneralOffice', 'Sold')).toBe(false)
      expect(isValidTransition('GeneralOffice', 'Repurposed')).toBe(false)
    })
  })
})
