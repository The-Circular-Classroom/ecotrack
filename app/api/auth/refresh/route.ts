import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/refresh
 *
 * Refreshes the current session using cookie-based auth.
 * Used by the SessionTracker component for automatic token refresh.
 *
 * Returns new access_token, refresh_token, and expires_in on success.
 * Returns 401 if the session cannot be refreshed.
 */
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession()

    if (error || !session) {
      return NextResponse.json(
        { error: 'refresh_failed', message: 'Unable to refresh session' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
    })
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
