import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { UserRole } from '@/lib/prisma/generated/client/client'

/**
 * POST /api/users/sync - Sync Supabase Auth users to database.
 * Compares all Auth users against DB records and creates missing DB entries.
 * Admin-only endpoint.
 * Requirements: 4.6, 3.4, 3.5
 */
export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'Admin')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  // Fetch all users from Supabase Auth (paginated)
  const authUsers: Array<{
    id: string
    email?: string
    app_metadata?: Record<string, unknown>
    user_metadata?: Record<string, unknown>
  }> = []
  let page = 1
  const perPage = 100

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      return NextResponse.json(
        { error: 'auth_error', message: 'Failed to list auth users' },
        { status: 500 }
      )
    }

    if (!data.users || data.users.length === 0) break
    authUsers.push(...data.users)

    if (data.users.length < perPage) break
    page++
  }

  // Get all existing DB user records by supabaseAuthId
  const existingDbUsers = await prisma.user.findMany({
    select: { supabaseAuthId: true },
  })
  const existingAuthIds = new Set(existingDbUsers.map((u) => u.supabaseAuthId))

  // Find auth users without corresponding DB records
  const missingUsers = authUsers.filter((au) => !existingAuthIds.has(au.id))

  // Create missing DB records
  let created = 0
  const errors: Array<{ authId: string; email?: string; error: string }> = []

  for (const authUser of missingUsers) {
    try {
      await prisma.user.create({
        data: {
          supabaseAuthId: authUser.id,
          email: authUser.email || `${authUser.id}@unknown.local`,
          role: (authUser.app_metadata?.role as UserRole) || UserRole.Parent,
          firstName: (authUser.user_metadata?.first_name as string) || null,
          lastName: (authUser.user_metadata?.last_name as string) || null,
          fullName: (authUser.user_metadata?.full_name as string) || null,
          isActive: true,
        },
      })
      created++
    } catch (dbError: unknown) {
      const err = dbError as { message?: string }
      errors.push({
        authId: authUser.id,
        email: authUser.email,
        error: err.message || 'Unknown database error',
      })
    }
  }

  return NextResponse.json({
    message: 'User sync completed',
    totalAuthUsers: authUsers.length,
    existingDbUsers: existingAuthIds.size,
    created,
    errors: errors.length > 0 ? errors : undefined,
  })
}
