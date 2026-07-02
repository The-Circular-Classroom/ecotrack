import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

const { mockUpload, mockInvoke } = vi.hoisted(() => ({
  mockUpload: vi.fn(),
  mockInvoke: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    storage: {
      from: () => ({
        upload: mockUpload,
      }),
    },
    functions: {
      invoke: mockInvoke,
    },
  }),
}))

function createMockRequest(options: {
  file?: File | null
  userId?: string | null
  userRole?: string | null
}): NextRequest {
  const { file, userId, userRole } = options

  const formData = new FormData()
  if (file) {
    formData.append('file', file)
  }

  const headers = new Headers()
  if (userId) {
    headers.set('x-user-id', userId)
  }
  if (userRole) {
    headers.set('x-user-role', userRole)
  }

  return new NextRequest('http://localhost/api/donations/drives/upload-csv', {
    method: 'POST',
    headers,
    body: formData,
  })
}

describe('POST /api/donations/drives/upload-csv', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpload.mockResolvedValue({ error: null })
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null })
  })

  it('returns 401 when x-user-id is missing', async () => {
    const request = createMockRequest({ userId: null, userRole: 'PsgVolunteer' })
    const response = await POST(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('unauthorized')
  })

  it('returns 403 when role is not sufficient', async () => {
    const request = createMockRequest({ userId: 'user-123', userRole: 'Parent' })
    const response = await POST(request)

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toBe('forbidden')
  })

  it('returns 400 when no file is provided', async () => {
    const request = createMockRequest({ userId: 'user-123', userRole: 'PsgVolunteer', file: null })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('missing_file')
  })

  it('returns 400 for unsupported file type', async () => {
    const file = new File(['data'], 'test.png', { type: 'image/png' })
    const request = createMockRequest({ userId: 'user-123', userRole: 'PsgVolunteer', file })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('invalid_format')
  })

  it('returns 400 when flat CSV is missing required headers', async () => {
    const file = new File(['invalid,header\n1,2'], 'test.csv', { type: 'text/csv' })
    const request = createMockRequest({ userId: 'user-123', userRole: 'PsgVolunteer', file })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('missing_headers')
  })

  it('returns 400 when flat CSV validation fails', async () => {
    const headers = 'item_type_id,item_name,colour_name,gender,user_id,school_id,donation_drive_id,to_stored_at,quantity,to_status,size_name,remarks'
    const row = '1,Shirt,Red,Unisex,1,1,1,invalid_store,-5,invalid_status,M,No remarks'
    const file = new File([`${headers}\n${row}`], 'test.csv', { type: 'text/csv' })

    const request = createMockRequest({ userId: 'user-123', userRole: 'PsgVolunteer', file })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('validation_failed')
    expect(body.errors.length).toBeGreaterThan(0)
  })

  it('returns 202 and uploads file on successful flat CSV', async () => {
    const headers = 'item_type_id,item_name,colour_name,gender,user_id,school_id,donation_drive_id,to_stored_at,quantity,to_status,size_name,remarks'
    const row = '1,Shirt,Red,Unisex,1,1,1,school,5,for_school_stock,M,No remarks'
    const file = new File([`${headers}\n${row}`], 'test.csv', { type: 'text/csv' })

    const request = createMockRequest({ userId: 'user-123', userRole: 'PsgVolunteer', file })
    const response = await POST(request)

    expect(response.status).toBe(202)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(mockUpload).toHaveBeenCalledTimes(1)
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('returns 202 on raw donation matrix upload and converts to flat layout', async () => {
    // Raw CSV layout contains 'school name' and 'donation drive'
    const headers = 'school name,donation drive,start date,end date,item type id,item name,user id,school id,donation drive id,size name,storage location,for school stock'
    const row = 'Zhenghua,Drive 1,2026-01-01,2026-12-31,1,Shirt,1,1,1,M,school,10'
    const file = new File([`${headers}\n${row}`], 'test.csv', { type: 'text/csv' })

    const request = createMockRequest({ userId: 'user-123', userRole: 'PsgVolunteer', file })
    const response = await POST(request)

    expect(response.status).toBe(202)
    expect(mockUpload).toHaveBeenCalledTimes(1)
    const [path, buffer] = mockUpload.mock.calls[0]
    expect(path).toContain('_converted.xlsx')
  })
})
