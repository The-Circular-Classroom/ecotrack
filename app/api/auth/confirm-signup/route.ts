import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma/client'
import { validateEmail } from '@/lib/auth/validation'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/auth/confirm-signup
 *
 * Verifies a user's email after registration by accepting the OTP code
 * sent to their email during signup. Also supports resending the OTP code
 * when `resend: true` is included in the request body.
 *
 * Accepts: { username, code } to verify, or { username, code, resend: true } to resend.
 *
 * Uses Supabase verifyOtp with type 'signup' to confirm the email address.
 *
 * Requirements: 2.12 (confirm signup verification flow)
 *               3.1 (new endpoint added alongside existing ones)
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/auth/confirm-signup');
  try {
    const body = await request.json()
    const { username, code, resend } = body
    logger.info('Request received', { username, hasCode: !!code, resend: !!resend });

    // Validate username (email) is provided
    if (!username) {
      logger.warn('Validation failed: missing username');
      return NextResponse.json(
        { error: 'validation_error', message: 'Username (email) is required' },
        { status: 400 }
      )
    }

    const emailError = validateEmail(username)
    if (emailError) {
      logger.warn('Validation failed: invalid email', { reason: emailError.message });
      return NextResponse.json(
        { error: 'validation_error', message: emailError.message },
        { status: 400 }
      )
    }

    logger.debug('Validation passed');

    const supabase = await createSupabaseServerClient()

    // If resend flag is true, resend the OTP instead of verifying
    if (resend) {
      logger.debug('Resending OTP code');
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: username,
      })

      if (resendError) {
        logger.error('Resend OTP failed', { error: resendError.message });
        return NextResponse.json(
          { error: 'resend_failed', message: 'Failed to resend verification code' },
          { status: 400 }
        )
      }

      logger.info('OTP resent successfully', { username });
      return NextResponse.json({
        success: true,
        message: 'Verification code resent successfully',
      })
    }

    // Validate code is provided for verification
    if (!code) {
      logger.warn('Validation failed: missing code');
      return NextResponse.json(
        { error: 'validation_error', message: 'Verification code is required' },
        { status: 400 }
      )
    }

    // Verify the OTP code for signup email confirmation
    logger.debug('Verifying OTP code');
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: username,
      token: code,
      type: 'signup',
    })

    if (verifyError) {
      logger.warn('OTP verification failed', { error: verifyError.message });
      return NextResponse.json(
        { error: 'invalid_code', message: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    logger.info('OTP verification succeeded', { username });

    // Safety net: ensure Prisma user record exists after email verification
    try {
      logger.debug('Checking Prisma user record exists');
      const existingUser = await prisma.user.findFirst({
        where: { email: username.toLowerCase() },
      })

      if (!existingUser) {
        logger.debug('Prisma user not found, creating from Supabase data');
        // Look up the Supabase user by email to get the auth ID
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
        const supabaseUser = usersData?.users?.find(
          (u) => u.email?.toLowerCase() === username.toLowerCase()
        )

        if (supabaseUser) {
          await prisma.user.upsert({
            where: { supabaseAuthId: supabaseUser.id },
            update: {},
            create: {
              supabaseAuthId: supabaseUser.id,
              email: username.toLowerCase(),
              firstName: supabaseUser.user_metadata?.first_name || null,
              lastName: supabaseUser.user_metadata?.last_name || null,
              fullName: supabaseUser.user_metadata?.full_name || null,
              phoneNumber: supabaseUser.user_metadata?.phone_number || null,
              role: 'Parent',
            },
          })
          logger.info('Prisma user record created during confirm-signup', { userId: supabaseUser.id });
        }
      } else {
        logger.debug('Prisma user record already exists');
      }
    } catch (prismaError) {
      // Log but don't fail the verification — the user is confirmed in Supabase
      logger.error('Prisma user upsert after confirm-signup failed', { error: prismaError instanceof Error ? prismaError.message : String(prismaError) });
    }

    logger.info('Response sent', { status: 200 });
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
