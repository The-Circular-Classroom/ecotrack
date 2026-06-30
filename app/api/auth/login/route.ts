import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Returns access and refresh tokens on success.
 *
 * Requirements: 2.2 (login returning tokens), 2.9 (generic error message)
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/auth/login');
  try {
    const body = await request.json()
    const { email, password } = body
    logger.info('Request received', { email, hasPassword: !!password });

    if (!email || !password) {
      logger.warn('Validation failed: missing required fields', { hasEmail: !!email, hasPassword: !!password });
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Email and password are required',
        },
        { status: 400 }
      )
    }

    logger.debug('Calling Supabase signInWithPassword');
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logger.warn('Authentication failed', { email, error: error.message });
      // Generic error message to avoid leaking whether email or password is wrong
      // Requirement 2.9
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    logger.info('Authentication succeeded', { userId: data.user.id, email });

    // Get role from the users table via Prisma (canonical source)
    let role = 'Parent'
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: data.user.id },
      select: { role: true },
    })
    if (dbUser?.role) {
      role = dbUser.role
    }
    logger.debug('Role resolved from users table', { role });

    logger.info('Response sent', { status: 200 });
    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
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
