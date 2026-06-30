import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { validateEmail } from '@/lib/auth/validation'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/auth/reset-password
 *
 * Initiates a password reset flow by sending a reset link to the user's email.
 *
 * Requirements: 2.4 (password reset link to registered email)
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/auth/reset-password');
  try {
    const body = await request.json()
    const { email } = body
    logger.info('Request received', { email });

    const emailError = validateEmail(email)
    if (emailError) {
      logger.warn('Validation failed: invalid email', { reason: emailError.message });
      return NextResponse.json(
        { error: 'validation_error', message: emailError.message },
        { status: 400 }
      )
    }

    logger.debug('Calling Supabase resetPasswordForEmail with redirect');
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.nextUrl.origin}/reset-password/confirm`,
    })

    if (error) {
      logger.warn('Supabase resetPasswordForEmail returned error (suppressed)', { error: error.message });
      // Don't reveal whether the email exists or not for security
      // Always return success to prevent email enumeration
      return NextResponse.json({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      })
    }

    logger.info('Reset password email sent', { email });
    logger.info('Response sent', { status: 200 });
    return NextResponse.json({
      message:
        'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
