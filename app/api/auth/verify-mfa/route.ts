import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/auth/verify-mfa
 *
 * Verifies an MFA code during login using session + code + username.
 * This endpoint adapts the legacy cognito-frontend pattern where the client
 * sends { mfaCode, session, username } rather than factorId/challengeId directly.
 *
 * The session (access_token from the initial login) is used to identify the user
 * and enumerate their TOTP factors. A challenge is created and verified against
 * the provided code.
 *
 * Returns session tokens and user info on success.
 *
 * The existing POST /api/auth/mfa (factorId/challengeId pattern) remains unchanged.
 *
 * Requirements: 2.12 (MFA verification flow)
 *               3.1 (new endpoint added alongside existing ones)
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/auth/verify-mfa');
  try {
    const body = await request.json()
    const { mfaCode, session, username } = body
    logger.info('Request received', { username, hasSession: !!session, hasCode: !!mfaCode });

    // Validate required fields
    if (!mfaCode || !session || !username) {
      logger.warn('Validation failed: missing required fields', { hasMfaCode: !!mfaCode, hasSession: !!session, hasUsername: !!username });
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'mfaCode, session, and username are required',
        },
        { status: 400 }
      )
    }

    // Validate mfaCode format (should be 6 digits)
    if (!/^\d{6}$/.test(mfaCode)) {
      logger.warn('Validation failed: invalid MFA code format');
      return NextResponse.json(
        { error: 'validation_error', message: 'MFA code must be 6 digits' },
        { status: 400 }
      )
    }

    logger.debug('Validation passed');

    // Set the session on the Supabase client to authenticate as the user
    logger.debug('Setting session on Supabase client');
    const supabase = await createSupabaseServerClient()
    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token: session,
        refresh_token: session, // The session token from login acts as the access token
      })

    if (sessionError) {
      logger.warn('setSession failed, falling back to admin lookup', { error: sessionError.message });
      // If setSession fails, try to look up user by username and use admin client
      // to get their factors
      const { data: userList, error: listError } =
        await supabaseAdmin.auth.admin.listUsers()

      if (listError) {
        logger.error('Admin listUsers failed', { error: listError.message });
        return NextResponse.json(
          { error: 'auth_failed', message: 'Invalid session or user not found' },
          { status: 401 }
        )
      }

      const user = userList?.users?.find(
        (u) => u.email?.toLowerCase() === username.toLowerCase()
      )

      if (!user) {
        logger.warn('User not found by email', { username });
        return NextResponse.json(
          { error: 'user_not_found', message: 'User not found' },
          { status: 404 }
        )
      }

      logger.debug('User found via admin lookup', { userId: user.id });

      // Use admin to get MFA factors for this user
      logger.debug('Listing MFA factors via admin');
      const { data: factorsData, error: factorsError } =
        await supabaseAdmin.auth.admin.mfa.listFactors({ userId: user.id })

      if (factorsError || !factorsData?.factors || factorsData.factors.length === 0) {
        logger.warn('No MFA factors found for user', { userId: user.id });
        return NextResponse.json(
          { error: 'mfa_not_configured', message: 'No MFA factors configured for this user' },
          { status: 400 }
        )
      }

      // Filter to TOTP factors and find a verified one
      const totpFactors = factorsData.factors.filter((f) => f.factor_type === 'totp')
      if (totpFactors.length === 0) {
        logger.warn('No TOTP factors found for user', { userId: user.id });
        return NextResponse.json(
          { error: 'mfa_not_configured', message: 'No TOTP factors configured for this user' },
          { status: 400 }
        )
      }

      // Use the first verified TOTP factor
      const factor = totpFactors.find((f) => f.status === 'verified') || totpFactors[0]
      logger.debug('Creating MFA challenge', { factorId: factor.id });

      // Sign the user in with password to get a valid session for MFA verification
      // Since we have the session token, attempt to use the server client for MFA
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: factor.id })

      if (challengeError) {
        logger.error('MFA challenge creation failed', { error: challengeError.message });
        return NextResponse.json(
          { error: 'mfa_challenge_failed', message: 'Failed to create MFA challenge' },
          { status: 400 }
        )
      }

      logger.debug('Verifying MFA code');
      const { data: verifyData, error: verifyError } =
        await supabase.auth.mfa.verify({
          factorId: factor.id,
          challengeId: challengeData.id,
          code: mfaCode,
        })

      if (verifyError) {
        logger.warn('MFA verification failed', { error: verifyError.message, userId: user.id });
        return NextResponse.json(
          { error: 'mfa_invalid', message: 'Invalid or expired MFA code' },
          { status: 401 }
        )
      }

      logger.info('MFA verification succeeded (admin path)', { userId: user.id });
      logger.info('Response sent', { status: 200 });
      return NextResponse.json({
        success: true,
        access_token: verifyData.access_token,
        refresh_token: verifyData.refresh_token,
        expires_in: verifyData.expires_in,
        user: {
          id: user.id,
          email: user.email,
          role: user.app_metadata?.role || null,
        },
      })
    }

    logger.debug('Session set successfully, listing MFA factors');

    // Session was set successfully - get the user's MFA factors
    const { data: factorsResponse, error: factorsError } =
      await supabase.auth.mfa.listFactors()

    if (factorsError || !factorsResponse?.totp || factorsResponse.totp.length === 0) {
      logger.warn('No TOTP factors found via session', { error: factorsError?.message });
      return NextResponse.json(
        { error: 'mfa_not_configured', message: 'No MFA factors configured for this user' },
        { status: 400 }
      )
    }

    // Use the first verified TOTP factor
    const factor =
      factorsResponse.totp.find((f) => f.status === 'verified') || factorsResponse.totp[0]

    // Create a challenge for the factor
    logger.debug('Creating MFA challenge', { factorId: factor.id });
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: factor.id })

    if (challengeError) {
      logger.error('MFA challenge creation failed', { error: challengeError.message });
      return NextResponse.json(
        { error: 'mfa_challenge_failed', message: 'Failed to create MFA challenge' },
        { status: 400 }
      )
    }

    // Verify the MFA code against the challenge
    logger.debug('Verifying MFA code');
    const { data: verifyData, error: verifyError } =
      await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challengeData.id,
        code: mfaCode,
      })

    if (verifyError) {
      logger.warn('MFA verification failed', { error: verifyError.message });
      return NextResponse.json(
        { error: 'mfa_invalid', message: 'Invalid or expired MFA code' },
        { status: 401 }
      )
    }

    // Get user info from the session
    const user = sessionData?.user
    logger.info('MFA verification succeeded', { userId: user?.id });
    logger.info('Response sent', { status: 200 });

    return NextResponse.json({
      success: true,
      access_token: verifyData.access_token,
      refresh_token: verifyData.refresh_token,
      expires_in: verifyData.expires_in,
      user: {
        id: user?.id || null,
        email: user?.email || username,
        role: user?.app_metadata?.role || null,
      },
    })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
