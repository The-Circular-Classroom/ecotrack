/**
 * Overview analytics — platform-wide and school-level statistics.
 *
 * Migrated from tcc-analytics-backend/controllers/overviewController.js
 * (getNetworkKPITotals, getInventoryBySchool, getInventoryByCategory,
 * getYearlyTrend, getDriveParticipation, getRepurposingByColour patterns).
 *
 * School overview: total inventory, items by status, items by storage location.
 * Platform overview: total inventory with weight, distribution by school and
 * category, yearly trends, drive participation, repurposing material by colour.
 */

import { PrismaClient } from '@/lib/prisma/generated/client/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SchoolOverview {
  schoolId: number
  schoolName: string
  totalItems: number
  byStatus: Record<string, number>
  byStorageLocation: Record<string, number>
}

export interface PlatformOverview {
  totalItems: number
  totalEstimatedWeightKg: number
  bySchool: Array<{ schoolId: number; schoolName: string; count: number }>
  byCategory: Array<{ categoryId: number; categoryName: string; count: number; weightKg: number }>
  yearlyTrends: Array<{ year: number; donationsIn: number; disposed: number }>
  driveParticipation: Array<{ driveId: number; driveName: string; totalDonations: number }>
  repurposeMaterialByColour: Array<{ colourName: string; hexcode: string; count: number }>
}

// ─── School Overview ──────────────────────────────────────────────────────────

/**
 * Retrieves school-level overview statistics:
 * - Total inventory item count (sum of balances with quantity > 0)
 * - Item counts grouped by status
 * - Item counts grouped by storage location
 *
 * @param prisma - Prisma client instance
 * @param schoolId - The school to retrieve statistics for
 * @returns School overview with totals and breakdowns
 */
export async function getSchoolOverview(
  prisma: PrismaClient,
  schoolId: number
): Promise<SchoolOverview> {
  // Get the school name
  const school = await prisma.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { id: true, schoolName: true },
  })

  // Get inventory balances for items belonging to this school
  const balances = await prisma.inventoryBalance.findMany({
    where: {
      quantity: { gt: 0 },
      itemType: { schoolId },
    },
    select: {
      itemStatus: true,
      storedAt: true,
      quantity: true,
    },
  })

  let totalItems = 0
  const byStatus: Record<string, number> = {}
  const byStorageLocation: Record<string, number> = {}

  for (const balance of balances) {
    const qty = balance.quantity
    totalItems += qty

    // Group by status
    const status = balance.itemStatus
    byStatus[status] = (byStatus[status] ?? 0) + qty

    // Group by storage location
    const location = balance.storedAt
    byStorageLocation[location] = (byStorageLocation[location] ?? 0) + qty
  }

  return {
    schoolId: school.id,
    schoolName: school.schoolName,
    totalItems,
    byStatus,
    byStorageLocation,
  }
}

// ─── Platform Overview ────────────────────────────────────────────────────────

/**
 * Retrieves platform-wide overview statistics:
 * - Total inventory count with estimated weight
 * - Inventory distribution by school
 * - Inventory distribution by category (with weight)
 * - Yearly donation and disposal trends
 * - Donation drive participation rates
 * - Repurposing material availability by colour
 *
 * Queries InventoryBalance for current stock metrics and Transaction for trends.
 *
 * @param prisma - Prisma client instance
 * @returns Platform overview with all aggregate statistics
 */
export async function getPlatformOverview(
  prisma: PrismaClient
): Promise<PlatformOverview> {
  // Run independent queries in parallel for efficiency
  const [
    inventoryBySchool,
    inventoryByCategory,
    yearlyTrends,
    driveParticipation,
    repurposeByColour,
  ] = await Promise.all([
    getInventoryBySchool(prisma),
    getInventoryByCategory(prisma),
    getYearlyTrends(prisma),
    getDriveParticipation(prisma),
    getRepurposeMaterialByColour(prisma),
  ])

  // Calculate totals from the by-school breakdown
  const totalItems = inventoryBySchool.reduce((sum, s) => sum + s.count, 0)
  const totalEstimatedWeightKg = Number(
    inventoryByCategory.reduce((sum, c) => sum + c.weightKg, 0).toFixed(3)
  )

  return {
    totalItems,
    totalEstimatedWeightKg,
    bySchool: inventoryBySchool,
    byCategory: inventoryByCategory,
    yearlyTrends,
    driveParticipation,
    repurposeMaterialByColour: repurposeByColour,
  }
}

// ─── Internal Query Functions ─────────────────────────────────────────────────

/**
 * Aggregates current inventory by school using InventoryBalance records.
 */
async function getInventoryBySchool(
  prisma: PrismaClient
): Promise<Array<{ schoolId: number; schoolName: string; count: number }>> {
  const balances = await prisma.inventoryBalance.findMany({
    where: { quantity: { gt: 0 } },
    select: {
      quantity: true,
      itemType: {
        select: {
          school: {
            select: { id: true, schoolName: true },
          },
        },
      },
    },
  })

  const schoolMap: Record<number, { schoolId: number; schoolName: string; count: number }> = {}

  for (const balance of balances) {
    const school = balance.itemType?.school
    if (!school) continue

    if (!schoolMap[school.id]) {
      schoolMap[school.id] = {
        schoolId: school.id,
        schoolName: school.schoolName,
        count: 0,
      }
    }
    schoolMap[school.id].count += balance.quantity
  }

  return Object.values(schoolMap).sort((a, b) => b.count - a.count)
}

/**
 * Aggregates current inventory by category with weight estimates.
 */
async function getInventoryByCategory(
  prisma: PrismaClient
): Promise<Array<{ categoryId: number; categoryName: string; count: number; weightKg: number }>> {
  const balances = await prisma.inventoryBalance.findMany({
    where: { quantity: { gt: 0 } },
    select: {
      quantity: true,
      itemType: {
        select: {
          category: {
            select: { id: true, categoryName: true, weightKg: true },
          },
        },
      },
    },
  })

  const categoryMap: Record<number, { categoryId: number; categoryName: string; count: number; weightKg: number }> = {}

  for (const balance of balances) {
    const category = balance.itemType?.category
    if (!category) continue

    const qty = balance.quantity
    const weightKg = Number(category.weightKg) * qty

    if (!categoryMap[category.id]) {
      categoryMap[category.id] = {
        categoryId: category.id,
        categoryName: category.categoryName,
        count: 0,
        weightKg: 0,
      }
    }
    categoryMap[category.id].count += qty
    categoryMap[category.id].weightKg += weightKg
  }

  return Object.values(categoryMap)
    .map((c) => ({ ...c, weightKg: Number(c.weightKg.toFixed(3)) }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Calculates yearly trends for donations in and disposals using Transaction records.
 * Returns data for the last 5 years up to the current year.
 */
async function getYearlyTrends(
  prisma: PrismaClient
): Promise<Array<{ year: number; donationsIn: number; disposed: number }>> {
  const currentYear = new Date().getFullYear()
  const startYear = currentYear - 4 // Last 5 years including current

  const transactions = await prisma.transaction.findMany({
    where: {
      transactionDate: {
        gte: new Date(Date.UTC(startYear, 0, 1)),
      },
      transactionType: { in: ['DonationIn', 'Disposal'] },
    },
    select: {
      transactionType: true,
      quantity: true,
      transactionDate: true,
    },
  })

  // Initialize year map
  const yearMap: Record<number, { year: number; donationsIn: number; disposed: number }> = {}
  for (let y = startYear; y <= currentYear; y++) {
    yearMap[y] = { year: y, donationsIn: 0, disposed: 0 }
  }

  for (const tx of transactions) {
    const year = new Date(tx.transactionDate).getUTCFullYear()
    if (!yearMap[year]) continue

    const qty = tx.quantity ?? 0
    if (tx.transactionType === 'DonationIn') {
      yearMap[year].donationsIn += qty
    } else if (tx.transactionType === 'Disposal') {
      yearMap[year].disposed += qty
    }
  }

  return Object.values(yearMap).sort((a, b) => a.year - b.year)
}

/**
 * Gets donation drive participation: total donations per drive.
 */
async function getDriveParticipation(
  prisma: PrismaClient
): Promise<Array<{ driveId: number; driveName: string; totalDonations: number }>> {
  const drives = await prisma.donationDrive.findMany({
    select: {
      id: true,
      driveName: true,
      transactions: {
        where: { transactionType: 'DonationIn' },
        select: { quantity: true },
      },
    },
  })

  return drives
    .map((drive) => ({
      driveId: drive.id,
      driveName: drive.driveName,
      totalDonations: drive.transactions.reduce((sum, tx) => sum + (tx.quantity ?? 0), 0),
    }))
    .filter((d) => d.totalDonations > 0)
    .sort((a, b) => b.totalDonations - a.totalDonations)
}

/**
 * Gets repurposing material availability grouped by primary colour.
 * Only considers items with ForRepurpose status and quantity > 0.
 */
async function getRepurposeMaterialByColour(
  prisma: PrismaClient
): Promise<Array<{ colourName: string; hexcode: string; count: number }>> {
  const balances = await prisma.inventoryBalance.findMany({
    where: {
      itemStatus: 'ForRepurpose',
      quantity: { gt: 0 },
    },
    select: {
      quantity: true,
      itemType: {
        select: {
          primaryColour: {
            select: { colourName: true, hexcode: true },
          },
        },
      },
    },
  })

  const colourMap: Record<string, { colourName: string; hexcode: string; count: number }> = {}

  for (const balance of balances) {
    const colour = balance.itemType?.primaryColour
    if (!colour) continue

    const key = colour.hexcode

    if (!colourMap[key]) {
      colourMap[key] = {
        colourName: colour.colourName,
        hexcode: colour.hexcode,
        count: 0,
      }
    }
    colourMap[key].count += balance.quantity
  }

  return Object.values(colourMap).sort((a, b) => b.count - a.count)
}
