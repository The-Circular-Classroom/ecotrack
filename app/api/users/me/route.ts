import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createApiLogger } from '@/lib/logger'

/**
 * GET /api/users/me - Get current user profile with school association.
 * Extracts user from middleware x-user-id header.
 * Requirements: 2.8, 3.1
 */
export async function GET(request: NextRequest) {
  const logger = createApiLogger('GET /api/users/me');
  const userId = request.headers.get('x-user-id')
  logger.info('Request received', { userId });

  if (!userId) {
    logger.warn('Unauthorized: missing x-user-id header');
    return NextResponse.json(
      { error: 'unauthorized', message: 'Authentication required' },
      { status: 401 }
    )
  }

  logger.debug('Querying Prisma for user');
  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: userId },
    include: {
      school: {
        select: { id: true, schoolName: true },
      },
    },
  })

  if (!user) {
    logger.warn('User not found', { userId });
    return NextResponse.json(
      { error: 'not_found', message: 'User not found' },
      { status: 404 }
    )
  }

  logger.info('Response sent', { status: 200, userId });
  return NextResponse.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    role: user.role,
    school: user.school ? { id: user.school.id, name: user.school.schoolName } : null,
    phone: user.phoneNumber,
    isActive: user.isActive,
    mustChangePassword:
      request.headers.get('x-user-force-password-change') === 'true' ||
      (user.userFlags as any)?.must_change_password === true,
  })
}
