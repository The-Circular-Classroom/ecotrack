/**
 * Property 7: Unique filename generation
 * Feature: aws-to-vercel-supabase-migration, Property 7: Unique filename generation
 *
 * For any (originalFilename, userId, timestamp) tuple, the generated storage filename
 * SHALL contain the original filename stem, the userId, and the timestamp.
 * For any two tuples with different timestamps, the generated filenames SHALL be different.
 *
 * **Validates: Requirements 6.2**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { generateUniqueFilename } from '../filename'

/**
 * Arbitrary for generating filenames with various extensions.
 * Produces strings like "report.csv", "data.xlsx", "photo.png", "noext", etc.
 */
const filenameArb = fc.oneof(
  // Filename with common extensions
  fc.tuple(
    fc.stringMatching(/^[a-zA-Z0-9._-]{1,30}$/),
    fc.constantFrom('csv', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'pdf')
  ).map(([stem, ext]) => `${stem}.${ext}`),
  // Filename without extension
  fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
  // Filename with multiple dots
  fc.tuple(
    fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/),
    fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/),
    fc.constantFrom('csv', 'xlsx', 'txt')
  ).map(([a, b, ext]) => `${a}.${b}.${ext}`)
)

/**
 * Arbitrary for non-empty user IDs (alphanumeric with some special chars)
 */
const userIdArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,36}$/)

/**
 * Arbitrary for positive integer timestamps (Unix epoch milliseconds)
 */
const timestampArb = fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER })

/**
 * Helper to extract the filename stem (name without last extension).
 * Mirrors the parseFilename logic in the implementation.
 */
function getStem(filename: string): string {
  const basename = filename.replace(/^.*[/\\]/, '')
  if (!basename) return ''
  const lastDotIndex = basename.lastIndexOf('.')
  if (lastDotIndex <= 0) return basename
  return basename.slice(0, lastDotIndex)
}

describe('Feature: aws-to-vercel-supabase-migration, Property 7: Unique filename generation', () => {
  it('Property A: output contains the original stem, userId, and timestamp string', () => {
    fc.assert(
      fc.property(
        filenameArb,
        userIdArb,
        timestampArb,
        (filename, userId, timestamp) => {
          const result = generateUniqueFilename(filename, userId, timestamp)
          const stem = getStem(filename)

          // The generated filename SHALL contain the original filename stem
          expect(result).toContain(stem)

          // The generated filename SHALL contain the userId
          expect(result).toContain(userId)

          // The generated filename SHALL contain the timestamp as a string
          expect(result).toContain(String(timestamp))
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property B: two tuples with different timestamps produce different filenames', () => {
    fc.assert(
      fc.property(
        filenameArb,
        userIdArb,
        timestampArb,
        timestampArb,
        (filename, userId, timestamp1, timestamp2) => {
          // Pre-condition: timestamps must be different
          fc.pre(timestamp1 !== timestamp2)

          const result1 = generateUniqueFilename(filename, userId, timestamp1)
          const result2 = generateUniqueFilename(filename, userId, timestamp2)

          // For any two tuples with different timestamps, the generated filenames SHALL be different
          expect(result1).not.toBe(result2)
        }
      ),
      { numRuns: 100 }
    )
  })
})
