import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/users/[id]/deactivate - Deactivate a user.
 * Disables the user in Supabase Auth and sets isActive=false in DB.
 * Admin-only endpoint.
 * Requirements: 4.4, 4.8, 3.4, 3.5
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'Admin')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  const { id } = await params
  const userId = parseInt(id, 10)
  if (isNaN(userId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'User ID must be a valid integer' },
      { status: 400 }
    )
  }

  // Find existing user
  const existingUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!existingUser) {
    return NextResponse.json(
      { error: 'not_found', message: 'User not found' },
      { status: 404 }
    )
  }

  // Disable user in Supabase Auth by banning them
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    existingUser.supabaseAuthId,
    { ban_duration: '876000h' } // ~100 years, effectively permanent
  )

  if (authError) {
    return NextResponse.json(
      { error: 'auth_error', message: 'Failed to deactivate user in auth system' },
      { status: 500 }
    )
  }

  // Set isActive=false in DB
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })

    return NextResponse.json({ user, message: 'User deactivated successfully' })
  } catch (dbError: unknown) {
    const error = dbError as { code?: string }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'not_found', message: 'User not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to deactivate user record' },
      { status: 500 }
    )
  }
}
