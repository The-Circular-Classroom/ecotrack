import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

// Mock Supabase server client
const mockDownload = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    storage: {
      from: () => ({
        download: mockDownload,
      }),
    },
  }),
}))

// Mock Prisma client
vi.mock('@/lib/prisma/client', () => ({
  prisma: {},
}))

// Mock CSV processor
const mockProcessApprovedCsv = vi.fn()
vi.mock('@/lib/csv/processor', () => ({
  processApprovedCsv: (...args: unknown[]) => mockProcessApprovedCsv(...args),
}))

function createMockRequest(options: {
  body?: unknown
  userId?: string | null
  userRole?: string | null
}): NextRequest {
  const { body, userId, userRole } = options
  const headers = new Headers()
  if (userId) headers.set('x-user-id', userId)
  if (userRole) headers.set('x-user-role', userRole)

  return new NextRequest('http://localhost/api/csv/approve', {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

function createCsvBlob(content: string): Blob {
  return new Blob([content], { type: 'text/csv' })
}

describe('POST /api/csv/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when x-user-id header is missing', async () => {
    const request = createMockRequest({ body: { filePath: 'validated/file.csv' }, userId: null, userRole: null })
    const response = await POST(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('unauthorized')
  })

  it('returns 403 when user role is SchoolStaff (not Admin)', async () => {
    const request = createMockRequest({
      body: { filePath: 'validated/file.csv' },
      userId: 'user-1',
      userRole: 'SchoolStaff',
    })
    const response = await POST(request)

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toBe('forbidden')
  })

  it('returns 403 when user role is Parent', async () => {
    const request = createMockRequest({
      body: { filePath: 'validated/file.csv' },
      userId: 'user-1',
      userRole: 'Parent',
    })
    const response = await POST(request)

    expect(response.status).toBe(403)
  })

  it('returns 403 when user role is PsgVolunteer', async () => {
    const request = createMockRequest({
      body: { filePath: 'validated/file.csv' },
      userId: 'user-1',
      userRole: 'PsgVolunteer',
    })
    const response = await POST(request)

    expect(response.status).toBe(403)
  })

  it('returns 400 when filePath is missing', async () => {
    const request = createMockRequest({
      body: {},
      userId: 'admin-1',
      userRole: 'Admin',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('missing_field')
  })

  it('returns 400 when filePath is not in validated/ folder', async () => {
    const request = createMockRequest({
      body: { filePath: 'pre-processing/file.csv' },
      userId: 'admin-1',
      userRole: 'Admin',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('invalid_path')
    expect(body.message).toContain('validated/')
  })

  it('returns 400 for invalid JSON body', async () => {
    const headers = new Headers()
    headers.set('x-user-id', 'admin-1')
    headers.set('x-user-role', 'Admin')

    const request = new NextRequest('http://localhost/api/csv/approve', {
      method: 'POST',
      headers,
      body: 'not-json',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('invalid_body')
  })

  it('returns 404 when file download fails', async () => {
    mockDownload.mockResolvedValue({
      data: null,
      error: { message: 'Object not found' },
    })

    const request = createMockRequest({
      body: { filePath: 'validated/missing.csv' },
      userId: 'admin-1',
      userRole: 'Admin',
    })
    const response = await POST(request)

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('download_failed')
  })

  it('returns 200 with processing result on success', async () => {
    mockDownload.mockResolvedValue({
      data: createCsvBlob('item_type_id,size_name,user_id,school_id,donation_drive_id,to_stored_at,quantity,to_status\n1,S,1,1,1,school,5,for_sale'),
      error: null,
    })
    mockProcessApprovedCsv.mockResolvedValue({
      success: true,
      transactionsCreated: 1,
      balancesUpdated: 1,
    })

    const request = createMockRequest({
      body: { filePath: 'validated/donations.csv' },
      userId: 'admin-1',
      userRole: 'Admin',
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('processed')
    expect(body.transactionsCreated).toBe(1)
    expect(body.balancesUpdated).toBe(1)
  })

  it('passes correct arguments to processApprovedCsv', async () => {
    mockDownload.mockResolvedValue({
      data: createCsvBlob('item_type_id,size_name,user_id,school_id,donation_drive_id,to_stored_at,quantity,to_status\n1,S,1,1,1,school,5,for_sale'),
      error: null,
    })
    mockProcessApprovedCsv.mockResolvedValue({
      success: true,
      transactionsCreated: 1,
      balancesUpdated: 1,
    })

    const request = createMockRequest({
      body: { filePath: 'validated/donations.csv' },
      userId: 'admin-1',
      userRole: 'Admin',
    })
    await POST(request)

    expect(mockProcessApprovedCsv).toHaveBeenCalledTimes(1)
    const [rows, , , filePath, approverId] = mockProcessApprovedCsv.mock.calls[0]
    expect(rows).toHaveLength(1)
    expect(filePath).toBe('validated/donations.csv')
    expect(approverId).toBe('admin-1')
  })

  it('returns 500 when processing fails', async () => {
    mockDownload.mockResolvedValue({
      data: createCsvBlob('item_type_id,size_name,user_id,school_id,donation_drive_id,to_stored_at,quantity,to_status\n1,S,1,1,1,school,5,for_sale'),
      error: null,
    })
    mockProcessApprovedCsv.mockResolvedValue({
      success: false,
      transactionsCreated: 0,
      balancesUpdated: 0,
      error: 'Database constraint violation',
    })

    const request = createMockRequest({
      body: { filePath: 'validated/donations.csv' },
      userId: 'admin-1',
      userRole: 'Admin',
    })
    const response = await POST(request)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('processing_failed')
    expect(body.message).toBe('Database constraint violation')
  })

  it('includes warning when processing succeeds but file move fails', async () => {
    mockDownload.mockResolvedValue({
      data: createCsvBlob('item_type_id,size_name,user_id,school_id,donation_drive_id,to_stored_at,quantity,to_status\n1,S,1,1,1,school,5,for_sale'),
      error: null,
    })
    mockProcessApprovedCsv.mockResolvedValue({
      success: true,
      transactionsCreated: 1,
      balancesUpdated: 1,
      error: 'Database records created successfully but file move failed: Storage error',
    })

    const request = createMockRequest({
      body: { filePath: 'validated/donations.csv' },
      userId: 'admin-1',
      userRole: 'Admin',
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('processed')
    expect(body.warning).toContain('file move failed')
  })

  it('returns 422 when file cannot be parsed', async () => {
    mockDownload.mockResolvedValue({
      data: createCsvBlob(''),
      error: null,
    })

    const request = createMockRequest({
      body: { filePath: 'validated/empty.csv' },
      userId: 'admin-1',
      userRole: 'Admin',
    })
    const response = await POST(request)

    expect(response.status).toBe(422)
    const body = await response.json()
    expect(body.error).toBe('parse_failed')
  })
})
