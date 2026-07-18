/**
 * Property 4: JWT authentication enforcement
 * Feature: aws-to-vercel-supabase-migration, Property 4: JWT authentication enforcement
 *
 * For any request to a protected endpoint (not in the public paths set), if the request contains
 * no JWT, an expired JWT, or a JWT with an invalid signature, the middleware SHALL return a 401
 * Unauthorized response without forwarding to the handler.
 *
 * **Validates: Requirements 3.2, 3.3**
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// Mock @supabase/ssr before importing middleware
const mockGetUser = vi.fn()
const mockCreateServerClient = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}))

// Mock next/server's NextResponse and NextRequest
vi.mock('next/server', () => {
  class MockNextResponse {
    status: number
    body: unknown
    _headers: Map<string, string>
    _redirectUrl: string | null

    constructor(body?: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.status = init?.status || 200
      this.body = body
      this._headers = new Map(Object.entries(init?.headers || {}))
      this._redirectUrl = null
    }

    get headers() {
      const self = this
      return {
        set(key: string, value: string) {
          self._headers.set(key, value)
        },
        get(key: string) {
          return self._headers.get(key)
        },
      }
    }

    static next({ request }: { request?: unknown } = {}) {
      const resp = new MockNextResponse(null, { status: 200 })
      ;(resp as any)._type = 'next'
      ;(resp as any)._request = request
      return resp
    }

    static json(body: unknown, init?: { status?: number }) {
      const resp = new MockNextResponse(body, init)
      ;(resp as any)._type = 'json'
      return resp
    }

    static redirect(url: URL | string) {
      const resp = new MockNextResponse(null, { status: 307 })
      ;(resp as any)._type = 'redirect'
      resp._redirectUrl = typeof url === 'string' ? url : url.toString()
      return resp
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: class MockNextRequest {
      url: string
      nextUrl: { pathname: string }
      cookies: { getAll: () => [] }

      constructor(url: string) {
        this.url = url
        const urlObj = new URL(url)
        this.nextUrl = { pathname: urlObj.pathname }
        const cookieStore: { name: string; value: string }[] = []
        this.cookies = {
          getAll: () => cookieStore,
          set: (name: string, value: string) => {
            cookieStore.push({ name, value })
          },
        } as any
      }
    },
  }
})

import { proxy } from '@/proxy'
import { NextRequest } from 'next/server'

/** The public paths that should be accessible without auth */
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/forget-password',
  '/auth/reset-password',
  '/auth/set-new-password',
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/callback',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/set-new-password',
]

/** Base URL used for constructing test requests */
const BASE_URL = 'http://localhost:3000'

/**
 * Arbitrary for generating random protected API paths.
 * These are paths that start with /api/ but are NOT public.
 */
const protectedApiPathArb = fc
  .array(
    fc.stringMatching(/^[a-z][a-z0-9-]*$/),
    { minLength: 1, maxLength: 4 }
  )
  .map((segments) => `/api/${segments.join('/')}`)
  .filter(
    (path) => !PUBLIC_PATHS.some((pub) => path.startsWith(pub))
  )

/**
 * Arbitrary for generating random protected page paths (non-API).
 * These are paths that are NOT public and NOT API routes.
 */
const protectedPagePathArb = fc
  .array(
    fc.stringMatching(/^[a-z][a-z0-9-]*$/),
    { minLength: 1, maxLength: 4 }
  )
  .map((segments) => `/${segments.join('/')}`)
  .filter(
    (path) =>
      !path.startsWith('/api/') &&
      !PUBLIC_PATHS.some((pub) => path.startsWith(pub))
  )

/**
 * Arbitrary for generating public paths (including sub-paths)
 */
const publicPathArb = fc.constantFrom(...PUBLIC_PATHS).chain((basePath) =>
  fc.oneof(
    fc.constant(basePath),
    fc
      .array(fc.stringMatching(/^[a-z][a-z0-9-]*$/), {
        minLength: 1,
        maxLength: 2,
      })
      .map((segments) => `${basePath}/${segments.join('/')}`)
  )
)

/**
 * Helper: set up the mock Supabase client to simulate no valid user (unauthenticated)
 */
function setupNoAuth() {
  mockGetUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'invalid claim: missing sub claim' },
  })
  mockCreateServerClient.mockReturnValue({
    auth: { getUser: mockGetUser },
  })
}

// Module-level variable to control what role the admin client mock returns
let mockDbRole = 'parent'

// Mock @supabase/supabase-js for the admin client used in role lookup
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() =>
              Promise.resolve({ data: { role: mockDbRole }, error: null })
            ),
          }),
        }),
      }),
    })),
  }
})

/**
 * Helper: set up the mock Supabase client to simulate a valid authenticated user
 */
function setupValidAuth(role: string = 'Parent') {
  // Map application role name to DB enum value
  const dbRoleMap: Record<string, string> = {
    Admin: 'admin',
    SchoolStaff: 'school_staff',
    Parent: 'parent',
    PsgVolunteer: 'psg_volunteer',
  }
  mockDbRole = dbRoleMap[role] || 'parent'

  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id: 'user-uuid-123',
        app_metadata: { role },
        user_metadata: { first_name: 'Test', last_name: 'User' },
      },
    },
    error: null,
  })

  mockCreateServerClient.mockReturnValue({
    auth: { getUser: mockGetUser },
  })
}

describe('Feature: aws-to-vercel-supabase-migration, Property 4: JWT authentication enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set env vars that middleware expects
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-anon-key'
  })

  it('SHALL allow access to public paths without authentication', async () => {
    await fc.assert(
      fc.asyncProperty(publicPathArb, async (path) => {
        setupNoAuth()
        const request = new NextRequest(`${BASE_URL}${path}`)
        const response = await proxy(request)

        // Public paths should return a "next" response (pass through)
        expect((response as any)._type).toBe('next')
      }),
      { numRuns: 100 }
    )
  })

  it('SHALL return 401 for protected API paths when no valid user session exists', async () => {
    await fc.assert(
      fc.asyncProperty(protectedApiPathArb, async (path) => {
        setupNoAuth()
        const request = new NextRequest(`${BASE_URL}${path}`)
        const response = await proxy(request)

        // Protected API paths with no auth should get 401
        expect((response as any)._type).toBe('json')
        expect(response.status).toBe(401)
        expect((response as any).body).toEqual({ error: 'Unauthorized' })
      }),
      { numRuns: 100 }
    )
  })

  it('SHALL redirect to /login for protected page paths when no valid user session exists', async () => {
    await fc.assert(
      fc.asyncProperty(protectedPagePathArb, async (path) => {
        setupNoAuth()
        const request = new NextRequest(`${BASE_URL}${path}`)
        const response = await proxy(request)

        // Protected page paths with no auth should redirect to /login
        expect((response as any)._type).toBe('redirect')
        expect((response as any)._redirectUrl).toContain('/login')
      }),
      { numRuns: 100 }
    )
  })

  it('SHALL return 401 for protected API paths when getUser returns an error (expired/invalid JWT)', async () => {
    const errorTypes = [
      { message: 'JWT expired' },
      { message: 'invalid signature' },
      { message: 'token is malformed' },
      { message: 'missing sub claim' },
    ]

    await fc.assert(
      fc.asyncProperty(
        protectedApiPathArb,
        fc.constantFrom(...errorTypes),
        async (path, error) => {
          mockGetUser.mockResolvedValue({
            data: { user: null },
            error,
          })
          mockCreateServerClient.mockReturnValue({
            auth: { getUser: mockGetUser },
          })

          const request = new NextRequest(`${BASE_URL}${path}`)
          const response = await proxy(request)

          expect((response as any)._type).toBe('json')
          expect(response.status).toBe(401)
          expect((response as any).body).toEqual({ error: 'Unauthorized' })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL forward request with user context for protected paths when valid auth exists', async () => {
    const validRoles = ['Admin', 'SchoolStaff', 'PsgVolunteer', 'Parent']

    await fc.assert(
      fc.asyncProperty(
        protectedApiPathArb,
        fc.constantFrom(...validRoles),
        async (path, role) => {
          setupValidAuth(role)
          const request = new NextRequest(`${BASE_URL}${path}`)
          const response = await proxy(request)

          // Valid auth should forward the request (type = 'next')
          expect((response as any)._type).toBe('next')
          // User context headers should be set
          expect(response.headers.get('x-user-id')).toBe('user-uuid-123')
          expect(response.headers.get('x-user-role')).toBe(role)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL allow /api/users/me when user has force_password_change set to true', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-uuid-temp',
          app_metadata: { role: 'Parent', force_password_change: true },
        },
      },
      error: null,
    })
    mockCreateServerClient.mockReturnValue({
      auth: { getUser: mockGetUser },
    })

    const request = new NextRequest(`${BASE_URL}/api/users/me`)
    const response = await proxy(request)

    expect((response as any)._type).toBe('next')
    expect(response.headers.get('x-user-id')).toBe('user-uuid-temp')
    expect(response.headers.get('x-user-force-password-change')).toBe('true')
  })

  it('SHALL not call getUser for public paths (no auth check needed)', async () => {
    await fc.assert(
      fc.asyncProperty(publicPathArb, async (path) => {
        setupNoAuth()
        const request = new NextRequest(`${BASE_URL}${path}`)
        await proxy(request)

        // For public paths, the middleware should short-circuit before calling getUser
        expect(mockGetUser).not.toHaveBeenCalled()
        // It should also not create a Supabase client
        expect(mockCreateServerClient).not.toHaveBeenCalled()
      }),
      { numRuns: 100 }
    )
  })
})
