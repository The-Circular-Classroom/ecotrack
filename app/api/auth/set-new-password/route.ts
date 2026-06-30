import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validatePassword } from '@/lib/auth/validation'

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
  try {
    const body = await request.json()
    const { session, username, password, confirmPassword } = body

    // Validate required fields
    if (!session || !username || !password || !confirmPassword) {
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
      return NextResponse.json(
        { error: 'validation_error', message: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json(
        { error: 'validation_error', message: passwordError.message },
        { status: 400 }
      )
    }

    // Look up the user by email (username) using admin client
    const { data: userList, error: listError } =
      await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json(
        { error: 'internal_error', message: 'Failed to look up user' },
        { status: 500 }
      )
    }

    const user = userList?.users?.find(
      (u) => u.email?.toLowerCase() === username.toLowerCase()
    )

    if (!user) {
      return NextResponse.json(
        { error: 'user_not_found', message: 'User not found' },
        { status: 404 }
      )
    }

    // Update the user's password using admin client (forced password change)
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password,
      })

    if (updateError) {
      return NextResponse.json(
        { error: 'update_failed', message: 'Failed to update password' },
        { status: 400 }
      )
    }

    // Sign the user in with the new password to generate session tokens
    const supabase = await createSupabaseServerClient()
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: username,
        password,
      })

    if (signInError) {
      return NextResponse.json(
        { error: 'auth_failed', message: 'Password updated but sign-in failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      expires_in: signInData.session.expires_in,
    })
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
