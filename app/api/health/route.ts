import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/health - Health check endpoint.
 * Publicly accessible (no auth required).
 * Verifies database connectivity to Supabase.
 * Requirements: 12.6, 12.7
 */
export async function GET() {
  try {
    const start = Date.now()

    // Simple connectivity check with 5 second timeout
    const dbCheck = prisma.$queryRaw`SELECT 1`
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    )

    await Promise.race([dbCheck, timeout])

    const latencyMs = Date.now() - start

    return NextResponse.json(
      { status: 'healthy', database: 'connected', latencyMs },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { status: 'unhealthy', database: 'unreachable', error: message },
      { status: 503 }
    )
  }
}
