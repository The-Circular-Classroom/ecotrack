import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  isMfaLocked,
  recordFailedMfaAttempt,
  resetMfaAttempts,
} from '@/lib/auth/mfa-lockout'

/**
 * POST /api/auth/mfa
 *
 * Verifies a TOTP MFA code during login.
 * Implements 5-attempt lockout with 15-minute cooldown.
 *
 * Requirements: 2.3 (MFA verification), 2.11 (5-attempt lockout, 15 min)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { factorId, challengeId, code, userId } = body

    if (!factorId || !code) {
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
    const lockStatus = isMfaLocked(lockoutKey)
    if (lockStatus.isLocked) {
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
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId })

      if (challengeError) {
        return NextResponse.json(
          { error: 'mfa_challenge_failed', message: 'Failed to create MFA challenge' },
          { status: 400 }
        )
      }
      activeChallengeId = challengeData.id
    }

    // Verify the MFA code
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: activeChallengeId,
      code,
    })

    if (error) {
      // Record the failed attempt
      const result = recordFailedMfaAttempt(lockoutKey)

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

    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    })
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
