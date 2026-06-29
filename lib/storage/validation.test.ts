import { describe, it, expect } from 'vitest'
import { validateFileSize, validateFileType, validateFile, BucketType } from './validation'

describe('validateFileSize', () => {
  describe('donations bucket (10MB limit)', () => {
    it('accepts a file at exactly 10MB', () => {
      const result = validateFileSize(10 * 1024 * 1024, 'donations')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('accepts a file under 10MB', () => {
      const result = validateFileSize(5 * 1024 * 1024, 'donations')
      expect(result.valid).toBe(true)
    })

    it('rejects a file over 10MB', () => {
      const sizeBytes = 11 * 1024 * 1024
      const result = validateFileSize(sizeBytes, 'donations')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('10.00MB')
      expect(result.error).toContain('11.00MB')
      expect(result.error).toContain('donations bucket')
    })

    it('accepts a zero-byte file', () => {
      const result = validateFileSize(0, 'donations')
      expect(result.valid).toBe(true)
    })
  })

  describe('images bucket (5MB limit)', () => {
    it('accepts a file at exactly 5MB', () => {
      const result = validateFileSize(5 * 1024 * 1024, 'images')
      expect(result.valid).toBe(true)
    })

    it('rejects a file over 5MB', () => {
      const sizeBytes = 6 * 1024 * 1024
      const result = validateFileSize(sizeBytes, 'images')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('5.00MB')
      expect(result.error).toContain('6.00MB')
      expect(result.error).toContain('images bucket')
    })
  })
})

describe('validateFileType', () => {
  describe('donations bucket (csv, xls, xlsx)', () => {
    it('accepts .csv files', () => {
      expect(validateFileType('data.csv', 'donations').valid).toBe(true)
    })

    it('accepts .xls files', () => {
      expect(validateFileType('data.xls', 'donations').valid).toBe(true)
    })

    it('accepts .xlsx files', () => {
      expect(validateFileType('data.xlsx', 'donations').valid).toBe(true)
    })

    it('is case-insensitive for extensions', () => {
      expect(validateFileType('data.CSV', 'donations').valid).toBe(true)
      expect(validateFileType('data.Xlsx', 'donations').valid).toBe(true)
    })

    it('rejects .png files', () => {
      const result = validateFileType('image.png', 'donations')
      expect(result.valid).toBe(false)
      expect(result.error).toContain("'.png'")
      expect(result.error).toContain('donations bucket')
      expect(result.error).toContain('.csv, .xls, .xlsx')
    })

    it('rejects files with no extension', () => {
      const result = validateFileType('noextension', 'donations')
      expect(result.valid).toBe(false)
    })
  })

  describe('images bucket (png, jpg, jpeg, webp)', () => {
    it('accepts .png files', () => {
      expect(validateFileType('photo.png', 'images').valid).toBe(true)
    })

    it('accepts .jpg files', () => {
      expect(validateFileType('photo.jpg', 'images').valid).toBe(true)
    })

    it('accepts .jpeg files', () => {
      expect(validateFileType('photo.jpeg', 'images').valid).toBe(true)
    })

    it('accepts .webp files', () => {
      expect(validateFileType('photo.webp', 'images').valid).toBe(true)
    })

    it('is case-insensitive for extensions', () => {
      expect(validateFileType('photo.PNG', 'images').valid).toBe(true)
      expect(validateFileType('photo.JpEg', 'images').valid).toBe(true)
    })

    it('rejects .csv files', () => {
      const result = validateFileType('data.csv', 'images')
      expect(result.valid).toBe(false)
      expect(result.error).toContain("'.csv'")
      expect(result.error).toContain('images bucket')
      expect(result.error).toContain('.png, .jpg, .jpeg, .webp')
    })
  })
})

describe('validateFile', () => {
  it('returns valid for a file passing both checks', () => {
    const result = validateFile('donations.csv', 1024, 'donations')
    expect(result.valid).toBe(true)
  })

  it('returns type error first if type is invalid', () => {
    const result = validateFile('photo.png', 20 * 1024 * 1024, 'donations')
    expect(result.valid).toBe(false)
    expect(result.error).toContain("'.png'")
  })

  it('returns size error if type is valid but size exceeds limit', () => {
    const result = validateFile('data.csv', 20 * 1024 * 1024, 'donations')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('exceeds maximum')
  })
})
