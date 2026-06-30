import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createApiLogger } from '@/lib/logger'

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
  const logger = createApiLogger('POST /api/auth/refresh');
  try {
    logger.info('Request received');
    logger.debug('Calling Supabase refreshSession');

    const supabase = await createSupabaseServerClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession()

    if (error || !session) {
      logger.warn('Session refresh failed', { error: error?.message });
      return NextResponse.json(
        { error: 'refresh_failed', message: 'Unable to refresh session' },
        { status: 401 }
      )
    }

    logger.info('Session refreshed successfully', { userId: session.user?.id });
    logger.info('Response sent', { status: 200 });
    return NextResponse.json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
    })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
