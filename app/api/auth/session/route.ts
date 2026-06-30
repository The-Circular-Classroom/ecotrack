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

    // Get role from the users table (canonical source)
    let role = 'Parent'
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('supabase_auth_id', user.id)
      .single()
    if (dbUser?.role) {
      const roleMap: Record<string, string> = {
        admin: 'Admin',
        school_staff: 'SchoolStaff',
        parent: 'Parent',
        psg_volunteer: 'PsgVolunteer',
      }
      role = roleMap[dbUser.role] || 'Parent'
    }

    logger.info('Response sent', { status: 200 });
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role,
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
