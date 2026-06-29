import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/logout
 *
 * Signs out the current user by invalidating their session.
 *
 * Requirements: 2.6 (logout / session invalidation)
 */
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { error: 'logout_failed', message: 'Failed to sign out' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Successfully signed out' })
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
