/**
 * Unit tests for collection analytics — validates filter validation logic
 * and date range helper functions.
 */
import { describe, it, expect } from 'vitest'
import {
  validateCollectionFilter,
  getMonthConstrainedRange,
  type CollectionFilter,
} from './collection'

describe('validateCollectionFilter', () => {
  it('should return null for a valid filter with only year', () => {
    const filter: CollectionFilter = { year: 2024 }
    expect(validateCollectionFilter(filter)).toBeNull()
  })

  it('should return null for a valid filter with year, startMonth, and endMonth', () => {
    const filter: CollectionFilter = { year: 2024, startMonth: 3, endMonth: 9 }
    expect(validateCollectionFilter(filter)).toBeNull()
  })

  it('should return null for a valid filter with equal startMonth and endMonth', () => {
    const filter: CollectionFilter = { year: 2024, startMonth: 6, endMonth: 6 }
    expect(validateCollectionFilter(filter)).toBeNull()
  })

  it('should return null for a valid filter with schoolId', () => {
    const filter: CollectionFilter = { year: 2024, schoolId: 5 }
    expect(validateCollectionFilter(filter)).toBeNull()
  })

  it('should reject a non-positive year (0)', () => {
    const filter: CollectionFilter = { year: 0 }
    const error = validateCollectionFilter(filter)
    expect(error).not.toBeNull()
    expect(error!.field).toBe('year')
    expect(error!.message).toContain('positive integer')
  })

  it('should reject a negative year', () => {
    const filter: CollectionFilter = { year: -1 }
    const error = validateCollectionFilter(filter)
    expect(error).not.toBeNull()
    expect(error!.field).toBe('year')
  })

  it('should reject a non-integer year', () => {
    const filter: CollectionFilter = { year: 2024.5 }
    const error = validateCollectionFilter(filter)
    expect(error).not.toBeNull()
    expect(error!.field).toBe('year')
  })

  it('should reject startMonth < 1', () => {
    const filter: CollectionFilter = { year: 2024, startMonth: 0 }
    const error = validateCollectionFilter(filter)
    expect(error).not.toBeNull()
    expect(error!.field).toBe('startMonth')
    expect(error!.message).toContain('between 1 and 12')
  })

  it('should reject startMonth > 12', () => {
    const filter: CollectionFilter = { year: 2024, startMonth: 13 }
    const error = validateCollectionFilter(filter)
    expect(error).not.toBeNull()
    expect(error!.field).toBe('startMonth')
  })

  it('should reject endMonth < 1', () => {
    const filter: CollectionFilter = { year: 2024, endMonth: 0 }
    const error = validateCollectionFilter(filter)
    expect(error).not.toBeNull()
    expect(error!.field).toBe('endMonth')
    expect(error!.message).toContain('between 1 and 12')
  })

  it('should reject endMonth > 12', () => {
    const filter: CollectionFilter = { year: 2024, endMonth: 13 }
    const error = validateCollectionFilter(filter)
    expect(error).not.toBeNull()
    expect(error!.field).toBe('endMonth')
  })

  it('should reject startMonth > endMonth', () => {
    const filter: CollectionFilter = { year: 2024, startMonth: 9, endMonth: 3 }
    const error = validateCollectionFilter(filter)
    expect(error).not.toBeNull()
    expect(error!.field).toBe('startMonth')
    expect(error!.message).toContain('less than or equal to endMonth')
  })

  it('should reject non-integer startMonth', () => {
    const filter: CollectionFilter = { year: 2024, startMonth: 1.5 }
    const error = validateCollectionFilter(filter)
    expect(error).not.toBeNull()
    expect(error!.field).toBe('startMonth')
  })

  it('should reject non-integer endMonth', () => {
    const filter: CollectionFilter = { year: 2024, endMonth: 11.9 }
    const error = validateCollectionFilter(filter)
    expect(error).not.toBeNull()
    expect(error!.field).toBe('endMonth')
  })
})

describe('getMonthConstrainedRange', () => {
  it('should return full year range when no months specified', () => {
    const { start, end } = getMonthConstrainedRange(2024)
    expect(start).toEqual(new Date(Date.UTC(2024, 0, 1)))
    expect(end).toEqual(new Date(Date.UTC(2024, 12, 1))) // Jan 1 2025
  })

  it('should constrain to the specified month range', () => {
    const { start, end } = getMonthConstrainedRange(2024, 3, 9)
    expect(start).toEqual(new Date(Date.UTC(2024, 2, 1))) // March 1
    expect(end).toEqual(new Date(Date.UTC(2024, 9, 1)))   // Oct 1 (exclusive)
  })

  it('should handle a single month (startMonth === endMonth)', () => {
    const { start, end } = getMonthConstrainedRange(2024, 6, 6)
    expect(start).toEqual(new Date(Date.UTC(2024, 5, 1))) // June 1
    expect(end).toEqual(new Date(Date.UTC(2024, 6, 1)))   // July 1 (exclusive)
  })

  it('should use default start month 1 when only endMonth provided', () => {
    const { start, end } = getMonthConstrainedRange(2024, undefined, 6)
    expect(start).toEqual(new Date(Date.UTC(2024, 0, 1))) // Jan 1
    expect(end).toEqual(new Date(Date.UTC(2024, 6, 1)))   // July 1
  })

  it('should use default end month 12 when only startMonth provided', () => {
    const { start, end } = getMonthConstrainedRange(2024, 3)
    expect(start).toEqual(new Date(Date.UTC(2024, 2, 1))) // March 1
    expect(end).toEqual(new Date(Date.UTC(2024, 12, 1)))  // Jan 1 2025
  })
})
