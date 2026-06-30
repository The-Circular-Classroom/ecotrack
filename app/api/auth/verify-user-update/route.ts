import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'

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
  try {
    const body = await request.json()
    const { code, type } = body

    // Validate type is provided and supported
    if (!type) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Update type is required' },
        { status: 400 }
      )
    }

    if (type !== 'email_change') {
      return NextResponse.json(
        { error: 'validation_error', message: 'Unsupported update type. Supported types: email_change' },
        { status: 400 }
      )
    }

    // Validate code is provided
    if (!code) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Verification code is required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Get the current user's email for OTP verification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'You must be logged in to verify an update' },
        { status: 401 }
      )
    }

    // Verify the OTP code for email change confirmation
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: user.email,
      token: code,
      type: 'email_change',
    })

    if (verifyError) {
      return NextResponse.json(
        { error: 'invalid_code', message: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Sync the new email to Prisma after successful email change verification
    try {
      // After verifyOtp for email_change, Supabase updates the user's email.
      // Fetch the updated user to get the new email.
      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      if (updatedUser?.email) {
        await prisma.user.update({
          where: { supabaseAuthId: updatedUser.id },
          data: { email: updatedUser.email.toLowerCase() },
        })
      }
    } catch (prismaError) {
      // Log but don't fail — the email is already changed in Supabase
      console.error('Prisma email sync after email change failed:', prismaError)
    }

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully',
    })
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
