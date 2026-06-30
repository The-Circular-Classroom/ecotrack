import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/auth/logout
 *
 * Signs out the current user by invalidating their session.
 *
 * Requirements: 2.6 (logout / session invalidation)
 */
export async function POST() {
  const logger = createApiLogger('POST /api/auth/logout');
  try {
    logger.info('Request received');
    logger.debug('Calling Supabase signOut');

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.error('Supabase signOut failed', { error: error.message });
      return NextResponse.json(
        { error: 'logout_failed', message: 'Failed to sign out' },
        { status: 500 }
      )
    }

    logger.info('Logout successful');
    logger.info('Response sent', { status: 200 });
    return NextResponse.json({ message: 'Successfully signed out' })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
