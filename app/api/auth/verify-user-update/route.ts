import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/auth/verify-user-update
 *
 * Verifies an OTP code to confirm a user profile update (e.g., email change).
 * After a user requests an email change via PATCH /api/auth/me, a verification
 * code is sent to the new email. This endpoint confirms that code.
 *
 * Accepts: { code, type } where type = 'email_change'
 *
 * Uses Supabase verifyOtp with the appropriate type to confirm the update.
 *
 * Requirements: 2.12 (email change verification flow)
 *               3.1 (new endpoint added alongside existing ones)
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/auth/verify-user-update');
  try {
    const body = await request.json()
    const { code, type } = body
    logger.info('Request received', { type, hasCode: !!code });

    // Validate type is provided and supported
    if (!type) {
      logger.warn('Validation failed: missing type');
      return NextResponse.json(
        { error: 'validation_error', message: 'Update type is required' },
        { status: 400 }
      )
    }

    if (type !== 'email_change') {
      logger.warn('Validation failed: unsupported type', { type });
      return NextResponse.json(
        { error: 'validation_error', message: 'Unsupported update type. Supported types: email_change' },
        { status: 400 }
      )
    }

    // Validate code is provided
    if (!code) {
      logger.warn('Validation failed: missing code');
      return NextResponse.json(
        { error: 'validation_error', message: 'Verification code is required' },
        { status: 400 }
      )
    }

    logger.debug('Validation passed');

    const supabase = await createSupabaseServerClient()

    // Get the current user's email for OTP verification
    logger.debug('Fetching current user');
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      logger.warn('User not authenticated');
      return NextResponse.json(
        { error: 'unauthorized', message: 'You must be logged in to verify an update' },
        { status: 401 }
      )
    }

    logger.debug('Verifying OTP for email change', { userId: user.id });

    // Verify the OTP code for email change confirmation
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: user.email,
      token: code,
      type: 'email_change',
    })

    if (verifyError) {
      logger.warn('OTP verification failed', { error: verifyError.message });
      return NextResponse.json(
        { error: 'invalid_code', message: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    logger.info('OTP verification succeeded', { userId: user.id });

    // Sync the new email to Prisma after successful email change verification
    try {
      logger.debug('Syncing new email to Prisma');
      // After verifyOtp for email_change, Supabase updates the user's email.
      // Fetch the updated user to get the new email.
      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      if (updatedUser?.email) {
        await prisma.user.update({
          where: { supabaseAuthId: updatedUser.id },
          data: { email: updatedUser.email.toLowerCase() },
        })
        logger.info('Prisma email synced', { userId: updatedUser.id, newEmail: updatedUser.email });
      }
    } catch (prismaError) {
      // Log but don't fail — the email is already changed in Supabase
      logger.error('Prisma email sync failed', { error: prismaError instanceof Error ? prismaError.message : String(prismaError) });
    }

    logger.info('Response sent', { status: 200 });
    return NextResponse.json({
      success: true,
      message: 'Email updated successfully',
    })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
