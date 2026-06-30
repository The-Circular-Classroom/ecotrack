import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validatePassword } from '@/lib/auth/validation'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/auth/set-new-password
 *
 * Handles forced password change scenarios (e.g., NEW_PASSWORD_REQUIRED challenge
 * after first login with a temporary password).
 *
 * Accepts the session context, username, and new password. Validates that
 * passwords match, then uses Supabase admin to update the user's password.
 * Returns session tokens on success so the user can proceed to the dashboard.
 *
 * Requirements: 2.12 (forced password change flow)
 *               3.1 (new endpoint added alongside existing ones)
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/auth/set-new-password');
  try {
    const body = await request.json()
    const { session, username, password, confirmPassword } = body
    logger.info('Request received', { username, hasSession: !!session });

    // Validate required fields
    if (!session || !username || !password || !confirmPassword) {
      logger.warn('Validation failed: missing required fields', { hasSession: !!session, hasUsername: !!username, hasPassword: !!password, hasConfirmPassword: !!confirmPassword });
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Session, username, password, and confirmPassword are required',
        },
        { status: 400 }
      )
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      logger.warn('Validation failed: passwords do not match');
      return NextResponse.json(
        { error: 'validation_error', message: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordError = validatePassword(password)
    if (passwordError) {
      logger.warn('Validation failed: weak password', { reason: passwordError.message });
      return NextResponse.json(
        { error: 'validation_error', message: passwordError.message },
        { status: 400 }
      )
    }

    logger.debug('Validation passed');

    // Look up the user by email (username) using admin client
    logger.debug('Looking up user by email');
    const { data: userList, error: listError } =
      await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      logger.error('Failed to list users', { error: listError.message });
      return NextResponse.json(
        { error: 'internal_error', message: 'Failed to look up user' },
        { status: 500 }
      )
    }

    const user = userList?.users?.find(
      (u) => u.email?.toLowerCase() === username.toLowerCase()
    )

    if (!user) {
      logger.warn('User not found', { username });
      return NextResponse.json(
        { error: 'user_not_found', message: 'User not found' },
        { status: 404 }
      )
    }

    logger.debug('User found, updating password', { userId: user.id });

    // Update the user's password using admin client (forced password change)
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password,
      })

    if (updateError) {
      logger.error('Password update failed', { error: updateError.message, userId: user.id });
      return NextResponse.json(
        { error: 'update_failed', message: 'Failed to update password' },
        { status: 400 }
      )
    }

    logger.info('Password updated successfully', { userId: user.id });

    // Sign the user in with the new password to generate session tokens
    logger.debug('Signing in user with new password');
    const supabase = await createSupabaseServerClient()
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: username,
        password,
      })

    if (signInError) {
      logger.error('Sign-in after password update failed', { error: signInError.message, userId: user.id });
      return NextResponse.json(
        { error: 'auth_failed', message: 'Password updated but sign-in failed' },
        { status: 500 }
      )
    }

    logger.info('Response sent', { status: 200, userId: user.id });
    return NextResponse.json({
      success: true,
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      expires_in: signInData.session.expires_in,
    })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
