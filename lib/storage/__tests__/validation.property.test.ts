/**
 * Property 8: File size validation
 * Property 9: File type validation
 * Feature: aws-to-vercel-supabase-migration
 *
 * Property 8: For any file upload to the donations bucket, the validation function SHALL reject it
 * if and only if its size exceeds 10 megabytes. For any file upload to the images bucket, the
 * validation function SHALL reject it if and only if its size exceeds 5 megabytes. In both cases,
 * the error message SHALL include the maximum allowed size and the actual file size.
 *
 * Property 9: For any file upload to the donations bucket, the type validation function SHALL accept
 * it if and only if its extension is one of: csv, xls, xlsx. For any file upload to the images
 * bucket, the type validation function SHALL accept it if and only if its extension is one of:
 * png, jpg, jpeg, webp.
 *
 * **Validates: Requirements 6.5, 6.6, 6.7, 11.4, 11.5**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateFileSize, validateFileType, BucketType } from '../validation'

const DONATIONS_MAX = 10 * 1024 * 1024 // 10 MB
const IMAGES_MAX = 5 * 1024 * 1024     // 5 MB

const DONATIONS_ALLOWED = ['csv', 'xls', 'xlsx']
const IMAGES_ALLOWED = ['png', 'jpg', 'jpeg', 'webp']

const ALL_ALLOWED: Record<BucketType, string[]> = {
  donations: DONATIONS_ALLOWED,
  images: IMAGES_ALLOWED,
}

const MAX_SIZES: Record<BucketType, number> = {
  donations: DONATIONS_MAX,
  images: IMAGES_MAX,
}

/**
 * Arbitrary for bucket type
 */
const bucketArb = fc.constantFrom<BucketType>('donations', 'images')

/**
 * Arbitrary for file sizes that are within limits (0 to max inclusive)
 */
function validSizeArb(bucket: BucketType): fc.Arbitrary<number> {
  return fc.integer({ min: 0, max: MAX_SIZES[bucket] })
}

/**
 * Arbitrary for file sizes that exceed limits (max + 1 to a large value)
 */
function oversizedArb(bucket: BucketType): fc.Arbitrary<number> {
  return fc.integer({ min: MAX_SIZES[bucket] + 1, max: MAX_SIZES[bucket] * 10 })
}

const ALPHA_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789_-'.split('')
const ALPHA_NUM_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('')

/**
 * Arbitrary for a filename stem (non-empty, no dots, slashes, or null chars)
 */
const filenameStemArb = fc.array(fc.constantFrom(...ALPHA_CHARS), { minLength: 1, maxLength: 20 })
  .map(arr => arr.join(''))

/**
 * Arbitrary for a random file extension (non-empty, lowercase alphanumeric)
 */
const randomExtensionArb = fc.array(fc.constantFrom(...ALPHA_NUM_CHARS), { minLength: 1, maxLength: 8 })
  .map(arr => arr.join(''))

describe('Feature: aws-to-vercel-supabase-migration, Property 8: File size validation', () => {
  it('SHALL accept files with size <= max for donations bucket', () => {
    fc.assert(
      fc.property(
        validSizeArb('donations'),
        (size) => {
          const result = validateFileSize(size, 'donations')
          expect(result.valid).toBe(true)
          expect(result.error).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL reject files with size > max for donations bucket', () => {
    fc.assert(
      fc.property(
        oversizedArb('donations'),
        (size) => {
          const result = validateFileSize(size, 'donations')
          expect(result.valid).toBe(false)
          expect(result.error).toBeDefined()
          // Error message must include the maximum allowed size
          const maxMB = (DONATIONS_MAX / (1024 * 1024)).toFixed(2)
          expect(result.error).toContain(maxMB)
          // Error message must include the actual file size
          const actualMB = (size / (1024 * 1024)).toFixed(2)
          expect(result.error).toContain(actualMB)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL accept files with size <= max for images bucket', () => {
    fc.assert(
      fc.property(
        validSizeArb('images'),
        (size) => {
          const result = validateFileSize(size, 'images')
          expect(result.valid).toBe(true)
          expect(result.error).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL reject files with size > max for images bucket', () => {
    fc.assert(
      fc.property(
        oversizedArb('images'),
        (size) => {
          const result = validateFileSize(size, 'images')
          expect(result.valid).toBe(false)
          expect(result.error).toBeDefined()
          // Error message must include the maximum allowed size
          const maxMB = (IMAGES_MAX / (1024 * 1024)).toFixed(2)
          expect(result.error).toContain(maxMB)
          // Error message must include the actual file size
          const actualMB = (size / (1024 * 1024)).toFixed(2)
          expect(result.error).toContain(actualMB)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL reject if and only if size exceeds limit for any bucket', () => {
    fc.assert(
      fc.property(
        bucketArb,
        fc.integer({ min: 0, max: DONATIONS_MAX * 10 }),
        (bucket, size) => {
          const result = validateFileSize(size, bucket)
          const maxSize = MAX_SIZES[bucket]

          if (size > maxSize) {
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
            // Verify both max and actual sizes in error
            const maxMB = (maxSize / (1024 * 1024)).toFixed(2)
            const actualMB = (size / (1024 * 1024)).toFixed(2)
            expect(result.error).toContain(maxMB)
            expect(result.error).toContain(actualMB)
          } else {
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Feature: aws-to-vercel-supabase-migration, Property 9: File type validation', () => {
  it('SHALL accept files with allowed extensions for donations bucket (case-insensitive)', () => {
    fc.assert(
      fc.property(
        filenameStemArb,
        fc.constantFrom(...DONATIONS_ALLOWED),
        fc.constantFrom('lower', 'upper', 'mixed') as fc.Arbitrary<string>,
        (stem, ext, caseVariant) => {
          let fileExt: string
          if (caseVariant === 'upper') {
            fileExt = ext.toUpperCase()
          } else if (caseVariant === 'mixed') {
            fileExt = ext.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c).join('')
          } else {
            fileExt = ext
          }
          const filename = `${stem}.${fileExt}`
          const result = validateFileType(filename, 'donations')
          expect(result.valid).toBe(true)
          expect(result.error).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL accept files with allowed extensions for images bucket (case-insensitive)', () => {
    fc.assert(
      fc.property(
        filenameStemArb,
        fc.constantFrom(...IMAGES_ALLOWED),
        fc.constantFrom('lower', 'upper', 'mixed') as fc.Arbitrary<string>,
        (stem, ext, caseVariant) => {
          let fileExt: string
          if (caseVariant === 'upper') {
            fileExt = ext.toUpperCase()
          } else if (caseVariant === 'mixed') {
            fileExt = ext.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c).join('')
          } else {
            fileExt = ext
          }
          const filename = `${stem}.${fileExt}`
          const result = validateFileType(filename, 'images')
          expect(result.valid).toBe(true)
          expect(result.error).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL reject files with non-allowed extensions for donations bucket', () => {
    fc.assert(
      fc.property(
        filenameStemArb,
        randomExtensionArb.filter(ext => !DONATIONS_ALLOWED.includes(ext.toLowerCase())),
        (stem, ext) => {
          const filename = `${stem}.${ext}`
          const result = validateFileType(filename, 'donations')
          expect(result.valid).toBe(false)
          expect(result.error).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL reject files with non-allowed extensions for images bucket', () => {
    fc.assert(
      fc.property(
        filenameStemArb,
        randomExtensionArb.filter(ext => !IMAGES_ALLOWED.includes(ext.toLowerCase())),
        (stem, ext) => {
          const filename = `${stem}.${ext}`
          const result = validateFileType(filename, 'images')
          expect(result.valid).toBe(false)
          expect(result.error).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL accept if and only if extension matches the allowed set for any bucket', () => {
    fc.assert(
      fc.property(
        bucketArb,
        filenameStemArb,
        randomExtensionArb,
        (bucket, stem, ext) => {
          const filename = `${stem}.${ext}`
          const result = validateFileType(filename, bucket)
          const allowed = ALL_ALLOWED[bucket]
          const isAllowed = allowed.includes(ext.toLowerCase())

          if (isAllowed) {
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
          } else {
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL reject files with no extension', () => {
    fc.assert(
      fc.property(
        bucketArb,
        filenameStemArb.filter(s => !s.includes('.')),
        (bucket, stem) => {
          const result = validateFileType(stem, bucket)
          expect(result.valid).toBe(false)
          expect(result.error).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })
})
