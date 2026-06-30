import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { validateEmail } from '@/lib/auth/validation'

/**
 * POST /api/auth/forgot-password
 *
 * Initiates a code-based (OTP) password reset flow by sending a verification
 * code to the user's email. This is SEPARATE from the existing
 * POST /api/auth/reset-password which sends a link.
 *
 * The frontend forgot-password page calls this endpoint, then redirects the
 * user to the reset-password page where they enter the code + new password.
 *
 * Requirements: 2.5 (code-based password reset flow)
 *               3.1 (new endpoint added alongside existing ones)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email format
    const emailError = validateEmail(email)
    if (emailError) {
      return NextResponse.json(
        { error: 'validation_error', message: emailError.message },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Use resetPasswordForEmail to trigger OTP code delivery.
    // Supabase sends an OTP code when no redirectTo is provided or when
    // configured for code-based flow. We omit redirectTo to get OTP behavior.
    await supabase.auth.resetPasswordForEmail(email)

    // Always return success regardless of whether the email exists.
    // This prevents email enumeration attacks (security best practice).
    return NextResponse.json({
      success: true,
      message: 'Verification code sent to email',
    })
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
