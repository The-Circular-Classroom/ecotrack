import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import {
  getRepurposeProjections,
  calculateAssemblyPlan,
} from '@/lib/analytics/assembly'

/**
 * GET /api/analytics/assembly - Repurpose projections endpoint.
 * Returns how many products can be assembled from current ForRepurpose stock.
 *
 * Query params: schoolId (optional)
 * SchoolStaff+ role required.
 * Requirements: 9.2
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
  const schoolIdParam = searchParams.get('schoolId')
  const schoolId = schoolIdParam ? parseInt(schoolIdParam, 10) : undefined

  const projections = await getRepurposeProjections(prisma, schoolId)
  return NextResponse.json({ projections })
}

/**
 * POST /api/analytics/assembly - Assembly plan calculation endpoint.
 * Given target quantities per product style, calculates how many can actually
 * be produced based on available ForRepurpose stock.
 *
 * Body: { targetQuantities: Record<number, number> }
 * SchoolStaff+ role required.
 * Requirements: 9.2
 */
export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff access required' },
      { status: 403 }
    )
  }

  let body: { targetQuantities?: Record<string, number> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'validation_error', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  if (!body.targetQuantities || typeof body.targetQuantities !== 'object') {
    return NextResponse.json(
      {
        error: 'validation_error',
        message: 'targetQuantities is required and must be an object mapping product style IDs to quantities',
      },
      { status: 400 }
    )
  }

  // Convert string keys to number keys and validate values
  const targetQuantities: Record<number, number> = {}
  for (const [key, value] of Object.entries(body.targetQuantities)) {
    const id = parseInt(key, 10)
    if (isNaN(id) || id < 1) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: `Invalid product style ID: ${key}`,
        },
        { status: 400 }
      )
    }
    if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: `Target quantity for product style ${key} must be a non-negative integer`,
        },
        { status: 400 }
      )
    }
    targetQuantities[id] = value
  }

  const plan = await calculateAssemblyPlan(prisma, targetQuantities)
  return NextResponse.json(plan)
}
