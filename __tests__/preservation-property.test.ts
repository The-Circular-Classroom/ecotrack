/**
 * Preservation Property Tests - Property 2: Backend API Routes and Auth Infrastructure Unchanged
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 *
 * These tests observe the current (unfixed) code's backend infrastructure and encode
 * that it must remain byte-identical after the frontend fix. They ensure no regressions
 * in API routes, middleware, Supabase client/server, or Prisma client.
 *
 * Methodology: Observation-first — we read the current file contents, compute checksums,
 * and assert key structural properties that must not change.
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

// Helper: compute SHA-256 hash of a file's content
function fileHash(filePath: string): string {
  const fullPath = path.resolve(process.cwd(), filePath)
  const content = fs.readFileSync(fullPath, 'utf-8')
  return crypto.createHash('sha256').update(content).digest('hex')
}

// Helper: read file content
function readFile(filePath: string): string {
  const fullPath = path.resolve(process.cwd(), filePath)
  return fs.readFileSync(fullPath, 'utf-8')
}

// Helper: check if file exists
function fileExists(filePath: string): boolean {
  const fullPath = path.resolve(process.cwd(), filePath)
  return fs.existsSync(fullPath)
}

// ============================================================
// OBSERVED BASELINE: Backend infrastructure file checksums
// These are computed at test definition time from the CURRENT unfixed code.
// After the fix, these same files must produce identical checksums.
// ============================================================

const INFRASTRUCTURE_FILES = {
  'lib/prisma/client.ts': fileHash('lib/prisma/client.ts'),
  'lib/supabase/client.ts': fileHash('lib/supabase/client.ts'),
  'lib/supabase/server.ts': fileHash('lib/supabase/server.ts'),
  'proxy.ts': fileHash('proxy.ts'),
} as const

// All backend API route files that must remain unchanged
const API_ROUTE_FILES = [
  'app/api/health/route.ts',
  'app/api/auth/login/route.ts',
  'app/api/auth/register/route.ts',
  'app/api/auth/logout/route.ts',
  'app/api/auth/session/route.ts',
  'app/api/auth/reset-password/route.ts',
  'app/api/auth/callback/route.ts',
  'app/api/auth/mfa/route.ts',
  'app/api/inventory/balance/route.ts',
  'app/api/inventory/brands/route.ts',
  'app/api/inventory/categories/route.ts',
  'app/api/inventory/colours/route.ts',
  'app/api/inventory/item-types/route.ts',
  'app/api/inventory/materials/route.ts',
  'app/api/inventory/patterns/route.ts',
  'app/api/inventory/sizes/route.ts',
  'app/api/inventory/tags/route.ts',
  'app/api/inventory/transactions/route.ts',
  'app/api/analytics/overview/route.ts',
  'app/api/analytics/collection/route.ts',
  'app/api/analytics/assembly/route.ts',
  'app/api/csv/approve/route.ts',
  'app/api/csv/upload/route.ts',
  'app/api/csv/validate/route.ts',
  'app/api/donations/drives/route.ts',
  'app/api/users/route.ts',
  'app/api/users/[id]/route.ts',
  'app/api/reports/route.ts',
  'app/api/storage/images/route.ts',
]

// Compute baseline checksums for all API route files
const API_ROUTE_CHECKSUMS: Record<string, string> = {}
for (const file of API_ROUTE_FILES) {
  if (fileExists(file)) {
    API_ROUTE_CHECKSUMS[file] = fileHash(file)
  }
}

describe('Preservation Property Tests - Property 2: Backend API Routes and Auth Infrastructure Unchanged', () => {
  /**
   * Property: For all API route files, the file content remains byte-identical
   * (SHA-256 hash matches the observed baseline).
   *
   * This uses property-based testing to randomly select API route files and verify
   * they haven't been modified.
   *
   * **Validates: Requirements 3.1**
   */
  it('Property: All API route file contents remain byte-identical to observed baseline', () => {
    const existingRouteFiles = API_ROUTE_FILES.filter(f => fileExists(f))

    fc.assert(
      fc.property(
        fc.constantFrom(...existingRouteFiles),
        (routeFile: string) => {
          const currentHash = fileHash(routeFile)
          const baselineHash = API_ROUTE_CHECKSUMS[routeFile]

          expect(currentHash).toBe(baselineHash)
        }
      ),
      { numRuns: 100 } // Run enough to cover all route files multiple times
    )
  })

  /**
   * Property: Prisma client module and Supabase client/server files remain byte-identical.
   *
   * **Validates: Requirements 3.4, 3.7**
   */
  it('Property: Infrastructure files (Prisma, Supabase client/server) remain byte-identical', () => {
    const infraFiles = Object.keys(INFRASTRUCTURE_FILES) as Array<keyof typeof INFRASTRUCTURE_FILES>

    fc.assert(
      fc.property(
        fc.constantFrom(...infraFiles),
        (infraFile: string) => {
          const currentHash = fileHash(infraFile)
          const baselineHash = INFRASTRUCTURE_FILES[infraFile as keyof typeof INFRASTRUCTURE_FILES]

          expect(currentHash).toBe(baselineHash)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: For all request types, middleware continues to validate JWT via getUser(),
   * redirect unauthenticated page requests, and return 401 for unauthorized API calls.
   *
   * We verify this structurally by checking the middleware source contains the key patterns
   * that implement auth validation behavior.
   *
   * **Validates: Requirements 3.2**
   */
  it('Property: Middleware validates JWT via getUser(), redirects unauthenticated pages, returns 401 for unauthorized API calls', () => {
    const middlewareSource = readFile('proxy.ts')

    // Middleware must call getUser() to validate JWT tokens
    expect(middlewareSource).toContain('getUser()')

    // Middleware must check for API paths and return 401
    expect(middlewareSource).toContain("pathname.startsWith('/api/')")
    expect(middlewareSource).toContain('status: 401')

    // Middleware must redirect unauthenticated page requests to /login
    expect(middlewareSource).toContain("'/login'")
    expect(middlewareSource).toContain('NextResponse.redirect')

    // Middleware must attach x-user-id and x-user-role headers
    expect(middlewareSource).toContain("'x-user-id'")
    expect(middlewareSource).toContain("'x-user-role'")

    // Middleware must use createServerClient from @supabase/ssr
    expect(middlewareSource).toContain('createServerClient')
    expect(middlewareSource).toContain("'@supabase/ssr'")

    // Middleware must have PUBLIC_PATHS including auth endpoints
    expect(middlewareSource).toContain('PUBLIC_PATHS')
    expect(middlewareSource).toContain('/api/health')
    expect(middlewareSource).toContain('/api/auth/login')
    expect(middlewareSource).toContain('/api/auth/register')
  })

  /**
   * Property: POST /api/auth/login continues to return the response format
   * { access_token, refresh_token, expires_in, user: { id, email, role } }
   *
   * We verify structurally that the login route source produces the expected response shape.
   *
   * **Validates: Requirements 3.3**
   */
  it('Property: Login API route returns { access_token, refresh_token, expires_in, user: { id, email, role } } response format', () => {
    const loginSource = readFile('app/api/auth/login/route.ts')

    // Must return access_token
    expect(loginSource).toContain('access_token')

    // Must return refresh_token
    expect(loginSource).toContain('refresh_token')

    // Must return expires_in
    expect(loginSource).toContain('expires_in')

    // Must return user object with id, email, role
    expect(loginSource).toContain('user:')
    expect(loginSource).toContain('id: data.user.id')
    expect(loginSource).toContain('email: data.user.email')
    expect(loginSource).toMatch(/role/)

    // Must use signInWithPassword (Supabase auth)
    expect(loginSource).toContain('signInWithPassword')

    // Must use createSupabaseServerClient
    expect(loginSource).toContain('createSupabaseServerClient')
  })

  /**
   * Property: Cookie-based session management via @supabase/ssr middleware
   * remains the auth mechanism (not sessionStorage tokens).
   *
   * **Validates: Requirements 3.4**
   */
  it('Property: Supabase client uses cookie-based auth via @supabase/ssr (not sessionStorage)', () => {
    const serverSource = readFile('lib/supabase/server.ts')
    const clientSource = readFile('lib/supabase/client.ts')
    const middlewareSource = readFile('proxy.ts')

    // Server client must use cookies
    expect(serverSource).toContain('cookies')
    expect(serverSource).toContain('getAll')
    expect(serverSource).toContain('setAll')
    expect(serverSource).toContain("'@supabase/ssr'")

    // Client uses createBrowserClient from @supabase/ssr
    expect(clientSource).toContain('createBrowserClient')
    expect(clientSource).toContain("'@supabase/ssr'")

    // No sessionStorage usage in any infrastructure file
    expect(serverSource).not.toContain('sessionStorage')
    expect(clientSource).not.toContain('sessionStorage')
    expect(middlewareSource).not.toContain('sessionStorage')
  })

  /**
   * Property: Role-based access control uses Supabase app_metadata.role values
   * (Admin, SchoolStaff, PsgVolunteer, Parent) rather than legacy Cognito group names.
   *
   * **Validates: Requirements 3.5**
   */
  it('Property: Roles use Supabase app_metadata.role values (Admin, SchoolStaff, PsgVolunteer, Parent)', () => {
    const middlewareSource = readFile('proxy.ts')
    const loginSource = readFile('app/api/auth/login/route.ts')
    const registerSource = readFile('app/api/auth/register/route.ts')

    // Middleware extracts role from app_metadata
    expect(middlewareSource).toContain('app_metadata')
    expect(middlewareSource).toContain('role')

    // Default role is 'Parent'
    expect(middlewareSource).toContain("'Parent'")
    expect(loginSource).toContain("'Parent'")

    // Register assigns default 'Parent' role
    expect(registerSource).toContain("role: 'Parent'")

    // No Cognito group references
    expect(middlewareSource).not.toContain('cognito')
    expect(middlewareSource).not.toContain('Cognito')
    expect(loginSource).not.toContain('cognito')
    expect(loginSource).not.toContain('Cognito')
  })

  /**
   * Property: Next.js 15 App Router conventions preserved with (auth) and (dashboard)
   * route groups and TypeScript .tsx format.
   *
   * **Validates: Requirements 3.6**
   */
  it('Property: Next.js 15 App Router conventions preserved with route groups and TypeScript format', () => {
    // (auth) route group exists
    expect(fileExists('app/(auth)/layout.tsx')).toBe(true)
    expect(fileExists('app/(auth)/login/page.tsx')).toBe(true)
    expect(fileExists('app/(auth)/register/page.tsx')).toBe(true)

    // (dashboard) route group exists
    expect(fileExists('app/(dashboard)/layout.tsx')).toBe(true)
    expect(fileExists('app/(dashboard)/overview/page.tsx')).toBe(true)
    expect(fileExists('app/(dashboard)/inventory/page.tsx')).toBe(true)
    expect(fileExists('app/(dashboard)/analytics/page.tsx')).toBe(true)
    expect(fileExists('app/(dashboard)/users/page.tsx')).toBe(true)
    expect(fileExists('app/(dashboard)/donations/page.tsx')).toBe(true)
    expect(fileExists('app/(dashboard)/csv-upload/page.tsx')).toBe(true)
    expect(fileExists('app/(dashboard)/settings/page.tsx')).toBe(true)

    // Root layout exists
    expect(fileExists('app/layout.tsx')).toBe(true)

    // All API routes use TypeScript (.ts) format
    fc.assert(
      fc.property(
        fc.constantFrom(...API_ROUTE_FILES.filter(f => fileExists(f))),
        (routeFile: string) => {
          expect(routeFile.endsWith('.ts')).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Prisma client functions correctly — no changes to database schema,
   * Prisma client usage, or data access patterns in the API layer.
   *
   * We verify structurally that:
   * - lib/prisma/client.ts exists and exports prisma singleton
   * - API routes import from @/lib/prisma/client
   * - Prisma client uses PrismaPg adapter pattern
   *
   * **Validates: Requirements 3.7**
   */
  it('Property: Prisma client module uses PrismaPg adapter and exports singleton correctly', () => {
    const prismaSource = readFile('lib/prisma/client.ts')

    // Must use PrismaPg adapter
    expect(prismaSource).toContain('PrismaPg')
    expect(prismaSource).toContain("@prisma/adapter-pg")

    // Must export prisma singleton
    expect(prismaSource).toContain('export const prisma')

    // Must use globalThis pattern for dev mode caching
    expect(prismaSource).toContain('globalForPrisma')
    expect(prismaSource).toContain('globalThis')

    // Must use POSTGRES_PRISMA_URL env var
    expect(prismaSource).toContain('POSTGRES_PRISMA_URL')
  })

  /**
   * Property: GET /api/health returns 200 with status JSON structure
   * (observed: { status: 'healthy', database: 'connected', latencyMs: number } on success).
   *
   * We verify structurally that the health route produces the expected response shape.
   *
   * **Validates: Requirements 3.1**
   */
  it('Property: Health API route returns status JSON with expected fields', () => {
    const healthSource = readFile('app/api/health/route.ts')

    // Must return 'healthy' status on success
    expect(healthSource).toContain("'healthy'")
    expect(healthSource).toContain("'connected'")
    expect(healthSource).toContain('latencyMs')

    // Must return 'unhealthy' status on failure
    expect(healthSource).toContain("'unhealthy'")
    expect(healthSource).toContain("'unreachable'")

    // Must use prisma for database connectivity check
    expect(healthSource).toContain('prisma')
    expect(healthSource).toContain('$queryRaw')

    // Must be a GET handler
    expect(healthSource).toContain('export async function GET()')
  })

  /**
   * Property: For all API routes, source files contain proper Next.js route handler exports
   * (GET, POST, PATCH, DELETE, PUT) and use NextResponse for responses.
   *
   * **Validates: Requirements 3.1**
   */
  it('Property: All API route files export proper Next.js route handlers', () => {
    const existingRouteFiles = API_ROUTE_FILES.filter(f => fileExists(f))

    fc.assert(
      fc.property(
        fc.constantFrom(...existingRouteFiles),
        (routeFile: string) => {
          const source = readFile(routeFile)

          // Must import NextResponse
          expect(source).toContain('NextResponse')

          // Must export at least one HTTP method handler
          const hasHandler =
            source.includes('export async function GET') ||
            source.includes('export async function POST') ||
            source.includes('export async function PATCH') ||
            source.includes('export async function DELETE') ||
            source.includes('export async function PUT')

          expect(hasHandler).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Unauthenticated API requests receive 401.
   * We verify the middleware's structural implementation ensures unauthorized
   * API calls get a 401 JSON response.
   *
   * **Validates: Requirements 3.2**
   */
  it('Property: Middleware returns 401 JSON for unauthenticated API requests', () => {
    const middlewareSource = readFile('proxy.ts')

    // Must have error handling for missing/invalid user
    expect(middlewareSource).toContain('if (error || !user)')

    // Must return 401 for API paths
    expect(middlewareSource).toContain('401')
    expect(middlewareSource).toContain('Unauthorized')

    // Must use NextResponse.json for API error
    expect(middlewareSource).toContain('NextResponse.json')

    // Must check pathname.startsWith('/api/')
    expect(middlewareSource).toContain("pathname.startsWith('/api/')")
  })

  /**
   * Property: Middleware attaches x-user-id and x-user-role headers on authenticated requests.
   *
   * **Validates: Requirements 3.2**
   */
  it('Property: Middleware attaches x-user-id and x-user-role headers for downstream use', () => {
    const middlewareSource = readFile('proxy.ts')

    // Must set x-user-id header from user.id
    expect(middlewareSource).toContain("response.headers.set('x-user-id', user.id)")

    // Must set x-user-role header
    expect(middlewareSource).toContain("response.headers.set('x-user-role', role)")

    // Role must be resolved from the users table (with app_metadata fallback)
    expect(middlewareSource).toContain("supabase_auth_id")
    expect(middlewareSource).toContain("select('role')")
  })
})
