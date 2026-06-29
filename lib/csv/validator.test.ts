import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateDonationCsv,
  isForbiddenCombination,
  getMissingFields,
  REQUIRED_FIELDS,
  MAX_ERRORS,
  type ValidationResult,
} from './validator'
import type { ParsedRow } from './parser'

// Helper to create a valid row with all required fields
function createValidRow(overrides: Partial<ParsedRow> = {}): ParsedRow {
  return {
    item_type_id: '1',
    size_name: 'M',
    user_id: '10',
    school_id: '5',
    donation_drive_id: '3',
    to_stored_at: 'tcc',
    quantity: '2',
    to_status: 'for_sale',
    ...overrides,
  }
}

// Create a mock PrismaClient
function createMockPrisma() {
  const now = new Date()
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 10, isActive: true }),
    },
    school: {
      findUnique: vi.fn().mockResolvedValue({ id: 5, isCooperating: true }),
    },
    donationDrive: {
      findUnique: vi.fn().mockResolvedValue({
        id: 3,
        startDate,
        endDate,
        schoolId: 5,
      }),
    },
    itemType: {
      findUnique: vi.fn().mockResolvedValue({ id: 1, sizeCategoryId: 1 }),
    },
    sizeOption: {
      findFirst: vi.fn().mockResolvedValue({ id: 1 }),
    },
  } as any
}

describe('isForbiddenCombination', () => {
  it('returns true for school + for_repurposing', () => {
    expect(isForbiddenCombination('school', 'for_repurposing')).toBe(true)
  })

  it('returns true case-insensitively', () => {
    expect(isForbiddenCombination('School', 'For_Repurposing')).toBe(true)
    expect(isForbiddenCombination('SCHOOL', 'FOR_REPURPOSING')).toBe(true)
  })

  it('returns false for school + other status', () => {
    expect(isForbiddenCombination('school', 'for_sale')).toBe(false)
  })

  it('returns false for non-school + for_repurposing', () => {
    expect(isForbiddenCombination('tcc', 'for_repurposing')).toBe(false)
  })

  it('returns false for unrelated values', () => {
    expect(isForbiddenCombination('warehouse', 'sold')).toBe(false)
  })
})

describe('getMissingFields', () => {
  it('returns empty array when all required fields are present', () => {
    const row = createValidRow()
    expect(getMissingFields(row)).toEqual([])
  })

  it('returns missing field names for empty values', () => {
    const row = createValidRow({ item_type_id: '', size_name: '' })
    expect(getMissingFields(row)).toEqual(['item_type_id', 'size_name'])
  })

  it('returns missing field names for whitespace-only values', () => {
    const row = createValidRow({ user_id: '   ', school_id: '\t' })
    expect(getMissingFields(row)).toEqual(['user_id', 'school_id'])
  })

  it('returns all fields when row is empty', () => {
    const row = {} as Record<string, string>
    expect(getMissingFields(row)).toEqual([...REQUIRED_FIELDS])
  })
})

describe('validateDonationCsv', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('returns valid result when all rows pass validation', async () => {
    const rows = [createValidRow()]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.validRows).toBe(1)
    expect(result.invalidRows).toBe(0)
  })

  it('reports errors for missing required fields', async () => {
    const rows = [createValidRow({ item_type_id: '', size_name: '' })]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
    expect(result.errors[0].field).toBe('item_type_id')
    expect(result.errors[1].field).toBe('size_name')
    expect(result.invalidRows).toBe(1)
    expect(result.validRows).toBe(0)
  })

  it('reports error for inactive user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 10, isActive: false })
    const rows = [createValidRow()]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].field).toBe('user_id')
    expect(result.errors[0].message).toContain('not active')
  })

  it('reports error for non-existent user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    const rows = [createValidRow()]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toBe('user_id')
    expect(result.errors[0].message).toContain('does not exist')
  })

  it('reports error for non-cooperating school', async () => {
    mockPrisma.school.findUnique.mockResolvedValue({ id: 5, isCooperating: false })
    const rows = [createValidRow()]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e: any) => e.field === 'school_id' && e.message.includes('not cooperating'))).toBe(true)
  })

  it('reports error for non-existent school', async () => {
    mockPrisma.school.findUnique.mockResolvedValue(null)
    const rows = [createValidRow()]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e: any) => e.field === 'school_id' && e.message.includes('does not exist'))).toBe(true)
  })

  it('reports error for inactive donation drive', async () => {
    const pastEnd = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const pastStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
    mockPrisma.donationDrive.findUnique.mockResolvedValue({
      id: 3,
      startDate: pastStart,
      endDate: pastEnd,
      schoolId: 5,
    })
    const rows = [createValidRow()]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e: any) => e.field === 'donation_drive_id' && e.message.includes('not active'))).toBe(true)
    expect(result.errors.some((e: any) => e.message.includes('Valid date range'))).toBe(true)
  })

  it('reports error when drive does not belong to school', async () => {
    const now = new Date()
    mockPrisma.donationDrive.findUnique.mockResolvedValue({
      id: 3,
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      schoolId: 99, // different from school_id in row (5)
    })
    const rows = [createValidRow()]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e: any) => e.field === 'donation_drive_id' && e.message.includes('does not belong'))).toBe(true)
  })

  it('reports error for non-existent item type', async () => {
    mockPrisma.itemType.findUnique.mockResolvedValue(null)
    const rows = [createValidRow()]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e: any) => e.field === 'item_type_id' && e.message.includes('does not exist'))).toBe(true)
  })

  it('reports error when size option does not exist for item type', async () => {
    mockPrisma.sizeOption.findFirst.mockResolvedValue(null)
    const rows = [createValidRow()]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e: any) => e.field === 'size_name' && e.message.includes('does not exist'))).toBe(true)
  })

  it('rejects forbidden combination school + for_repurposing', async () => {
    const rows = [createValidRow({ to_stored_at: 'school', to_status: 'for_repurposing' })]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e: any) => e.message.includes('not permitted'))).toBe(true)
  })

  it('caps errors at MAX_ERRORS (50)', async () => {
    // Create many rows with missing fields to generate lots of errors
    const rows: ParsedRow[] = Array.from({ length: 100 }, () =>
      createValidRow({ item_type_id: '', size_name: '', user_id: '', school_id: '' })
    )
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeLessThanOrEqual(MAX_ERRORS)
    expect(result.errors.length).toBe(MAX_ERRORS)
    // All rows are still invalid even if not all errors are reported
    expect(result.invalidRows).toBe(100)
  })

  it('validates multiple rows and counts valid/invalid correctly', async () => {
    const rows = [
      createValidRow(), // valid
      createValidRow({ item_type_id: '' }), // invalid - missing field
      createValidRow(), // valid
    ]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(false)
    expect(result.validRows).toBe(2)
    expect(result.invalidRows).toBe(1)
    expect(result.errors).toHaveLength(1)
  })

  it('reports error for invalid numeric user_id', async () => {
    const rows = [createValidRow({ user_id: 'abc' })]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toBe('user_id')
    expect(result.errors[0].message).toContain('Invalid user_id')
  })

  it('reports row numbers starting at 1', async () => {
    const rows = [
      createValidRow(), // row 1 - valid
      createValidRow({ item_type_id: '' }), // row 2 - invalid
    ]
    const result = await validateDonationCsv(rows, mockPrisma)

    expect(result.errors[0].row).toBe(2)
  })
})
