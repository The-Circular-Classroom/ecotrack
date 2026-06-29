/**
 * MFA attempt tracking with lockout mechanism.
 *
 * Implements Requirement 2.11: 5-attempt limit with 15-minute lockout.
 *
 * Uses in-memory storage. In production, this would be replaced with
 * Redis or a database-backed solution for multi-instance deployments.
 */

/** Maximum consecutive failed MFA attempts before lockout */
export const MAX_MFA_ATTEMPTS = 5

/** Lockout duration in milliseconds (15 minutes) */
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000

interface MfaAttemptRecord {
  failedAttempts: number
  lockedUntil: number | null
}

/** In-memory store keyed by user ID */
const mfaAttempts = new Map<string, MfaAttemptRecord>()

/**
 * Checks if a user is currently locked out from MFA verification.
 * @param userId - The user's ID
 * @returns Object with isLocked flag and optional remainingSeconds
 */
export function isMfaLocked(userId: string): {
  isLocked: boolean
  remainingSeconds?: number
} {
  const record = mfaAttempts.get(userId)
  if (!record || !record.lockedUntil) {
    return { isLocked: false }
  }

  const now = Date.now()
  if (now >= record.lockedUntil) {
    // Lockout expired, reset the record
    mfaAttempts.delete(userId)
    return { isLocked: false }
  }

  const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000)
  return { isLocked: true, remainingSeconds }
}

/**
 * Records a failed MFA attempt. If the attempt count reaches MAX_MFA_ATTEMPTS,
 * the user is locked out for LOCKOUT_DURATION_MS.
 * @param userId - The user's ID
 * @returns Object with the current attempt count and whether lockout was triggered
 */
export function recordFailedMfaAttempt(userId: string): {
  attempts: number
  lockedOut: boolean
} {
  let record = mfaAttempts.get(userId)
  if (!record) {
    record = { failedAttempts: 0, lockedUntil: null }
  }

  record.failedAttempts += 1

  if (record.failedAttempts >= MAX_MFA_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS
    mfaAttempts.set(userId, record)
    return { attempts: record.failedAttempts, lockedOut: true }
  }

  mfaAttempts.set(userId, record)
  return { attempts: record.failedAttempts, lockedOut: false }
}

/**
 * Resets MFA attempt tracking for a user (called on successful verification).
 * @param userId - The user's ID
 */
export function resetMfaAttempts(userId: string): void {
  mfaAttempts.delete(userId)
}

/**
 * Clears all MFA tracking data. Used primarily for testing.
 */
export function clearAllMfaAttempts(): void {
  mfaAttempts.clear()
}
