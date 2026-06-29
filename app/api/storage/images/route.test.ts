import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

// Mock Supabase server client
const mockUpload = vi.fn()
const mockRemove = vi.fn()
const mockGetPublicUrl = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    storage: {
      from: () => ({
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}))

// Mock Prisma client
const mockItemTypeFindUnique = vi.fn()
const mockItemTypeUpdate = vi.fn()
const mockSchoolFindUnique = vi.fn()
const mockSchoolUpdate = vi.fn()

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    itemType: {
      findUnique: (...args: unknown[]) => mockItemTypeFindUnique(...args),
      update: (...args: unknown[]) => mockItemTypeUpdate(...args),
    },
    school: {
      findUnique: (...args: unknown[]) => mockSchoolFindUnique(...args),
      update: (...args: unknown[]) => mockSchoolUpdate(...args),
    },
  },
}))

function createMockRequest(options: {
  file?: File | null
  type?: string | null
  entityId?: string | null
  userId?: string | null
  userRole?: string | null
}): NextRequest {
  const { file, type, entityId, userId, userRole } = options

  const formData = new FormData()
  if (file) formData.append('file', file)
  if (type) formData.append('type', type)
  if (entityId) formData.append('entityId', entityId)

  const headers = new Headers()
  if (userId) headers.set('x-user-id', userId)
  if (userRole) headers.set('x-user-role', userRole)

  return new NextRequest('http://localhost/api/storage/images', {
    method: 'POST',
    headers,
    body: formData,
  })
}

describe('POST /api/storage/images', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpload.mockResolvedValue({ error: null })
    mockRemove.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/images/test_user1_123.png' },
    })
    mockItemTypeFindUnique.mockResolvedValue({ imageUrl: null })
    mockItemTypeUpdate.mockResolvedValue({})
    mockSchoolFindUnique.mockResolvedValue({ logoUrl: null })
    mockSchoolUpdate.mockResolvedValue({})
  })

  it('returns 401 when x-user-id header is missing', async () => {
    const request = createMockRequest({ userId: null, userRole: 'Admin' })
    const response = await POST(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('unauthorized')
  })

  it('returns 403 when user role is insufficient', async () => {
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'Parent',
      file: new File(['img'], 'photo.png', { type: 'image/png' }),
      type: 'item_type',
      entityId: '1',
    })
    const response = await POST(request)

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toBe('forbidden')
  })

  it('returns 400 when no file is provided', async () => {
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'SchoolStaff',
      type: 'item_type',
      entityId: '1',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('missing_file')
  })

  it('returns 400 for invalid type field', async () => {
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'Admin',
      file,
      type: 'invalid',
      entityId: '1',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('invalid_type')
  })

  it('returns 400 when entityId is missing', async () => {
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'Admin',
      file,
      type: 'item_type',
      entityId: null,
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('missing_entity_id')
  })

  it('returns 400 for invalid file type (pdf)', async () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'SchoolStaff',
      file,
      type: 'item_type',
      entityId: '1',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('validation_failed')
    expect(body.message).toContain('.pdf')
  })

  it('returns 400 for file exceeding 5MB', async () => {
    const largeContent = new Uint8Array(6 * 1024 * 1024)
    const file = new File([largeContent], 'big.png', { type: 'image/png' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'SchoolStaff',
      file,
      type: 'item_type',
      entityId: '1',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('validation_failed')
    expect(body.message).toContain('exceeds maximum')
  })

  it('returns 400 for non-integer entityId', async () => {
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'Admin',
      file,
      type: 'item_type',
      entityId: 'abc',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('invalid_entity_id')
  })

  it('returns 404 when item type is not found', async () => {
    mockItemTypeFindUnique.mockResolvedValue(null)
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'SchoolStaff',
      file,
      type: 'item_type',
      entityId: '999',
    })
    const response = await POST(request)

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('not_found')
    expect(body.message).toBe('Item type not found')
  })

  it('returns 404 when school is not found', async () => {
    mockSchoolFindUnique.mockResolvedValue(null)
    const file = new File(['img'], 'logo.jpg', { type: 'image/jpeg' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'SchoolStaff',
      file,
      type: 'school',
      entityId: '999',
    })
    const response = await POST(request)

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('not_found')
    expect(body.message).toBe('School not found')
  })

  it('returns 200 with public URL on successful item type image upload', async () => {
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'SchoolStaff',
      file,
      type: 'item_type',
      entityId: '5',
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.url).toContain('https://')
    expect(body.filename).toMatch(/^photo_user-1_\d+\.png$/)
  })

  it('returns 200 with public URL on successful school logo upload', async () => {
    const file = new File(['img'], 'logo.webp', { type: 'image/webp' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'Admin',
      file,
      type: 'school',
      entityId: '3',
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.url).toContain('https://')
    expect(body.filename).toMatch(/^logo_user-1_\d+\.webp$/)
  })

  it('deletes existing image when replacing item type image', async () => {
    mockItemTypeFindUnique.mockResolvedValue({
      imageUrl: 'https://example.supabase.co/storage/v1/object/public/images/old_user-1_100.png',
    })
    const file = new File(['new-img'], 'new.jpg', { type: 'image/jpeg' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'SchoolStaff',
      file,
      type: 'item_type',
      entityId: '5',
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockRemove).toHaveBeenCalledWith(['old_user-1_100.png'])
  })

  it('deletes existing logo when replacing school logo', async () => {
    mockSchoolFindUnique.mockResolvedValue({
      logoUrl: 'https://example.supabase.co/storage/v1/object/public/images/old_logo_100.png',
    })
    const file = new File(['new-logo'], 'newlogo.webp', { type: 'image/webp' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'Admin',
      file,
      type: 'school',
      entityId: '2',
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockRemove).toHaveBeenCalledWith(['old_logo_100.png'])
  })

  it('updates item type record with public URL', async () => {
    const file = new File(['img'], 'photo.jpeg', { type: 'image/jpeg' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'SchoolStaff',
      file,
      type: 'item_type',
      entityId: '7',
    })
    await POST(request)

    expect(mockItemTypeUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { imageUrl: expect.stringContaining('https://') },
    })
  })

  it('updates school record with public URL', async () => {
    const file = new File(['img'], 'logo.png', { type: 'image/png' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'Admin',
      file,
      type: 'school',
      entityId: '4',
    })
    await POST(request)

    expect(mockSchoolUpdate).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { logoUrl: expect.stringContaining('https://') },
    })
  })

  it('returns 500 when Supabase upload fails', async () => {
    mockUpload.mockResolvedValueOnce({ error: new Error('Storage error') })
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'SchoolStaff',
      file,
      type: 'item_type',
      entityId: '1',
    })
    const response = await POST(request)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('upload_failed')
  })

  it('returns 500 and cleans up file when DB update fails', async () => {
    mockItemTypeUpdate.mockRejectedValueOnce(new Error('DB error'))
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'SchoolStaff',
      file,
      type: 'item_type',
      entityId: '1',
    })
    const response = await POST(request)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('db_error')
    // Should have attempted to clean up the uploaded file
    expect(mockRemove).toHaveBeenCalled()
  })

  it('accepts PsgVolunteer role (below SchoolStaff) and returns 403', async () => {
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    const request = createMockRequest({
      userId: 'user-1',
      userRole: 'PsgVolunteer',
      file,
      type: 'item_type',
      entityId: '1',
    })
    const response = await POST(request)

    expect(response.status).toBe(403)
  })

  it('accepts all valid image formats: jpg, jpeg, webp', async () => {
    for (const ext of ['jpg', 'jpeg', 'webp']) {
      vi.clearAllMocks()
      mockUpload.mockResolvedValue({ error: null })
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/images/img.${ext}` },
      })
      mockItemTypeFindUnique.mockResolvedValue({ imageUrl: null })
      mockItemTypeUpdate.mockResolvedValue({})

      const file = new File(['img'], `photo.${ext}`, { type: `image/${ext}` })
      const request = createMockRequest({
        userId: 'user-1',
        userRole: 'SchoolStaff',
        file,
        type: 'item_type',
        entityId: '1',
      })
      const response = await POST(request)
      expect(response.status).toBe(200)
    }
  })
})
