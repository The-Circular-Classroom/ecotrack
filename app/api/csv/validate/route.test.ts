import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

// Mock Supabase server client
const mockDownload = vi.fn()
const mockMove = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    storage: {
      from: () => ({
        download: mockDownload,
        move: mockMove,
      }),
    },
  }),
}))

// Mock Prisma client
vi.mock('@/lib/prisma/client', () => ({
  prisma: {},
}))

// Mock CSV validator
const mockValidateDonationCsv = vi.fn()
vi.mock('@/lib/csv/validator', () => ({
  validateDonationCsv: (...args: unknown[]) => mockValidateDonationCsv(...args),
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

  return new NextRequest('http://localhost/api/csv/validate', {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

// Helper to create a valid CSV buffer as a Blob
function createCsvBlob(content: string): Blob {
  return new Blob([content], { type: 'text/csv' })
}

describe('POST /api/csv/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMove.mockResolvedValue({ error: null })
  })

  it('returns 401 when x-user-id header is missing', async () => {
    const request = createMockRequest({ body: { filePath: 'pre-processing/file.csv' }, userId: null, userRole: null })
    const response = await POST(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('unauthorized')
  })

  it('returns 403 when user role is insufficient (Parent)', async () => {
    const request = createMockRequest({
      body: { filePath: 'pre-processing/file.csv' },
      userId: 'user-1',
      userRole: 'Parent',
    })
    const response = await POST(request)

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toBe('forbidden')
  })

  it('returns 403 when user role is PsgVolunteer', async () => {
    const request = createMockRequest({
      body: { filePath: 'pre-processing/file.csv' },
      userId: 'user-1',
      userRole: 'PsgVolunteer',
    })
    const response = await POST(request)

    expect(response.status).toBe(403)
  })

  it('allows SchoolStaff role', async () => {
    mockDownload.mockResolvedValue({
      data: createCsvBlob('item_type_id,size_name,user_id,school_id,donation_drive_id,to_stored_at,quantity,to_status\n1,S,1,1,1,school,5,for_sale'),
      error: null,
    })
    mockValidateDonationCsv.mockResolvedValue({
      valid: true,
      errors: [],
      validRows: 1,
      invalidRows: 0,
    })

    const request = createMockRequest({
      body: { filePath: 'pre-processing/file.csv' },
      userId: 'user-1',
      userRole: 'SchoolStaff',
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  it('allows Admin role', async () => {
    mockDownload.mockResolvedValue({
      data: createCsvBlob('item_type_id,size_name,user_id,school_id,donation_drive_id,to_stored_at,quantity,to_status\n1,S,1,1,1,school,5,for_sale'),
      error: null,
    })
    mockValidateDonationCsv.mockResolvedValue({
      valid: true,
      errors: [],
      validRows: 1,
      invalidRows: 0,
    })

    const request = createMockRequest({
      body: { filePath: 'pre-processing/file.csv' },
      userId: 'user-1',
      userRole: 'Admin',
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  it('returns 400 when filePath is missing', async () => {
    const request = createMockRequest({
      body: {},
      userId: 'user-1',
      userRole: 'SchoolStaff',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('missing_field')
  })

  it('returns 400 for invalid JSON body', async () => {
    const headers = new Headers()
    headers.set('x-user-id', 'user-1')
    headers.set('x-user-role', 'SchoolStaff')

    const request = new NextRequest('http://localhost/api/csv/validate', {
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
      body: { filePath: 'pre-processing/missing.csv' },
      userId: 'user-1',
      userRole: 'SchoolStaff',
    })
    const response = await POST(request)

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('download_failed')
  })

  it('moves file to validated/ and returns 200 when all rows pass', async () => {
    mockDownload.mockResolvedValue({
      data: createCsvBlob('item_type_id,size_name,user_id,school_id,donation_drive_id,to_stored_at,quantity,to_status\n1,S,1,1,1,school,5,for_sale'),
      error: null,
    })
    mockValidateDonationCsv.mockResolvedValue({
      valid: true,
      errors: [],
      validRows: 1,
      invalidRows: 0,
    })

    const request = createMockRequest({
      body: { filePath: 'pre-processing/donations.csv' },
      userId: 'user-1',
      userRole: 'SchoolStaff',
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('validated')
    expect(body.filePath).toBe('validated/donations.csv')
    expect(mockMove).toHaveBeenCalledWith('pre-processing/donations.csv', 'validated/donations.csv')
  })

  it('moves file to failed/ and returns 422 when validation errors exist', async () => {
    mockDownload.mockResolvedValue({
      data: createCsvBlob('item_type_id,size_name,user_id,school_id,donation_drive_id,to_stored_at,quantity,to_status\n1,S,999,1,1,school,5,for_sale'),
      error: null,
    })
    mockValidateDonationCsv.mockResolvedValue({
      valid: false,
      errors: [{ row: 1, field: 'user_id', message: 'User with id 999 is not active' }],
      validRows: 0,
      invalidRows: 1,
    })

    const request = createMockRequest({
      body: { filePath: 'pre-processing/bad.csv' },
      userId: 'user-1',
      userRole: 'SchoolStaff',
    })
    const response = await POST(request)

    expect(response.status).toBe(422)
    const body = await response.json()
    expect(body.status).toBe('failed')
    expect(body.filePath).toBe('failed/bad.csv')
    expect(body.errors).toHaveLength(1)
    expect(mockMove).toHaveBeenCalledWith('pre-processing/bad.csv', 'failed/bad.csv')
  })

  it('returns 422 when file cannot be parsed (e.g., empty)', async () => {
    mockDownload.mockResolvedValue({
      data: createCsvBlob(''),
      error: null,
    })

    const request = createMockRequest({
      body: { filePath: 'pre-processing/empty.csv' },
      userId: 'user-1',
      userRole: 'SchoolStaff',
    })
    const response = await POST(request)

    expect(response.status).toBe(422)
    const body = await response.json()
    expect(body.error).toBe('parse_failed')
  })
})
