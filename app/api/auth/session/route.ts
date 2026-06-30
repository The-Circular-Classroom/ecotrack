import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createApiLogger } from '@/lib/logger'

/**
 * GET /api/auth/session
 *
 * Verifies and refreshes the current user session.
 * Returns the current user data if the session is valid.
 *
 * Requirements: 2.5 (silent token refresh)
 */
export async function GET() {
  const logger = createApiLogger('GET /api/auth/session');
  try {
    logger.info('Request received');
    logger.debug('Calling Supabase getUser');

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      logger.warn('Session invalid or expired', { error: error?.message });
      return NextResponse.json(
        { error: 'session_invalid', message: 'Session is invalid or expired' },
        { status: 401 }
      )
    }

    logger.info('Session valid', { userId: user.id });
    logger.info('Response sent', { status: 200 });
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.app_metadata?.role || 'Parent',
        user_metadata: user.user_metadata,
      },
    })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
