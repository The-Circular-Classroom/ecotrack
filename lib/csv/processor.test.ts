import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processApprovedCsv, type ProcessingResult } from './processor'
import type { ParsedRow } from './parser'

// Helper to create a valid parsed row
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

// Create a mock Prisma client with $transaction support
function createMockPrisma() {
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

  const prisma = {
    $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => {
      return fn(mockTx)
    }),
    _tx: mockTx,
  }

  return prisma as any
}

// Create a mock Supabase client
function createMockSupabase(moveSuccess = true) {
  return {
    storage: {
      from: vi.fn().mockReturnValue({
        move: vi.fn().mockResolvedValue(
          moveSuccess
            ? { error: null }
            : { error: { message: 'Move failed' } }
        ),
      }),
    },
  } as any
}

describe('processApprovedCsv', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    mockPrisma = createMockPrisma()
    mockSupabase = createMockSupabase()
  })

  it('creates transaction records for each row with DonationIn type and null fromStatus', async () => {
    const rows = [createValidRow()]
    const result = await processApprovedCsv(
      rows,
      mockPrisma,
      mockSupabase,
      'validated/test.csv',
      'approver-123'
    )

    expect(result.success).toBe(true)
    expect(result.transactionsCreated).toBe(1)

    const createCall = mockPrisma._tx.transaction.create.mock.calls[0][0]
    expect(createCall.data.transactionType).toBe('DonationIn')
    expect(createCall.data.fromStatus).toBeNull()
    expect(createCall.data.fromStoredAt).toBeNull()
    expect(createCall.data.toStatus).toBe('ForSale')
    expect(createCall.data.toStoredAt).toBe('TCC')
    expect(createCall.data.quantity).toBe(2)
    expect(createCall.data.itemTypeId).toBe(1)
    expect(createCall.data.userId).toBe(10)
    expect(createCall.data.donationDriveId).toBe(3)
  })

  it('upserts inventory balance records for each row', async () => {
    const rows = [createValidRow()]
    const result = await processApprovedCsv(
      rows,
      mockPrisma,
      mockSupabase,
      'validated/test.csv',
      'approver-123'
    )

    expect(result.success).toBe(true)
    expect(result.balancesUpdated).toBe(1)

    const upsertCall = mockPrisma._tx.inventoryBalance.upsert.mock.calls[0][0]
    expect(upsertCall.where.itemTypeId_sizeOptionId_itemStatus_storedAt).toEqual({
      itemTypeId: 1,
      sizeOptionId: 7,
      itemStatus: 'ForSale',
      storedAt: 'TCC',
    })
    expect(upsertCall.update.quantity.increment).toBe(2)
    expect(upsertCall.create.quantity).toBe(2)
  })

  it('processes multiple rows atomically', async () => {
    const rows = [
      createValidRow({ item_type_id: '1', to_status: 'for_sale' }),
      createValidRow({ item_type_id: '2', to_status: 'for_repurpose' }),
      createValidRow({ item_type_id: '3', to_status: 'general_office' }),
    ]

    const result = await processApprovedCsv(
      rows,
      mockPrisma,
      mockSupabase,
      'validated/test.csv',
      'approver-123'
    )

    expect(result.success).toBe(true)
    expect(result.transactionsCreated).toBe(3)
    expect(result.balancesUpdated).toBe(3)
    expect(mockPrisma._tx.transaction.create).toHaveBeenCalledTimes(3)
    expect(mockPrisma._tx.inventoryBalance.upsert).toHaveBeenCalledTimes(3)
  })

  it('counts unique balance keys correctly (same item+size+status+location = 1 update)', async () => {
    // Two rows with same item type, size, status, location -> same balance key
    const rows = [
      createValidRow({ item_type_id: '1', to_status: 'for_sale', to_stored_at: 'tcc' }),
      createValidRow({ item_type_id: '1', to_status: 'for_sale', to_stored_at: 'tcc' }),
    ]

    const result = await processApprovedCsv(
      rows,
      mockPrisma,
      mockSupabase,
      'validated/test.csv',
      'approver-123'
    )

    expect(result.success).toBe(true)
    expect(result.transactionsCreated).toBe(2)
    // Only 1 unique balance combination was updated
    expect(result.balancesUpdated).toBe(1)
  })

  it('moves file from validated/ to processed/ on success', async () => {
    const rows = [createValidRow()]
    await processApprovedCsv(
      rows,
      mockPrisma,
      mockSupabase,
      'validated/test-file.csv',
      'approver-123'
    )

    expect(mockSupabase.storage.from).toHaveBeenCalledWith('donations')
    const moveCall = mockSupabase.storage.from().move
    expect(moveCall).toHaveBeenCalledWith('validated/test-file.csv', 'processed/test-file.csv')
  })

  it('reports success with warning when file move fails but DB writes succeed', async () => {
    mockSupabase = createMockSupabase(false) // file move will fail
    const rows = [createValidRow()]

    const result = await processApprovedCsv(
      rows,
      mockPrisma,
      mockSupabase,
      'validated/test.csv',
      'approver-123'
    )

    expect(result.success).toBe(true)
    expect(result.transactionsCreated).toBe(1)
    expect(result.error).toContain('file move failed')
  })

  it('rolls back all changes on database error and retains file in validated/', async () => {
    // Make $transaction throw an error (simulating DB failure)
    mockPrisma.$transaction.mockRejectedValue(new Error('Database connection lost'))

    const rows = [createValidRow()]
    const result = await processApprovedCsv(
      rows,
      mockPrisma,
      mockSupabase,
      'validated/test.csv',
      'approver-123'
    )

    expect(result.success).toBe(false)
    expect(result.transactionsCreated).toBe(0)
    expect(result.balancesUpdated).toBe(0)
    expect(result.error).toBe('Database connection lost')
    // File move should not have been attempted
    expect(mockSupabase.storage.from).not.toHaveBeenCalled()
  })

  it('rolls back on partial failure mid-transaction', async () => {
    // Simulate failure on second row
    let callCount = 0
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      const failingTx = {
        ...mockPrisma._tx,
        transaction: {
          create: vi.fn().mockImplementation(() => {
            callCount++
            if (callCount === 2) {
              throw new Error('Constraint violation')
            }
            return { id: callCount }
          }),
        },
      }
      return fn(failingTx)
    })

    const rows = [createValidRow(), createValidRow()]
    const result = await processApprovedCsv(
      rows,
      mockPrisma,
      mockSupabase,
      'validated/test.csv',
      'approver-123'
    )

    expect(result.success).toBe(false)
    expect(result.transactionsCreated).toBe(0)
    expect(result.balancesUpdated).toBe(0)
    expect(result.error).toBe('Constraint violation')
  })

  it('maps storage locations correctly', async () => {
    const rows = [
      createValidRow({ to_stored_at: 'school' }),
      createValidRow({ to_stored_at: 'TCC' }),
      createValidRow({ to_stored_at: 'exited' }),
    ]

    await processApprovedCsv(
      rows,
      mockPrisma,
      mockSupabase,
      'validated/test.csv',
      'approver-123'
    )

    const calls = mockPrisma._tx.transaction.create.mock.calls
    expect(calls[0][0].data.toStoredAt).toBe('School')
    expect(calls[1][0].data.toStoredAt).toBe('TCC')
    expect(calls[2][0].data.toStoredAt).toBe('Exited')
  })

  it('maps item statuses correctly', async () => {
    const rows = [
      createValidRow({ to_status: 'for_sale' }),
      createValidRow({ to_status: 'for_repurpose' }),
      createValidRow({ to_status: 'general_office' }),
      createValidRow({ to_status: 'sold' }),
    ]

    await processApprovedCsv(
      rows,
      mockPrisma,
      mockSupabase,
      'validated/test.csv',
      'approver-123'
    )

    const calls = mockPrisma._tx.transaction.create.mock.calls
    expect(calls[0][0].data.toStatus).toBe('ForSale')
    expect(calls[1][0].data.toStatus).toBe('ForRepurpose')
    expect(calls[2][0].data.toStatus).toBe('GeneralOffice')
    expect(calls[3][0].data.toStatus).toBe('Sold')
  })

  it('looks up size option via item type sizeCategoryId and size_name', async () => {
    mockPrisma._tx.itemType.findUniqueOrThrow.mockResolvedValue({ sizeCategoryId: 42 })

    const rows = [createValidRow({ item_type_id: '5', size_name: 'XL' })]
    await processApprovedCsv(
      rows,
      mockPrisma,
      mockSupabase,
      'validated/test.csv',
      'approver-123'
    )

    expect(mockPrisma._tx.itemType.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 5 },
      select: { sizeCategoryId: true },
    })
    expect(mockPrisma._tx.sizeOption.findFirstOrThrow).toHaveBeenCalledWith({
      where: { sizeCategoryId: 42, sizeName: 'XL' },
      select: { id: true },
    })
  })

  it('handles empty rows array gracefully', async () => {
    const result = await processApprovedCsv(
      [],
      mockPrisma,
      mockSupabase,
      'validated/empty.csv',
      'approver-123'
    )

    expect(result.success).toBe(true)
    expect(result.transactionsCreated).toBe(0)
    expect(result.balancesUpdated).toBe(0)
  })

  it('handles unknown errors gracefully', async () => {
    mockPrisma.$transaction.mockRejectedValue('string error')

    const rows = [createValidRow()]
    const result = await processApprovedCsv(
      rows,
      mockPrisma,
      mockSupabase,
      'validated/test.csv',
      'approver-123'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Unknown error during CSV processing')
  })
})
