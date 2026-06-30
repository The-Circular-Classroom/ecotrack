import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/users/me - Get current user profile with school association.
 * Extracts user from middleware x-user-id header.
 * Requirements: 2.8, 3.1
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Authentication required' },
      { status: 401 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: userId },
    include: {
      school: {
        select: { id: true, schoolName: true },
      },
    },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'not_found', message: 'User not found' },
      { status: 404 }
    )
  }

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
  })
}
