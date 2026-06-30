import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { validateEmail } from '@/lib/auth/validation'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/auth/forgot-password
 *
 * Initiates a link-based password reset flow. Supabase sends an email with
 * a magic link that redirects the user to /api/auth/callback which exchanges
 * the code for a session, then redirects to /set-new-password.
 *
 * Requirements: 2.5 (password reset flow via Supabase email link)
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/auth/forgot-password');
  try {
    const body = await request.json()
    const { email } = body
    logger.info('Request received', { email });

    // Validate email format
    const emailError = validateEmail(email)
    if (emailError) {
      logger.warn('Validation failed: invalid email', { reason: emailError.message });
      return NextResponse.json(
        { error: 'validation_error', message: emailError.message },
        { status: 400 }
      )
    }

    logger.debug('Calling Supabase resetPasswordForEmail with redirectTo');
    const supabase = await createSupabaseServerClient()
    const origin = request.nextUrl.origin

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/api/auth/callback?next=/set-new-password`,
    })

    logger.info('Reset password email sent', { email });

    // Always return success regardless of whether the email exists.
    // This prevents email enumeration attacks (security best practice).
    logger.info('Response sent', { status: 200 });
    return NextResponse.json({
      success: true,
      message: 'Password reset link sent',
    })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
