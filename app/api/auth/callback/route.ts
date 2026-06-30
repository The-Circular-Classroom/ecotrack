import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

/**
 * GET /api/auth/callback
 *
 * Handles OAuth and email confirmation callbacks.
 * Exchanges the authorization code for a session.
 *
 * Requirements: 2.1 (email confirmation), 2.8 (default Parent role)
 */
export async function GET(request: NextRequest) {
  const logger = createApiLogger('GET /api/auth/callback');
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  logger.info('Request received', { hasCode: !!code, next });

  if (!code) {
    logger.warn('Missing authorization code');
    return NextResponse.redirect(new URL('/login?error=missing_code', origin))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  logger.debug('Exchanging code for session');
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    logger.error('Code exchange failed', { error: error.message });
    return NextResponse.redirect(
      new URL('/login?error=auth_callback_failed', origin)
    )
  }

  logger.info('Code exchange succeeded');

  // Ensure Prisma user record exists after OAuth or email confirmation callback
  try {
    logger.debug('Fetching user after code exchange');
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      logger.debug('Upserting Prisma user record', { userId: user.id });
      await prisma.user.upsert({
        where: { supabaseAuthId: user.id },
        update: {
          // Sync email in case it changed (e.g., email_change confirmation)
          email: user.email!.toLowerCase(),
        },
        create: {
          supabaseAuthId: user.id,
          email: user.email!.toLowerCase(),
          firstName: user.user_metadata?.first_name || null,
          lastName: user.user_metadata?.last_name || null,
          fullName: user.user_metadata?.full_name || null,
          phoneNumber: user.user_metadata?.phone_number || null,
          role: 'Parent',
        },
      })
      logger.info('Prisma user record upserted', { userId: user.id });
    }
  } catch (prismaError) {
    // Log but don't fail the callback — the user is authenticated in Supabase
    logger.error('Prisma user upsert after callback failed', { error: prismaError instanceof Error ? prismaError.message : String(prismaError) });
  }

  logger.info('Redirecting after callback', { redirectTo: next });
  return NextResponse.redirect(new URL(next, origin))
}
