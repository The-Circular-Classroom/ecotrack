import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/auth/callback
 *
 * Handles OAuth and email confirmation callbacks.
 * Exchanges the authorization code for a session.
 *
 * Requirements: 2.1 (email confirmation), 2.8 (default Parent role)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
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

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=auth_callback_failed', origin)
    )
  }

  // Ensure Prisma user record exists after OAuth or email confirmation callback
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
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
    }
  } catch (prismaError) {
    // Log but don't fail the callback — the user is authenticated in Supabase
    console.error('Prisma user upsert after callback failed:', prismaError)
  }

  return NextResponse.redirect(new URL(next, origin))
}
