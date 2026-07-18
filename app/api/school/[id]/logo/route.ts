import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { resolveSchoolLogoUrl } from '@/lib/school/logo'

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

    const targetUrl = resolveSchoolLogoUrl(school?.logoUrl, schoolId)
    return NextResponse.redirect(new URL(targetUrl, request.url))
  } catch (error) {
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to fetch logo' },
      { status: 500 }
    )
  }
}
