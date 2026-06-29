import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { validateEmail } from '@/lib/auth/validation'

/**
 * POST /api/auth/reset-password
 *
 * Initiates a password reset flow by sending a reset link to the user's email.
 *
 * Requirements: 2.4 (password reset link to registered email)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    const emailError = validateEmail(email)
    if (emailError) {
      return NextResponse.json(
        { error: 'validation_error', message: emailError.message },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.nextUrl.origin}/reset-password/confirm`,
    })

    if (error) {
      // Don't reveal whether the email exists or not for security
      // Always return success to prevent email enumeration
      return NextResponse.json({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      })
    }

    return NextResponse.json({
      message:
        'If an account with that email exists, a password reset link has been sent.',
    })
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
