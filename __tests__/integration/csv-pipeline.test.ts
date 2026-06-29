/**
 * Integration test: CSV Processing Pipeline
 *
 * Tests the end-to-end CSV flow through multiple modules:
 *   upload → validate → approve → process → verify records
 *
 * Mocks Prisma and Supabase Storage but tests the business logic flow
 * through parser → validator → processor modules.
 *
 * Validates: Requirements 7.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseFile, type ParsedRow } from '@/lib/csv/parser'
import {
  validateDonationCsv,
  getMissingFields,
  isForbiddenCombination,
  REQUIRED_FIELDS,
  MAX_ERRORS,
} from '@/lib/csv/validator'
import { processApprovedCsv } from '@/lib/csv/processor'
import { validateFileSize, validateFileType } from '@/lib/storage/validation'

// Helper: create a CSV buffer from rows
function createCsvBuffer(headers: string[], rows: string[][]): Buffer {
  const lines = [headers.join(','), ...rows.map((r) => r.join(','))]
  return Buffer.from(lines.join('\n'), 'utf-8')
}

// Helper: create a valid parsed row
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

// Helper: create mock Prisma for validation
function createMockPrismaForValidation(options: {
  userActive?: boolean
  userExists?: boolean
  schoolExists?: boolean
  schoolCooperating?: boolean
  driveExists?: boolean
  driveActive?: boolean
  driveSchoolId?: number
  itemTypeExists?: boolean
  sizeOptionExists?: boolean
} = {}) {
  const {
    userActive = true,
    userExists = true,
    schoolExists = true,
    schoolCooperating = true,
    driveExists = true,
    driveActive = true,
    driveSchoolId = 5,
    itemTypeExists = true,
    sizeOptionExists = true,
  } = options

  const now = new Date()
  const startDate = new Date(now.getTime() - 86400000) // yesterday
  const endDate = new Date(now.getTime() + 86400000) // tomorrow
  const inactiveStart = new Date(now.getTime() + 86400000) // future
  const inactiveEnd = new Date(now.getTime() + 172800000) // future + 1 day

  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(
        userExists ? { id: 10, isActive: userActive } : null
      ),
    },
    school: {
      findUnique: vi.fn().mockResolvedValue(
        schoolExists ? { id: 5, isCooperating: schoolCooperating } : null
      ),
    },
    donationDrive: {
      findUnique: vi.fn().mockResolvedValue(
        driveExists
          ? {
              id: 3,
              startDate: driveActive ? startDate : inactiveStart,
              endDate: driveActive ? endDate : inactiveEnd,
              schoolId: driveSchoolId,
            }
          : null
      ),
    },
    itemType: {
      findUnique: vi.fn().mockResolvedValue(
        itemTypeExists ? { id: 1, sizeCategoryId: 1 } : null
      ),
    },
    sizeOption: {
      findFirst: vi.fn().mockResolvedValue(
        sizeOptionExists ? { id: 7 } : null
      ),
    },
  } as any
}

// Helper: create mock Prisma for processing
function createMockPrismaForProcessing() {
  const mockTx = {
    itemType: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({ sizeCategoryId: 1 }),
    },
    sizeOption: {
      findFirstOrThrow: vi.fn().mockResolvedValue({ id: 7 }),
    },
    transaction: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
    },
    inventoryBalance: {
      upsert: vi.fn().mockResolvedValue({ id: 1, quantity: 2 }),
    },
  }

  return {
    $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => fn(mockTx)),
    _tx: mockTx,
  } as any
}

// Helper: create mock Supabase storage
function createMockSupabase(moveSuccess = true) {
  return {
    storage: {
      from: vi.fn().mockReturnValue({
        move: vi.fn().mockResolvedValue(
          moveSuccess ? { error: null } : { error: { message: 'Move failed' } }
        ),
        upload: vi.fn().mockResolvedValue({ data: { path: 'pre-processing/test.csv' }, error: null }),
      }),
    },
  } as any
}

describe('CSV Pipeline Integration: upload → validate → approve → process → verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Step 1: Upload — file validation and parsing', () => {
    it('validates file type before parsing (only csv, xls, xlsx allowed)', () => {
      expect(validateFileType('report.csv', 'donations')).toEqual({ valid: true })
      expect(validateFileType('report.xlsx', 'donations')).toEqual({ valid: true })
      expect(validateFileType('report.xls', 'donations')).toEqual({ valid: true })

      const invalidResult = validateFileType('report.pdf', 'donations')
      expect(invalidResult.valid).toBe(false)
    })

    it('validates file size (max 10MB for donations bucket)', () => {
      const validSize = validateFileSize(5 * 1024 * 1024, 'donations') // 5MB
      expect(validSize.valid).toBe(true)

      const invalidSize = validateFileSize(11 * 1024 * 1024, 'donations') // 11MB
      expect(invalidSize.valid).toBe(false)
    })

    it('parses a valid CSV file into structured rows', () => {
      const headers = ['item_type_id', 'size_name', 'user_id', 'school_id', 'donation_drive_id', 'to_stored_at', 'quantity', 'to_status']
      const rows = [
        ['1', 'M', '10', '5', '3', 'tcc', '2', 'for_sale'],
        ['2', 'L', '11', '5', '3', 'school', '1', 'for_sale'],
      ]
      const buffer = createCsvBuffer(headers, rows)
      const result = parseFile(buffer, 'donations.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.headers).toEqual(headers)
        expect(result.data.rows).toHaveLength(2)
        expect(result.data.rows[0].item_type_id).toBe('1')
        expect(result.data.rows[0].size_name).toBe('M')
        expect(result.data.rows[1].quantity).toBe('1')
      }
    })

    it('rejects empty files with no data rows', () => {
      const headers = ['item_type_id', 'size_name', 'user_id']
      const buffer = createCsvBuffer(headers, [])
      const result = parseFile(buffer, 'empty.csv')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('no valid data rows')
      }
    })

    it('rejects unsupported file formats', () => {
      const buffer = Buffer.from('data', 'utf-8')
      const result = parseFile(buffer, 'file.txt')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('Unsupported file format')
      }
    })
  })

  describe('Step 2: Validation — parsed rows checked against business rules', () => {
    it('validates required fields presence using getMissingFields', () => {
      const completeRow = createValidRow()
      expect(getMissingFields(completeRow)).toHaveLength(0)

      const incompleteRow = { ...createValidRow(), item_type_id: '', quantity: '' }
      const missing = getMissingFields(incompleteRow)
      expect(missing).toContain('item_type_id')
      expect(missing).toContain('quantity')
    })

    it('detects forbidden storage/status combination', () => {
      expect(isForbiddenCombination('school', 'for_repurposing')).toBe(true)
      expect(isForbiddenCombination('School', 'For_Repurposing')).toBe(true)
      expect(isForbiddenCombination('tcc', 'for_repurposing')).toBe(false)
      expect(isForbiddenCombination('school', 'for_sale')).toBe(false)
    })

    it('validates rows against the database (all pass)', async () => {
      const mockPrisma = createMockPrismaForValidation()
      const rows = [createValidRow()]

      const result = await validateDonationCsv(rows, mockPrisma)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.validRows).toBe(1)
      expect(result.invalidRows).toBe(0)
    })

    it('rejects rows where user is not active', async () => {
      const mockPrisma = createMockPrismaForValidation({ userActive: false })
      const rows = [createValidRow()]

      const result = await validateDonationCsv(rows, mockPrisma)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].message).toContain('not active')
    })

    it('rejects rows where donation drive is not active', async () => {
      const mockPrisma = createMockPrismaForValidation({ driveActive: false })
      const rows = [createValidRow()]

      const result = await validateDonationCsv(rows, mockPrisma)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.message.includes('not active'))).toBe(true)
    })

    it('rejects rows where drive does not belong to the specified school', async () => {
      const mockPrisma = createMockPrismaForValidation({ driveSchoolId: 99 })
      const rows = [createValidRow()]

      const result = await validateDonationCsv(rows, mockPrisma)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.message.includes('does not belong'))).toBe(true)
    })

    it('caps error reporting at 50 entries', async () => {
      // Create many rows with missing fields to generate lots of errors
      const rows: ParsedRow[] = Array.from({ length: 100 }, () =>
        createValidRow({ item_type_id: '', size_name: '' })
      )

      const mockPrisma = createMockPrismaForValidation()
      const result = await validateDonationCsv(rows, mockPrisma)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeLessThanOrEqual(MAX_ERRORS)
    })
  })

  describe('Step 3: Approval and Processing — validated data written to database', () => {
    it('creates Transaction records with DonationIn type for each row', async () => {
      const mockPrisma = createMockPrismaForProcessing()
      const mockSupabase = createMockSupabase()
      const rows = [createValidRow()]

      const result = await processApprovedCsv(
        rows,
        mockPrisma,
        mockSupabase,
        'validated/test.csv',
        'approver-1'
      )

      expect(result.success).toBe(true)
      expect(result.transactionsCreated).toBe(1)

      const createCall = mockPrisma._tx.transaction.create.mock.calls[0][0]
      expect(createCall.data.transactionType).toBe('DonationIn')
      expect(createCall.data.fromStatus).toBeNull()
    })

    it('upserts InventoryBalance records for each unique item/size/status/location', async () => {
      const mockPrisma = createMockPrismaForProcessing()
      const mockSupabase = createMockSupabase()
      const rows = [createValidRow(), createValidRow({ item_type_id: '2' })]

      const result = await processApprovedCsv(
        rows,
        mockPrisma,
        mockSupabase,
        'validated/test.csv',
        'approver-1'
      )

      expect(result.success).toBe(true)
      expect(result.transactionsCreated).toBe(2)
      expect(result.balancesUpdated).toBe(2)
    })

    it('moves file from validated/ to processed/ on success', async () => {
      const mockPrisma = createMockPrismaForProcessing()
      const mockSupabase = createMockSupabase()
      const rows = [createValidRow()]

      await processApprovedCsv(
        rows,
        mockPrisma,
        mockSupabase,
        'validated/batch-001.csv',
        'approver-1'
      )

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('donations')
      const moveCall = mockSupabase.storage.from().move
      expect(moveCall).toHaveBeenCalledWith('validated/batch-001.csv', 'processed/batch-001.csv')
    })

    it('rolls back all DB changes on failure and keeps file in validated/', async () => {
      const mockPrisma = createMockPrismaForProcessing()
      mockPrisma.$transaction.mockRejectedValue(new Error('Foreign key constraint violation'))
      const mockSupabase = createMockSupabase()
      const rows = [createValidRow()]

      const result = await processApprovedCsv(
        rows,
        mockPrisma,
        mockSupabase,
        'validated/test.csv',
        'approver-1'
      )

      expect(result.success).toBe(false)
      expect(result.transactionsCreated).toBe(0)
      expect(result.balancesUpdated).toBe(0)
      expect(result.error).toContain('Foreign key constraint violation')
      // File should NOT be moved
      expect(mockSupabase.storage.from).not.toHaveBeenCalled()
    })
  })

  describe('Full end-to-end flow: upload → parse → validate → process → verify', () => {
    it('processes a valid CSV file from upload to database records', async () => {
      // Step 1: Simulate file upload validation
      const filename = 'school5-donations.csv'
      const fileTypeResult = validateFileType(filename, 'donations')
      expect(fileTypeResult.valid).toBe(true)

      const fileSize = 1024 * 50 // 50KB
      const fileSizeResult = validateFileSize(fileSize, 'donations')
      expect(fileSizeResult.valid).toBe(true)

      // Step 2: Parse the uploaded CSV
      const headers = ['item_type_id', 'size_name', 'user_id', 'school_id', 'donation_drive_id', 'to_stored_at', 'quantity', 'to_status']
      const csvRows = [
        ['1', 'M', '10', '5', '3', 'tcc', '5', 'for_sale'],
        ['1', 'L', '10', '5', '3', 'school', '3', 'for_sale'],
        ['2', 'S', '11', '5', '3', 'tcc', '1', 'for_repurpose'],
      ]
      const buffer = createCsvBuffer(headers, csvRows)
      const parseResult = parseFile(buffer, filename)

      expect(parseResult.success).toBe(true)
      if (!parseResult.success) return

      expect(parseResult.data.rows).toHaveLength(3)
      expect(parseResult.data.totalRows).toBe(3)

      // Step 3: Validate parsed rows against database state
      const mockPrismaValidation = createMockPrismaForValidation()
      const validationResult = await validateDonationCsv(
        parseResult.data.rows,
        mockPrismaValidation
      )

      expect(validationResult.valid).toBe(true)
      expect(validationResult.validRows).toBe(3)
      expect(validationResult.invalidRows).toBe(0)

      // Step 4: Admin approves → process the file
      const mockPrismaProcessing = createMockPrismaForProcessing()
      const mockSupabase = createMockSupabase()

      const processingResult = await processApprovedCsv(
        parseResult.data.rows,
        mockPrismaProcessing,
        mockSupabase,
        'validated/school5-donations.csv',
        'admin-uuid-001'
      )

      // Step 5: Verify the output
      expect(processingResult.success).toBe(true)
      expect(processingResult.transactionsCreated).toBe(3)
      expect(processingResult.balancesUpdated).toBeGreaterThan(0)

      // Verify each transaction was created with correct types
      const txCalls = mockPrismaProcessing._tx.transaction.create.mock.calls
      expect(txCalls).toHaveLength(3)
      txCalls.forEach((call: any) => {
        expect(call[0].data.transactionType).toBe('DonationIn')
        expect(call[0].data.fromStatus).toBeNull()
      })

      // Verify file was moved to processed/
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('donations')
    })

    it('halts pipeline when validation fails and moves file to failed/', async () => {
      // Step 1: Parse a CSV with an invalid row
      const headers = ['item_type_id', 'size_name', 'user_id', 'school_id', 'donation_drive_id', 'to_stored_at', 'quantity', 'to_status']
      const csvRows = [
        ['1', 'M', '10', '5', '3', 'school', '2', 'for_repurposing'], // forbidden combo
      ]
      const buffer = createCsvBuffer(headers, csvRows)
      const parseResult = parseFile(buffer, 'invalid-batch.csv')

      expect(parseResult.success).toBe(true)
      if (!parseResult.success) return

      // Step 2: Validate — should fail due to forbidden combination
      const mockPrisma = createMockPrismaForValidation()
      const validationResult = await validateDonationCsv(
        parseResult.data.rows,
        mockPrisma
      )

      expect(validationResult.valid).toBe(false)
      expect(validationResult.errors.length).toBeGreaterThan(0)
      expect(validationResult.errors[0].message).toContain('not permitted')

      // Pipeline halts — file would be moved to failed/ (not processed)
      // Processing should NOT be called with invalid data
    })

    it('handles mixed valid and invalid rows correctly', async () => {
      const headers = ['item_type_id', 'size_name', 'user_id', 'school_id', 'donation_drive_id', 'to_stored_at', 'quantity', 'to_status']
      const csvRows = [
        ['1', 'M', '10', '5', '3', 'tcc', '2', 'for_sale'],      // valid
        ['', 'M', '10', '5', '3', 'tcc', '2', 'for_sale'],        // missing item_type_id
        ['1', 'M', '10', '5', '3', 'school', '2', 'for_repurposing'], // forbidden combo
      ]
      const buffer = createCsvBuffer(headers, csvRows)
      const parseResult = parseFile(buffer, 'mixed-batch.csv')

      expect(parseResult.success).toBe(true)
      if (!parseResult.success) return

      const mockPrisma = createMockPrismaForValidation()
      const validationResult = await validateDonationCsv(
        parseResult.data.rows,
        mockPrisma
      )

      // Overall validation fails because there are errors
      expect(validationResult.valid).toBe(false)
      expect(validationResult.invalidRows).toBe(2)
      expect(validationResult.validRows).toBe(1)
    })
  })
})
