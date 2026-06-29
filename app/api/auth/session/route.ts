import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET /api/auth/session
 *
 * Verifies and refreshes the current user session.
 * Returns the current user data if the session is valid.
 *
 * Requirements: 2.5 (silent token refresh)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'session_invalid', message: 'Session is invalid or expired' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.app_metadata?.role || 'Parent',
        user_metadata: user.user_metadata,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
