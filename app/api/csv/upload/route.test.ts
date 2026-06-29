import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

// Mock Supabase server client
const mockUpload = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    storage: {
      from: () => ({
        upload: mockUpload,
      }),
    },
  }),
}))

function createMockRequest(options: {
  file?: File | null
  userId?: string | null
}): NextRequest {
  const { file, userId } = options

  const formData = new FormData()
  if (file) {
    formData.append('file', file)
  }

  const headers = new Headers()
  if (userId) {
    headers.set('x-user-id', userId)
  }

  return new NextRequest('http://localhost/api/csv/upload', {
    method: 'POST',
    headers,
    body: formData,
  })
}

describe('POST /api/csv/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpload.mockResolvedValue({ error: null })
  })

  it('returns 401 when x-user-id header is missing', async () => {
    const request = createMockRequest({ userId: null })
    const response = await POST(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('unauthorized')
    expect(body.message).toBe('User ID required')
  })

  it('returns 400 when no file is provided', async () => {
    const request = createMockRequest({ userId: 'user-123' })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('missing_file')
    expect(body.message).toBe('No file provided')
  })

  it('returns 400 for invalid file type', async () => {
    const file = new File(['content'], 'image.png', { type: 'image/png' })
    const request = createMockRequest({ file, userId: 'user-123' })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('validation_failed')
    expect(body.message).toContain('.png')
  })

  it('returns 400 for file exceeding size limit', async () => {
    // Create a file just over 10MB
    const largeContent = new Uint8Array(11 * 1024 * 1024)
    const file = new File([largeContent], 'data.csv', { type: 'text/csv' })
    const request = createMockRequest({ file, userId: 'user-123' })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('validation_failed')
    expect(body.message).toContain('exceeds maximum')
  })

  it('returns 201 with storage path on successful upload', async () => {
    const file = new File(['col1,col2\nval1,val2'], 'donations.csv', { type: 'text/csv' })
    const request = createMockRequest({ file, userId: 'user-123' })
    const response = await POST(request)

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.path).toMatch(/^pre-processing\/donations_user-123_\d+\.csv$/)
    expect(body.filename).toMatch(/^donations_user-123_\d+\.csv$/)
  })

  it('uploads to the donations bucket with correct path', async () => {
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })
    const request = createMockRequest({ file, userId: 'user-456' })
    await POST(request)

    expect(mockUpload).toHaveBeenCalledTimes(1)
    const [path, buffer, options] = mockUpload.mock.calls[0]
    expect(path).toMatch(/^pre-processing\/test_user-456_\d+\.csv$/)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(options.contentType).toBe('text/csv')
    expect(options.upsert).toBe(false)
  })

  it('returns 500 when Supabase upload fails', async () => {
    mockUpload.mockResolvedValueOnce({ error: new Error('Storage error') })
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })
    const request = createMockRequest({ file, userId: 'user-123' })
    const response = await POST(request)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('upload_failed')
    expect(body.message).toBe('Failed to upload file')
  })

  it('accepts .xls files', async () => {
    const file = new File(['data'], 'donations.xls', { type: 'application/vnd.ms-excel' })
    const request = createMockRequest({ file, userId: 'user-123' })
    const response = await POST(request)

    expect(response.status).toBe(201)
  })

  it('accepts .xlsx files', async () => {
    const file = new File(['data'], 'donations.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const request = createMockRequest({ file, userId: 'user-123' })
    const response = await POST(request)

    expect(response.status).toBe(201)
  })
})
