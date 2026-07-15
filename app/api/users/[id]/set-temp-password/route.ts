import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendTempPasswordEmail } from '@/lib/email/resend'
import { createApiLogger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Generate a temporary password (16 characters) ensuring:
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
function generateTempPassword(): string {
  const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowers = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const symbols = '!@#$%^&*'
  const allChars = uppers + lowers + digits + symbols

  const required = [
    uppers[Math.floor(Math.random() * uppers.length)],
    lowers[Math.floor(Math.random() * lowers.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ]

  for (let i = required.length; i < 16; i++) {
    required.push(allChars[Math.floor(Math.random() * allChars.length)])
  }

  // Fisher-Yates shuffle
  for (let i = required.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[required[i], required[j]] = [required[j], required[i]]
  }

  return required.join('')
}

/**
 * POST /api/users/[id]/set-temp-password
 *
 * Sets a temporary password for a user and flags force_password_change in Supabase app_metadata
 * and user_flags in Prisma DB. Optionally sends email to user.
 * Admin-only endpoint.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const logger = createApiLogger('POST /api/users/[id]/set-temp-password')
  const role = request.headers.get('x-user-role')
  const { id } = await params
  logger.info('Request received', { id, role })

  if (!requireRole(role, 'Admin')) {
    logger.warn('Forbidden: insufficient role', { role })
    return NextResponse.json(
      { error: 'forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  const userId = parseInt(id, 10)
  if (isNaN(userId)) {
    logger.warn('Invalid user ID', { id })
    return NextResponse.json(
      { error: 'invalid_id', message: 'User ID must be a valid integer' },
      { status: 400 }
    )
  }

  let sendEmail = false
  try {
    const body = await request.json()
    if (body && typeof body.sendEmail === 'boolean') {
      sendEmail = body.sendEmail
    }
  } catch {
    // Body is optional
  }

  // 1. Look up existing user
  const dbUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!dbUser) {
    logger.warn('User not found', { userId })
    return NextResponse.json(
      { error: 'not_found', message: 'User not found' },
      { status: 404 }
    )
  }

  // Prevent admin from setting temp password for self via user management
  const currentAuthId = request.headers.get('x-user-id')
  if (currentAuthId && dbUser.supabaseAuthId === currentAuthId) {
    logger.warn('Forbidden: cannot set temporary password for self', { userId })
    return NextResponse.json(
      { error: 'forbidden', message: 'You cannot set a temporary password for your own account' },
      { status: 400 }
    )
  }

  // 2. Generate temporary password
  const tempPassword = generateTempPassword()

  // 3. Update Supabase Auth user (password & app_metadata flag)
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    dbUser.supabaseAuthId,
    {
      password: tempPassword,
      app_metadata: { force_password_change: true },
    }
  )

  if (authError) {
    logger.error('Supabase Auth password update failed', { error: authError.message, userId })
    return NextResponse.json(
      { error: 'auth_error', message: 'Failed to set temporary password in auth system' },
      { status: 500 }
    )
  }

  // 4. Update Prisma DB userFlags
  let emailSent = false
  try {
    const existingFlags = (dbUser.userFlags as Record<string, any>) || {}
    await prisma.user.update({
      where: { id: userId },
      data: {
        userFlags: {
          ...existingFlags,
          must_change_password: true,
        },
      },
    })
  } catch (dbErr: any) {
    logger.error('Failed to update user_flags in DB', { error: dbErr.message, userId })
    // Non-fatal since Supabase app_metadata is the primary source for proxy checks
  }

  // 5. Send email if requested
  if (sendEmail && dbUser.email) {
    try {
      await sendTempPasswordEmail({
        to: dbUser.email,
        tempPassword,
        firstName: dbUser.firstName || undefined,
      })
      emailSent = true
      logger.info('Temporary password email sent', { userId, email: dbUser.email })
    } catch (emailErr: any) {
      logger.error('Failed to send temp password email', { error: emailErr.message, userId })
    }
  }

  logger.info('Temporary password set successfully', { userId, sendEmail, emailSent })
  return NextResponse.json({
    success: true,
    tempPassword,
    emailSent,
    message: 'Temporary password set successfully',
  })
}
