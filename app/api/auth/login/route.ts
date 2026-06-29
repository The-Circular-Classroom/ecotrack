import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Returns access and refresh tokens on success.
 *
 * Requirements: 2.2 (login returning tokens), 2.9 (generic error message)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Email and password are required',
        },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Generic error message to avoid leaking whether email or password is wrong
      // Requirement 2.9
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.app_metadata?.role || 'Parent',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
