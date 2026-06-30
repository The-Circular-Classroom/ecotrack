/**
 * Unit tests for User Management API edge cases.
 *
 * Tests cover:
 * - Duplicate email rejection (Requirement 4.7)
 * - User not found errors (Requirement 4.8)
 * - User sync logic (Requirement 4.6)
 * - Non-Admin role rejection (Requirement 3.4)
 * - Invalid role value rejection (Requirement 3.7)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Prisma client
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock Supabase admin client
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: vi.fn(),
        updateUserById: vi.fn(),
        deleteUser: vi.fn(),
        listUsers: vi.fn(),
      },
    },
  },
}))

import { prisma } from '@/lib/prisma/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { POST as createUser, GET as listUsers } from '../route'
import { GET as getUser, PATCH as updateUser, DELETE as deleteUser } from '../[id]/route'
import { POST as deactivateUser } from '../[id]/deactivate/route'
import { POST as syncUsers } from '../sync/route'

// Helper to create mock NextRequest
function createMockRequest(
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: unknown
  } = {}
): NextRequest {
  const { method = 'GET', headers = {}, body } = options
  const init: RequestInit = {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  }
  if (body) {
    init.body = JSON.stringify(body)
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init as any)
}

// Helper for route params (Next.js 15+ uses Promise<params>)
function createRouteParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('User Management API - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/users - Duplicate email rejection (Requirement 4.7)', () => {
    it('returns 409 when Supabase Auth reports email already exists', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered', status: 422 },
      } as never)

      const request = createMockRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'x-user-role': 'Admin' },
        body: { email: 'duplicate@example.com', role: 'Parent' },
      })

      const response = await createUser(request)
      const json = await response.json()

      expect(response.status).toBe(409)
      expect(json.error).toBe('duplicate_email')
      expect(json.message).toContain('already in use')
    })

    it('returns 409 when database unique constraint fails (P2002)', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValue({
        data: { user: { id: 'auth-uuid-123' } },
        error: null,
      } as never)

      const prismaError = new Error('Unique constraint') as Error & { code: string }
      prismaError.code = 'P2002'
      vi.mocked(prisma.user.create).mockRejectedValue(prismaError)
      vi.mocked(supabaseAdmin.auth.admin.deleteUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never)

      const request = createMockRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'x-user-role': 'Admin' },
        body: { email: 'duplicate@example.com', role: 'SchoolStaff' },
      })

      const response = await createUser(request)
      const json = await response.json()

      expect(response.status).toBe(409)
      expect(json.error).toBe('duplicate_email')
      expect(json.message).toContain('already in use')
      // Verify rollback: auth user should be deleted
      expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('auth-uuid-123')
    })
  })

  describe('GET /api/users/[id] - User not found (Requirement 4.8)', () => {
    it('returns 404 when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/users/999', {
        method: 'GET',
        headers: { 'x-user-role': 'Admin' },
      })

      const response = await getUser(request, createRouteParams('999'))
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error).toBe('not_found')
      expect(json.message).toContain('not found')
    })
  })

  describe('PATCH /api/users/[id] - User not found (Requirement 4.8)', () => {
    it('returns 404 when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/users/999', {
        method: 'PATCH',
        headers: { 'x-user-role': 'Admin' },
        body: { firstName: 'Updated' },
      })

      const response = await updateUser(request, createRouteParams('999'))
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error).toBe('not_found')
      expect(json.message).toContain('not found')
    })
  })

  describe('DELETE /api/users/[id] - User not found (Requirement 4.8)', () => {
    it('returns 404 when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/users/999', {
        method: 'DELETE',
        headers: { 'x-user-role': 'Admin' },
      })

      const response = await deleteUser(request, createRouteParams('999'))
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error).toBe('not_found')
      expect(json.message).toContain('not found')
    })
  })

  describe('POST /api/users/[id]/deactivate - User not found (Requirement 4.8)', () => {
    it('returns 404 when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/users/1/deactivate', {
        method: 'POST',
        headers: { 'x-user-role': 'Admin' },
      })

      const response = await deactivateUser(request, createRouteParams('999'))
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error).toBe('not_found')
      expect(json.message).toContain('not found')
    })
  })

  describe('POST /api/users/sync - Creates missing DB records (Requirement 4.6)', () => {
    it('creates DB records for auth users without corresponding database entries', async () => {
      // Mock auth users - 3 users in Supabase Auth
      vi.mocked(supabaseAdmin.auth.admin.listUsers).mockResolvedValue({
        data: {
          users: [
            {
              id: 'auth-1',
              email: 'user1@example.com',
              app_metadata: { role: 'Admin' },
              user_metadata: { first_name: 'User', last_name: 'One', full_name: 'User One' },
            },
            {
              id: 'auth-2',
              email: 'user2@example.com',
              app_metadata: { role: 'SchoolStaff' },
              user_metadata: { first_name: 'User', last_name: 'Two', full_name: 'User Two' },
            },
            {
              id: 'auth-3',
              email: 'user3@example.com',
              app_metadata: {},
              user_metadata: {},
            },
          ],
        },
        error: null,
      } as never)

      // Mock existing DB users - only auth-1 exists in DB
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { supabaseAuthId: 'auth-1' },
      ] as never)

      // Mock successful DB creation
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 2,
        supabaseAuthId: 'auth-2',
        email: 'user2@example.com',
      } as never)

      const request = createMockRequest('http://localhost:3000/api/users/sync', {
        method: 'POST',
        headers: { 'x-user-role': 'Admin' },
      })

      const response = await syncUsers(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.totalAuthUsers).toBe(3)
      expect(json.existingDbUsers).toBe(1)
      expect(json.created).toBe(2)
      // Verify create was called for the missing users
      expect(prisma.user.create).toHaveBeenCalledTimes(2)
      // auth-2 should be created with SchoolStaff role
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          supabaseAuthId: 'auth-2',
          email: 'user2@example.com',
          role: 'SchoolStaff',
          firstName: 'User',
          lastName: 'Two',
          fullName: 'User Two',
        }),
      })
      // auth-3 should be created with default Parent role
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          supabaseAuthId: 'auth-3',
          email: 'user3@example.com',
          role: 'Parent',
          firstName: null,
          lastName: null,
          fullName: null,
        }),
      })
    })

    it('reports errors for individual users that fail to sync', async () => {
      vi.mocked(supabaseAdmin.auth.admin.listUsers).mockResolvedValue({
        data: {
          users: [
            {
              id: 'auth-fail',
              email: 'fail@example.com',
              app_metadata: { role: 'Parent' },
              user_metadata: { first_name: 'Fail', last_name: 'User', full_name: 'Fail User' },
            },
          ],
        },
        error: null,
      } as never)

      vi.mocked(prisma.user.findMany).mockResolvedValue([] as never)
      vi.mocked(prisma.user.create).mockRejectedValue(new Error('DB constraint error'))

      const request = createMockRequest('http://localhost:3000/api/users/sync', {
        method: 'POST',
        headers: { 'x-user-role': 'Admin' },
      })

      const response = await syncUsers(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.created).toBe(0)
      expect(json.errors).toHaveLength(1)
      expect(json.errors[0].authId).toBe('auth-fail')
      expect(json.errors[0].email).toBe('fail@example.com')
    })
  })

  describe('All endpoints - Non-Admin role rejection (Requirement 3.4)', () => {
    const nonAdminRoles = ['SchoolStaff', 'PsgVolunteer', 'Parent']

    nonAdminRoles.forEach((testRole) => {
      it(`GET /api/users returns 403 for ${testRole} role`, async () => {
        const request = createMockRequest('http://localhost:3000/api/users', {
          method: 'GET',
          headers: { 'x-user-role': testRole },
        })

        const response = await listUsers(request)
        expect(response.status).toBe(403)
      })

      it(`POST /api/users returns 403 for ${testRole} role`, async () => {
        const request = createMockRequest('http://localhost:3000/api/users', {
          method: 'POST',
          headers: { 'x-user-role': testRole },
          body: { email: 'test@example.com', role: 'Parent' },
        })

        const response = await createUser(request)
        expect(response.status).toBe(403)
      })

      it(`GET /api/users/[id] returns 403 for ${testRole} role`, async () => {
        const request = createMockRequest('http://localhost:3000/api/users/1', {
          method: 'GET',
          headers: { 'x-user-role': testRole },
        })

        const response = await getUser(request, createRouteParams('1'))
        expect(response.status).toBe(403)
      })

      it(`PATCH /api/users/[id] returns 403 for ${testRole} role`, async () => {
        const request = createMockRequest('http://localhost:3000/api/users/1', {
          method: 'PATCH',
          headers: { 'x-user-role': testRole },
          body: { firstName: 'Updated' },
        })

        const response = await updateUser(request, createRouteParams('1'))
        expect(response.status).toBe(403)
      })

      it(`DELETE /api/users/[id] returns 403 for ${testRole} role`, async () => {
        const request = createMockRequest('http://localhost:3000/api/users/1', {
          method: 'DELETE',
          headers: { 'x-user-role': testRole },
        })

        const response = await deleteUser(request, createRouteParams('1'))
        expect(response.status).toBe(403)
      })

      it(`POST /api/users/[id]/deactivate returns 403 for ${testRole} role`, async () => {
        const request = createMockRequest('http://localhost:3000/api/users/1/deactivate', {
          method: 'POST',
          headers: { 'x-user-role': testRole },
        })

        const response = await deactivateUser(request, createRouteParams('1'))
        expect(response.status).toBe(403)
      })

      it(`POST /api/users/sync returns 403 for ${testRole} role`, async () => {
        const request = createMockRequest('http://localhost:3000/api/users/sync', {
          method: 'POST',
          headers: { 'x-user-role': testRole },
        })

        const response = await syncUsers(request)
        expect(response.status).toBe(403)
      })
    })
  })

  describe('POST /api/users - Invalid role value (Requirement 3.7)', () => {
    it('returns 400 for an invalid role value', async () => {
      const request = createMockRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'x-user-role': 'Admin' },
        body: { email: 'test@example.com', role: 'SuperAdmin' },
      })

      const response = await createUser(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('invalid_role')
      expect(json.message).toContain('Admin, SchoolStaff, PsgVolunteer, Parent')
    })

    it('returns 400 for empty string role', async () => {
      const request = createMockRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'x-user-role': 'Admin' },
        body: { email: 'test@example.com', role: '' },
      })

      const response = await createUser(request)
      const json = await response.json()

      expect(response.status).toBe(400)
    })

    it('returns 400 for case-sensitive mismatch (e.g., "admin" instead of "Admin")', async () => {
      const request = createMockRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'x-user-role': 'Admin' },
        body: { email: 'test@example.com', role: 'admin' },
      })

      const response = await createUser(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('invalid_role')
    })
  })
})
