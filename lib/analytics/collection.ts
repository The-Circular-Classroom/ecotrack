/**
 * Collection analytics — queries for donation volumes aggregated by school,
 * category, and donation drive, with filtering by year and month range.
 *
 * Migrated from tcc-analytics-backend/controllers/collectionController.js
 * (getDonationBreakdown, getDonationDriveVolume patterns).
 */

import { PrismaClient } from '@/lib/prisma/generated/client/client'

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface CollectionFilter {
  year: number
  startMonth?: number // 1-12
  endMonth?: number   // 1-12
  schoolId?: number
}

export interface FilterValidationError {
  field: string
  message: string
}

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface CategoryBreakdown {
  categoryId: number
  categoryName: string
  totalQuantity: number
  totalEstimatedWeightKg: number
}

export interface DriveBreakdown {
  driveId: number
  driveName: string
  totalQuantity: number
}

export interface SchoolAnalytics {
  schoolId: number
  schoolName: string
  totalQuantity: number
  totalEstimatedWeightKg: number
  categories: CategoryBreakdown[]
  drives: DriveBreakdown[]
}

export interface CollectionAnalyticsResult {
  filters: {
    year: number
    startMonth?: number
    endMonth?: number
    schoolId?: number
  }
  schools: SchoolAnalytics[]
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates collection filter parameters.
 * Pure function — no side effects, suitable for property testing.
 *
 * Rules:
 * - year must be a positive integer
 * - startMonth and endMonth, if provided, must be integers in [1, 12]
 * - startMonth must not be greater than endMonth
 *
 * @returns null if valid, or a FilterValidationError describing the issue
 */
export function validateCollectionFilter(filter: CollectionFilter): FilterValidationError | null {
  // Validate year: must be a positive integer
  if (!Number.isInteger(filter.year) || filter.year < 1) {
    return {
      field: 'year',
      message: 'year must be a positive integer',
    }
  }

  // Validate startMonth if provided
  if (filter.startMonth !== undefined) {
    if (!Number.isInteger(filter.startMonth) || filter.startMonth < 1 || filter.startMonth > 12) {
      return {
        field: 'startMonth',
        message: 'startMonth must be an integer between 1 and 12',
      }
    }
  }

  // Validate endMonth if provided
  if (filter.endMonth !== undefined) {
    if (!Number.isInteger(filter.endMonth) || filter.endMonth < 1 || filter.endMonth > 12) {
      return {
        field: 'endMonth',
        message: 'endMonth must be an integer between 1 and 12',
      }
    }
  }

  // Validate startMonth <= endMonth when both are provided
  if (
    filter.startMonth !== undefined &&
    filter.endMonth !== undefined &&
    filter.startMonth > filter.endMonth
  ) {
    return {
      field: 'startMonth',
      message: 'startMonth must be less than or equal to endMonth',
    }
  }

  return null
}

// ─── Date Range Helpers ───────────────────────────────────────────────────────

/**
 * Computes a UTC date range for a given year and optional month constraints.
 * Months are 1-indexed (January = 1, December = 12).
 */
export function getMonthConstrainedRange(
  year: number,
  startMonth?: number,
  endMonth?: number
): { start: Date; end: Date } {
  const safeStartMonth = startMonth ?? 1
  const safeEndMonth = endMonth ?? 12

  return {
    start: new Date(Date.UTC(year, safeStartMonth - 1, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, safeEndMonth, 1, 0, 0, 0, 0)),
  }
}

// ─── Analytics Query ──────────────────────────────────────────────────────────

/**
 * Fetches collection analytics: donations received per school, per category,
 * and per donation drive, filtered by year and optional month range.
 *
 * @param prisma - Prisma client instance
 * @param filter - Validated collection filter (call validateCollectionFilter first)
 * @returns Structured analytics result with school-level breakdowns
 */
export async function getCollectionAnalytics(
  prisma: PrismaClient,
  filter: CollectionFilter
): Promise<CollectionAnalyticsResult> {
  const { start, end } = getMonthConstrainedRange(filter.year, filter.startMonth, filter.endMonth)

  // Build the where clause for donation transactions within the date range
  const where: Record<string, unknown> = {
    transactionType: 'DonationIn',
    transactionDate: {
      gte: start,
      lt: end,
    },
  }

  // Filter by school if provided
  if (filter.schoolId) {
    where.itemType = { is: { schoolId: filter.schoolId } }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    select: {
      quantity: true,
      donationDrive: {
        select: {
          id: true,
          driveName: true,
        },
      },
      itemType: {
        select: {
          school: {
            select: {
              id: true,
              schoolName: true,
            },
          },
          category: {
            select: {
              id: true,
              categoryName: true,
              weightKg: true,
            },
          },
        },
      },
    },
    orderBy: { transactionDate: 'asc' },
  })

  // Aggregate donations per school, per category, per donation drive
  const schoolMap: Record<number, {
    schoolId: number
    schoolName: string
    totalQuantity: number
    totalEstimatedWeightKg: number
    categories: Record<number, CategoryBreakdown>
    drives: Record<number, DriveBreakdown>
  }> = {}

  for (const tx of transactions) {
    const school = tx.itemType?.school
    const category = tx.itemType?.category
    if (!school || !category) continue

    const qty = tx.quantity ?? 0
    const weightKg = Number(category.weightKg) * qty

    // Initialize school entry if not exists
    if (!schoolMap[school.id]) {
      schoolMap[school.id] = {
        schoolId: school.id,
        schoolName: school.schoolName,
        totalQuantity: 0,
        totalEstimatedWeightKg: 0,
        categories: {},
        drives: {},
      }
    }

    const schoolEntry = schoolMap[school.id]
    schoolEntry.totalQuantity += qty
    schoolEntry.totalEstimatedWeightKg += weightKg

    // Aggregate by category
    if (!schoolEntry.categories[category.id]) {
      schoolEntry.categories[category.id] = {
        categoryId: category.id,
        categoryName: category.categoryName,
        totalQuantity: 0,
        totalEstimatedWeightKg: 0,
      }
    }
    schoolEntry.categories[category.id].totalQuantity += qty
    schoolEntry.categories[category.id].totalEstimatedWeightKg += weightKg

    // Aggregate by donation drive (if transaction has one)
    if (tx.donationDrive) {
      const drive = tx.donationDrive
      if (!schoolEntry.drives[drive.id]) {
        schoolEntry.drives[drive.id] = {
          driveId: drive.id,
          driveName: drive.driveName,
          totalQuantity: 0,
        }
      }
      schoolEntry.drives[drive.id].totalQuantity += qty
    }
  }

  // Convert maps to sorted arrays
  const schools: SchoolAnalytics[] = Object.values(schoolMap)
    .map((school) => ({
      schoolId: school.schoolId,
      schoolName: school.schoolName,
      totalQuantity: school.totalQuantity,
      totalEstimatedWeightKg: Number(school.totalEstimatedWeightKg.toFixed(3)),
      categories: Object.values(school.categories)
        .map((cat) => ({
          ...cat,
          totalEstimatedWeightKg: Number(cat.totalEstimatedWeightKg.toFixed(3)),
        }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity),
      drives: Object.values(school.drives)
        .sort((a, b) => b.totalQuantity - a.totalQuantity),
    }))
    .sort((a, b) => a.schoolName.localeCompare(b.schoolName))

  return {
    filters: {
      year: filter.year,
      startMonth: filter.startMonth,
      endMonth: filter.endMonth,
      schoolId: filter.schoolId,
    },
    schools,
  }
}
