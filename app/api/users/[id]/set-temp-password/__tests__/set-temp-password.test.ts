import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { prisma } from '@/lib/prisma/client'
import { supabaseAdmin } from '@/lib/supabase/admin'

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        updateUserById: vi.fn(),
      },
    },
  },
}))

vi.mock('@/lib/email/resend', () => ({
  sendTempPasswordEmail: vi.fn().mockResolvedValue(undefined),
}))

describe('POST /api/users/[id]/set-temp-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 if user is not Admin', async () => {
    const req = new NextRequest('http://localhost:3000/api/users/1/set-temp-password', {
      method: 'POST',
      headers: { 'x-user-role': 'SchoolStaff' },
    })

    const params = Promise.resolve({ id: '1' })
    const res = await POST(req, { params })
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('forbidden')
  })

  it('returns 400 if user ID is invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/users/abc/set-temp-password', {
      method: 'POST',
      headers: { 'x-user-role': 'Admin' },
    })

    const params = Promise.resolve({ id: 'abc' })
    const res = await POST(req, { params })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('invalid_id')
  })

  it('returns 404 if DB user is not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/users/999/set-temp-password', {
      method: 'POST',
      headers: { 'x-user-role': 'Admin' },
    })

    const params = Promise.resolve({ id: '999' })
    const res = await POST(req, { params })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('not_found')
  })

  it('returns 400 when setting temporary password for self', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      supabaseAuthId: 'self-auth-id',
      email: 'admin@example.com',
    } as any)

    const req = new NextRequest('http://localhost:3000/api/users/1/set-temp-password', {
      method: 'POST',
      headers: {
        'x-user-role': 'Admin',
        'x-user-id': 'self-auth-id',
      },
    })

    const params = Promise.resolve({ id: '1' })
    const res = await POST(req, { params })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('forbidden')
  })

  it('successfully sets temporary password with valid password format (uppercase, lowercase, number, symbol)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 2,
      supabaseAuthId: 'target-auth-id',
      email: 'user@example.com',
      userFlags: {},
    } as any)

    vi.mocked(supabaseAdmin.auth.admin.updateUserById).mockResolvedValue({ data: {} as any, error: null })
    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    const req = new NextRequest('http://localhost:3000/api/users/2/set-temp-password', {
      method: 'POST',
      headers: {
        'x-user-role': 'Admin',
        'x-user-id': 'admin-auth-id',
      },
      body: JSON.stringify({ sendEmail: false }),
    })

    const params = Promise.resolve({ id: '2' })
    const res = await POST(req, { params })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(typeof body.tempPassword).toBe('string')
    expect(body.tempPassword.length).toBe(16)

    // Password character verification
    const pass = body.tempPassword
    expect(/[A-Z]/.test(pass)).toBe(true)
    expect(/[a-z]/.test(pass)).toBe(true)
    expect(/[0-9]/.test(pass)).toBe(true)
    expect(/[!@#$%^&*]/.test(pass)).toBe(true)

    // Supabase updateUserById call
    expect(supabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
      'target-auth-id',
      expect.objectContaining({
        password: pass,
        app_metadata: { force_password_change: true },
      })
    )

    // Prisma user.update call
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        data: expect.objectContaining({
          userFlags: expect.objectContaining({
            must_change_password: true,
          }),
        }),
      })
    )
  })
})
