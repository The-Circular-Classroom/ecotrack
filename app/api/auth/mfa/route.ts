import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  isMfaLocked,
  recordFailedMfaAttempt,
  resetMfaAttempts,
} from '@/lib/auth/mfa-lockout'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/auth/mfa
 *
 * Verifies a TOTP MFA code during login.
 * Implements 5-attempt lockout with 15-minute cooldown.
 *
 * Requirements: 2.3 (MFA verification), 2.11 (5-attempt lockout, 15 min)
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/auth/mfa');
  try {
    const body = await request.json()
    const { factorId, challengeId, code, userId } = body
    logger.info('Request received', { factorId, hasChallengeId: !!challengeId, hasCode: !!code, userId });

    if (!factorId || !code) {
      logger.warn('Validation failed: missing required fields', { hasFactorId: !!factorId, hasCode: !!code });
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Factor ID and verification code are required',
        },
        { status: 400 }
      )
    }

    // Use userId or factorId as the lockout key
    const lockoutKey = userId || factorId

    // Check if user is currently locked out
    logger.debug('Checking MFA lockout status', { lockoutKey });
    const lockStatus = isMfaLocked(lockoutKey)
    if (lockStatus.isLocked) {
      logger.warn('MFA locked out', { lockoutKey, remainingSeconds: lockStatus.remainingSeconds });
      return NextResponse.json(
        {
          error: 'mfa_locked',
          message: `MFA verification is temporarily locked. Please try again in ${lockStatus.remainingSeconds} seconds.`,
        },
        { status: 429 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // If no challengeId provided, create a challenge first
    let activeChallengeId = challengeId
    if (!activeChallengeId) {
      logger.debug('No challengeId provided, creating challenge', { factorId });
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId })

      if (challengeError) {
        logger.error('MFA challenge creation failed', { error: challengeError.message });
        return NextResponse.json(
          { error: 'mfa_challenge_failed', message: 'Failed to create MFA challenge' },
          { status: 400 }
        )
      }
      activeChallengeId = challengeData.id
      logger.debug('MFA challenge created', { challengeId: activeChallengeId });
    }

    // Verify the MFA code
    logger.debug('Verifying MFA code');
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: activeChallengeId,
      code,
    })

    if (error) {
      // Record the failed attempt
      const result = recordFailedMfaAttempt(lockoutKey)
      logger.warn('MFA verification failed', { error: error.message, attempts: result.attempts, lockedOut: result.lockedOut });

      if (result.lockedOut) {
        return NextResponse.json(
          {
            error: 'mfa_locked',
            message:
              'Too many failed attempts. MFA verification is locked for 15 minutes.',
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          error: 'mfa_invalid',
          message: 'Invalid or expired MFA code',
          attemptsRemaining: 5 - result.attempts,
        },
        { status: 401 }
      )
    }

    // Success - reset attempts counter
    resetMfaAttempts(lockoutKey)
    logger.info('MFA verification succeeded', { lockoutKey });
    logger.info('Response sent', { status: 200 });

    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
