import { describe, it, expect } from 'vitest'
import { validateBalanceUpdate } from './balance'

describe('Inventory Balance Manager', () => {
  describe('validateBalanceUpdate', () => {
    it('returns true when current quantity equals requested quantity', () => {
      expect(validateBalanceUpdate(5, 5)).toBe(true)
    })

    it('returns true when current quantity exceeds requested quantity', () => {
      expect(validateBalanceUpdate(10, 3)).toBe(true)
    })

    it('returns false when requested quantity exceeds current quantity', () => {
      expect(validateBalanceUpdate(3, 10)).toBe(false)
    })

    it('returns true when both quantities are zero', () => {
      expect(validateBalanceUpdate(0, 0)).toBe(true)
    })

    it('returns false when current is zero and requested is positive', () => {
      expect(validateBalanceUpdate(0, 1)).toBe(false)
    })

    it('returns true for large quantities when current is sufficient', () => {
      expect(validateBalanceUpdate(1000, 999)).toBe(true)
    })

    it('returns false for large quantities when current is insufficient', () => {
      expect(validateBalanceUpdate(999, 1000)).toBe(false)
    })
  })
})
