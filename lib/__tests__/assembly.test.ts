/**
 * Unit tests for assembly analytics — calculateMaxProducible
 *
 * Tests the pure function that ensures assembly plans never exceed
 * what available stock supports (Property 20).
 *
 * **Validates: Requirements 9.2**
 */
import { describe, it, expect } from 'vitest'
import { calculateMaxProducible } from '../analytics/assembly'

describe('calculateMaxProducible', () => {
  it('returns requested when stock is more than sufficient', () => {
    // 5 requested, 20 available stock, 2 per unit → stock supports 10, cap at 5
    expect(calculateMaxProducible(5, 20, 2)).toBe(5)
  })

  it('returns stock-limited amount when stock is insufficient', () => {
    // 10 requested, 6 available stock, 2 per unit → stock supports 3
    expect(calculateMaxProducible(10, 6, 2)).toBe(3)
  })

  it('returns 0 when no stock is available', () => {
    expect(calculateMaxProducible(5, 0, 1)).toBe(0)
  })

  it('returns 0 when stock is negative', () => {
    expect(calculateMaxProducible(5, -3, 1)).toBe(0)
  })

  it('returns 0 when requested is 0', () => {
    expect(calculateMaxProducible(0, 100, 1)).toBe(0)
  })

  it('returns 0 when requested is negative', () => {
    expect(calculateMaxProducible(-5, 100, 1)).toBe(0)
  })

  it('returns requested when quantityPerUnit is 0 (no ingredient needed)', () => {
    expect(calculateMaxProducible(5, 10, 0)).toBe(5)
  })

  it('returns requested when quantityPerUnit is negative', () => {
    expect(calculateMaxProducible(5, 10, -1)).toBe(5)
  })

  it('floors the division result (does not produce partial units)', () => {
    // 10 requested, 7 available, 3 per unit → floor(7/3) = 2
    expect(calculateMaxProducible(10, 7, 3)).toBe(2)
  })

  it('handles exact division', () => {
    // 10 requested, 9 available, 3 per unit → floor(9/3) = 3
    expect(calculateMaxProducible(10, 9, 3)).toBe(3)
  })

  it('handles fractional quantityPerUnit (decimal ingredient amounts)', () => {
    // 10 requested, 5 available, 0.5 per unit → floor(5/0.5) = 10
    expect(calculateMaxProducible(10, 5, 0.5)).toBe(10)
  })

  it('never exceeds requested even with massive stock', () => {
    expect(calculateMaxProducible(3, 1000000, 1)).toBe(3)
  })
})
