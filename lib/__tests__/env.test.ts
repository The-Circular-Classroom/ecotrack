/**
 * Property 22: Environment variable startup validation
 * Feature: aws-to-vercel-supabase-migration, Property 22: Environment variable startup validation
 *
 * For any required environment variable (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 * SUPABASE_SECRET_KEY, POSTGRES_PRISMA_URL) that is missing from the environment, the application
 * startup validation SHALL fail with an error message naming the missing variable.
 *
 * **Validates: Requirements 12.2**
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'POSTGRES_PRISMA_URL',
] as const

/**
 * Replicates the validation logic from lib/env.ts for testability.
 * The actual module executes validateEnv() on import, making it difficult
 * to test repeatedly with different env configurations. This extracted
 * logic mirrors the module's behavior exactly.
 */
function validateEnv(env: Record<string, string | undefined>) {
  const missing: string[] = []
  for (const varName of REQUIRED_ENV_VARS) {
    if (!env[varName]) {
      missing.push(varName)
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
  return {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    SUPABASE_SECRET_KEY: env.SUPABASE_SECRET_KEY!,
    POSTGRES_PRISMA_URL: env.POSTGRES_PRISMA_URL!,
  }
}

describe('Feature: aws-to-vercel-supabase-migration, Property 22: Environment variable startup validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  /**
   * Arbitrary that generates a non-empty subset of required env var indices.
   * Each generated value is an array of indices into REQUIRED_ENV_VARS
   * representing which variables should be missing.
   */
  const missingVarsSubsetArb = fc.subarray(
    [0, 1, 2, 3] as number[],
    { minLength: 1, maxLength: 4 }
  )

  /**
   * Arbitrary that generates valid non-empty string values for env vars
   */
  const envValueArb = fc.string({ minLength: 1, maxLength: 200 })

  it('should fail with error naming each missing variable for any non-empty subset of missing vars', () => {
    fc.assert(
      fc.property(
        missingVarsSubsetArb,
        fc.tuple(envValueArb, envValueArb, envValueArb, envValueArb),
        (missingIndices, values) => {
          // Build an env object with all vars set
          const env: Record<string, string | undefined> = {}
          for (let i = 0; i < REQUIRED_ENV_VARS.length; i++) {
            env[REQUIRED_ENV_VARS[i]] = values[i]
          }

          // Remove the selected subset to simulate missing vars
          const missingVarNames = missingIndices.map((i) => REQUIRED_ENV_VARS[i])
          for (const varName of missingVarNames) {
            delete env[varName]
          }

          // Validation should throw
          expect(() => validateEnv(env)).toThrow()

          // Verify the error message names each missing variable
          try {
            validateEnv(env)
          } catch (err) {
            const errorMessage = (err as Error).message
            for (const varName of missingVarNames) {
              expect(errorMessage).toContain(varName)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should succeed when all required environment variables are present with any non-empty values', () => {
    fc.assert(
      fc.property(
        fc.tuple(envValueArb, envValueArb, envValueArb, envValueArb),
        (values) => {
          const env: Record<string, string | undefined> = {}
          for (let i = 0; i < REQUIRED_ENV_VARS.length; i++) {
            env[REQUIRED_ENV_VARS[i]] = values[i]
          }

          // Validation should NOT throw when all vars are present with non-empty values
          const result = validateEnv(env)
          expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe(values[0])
          expect(result.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(values[1])
          expect(result.SUPABASE_SECRET_KEY).toBe(values[2])
          expect(result.POSTGRES_PRISMA_URL).toBe(values[3])
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should treat empty string as missing (falsy check)', () => {
    fc.assert(
      fc.property(
        missingVarsSubsetArb,
        fc.tuple(envValueArb, envValueArb, envValueArb, envValueArb),
        (emptyIndices, values) => {
          // Build an env object with all vars set
          const env: Record<string, string | undefined> = {}
          for (let i = 0; i < REQUIRED_ENV_VARS.length; i++) {
            env[REQUIRED_ENV_VARS[i]] = values[i]
          }

          // Set selected vars to empty string (falsy)
          const emptyVarNames = emptyIndices.map((i) => REQUIRED_ENV_VARS[i])
          for (const varName of emptyVarNames) {
            env[varName] = ''
          }

          // Validation should throw because empty string is falsy
          expect(() => validateEnv(env)).toThrow()

          // Error message should name each empty/missing variable
          try {
            validateEnv(env)
          } catch (err) {
            const errorMessage = (err as Error).message
            for (const varName of emptyVarNames) {
              expect(errorMessage).toContain(varName)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should fail validation when importing the actual module with missing env vars', async () => {
    // Remove a required env var
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    delete process.env.SUPABASE_SECRET_KEY
    delete process.env.POSTGRES_PRISMA_URL

    // Dynamically importing the module should throw because validateEnv()
    // runs at module evaluation time
    await expect(async () => {
      await import('../env')
    }).rejects.toThrow('Missing required environment variables')
  })

  it('should succeed validation when importing the actual module with all env vars present', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-anon-key'
    process.env.SUPABASE_SECRET_KEY = 'test-service-role-key'
    process.env.POSTGRES_PRISMA_URL = 'postgresql://user:pass@localhost:6543/db'

    const mod = await import('../env')
    expect(mod.env).toBeDefined()
    expect(mod.env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co')
    expect(mod.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe('test-anon-key')
    expect(mod.env.SUPABASE_SECRET_KEY).toBe('test-service-role-key')
    expect(mod.env.POSTGRES_PRISMA_URL).toBe('postgresql://user:pass@localhost:6543/db')
  })
})
