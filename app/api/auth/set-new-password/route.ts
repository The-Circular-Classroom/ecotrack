import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma/client'
import { validatePassword } from '@/lib/auth/validation'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/auth/set-new-password
 *
 * Sets a new password for the current user. Supports two flows:
 *
 * 1. Session-based (primary): User arrives via password reset link → callback
 *    exchanged code for session → user has a valid session. Uses
 *    supabase.auth.updateUser({ password }) to set the new password.
 *
 * 2. Admin fallback: If `username` and `session` are provided (legacy forced
 *    password change flow), uses admin API to update the user's password.
 *
 * Requirements: 2.12 (password reset / forced password change flow)
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/auth/set-new-password');
  try {
    const body = await request.json()
    const { session, username, password, confirmPassword } = body
    logger.info('Request received', { username: username || '(session-based)', hasSession: !!session });

    // Validate password and confirmPassword are present
    if (!password || !confirmPassword) {
      logger.warn('Validation failed: missing password fields');
      return NextResponse.json(
        { error: 'validation_error', message: 'Password and confirmPassword are required' },
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

    // Legacy admin flow: if username and session are provided, use admin API
    if (username && session) {
      logger.debug('Using admin fallback flow (username + session provided)');

      // Look up the user by email (username) using admin client
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

      logger.debug('User found, updating password via admin', { userId: user.id });

      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password,
          app_metadata: { force_password_change: false },
        })

      if (updateError) {
        logger.error('Password update failed', { error: updateError.message, userId: user.id });
        return NextResponse.json(
          { error: 'update_failed', message: 'Failed to update password' },
          { status: 400 }
        )
      }

      // Clear must_change_password flag in Prisma DB user_flags
      try {
        const dbUser = await prisma.user.findUnique({ where: { supabaseAuthId: user.id } })
        if (dbUser) {
          const existingFlags = (dbUser.userFlags as Record<string, any>) || {}
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              userFlags: {
                ...existingFlags,
                must_change_password: false,
              },
            },
          })
        }
      } catch (dbErr: any) {
        logger.error('Failed to clear DB must_change_password flag', { error: dbErr?.message })
      }

      logger.info('Password updated successfully (admin flow)', { userId: user.id });

      // Sign the user in with the new password to generate session tokens
      const supabase = await createSupabaseServerClient()
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email: username, password })

      if (signInError) {
        logger.error('Sign-in after password update failed', { error: signInError.message, userId: user.id });
        return NextResponse.json(
          { error: 'auth_failed', message: 'Password updated but sign-in failed' },
          { status: 500 }
        )
      }

      logger.info('Response sent (admin flow)', { status: 200, userId: user.id });
      return NextResponse.json({
        success: true,
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        expires_in: signInData.session.expires_in,
      })
    }

    // Primary flow: session-based password update (user has session from callback)
    logger.debug('Using session-based flow');
    const supabase = await createSupabaseServerClient()

    const { data: { user }, error: getUserError } = await supabase.auth.getUser()

    if (getUserError || !user) {
      logger.warn('No valid session found', { error: getUserError?.message });
      return NextResponse.json(
        { error: 'unauthorized', message: 'No valid session. Please use the reset link from your email.' },
        { status: 401 }
      )
    }

    logger.debug('User found from session, updating password', { userId: user.id });

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      logger.error('Password update failed', { error: updateError.message, userId: user.id });
      return NextResponse.json(
        { error: 'update_failed', message: 'Failed to update password' },
        { status: 400 }
      )
    }

    logger.info('Password updated successfully (session flow)', { userId: user.id });

    // Clear force_password_change flag in Supabase app_metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: { force_password_change: false },
      })
    } catch (clearErr: any) {
      logger.error('Failed to clear app_metadata force_password_change flag', { error: clearErr?.message })
    }

    // Clear must_change_password flag in Prisma DB user_flags
    try {
      const dbUser = await prisma.user.findUnique({ where: { supabaseAuthId: user.id } })
      if (dbUser) {
        const existingFlags = (dbUser.userFlags as Record<string, any>) || {}
        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            userFlags: {
              ...existingFlags,
              must_change_password: false,
            },
          },
        })
      }
    } catch (dbErr: any) {
      logger.error('Failed to clear DB must_change_password flag', { error: dbErr?.message })
    }

    logger.info('Response sent', { status: 200 });
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
