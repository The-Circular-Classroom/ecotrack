import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

import { prisma } from '@/lib/prisma/client'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { POST } from '../route'

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates user lastLogin timestamp in Prisma on successful login', async () => {
    const mockSignInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'auth-user-123', email: 'test@example.com' },
        session: { access_token: 'token-acc', refresh_token: 'token-ref', expires_in: 3600 },
      },
      error: null,
    })

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { signInWithPassword: mockSignInWithPassword },
    } as any)

    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 1,
      role: 'Admin',
      lastLogin: new Date(),
    } as any)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'Password123!' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const responseData = await response.json()
    expect(responseData.user.role).toBe('Admin')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { supabaseAuthId: 'auth-user-123' },
      data: { lastLogin: expect.any(Date) },
      select: { role: true },
    })
  })
})
