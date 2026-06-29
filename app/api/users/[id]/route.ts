import { NextRequest, NextResponse } from 'next/server'
import { requireRole, isValidRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/users/[id] - Get a single user by ID.
 * Admin-only endpoint.
 * Requirements: 4.3, 3.4, 3.5
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json(
      { error: 'not_found', message: 'User not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ user })
}

/**
 * PATCH /api/users/[id] - Update a user's fields.
 * Admin-only endpoint.
 * Requirements: 4.3, 4.8, 3.4, 3.5, 3.7
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  let body: {
    firstName?: string
    lastName?: string
    fullName?: string
    phoneNumber?: string
    role?: string
    schoolId?: number | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  // Validate role if provided (Requirement 3.7)
  if (body.role !== undefined && !isValidRole(body.role)) {
    return NextResponse.json(
      {
        error: 'invalid_role',
        message: `Invalid role. Must be one of: Admin, SchoolStaff, PsgVolunteer, Parent`,
      },
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

  // Build update data for DB
  const dbUpdate: Record<string, unknown> = {}
  if (body.firstName !== undefined) dbUpdate.firstName = body.firstName
  if (body.lastName !== undefined) dbUpdate.lastName = body.lastName
  if (body.fullName !== undefined) dbUpdate.fullName = body.fullName
  if (body.phoneNumber !== undefined) dbUpdate.phoneNumber = body.phoneNumber
  if (body.role !== undefined) dbUpdate.role = body.role
  if (body.schoolId !== undefined) dbUpdate.schoolId = body.schoolId

  // Build update data for Supabase Auth metadata
  const authMetaUpdate: Record<string, unknown> = {}
  if (body.firstName !== undefined) authMetaUpdate.first_name = body.firstName
  if (body.lastName !== undefined) authMetaUpdate.last_name = body.lastName
  if (body.fullName !== undefined) authMetaUpdate.full_name = body.fullName
  if (body.phoneNumber !== undefined) authMetaUpdate.phone_number = body.phoneNumber

  const authAppMetaUpdate: Record<string, unknown> = {}
  if (body.role !== undefined) authAppMetaUpdate.role = body.role

  // Capture previous auth state for potential rollback (Requirement 3.7)
  const previousRole = existingUser.role
  const previousMetadata = {
    first_name: existingUser.firstName,
    last_name: existingUser.lastName,
    full_name: existingUser.fullName,
    phone_number: existingUser.phoneNumber,
  }

  // Update Supabase Auth if we have auth-related changes
  if (Object.keys(authMetaUpdate).length > 0 || Object.keys(authAppMetaUpdate).length > 0) {
    const authUpdate: Record<string, unknown> = {}
    if (Object.keys(authMetaUpdate).length > 0) authUpdate.user_metadata = authMetaUpdate
    if (Object.keys(authAppMetaUpdate).length > 0) authUpdate.app_metadata = authAppMetaUpdate

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.supabaseAuthId,
      authUpdate
    )

    if (authError) {
      return NextResponse.json(
        { error: 'auth_error', message: 'Failed to update user in auth system' },
        { status: 500 }
      )
    }
  }

  // Update DB record
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: dbUpdate,
    })

    return NextResponse.json({ user })
  } catch (dbError: unknown) {
    // Rollback Supabase Auth changes if DB update fails (Requirement 3.7)
    if (Object.keys(authMetaUpdate).length > 0 || Object.keys(authAppMetaUpdate).length > 0) {
      const rollbackUpdate: Record<string, unknown> = {}
      if (Object.keys(authMetaUpdate).length > 0) {
        rollbackUpdate.user_metadata = previousMetadata
      }
      if (Object.keys(authAppMetaUpdate).length > 0) {
        rollbackUpdate.app_metadata = { role: previousRole }
      }
      await supabaseAdmin.auth.admin.updateUserById(
        existingUser.supabaseAuthId,
        rollbackUpdate
      )
    }

    const error = dbError as { code?: string }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'not_found', message: 'User not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to update user record' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id] - Delete a user.
 * Admin-only endpoint.
 * Requirements: 4.5, 4.8, 3.4, 3.5
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  // Delete from Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
    existingUser.supabaseAuthId
  )

  if (authError) {
    return NextResponse.json(
      { error: 'auth_error', message: 'Failed to delete user from auth system' },
      { status: 500 }
    )
  }

  // Delete from DB
  try {
    await prisma.user.delete({ where: { id: userId } })
    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (dbError: unknown) {
    const error = dbError as { code?: string }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'not_found', message: 'User not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to delete user record' },
      { status: 500 }
    )
  }
}
