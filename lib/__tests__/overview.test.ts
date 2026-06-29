/**
 * Unit tests for overview analytics — getSchoolOverview, getPlatformOverview
 *
 * Tests the school-level and platform-wide statistics functions.
 *
 * **Validates: Requirements 9.3, 9.5**
 */
import { describe, it, expect, vi } from 'vitest'
import { getSchoolOverview, getPlatformOverview } from '../analytics/overview'

// ─── Mock Prisma helpers ──────────────────────────────────────────────────────

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    school: {
      findUniqueOrThrow: vi.fn(),
    },
    inventoryBalance: {
      findMany: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
    donationDrive: {
      findMany: vi.fn(),
    },
    ...overrides,
  } as unknown as Parameters<typeof getSchoolOverview>[0]
}

// ─── getSchoolOverview tests ──────────────────────────────────────────────────

describe('getSchoolOverview', () => {
  it('returns totals grouped by status and storage location', async () => {
    const mockPrisma = createMockPrisma()

    ;(mockPrisma.school.findUniqueOrThrow as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      schoolName: 'Test School',
    })

    ;(mockPrisma.inventoryBalance.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { itemStatus: 'ForSale', storedAt: 'School', quantity: 10 },
      { itemStatus: 'ForSale', storedAt: 'TCC', quantity: 5 },
      { itemStatus: 'ForRepurpose', storedAt: 'TCC', quantity: 3 },
      { itemStatus: 'GeneralOffice', storedAt: 'School', quantity: 2 },
    ])

    const result = await getSchoolOverview(mockPrisma, 1)

    expect(result.schoolId).toBe(1)
    expect(result.schoolName).toBe('Test School')
    expect(result.totalItems).toBe(20)
    expect(result.byStatus).toEqual({
      ForSale: 15,
      ForRepurpose: 3,
      GeneralOffice: 2,
    })
    expect(result.byStorageLocation).toEqual({
      School: 12,
      TCC: 8,
    })
  })

  it('returns zero totals when no inventory exists', async () => {
    const mockPrisma = createMockPrisma()

    ;(mockPrisma.school.findUniqueOrThrow as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 2,
      schoolName: 'Empty School',
    })

    ;(mockPrisma.inventoryBalance.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

    const result = await getSchoolOverview(mockPrisma, 2)

    expect(result.schoolId).toBe(2)
    expect(result.schoolName).toBe('Empty School')
    expect(result.totalItems).toBe(0)
    expect(result.byStatus).toEqual({})
    expect(result.byStorageLocation).toEqual({})
  })
})

// ─── getPlatformOverview tests ────────────────────────────────────────────────

describe('getPlatformOverview', () => {
  it('aggregates platform-wide statistics from all queries', async () => {
    const mockPrisma = createMockPrisma()

    // Mock inventoryBalance.findMany — called multiple times for bySchool, byCategory, and byColour
    ;(mockPrisma.inventoryBalance.findMany as ReturnType<typeof vi.fn>).mockImplementation(
      (args: { where?: { itemStatus?: string } }) => {
        if (args?.where?.itemStatus === 'ForRepurpose') {
          // repurpose by colour query
          return Promise.resolve([
            {
              quantity: 7,
              itemType: { primaryColour: { colourName: 'Red', hexcode: '#FF0000' } },
            },
            {
              quantity: 3,
              itemType: { primaryColour: { colourName: 'Blue', hexcode: '#0000FF' } },
            },
          ])
        }
        // bySchool or byCategory queries (same data for both)
        return Promise.resolve([
          {
            quantity: 10,
            itemType: {
              school: { id: 1, schoolName: 'School A' },
              category: { id: 1, categoryName: 'Shirts', weightKg: 0.2 },
            },
          },
          {
            quantity: 5,
            itemType: {
              school: { id: 2, schoolName: 'School B' },
              category: { id: 2, categoryName: 'Pants', weightKg: 0.3 },
            },
          },
        ])
      }
    )

    // Mock transaction.findMany for yearly trends
    ;(mockPrisma.transaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { transactionType: 'DonationIn', quantity: 20, transactionDate: new Date('2024-03-01') },
      { transactionType: 'Disposal', quantity: 5, transactionDate: new Date('2024-06-01') },
    ])

    // Mock donationDrive.findMany for drive participation
    ;(mockPrisma.donationDrive.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 1,
        driveName: 'Spring Drive',
        transactions: [{ quantity: 15 }, { quantity: 8 }],
      },
      {
        id: 2,
        driveName: 'Fall Drive',
        transactions: [{ quantity: 12 }],
      },
    ])

    const result = await getPlatformOverview(mockPrisma)

    // Total items from bySchool aggregation (10 + 5 = 15)
    expect(result.totalItems).toBe(15)
    expect(result.totalEstimatedWeightKg).toBeGreaterThan(0)

    // bySchool
    expect(result.bySchool).toHaveLength(2)
    expect(result.bySchool[0].count).toBeGreaterThanOrEqual(result.bySchool[1].count) // sorted desc

    // byCategory
    expect(result.byCategory).toHaveLength(2)
    expect(result.byCategory[0].weightKg).toBeGreaterThan(0)

    // yearlyTrends
    expect(result.yearlyTrends.length).toBeGreaterThan(0)
    const year2024 = result.yearlyTrends.find((y) => y.year === 2024)
    expect(year2024?.donationsIn).toBe(20)
    expect(year2024?.disposed).toBe(5)

    // driveParticipation
    expect(result.driveParticipation).toHaveLength(2)
    expect(result.driveParticipation[0].driveName).toBe('Spring Drive')
    expect(result.driveParticipation[0].totalDonations).toBe(23)
    expect(result.driveParticipation[1].driveName).toBe('Fall Drive')
    expect(result.driveParticipation[1].totalDonations).toBe(12)

    // repurposeMaterialByColour
    expect(result.repurposeMaterialByColour).toHaveLength(2)
    expect(result.repurposeMaterialByColour[0].colourName).toBe('Red')
    expect(result.repurposeMaterialByColour[0].count).toBe(7)
  })

  it('returns empty arrays when no data exists', async () => {
    const mockPrisma = createMockPrisma()

    ;(mockPrisma.inventoryBalance.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(mockPrisma.transaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(mockPrisma.donationDrive.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

    const result = await getPlatformOverview(mockPrisma)

    expect(result.totalItems).toBe(0)
    expect(result.totalEstimatedWeightKg).toBe(0)
    expect(result.bySchool).toEqual([])
    expect(result.byCategory).toEqual([])
    expect(result.yearlyTrends.length).toBeGreaterThan(0) // Always returns year range
    expect(result.driveParticipation).toEqual([])
    expect(result.repurposeMaterialByColour).toEqual([])
  })
})
