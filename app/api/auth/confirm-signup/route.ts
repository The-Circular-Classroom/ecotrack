import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma/client'
import { validateEmail } from '@/lib/auth/validation'

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
  try {
    const body = await request.json()
    const { username, code, resend } = body

    // Validate username (email) is provided
    if (!username) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Username (email) is required' },
        { status: 400 }
      )
    }

    const emailError = validateEmail(username)
    if (emailError) {
      return NextResponse.json(
        { error: 'validation_error', message: emailError.message },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // If resend flag is true, resend the OTP instead of verifying
    if (resend) {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: username,
      })

      if (resendError) {
        return NextResponse.json(
          { error: 'resend_failed', message: 'Failed to resend verification code' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code resent successfully',
      })
    }

    // Validate code is provided for verification
    if (!code) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Verification code is required' },
        { status: 400 }
      )
    }

    // Verify the OTP code for signup email confirmation
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: username,
      token: code,
      type: 'signup',
    })

    if (verifyError) {
      return NextResponse.json(
        { error: 'invalid_code', message: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Safety net: ensure Prisma user record exists after email verification
    try {
      const existingUser = await prisma.user.findFirst({
        where: { email: username.toLowerCase() },
      })

      if (!existingUser) {
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
        }
      }
    } catch (prismaError) {
      // Log but don't fail the verification — the user is confirmed in Supabase
      console.error('Prisma user upsert after confirm-signup failed:', prismaError)
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    })
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
