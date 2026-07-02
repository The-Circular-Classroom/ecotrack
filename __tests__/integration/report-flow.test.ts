import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// Mock prisma client
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    inventoryBalance: {
      findMany: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
  },
}))

describe('Reports API Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/report/admin', () => {
    it('returns 403 forbidden for non-admin user roles', async () => {
      const { GET } = await import('@/app/api/report/admin/route')

      const req = new NextRequest('http://localhost/api/report/admin', {
        headers: {
          'x-user-role': 'SchoolStaff',
        },
      })

      const res = await GET(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toBe('forbidden')
    })

    it('returns 400 validation error for invalid year', async () => {
      const { GET } = await import('@/app/api/report/admin/route')

      const req = new NextRequest('http://localhost/api/report/admin?year=-20', {
        headers: {
          'x-user-role': 'Admin',
        },
      })

      const res = await GET(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('validation_error')
    })

    it('returns 200 and generates a PDF report for Admin', async () => {
      const { GET } = await import('@/app/api/report/admin/route')

      // Mock prisma findMany calls
      vi.mocked(prisma.inventoryBalance.findMany).mockResolvedValue([
        {
          quantity: 10,
          itemType: {
            school: { schoolName: 'School A' },
            category: { categoryName: 'Shirts', weightKg: 0.2 },
          },
        },
      ] as any)

      vi.mocked(prisma.transaction.findMany).mockResolvedValue([
        {
          transactionType: 'DonationIn',
          quantity: 50,
          transactionDate: new Date(),
          itemType: {
            school: { schoolName: 'School A' },
            category: { weightKg: 0.2 },
          },
        },
      ] as any)

      const req = new NextRequest('http://localhost/api/report/admin?year=2026', {
        headers: {
          'x-user-role': 'Admin',
        },
      })

      const res = await GET(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toBe('application/pdf')
      const buffer = await res.arrayBuffer()
      expect(buffer.byteLength).toBeGreaterThan(0)
    })
  })

  describe('GET /api/report/school/[id]', () => {
    it('returns 403 forbidden for non-SchoolStaff roles', async () => {
      const { GET } = await import('@/app/api/report/school/[id]/route')

      const req = new NextRequest('http://localhost/api/report/school/1', {
        headers: {
          'x-user-role': 'Parent',
        },
      })

      const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toBe('forbidden')
    })

    it('returns 404 if school is not found', async () => {
      const { GET } = await import('@/app/api/report/school/[id]/route')

      vi.mocked(prisma.school.findUnique).mockResolvedValue(null)

      const req = new NextRequest('http://localhost/api/report/school/999', {
        headers: {
          'x-user-role': 'SchoolStaff',
        },
      })

      const res = await GET(req, { params: Promise.resolve({ id: '999' }) })
      expect(res.status).toBe(404)
      const data = await res.json()
      expect(data.error).toBe('not_found')
    })

    it('returns 200 and generates school PDF report for SchoolStaff', async () => {
      const { GET } = await import('@/app/api/report/school/[id]/route')

      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        id: 1,
        schoolName: 'School A',
      } as any)

      vi.mocked(prisma.inventoryBalance.findMany).mockResolvedValue([
        {
          quantity: 5,
          itemType: {
            category: { categoryName: 'Pants', weightKg: 0.3 },
          },
        },
      ] as any)

      vi.mocked(prisma.transaction.findMany).mockResolvedValue([
        {
          transactionType: 'Sale',
          quantity: 20,
          transactionDate: new Date(),
          itemType: {
            category: { weightKg: 0.3 },
            school: { schoolName: 'School A' },
          },
        },
      ] as any)

      const req = new NextRequest('http://localhost/api/report/school/1?year=2026', {
        headers: {
          'x-user-role': 'SchoolStaff',
        },
      })

      const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toBe('application/pdf')
      const buffer = await res.arrayBuffer()
      expect(buffer.byteLength).toBeGreaterThan(0)
    })
  })
})
