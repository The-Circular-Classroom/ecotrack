/**
 * Environment variable validation module.
 * Validates all required environment variables at runtime and exports typed values.
 * Import this module early (e.g., in root layout) to fail fast on misconfiguration.
 *
 * Validation is skipped during Next.js production builds (where env vars may not be present)
 * and only runs at runtime when the application actually starts serving requests.
 */

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'POSTGRES_PRISMA_URL',
] as const

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number]

export interface ValidatedEnv {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string
  SUPABASE_SECRET_KEY: string
  POSTGRES_PRISMA_URL: string
}

/** Returns true if we are in the Next.js build phase (not runtime) */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

export function validateEnv(): ValidatedEnv {
  // Skip validation during build phase — env vars may not be present
  if (isBuildPhase()) {
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ?? '',
      POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ?? '',
    }
  }

  const missing: string[] = []

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY!,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL!,
  }
}

export const env = validateEnv()
