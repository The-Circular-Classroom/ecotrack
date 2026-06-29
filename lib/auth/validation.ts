/**
 * Authentication and profile validation utilities.
 *
 * Implements validation per Requirements 2.1, 2.7, 2.9, 2.10.
 */

/** Minimum password length per Requirement 2.1 */
export const MIN_PASSWORD_LENGTH = 8

/** Maximum field lengths per Requirement 2.7 */
export const MAX_NAME_LENGTH = 100
export const MAX_PHONE_LENGTH = 20

export interface ValidationError {
  field: string
  message: string
}

/**
 * Validates that a password meets minimum length requirements.
 * @param password - The password string to validate
 * @returns null if valid, or a ValidationError if invalid
 */
export function validatePassword(password: string): ValidationError | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      field: 'password',
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    }
  }
  return null
}

/**
 * Validates profile fields (name lengths, phone length).
 * @param fields - Object containing optional profile fields
 * @returns Array of validation errors (empty if all valid)
 */
export function validateProfileFields(fields: {
  firstName?: string
  lastName?: string
  fullName?: string
  phoneNumber?: string
}): ValidationError[] {
  const errors: ValidationError[] = []

  if (fields.firstName && fields.firstName.length > MAX_NAME_LENGTH) {
    errors.push({
      field: 'firstName',
      message: `First name must not exceed ${MAX_NAME_LENGTH} characters`,
    })
  }

  if (fields.lastName && fields.lastName.length > MAX_NAME_LENGTH) {
    errors.push({
      field: 'lastName',
      message: `Last name must not exceed ${MAX_NAME_LENGTH} characters`,
    })
  }

  if (fields.fullName && fields.fullName.length > MAX_NAME_LENGTH) {
    errors.push({
      field: 'fullName',
      message: `Full name must not exceed ${MAX_NAME_LENGTH} characters`,
    })
  }

  if (fields.phoneNumber && fields.phoneNumber.length > MAX_PHONE_LENGTH) {
    errors.push({
      field: 'phoneNumber',
      message: `Phone number must not exceed ${MAX_PHONE_LENGTH} characters`,
    })
  }

  return errors
}

/**
 * Validates an email address format.
 * @param email - The email to validate
 * @returns null if valid, or a ValidationError if invalid
 */
export function validateEmail(email: string): ValidationError | null {
  if (!email || !email.includes('@') || email.length < 3) {
    return {
      field: 'email',
      message: 'A valid email address is required',
    }
  }
  return null
}
