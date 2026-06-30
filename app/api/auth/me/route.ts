import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma/client'
import { validatePassword, validateProfileFields } from '@/lib/auth/validation'

/**
 * GET /api/auth/me
 *
 * Returns the current user's profile from middleware headers + Prisma.
 * Combines Supabase user_metadata with Prisma user record.
 *
 * Requirements: 2.6, 2.12 (user profile CRUD for settings page)
 *               3.1 (new endpoint, no existing endpoints modified)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch user from Prisma using supabaseAuthId
    const user = await prisma.user.findUnique({
      where: { supabaseAuthId: userId },
      include: { school: true },
    })

    if (!user) {
      // Fallback: try to get data from Supabase auth
      const supabase = await createSupabaseServerClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        return NextResponse.json(
          { error: 'not_found', message: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        fullName: authUser.user_metadata?.full_name || '',
        firstName: authUser.user_metadata?.first_name || '',
        lastName: authUser.user_metadata?.last_name || '',
        email: authUser.email || '',
        roles: [authUser.app_metadata?.role || 'Parent'],
        username: authUser.email || '',
        phone: authUser.user_metadata?.phone_number || '',
      })
    }

    return NextResponse.json({
      fullName: user.fullName || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      roles: [user.role],
      username: user.email,
      phone: user.phoneNumber || '',
    })
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/auth/me
 *
 * Updates the current user's profile.
 * Handles name updates (Prisma + Supabase metadata), email changes (triggers verification),
 * and password changes (requires currentPassword verification first).
 *
 * Requirements: 2.6, 2.12 (profile management in settings)
 *               3.1 (new endpoint, no existing endpoints modified)
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, fullName, email, password, currentPassword } = body

    // Validate profile fields if provided
    const profileErrors = validateProfileFields({
      firstName,
      lastName,
      fullName,
    })
    if (profileErrors.length > 0) {
      return NextResponse.json(
        { error: 'validation_error', message: profileErrors[0].message, details: profileErrors },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Handle password change
    if (password) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'validation_error', message: 'Current password is required to change password' },
          { status: 400 }
        )
      }

      const passwordError = validatePassword(password)
      if (passwordError) {
        return NextResponse.json(
          { error: 'validation_error', message: passwordError.message },
          { status: 400 }
        )
      }

      // Verify current password by attempting sign-in
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.email) {
        return NextResponse.json(
          { error: 'unauthorized', message: 'Unable to verify identity' },
          { status: 401 }
        )
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: currentPassword,
      })

      if (verifyError) {
        return NextResponse.json(
          { error: 'invalid_password', message: 'Current password is incorrect' },
          { status: 401 }
        )
      }

      // Update password via admin client to bypass session requirements
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      )

      if (updateError) {
        return NextResponse.json(
          { error: 'update_failed', message: 'Failed to update password' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
      })
    }

    // Handle email change
    if (email) {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser?.email === email) {
        return NextResponse.json(
          { error: 'validation_error', message: 'New email must be different from current email' },
          { status: 400 }
        )
      }

      const { error: emailError } = await supabase.auth.updateUser({ email })

      if (emailError) {
        return NextResponse.json(
          { error: 'update_failed', message: 'Failed to initiate email change' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Verification email sent to new address',
        requiresVerification: true,
      })
    }

    // Handle name/profile update
    const updateData: Record<string, string | undefined> = {}
    const metadataUpdate: Record<string, string> = {}

    if (firstName !== undefined) {
      updateData.firstName = firstName
      metadataUpdate.first_name = firstName
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName
      metadataUpdate.last_name = lastName
    }
    if (fullName !== undefined) {
      updateData.fullName = fullName
      metadataUpdate.full_name = fullName
    }

    // Update Prisma record
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { supabaseAuthId: userId },
        data: updateData,
      })
    }

    // Update Supabase user_metadata
    if (Object.keys(metadataUpdate).length > 0) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: metadataUpdate,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/me
 *
 * Deactivates the current user's account (soft-delete in Prisma, sign out from Supabase).
 * Does NOT permanently delete the user — sets isActive=false.
 *
 * Requirements: 2.6, 2.12 (account deactivation from settings page)
 *               3.1 (new endpoint, no existing endpoints modified)
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Soft-delete: set isActive=false in Prisma
    await prisma.user.update({
      where: { supabaseAuthId: userId },
      data: { isActive: false },
    })

    // Sign out the user from Supabase
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: 'Account deactivated',
    })
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
