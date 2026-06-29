/**
 * Property 1: Password validation enforces minimum length
 * Feature: aws-to-vercel-supabase-migration, Property 1: Password validation enforces minimum length
 *
 * For any string provided as a password, the password validation function SHALL accept it
 * if and only if it contains at least 8 characters.
 *
 * Property 2: Profile field length validation
 * Feature: aws-to-vercel-supabase-migration, Property 2: Profile field length validation
 *
 * For any string provided as a name field (firstName, lastName, fullName), validation SHALL
 * accept it if and only if its length is at most 100 characters. For any string provided as
 * a phone number, validation SHALL accept it if and only if its length is at most 20 characters.
 *
 * **Validates: Requirements 2.1, 2.7**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  validatePassword,
  validateProfileFields,
  MIN_PASSWORD_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PHONE_LENGTH,
} from '../validation'

describe('Feature: aws-to-vercel-supabase-migration, Property 1: Password validation enforces minimum length', () => {
  it('should accept a password if and only if it contains at least 8 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        (password: string) => {
          const result = validatePassword(password)
          const shouldBeValid = password.length >= MIN_PASSWORD_LENGTH

          if (shouldBeValid) {
            expect(result).toBeNull()
          } else {
            expect(result).not.toBeNull()
            expect(result!.field).toBe('password')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should always accept passwords with exactly 8 or more characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: MIN_PASSWORD_LENGTH, maxLength: 500 }),
        (password: string) => {
          const result = validatePassword(password)
          expect(result).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should always reject passwords with fewer than 8 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: MIN_PASSWORD_LENGTH - 1 }),
        (password: string) => {
          const result = validatePassword(password)
          expect(result).not.toBeNull()
          expect(result!.field).toBe('password')
          expect(result!.message).toContain(`${MIN_PASSWORD_LENGTH}`)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Feature: aws-to-vercel-supabase-migration, Property 2: Profile field length validation', () => {
  it('should accept name fields if and only if their length is at most 100 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (name: string) => {
          const shouldBeValid = name.length <= MAX_NAME_LENGTH

          // Test firstName
          const firstNameErrors = validateProfileFields({ firstName: name })
          if (shouldBeValid) {
            expect(firstNameErrors).toHaveLength(0)
          } else {
            expect(firstNameErrors.some((e) => e.field === 'firstName')).toBe(true)
          }

          // Test lastName
          const lastNameErrors = validateProfileFields({ lastName: name })
          if (shouldBeValid) {
            expect(lastNameErrors).toHaveLength(0)
          } else {
            expect(lastNameErrors.some((e) => e.field === 'lastName')).toBe(true)
          }

          // Test fullName
          const fullNameErrors = validateProfileFields({ fullName: name })
          if (shouldBeValid) {
            expect(fullNameErrors).toHaveLength(0)
          } else {
            expect(fullNameErrors.some((e) => e.field === 'fullName')).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should accept phone numbers if and only if their length is at most 20 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (phone: string) => {
          const shouldBeValid = phone.length <= MAX_PHONE_LENGTH
          const errors = validateProfileFields({ phoneNumber: phone })

          if (shouldBeValid) {
            expect(errors).toHaveLength(0)
          } else {
            expect(errors.some((e) => e.field === 'phoneNumber')).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate all profile fields independently and report multiple errors', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (firstName: string, lastName: string, fullName: string, phoneNumber: string) => {
          const errors = validateProfileFields({ firstName, lastName, fullName, phoneNumber })

          // Count expected errors
          let expectedErrorCount = 0
          if (firstName.length > MAX_NAME_LENGTH) expectedErrorCount++
          if (lastName.length > MAX_NAME_LENGTH) expectedErrorCount++
          if (fullName.length > MAX_NAME_LENGTH) expectedErrorCount++
          if (phoneNumber.length > MAX_PHONE_LENGTH) expectedErrorCount++

          expect(errors).toHaveLength(expectedErrorCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should accept names with exactly 100 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: MAX_NAME_LENGTH, maxLength: MAX_NAME_LENGTH }),
        (name: string) => {
          const errors = validateProfileFields({ firstName: name, lastName: name, fullName: name })
          expect(errors).toHaveLength(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reject names with exactly 101 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: MAX_NAME_LENGTH + 1, maxLength: MAX_NAME_LENGTH + 1 }),
        (name: string) => {
          const errors = validateProfileFields({ firstName: name })
          expect(errors).toHaveLength(1)
          expect(errors[0].field).toBe('firstName')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should accept phone numbers with exactly 20 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: MAX_PHONE_LENGTH, maxLength: MAX_PHONE_LENGTH }),
        (phone: string) => {
          const errors = validateProfileFields({ phoneNumber: phone })
          expect(errors).toHaveLength(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reject phone numbers with exactly 21 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: MAX_PHONE_LENGTH + 1, maxLength: MAX_PHONE_LENGTH + 1 }),
        (phone: string) => {
          const errors = validateProfileFields({ phoneNumber: phone })
          expect(errors).toHaveLength(1)
          expect(errors[0].field).toBe('phoneNumber')
        }
      ),
      { numRuns: 100 }
    )
  })
})
