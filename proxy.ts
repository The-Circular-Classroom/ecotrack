import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/reset-password',
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/callback',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths without authentication
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Create response and supabase client with cookie handling
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          // Update cookies on the request for downstream
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Recreate response with updated request cookies
          response = NextResponse.next({ request })
          // Set cookies on the response for the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validate JWT by calling getUser() which verifies the token server-side
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    // For API requests, return 401 JSON response
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // For page requests, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Attach user info to headers for downstream use
  const role = user.app_metadata?.role || 'Parent'
  response.headers.set('x-user-id', user.id)
  response.headers.set('x-user-role', role)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
