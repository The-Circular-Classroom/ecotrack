import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma/client'
import { validatePassword, validateProfileFields } from '@/lib/auth/validation'
import { createApiLogger } from '@/lib/logger'

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
  const logger = createApiLogger('GET /api/auth/me');
  try {
    const userId = request.headers.get('x-user-id')
    logger.info('Request received', { userId });

    if (!userId) {
      logger.warn('Unauthorized: missing x-user-id header');
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch user from Prisma using supabaseAuthId
    logger.debug('Querying Prisma for user');
    const user = await prisma.user.findUnique({
      where: { supabaseAuthId: userId },
      include: { school: true },
    })

    if (!user) {
      logger.debug('User not found in Prisma, falling back to Supabase');
      // Fallback: try to get data from Supabase auth
      const supabase = await createSupabaseServerClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        logger.warn('User not found in Supabase either', { userId });
        return NextResponse.json(
          { error: 'not_found', message: 'User not found' },
          { status: 404 }
        )
      }

      logger.info('Response sent (Supabase fallback)', { status: 200, userId });
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

    logger.info('Response sent', { status: 200, userId });
    return NextResponse.json({
      fullName: user.fullName || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      roles: [user.role],
      username: user.email,
      phone: user.phoneNumber || '',
    })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
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
  const logger = createApiLogger('PATCH /api/auth/me');
  try {
    const userId = request.headers.get('x-user-id')
    logger.info('Request received', { userId });

    if (!userId) {
      logger.warn('Unauthorized: missing x-user-id header');
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, fullName, email, password, currentPassword } = body
    logger.debug('Update fields', { hasFirstName: !!firstName, hasLastName: !!lastName, hasFullName: !!fullName, hasEmail: !!email, hasPassword: !!password });

    // Validate profile fields if provided
    const profileErrors = validateProfileFields({
      firstName,
      lastName,
      fullName,
    })
    if (profileErrors.length > 0) {
      logger.warn('Validation failed: invalid profile fields', { reason: profileErrors[0].message });
      return NextResponse.json(
        { error: 'validation_error', message: profileErrors[0].message, details: profileErrors },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Handle password change
    if (password) {
      logger.debug('Handling password change');
      if (!currentPassword) {
        logger.warn('Missing current password for password change');
        return NextResponse.json(
          { error: 'validation_error', message: 'Current password is required to change password' },
          { status: 400 }
        )
      }

      const passwordError = validatePassword(password)
      if (passwordError) {
        logger.warn('Validation failed: weak new password', { reason: passwordError.message });
        return NextResponse.json(
          { error: 'validation_error', message: passwordError.message },
          { status: 400 }
        )
      }

      // Verify current password by attempting sign-in
      logger.debug('Verifying current password');
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.email) {
        logger.warn('Unable to verify identity: no auth user');
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
        logger.warn('Current password verification failed', { userId });
        return NextResponse.json(
          { error: 'invalid_password', message: 'Current password is incorrect' },
          { status: 401 }
        )
      }

      logger.debug('Current password verified, updating to new password');
      // Update password via admin client to bypass session requirements
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      )

      if (updateError) {
        logger.error('Password update failed', { error: updateError.message, userId });
        return NextResponse.json(
          { error: 'update_failed', message: 'Failed to update password' },
          { status: 500 }
        )
      }

      logger.info('Password updated successfully', { userId });
      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
      })
    }

    // Handle email change
    if (email) {
      logger.debug('Handling email change', { newEmail: email });
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser?.email === email) {
        logger.warn('Email unchanged', { email });
        return NextResponse.json(
          { error: 'validation_error', message: 'New email must be different from current email' },
          { status: 400 }
        )
      }

      const { error: emailError } = await supabase.auth.updateUser({ email })

      if (emailError) {
        logger.error('Email change initiation failed', { error: emailError.message, userId });
        return NextResponse.json(
          { error: 'update_failed', message: 'Failed to initiate email change' },
          { status: 500 }
        )
      }

      logger.info('Email change verification sent', { userId, newEmail: email });
      return NextResponse.json({
        success: true,
        message: 'Verification email sent to new address',
        requiresVerification: true,
      })
    }

    // Handle name/profile update
    logger.debug('Handling profile name update');
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
      logger.debug('Updating Prisma user record');
      await prisma.user.update({
        where: { supabaseAuthId: userId },
        data: updateData,
      })
    }

    // Update Supabase user_metadata
    if (Object.keys(metadataUpdate).length > 0) {
      logger.debug('Updating Supabase user_metadata');
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: metadataUpdate,
      })
    }

    logger.info('Profile updated successfully', { userId });
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
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
  const logger = createApiLogger('DELETE /api/auth/me');
  try {
    const userId = request.headers.get('x-user-id')
    logger.info('Request received', { userId });

    if (!userId) {
      logger.warn('Unauthorized: missing x-user-id header');
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Soft-delete: set isActive=false in Prisma
    logger.debug('Deactivating user in Prisma');
    await prisma.user.update({
      where: { supabaseAuthId: userId },
      data: { isActive: false },
    })

    // Sign out the user from Supabase
    logger.debug('Signing out user from Supabase');
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()

    logger.info('Account deactivated', { userId });
    return NextResponse.json({
      success: true,
      message: 'Account deactivated',
    })
  } catch (err) {
    logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
