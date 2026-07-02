import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/school/[id]/logo - Serve the school logo or redirect to its storage path.
 * If no custom logo exists, falls back to the default green-stem logo.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const schoolId = parseInt(id, 10)
  
  if (isNaN(schoolId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'School ID must be a valid integer' },
      { status: 400 }
    )
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { logoUrl: true }
    })

    if (!school || !school.logoUrl) {
      // Redirect to the default placeholder logo in the public folder
      return NextResponse.redirect(new URL('/images/Logo-Symbol-green-stem.png', request.url))
    }

    // Redirect to the stored public URL of the logo
    return NextResponse.redirect(new URL(school.logoUrl))
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to fetch logo' },
      { status: 500 }
    )
  }
}
