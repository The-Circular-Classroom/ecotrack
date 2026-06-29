import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import {
  validateCollectionFilter,
  getCollectionAnalytics,
  type CollectionFilter,
} from '@/lib/analytics/collection'

/**
 * GET /api/analytics/collection - Collection analytics endpoint.
 * Returns donations received per school, per category, and per donation drive,
 * filterable by year and optional month range.
 *
 * Query params: year (required), startMonth, endMonth, schoolId
 * SchoolStaff+ role required.
 * Requirements: 9.1, 9.6
 */
export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)

  // Parse query parameters
  const yearParam = searchParams.get('year')
  const startMonthParam = searchParams.get('startMonth')
  const endMonthParam = searchParams.get('endMonth')
  const schoolIdParam = searchParams.get('schoolId')

  if (!yearParam) {
    return NextResponse.json(
      { error: 'validation_error', message: 'year query parameter is required' },
      { status: 400 }
    )
  }

  const filter: CollectionFilter = {
    year: parseInt(yearParam, 10),
    startMonth: startMonthParam ? parseInt(startMonthParam, 10) : undefined,
    endMonth: endMonthParam ? parseInt(endMonthParam, 10) : undefined,
    schoolId: schoolIdParam ? parseInt(schoolIdParam, 10) : undefined,
  }

  // Validate filter parameters
  const validationError = validateCollectionFilter(filter)
  if (validationError) {
    return NextResponse.json(
      {
        error: 'validation_error',
        message: validationError.message,
        details: { field: validationError.field },
      },
      { status: 400 }
    )
  }

  const result = await getCollectionAnalytics(prisma, filter)
  return NextResponse.json(result)
}
