import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

// Mock Prisma client
const mockQueryRaw = vi.fn()

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}))

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('returns 200 with healthy status when database is reachable', async () => {
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }])

    vi.useRealTimers()
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('healthy')
    expect(body.database).toBe('connected')
    expect(typeof body.latencyMs).toBe('number')
  })

  it('returns 503 with unhealthy status when database is unreachable', async () => {
    mockQueryRaw.mockRejectedValue(new Error('Connection refused'))

    vi.useRealTimers()
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.status).toBe('unhealthy')
    expect(body.database).toBe('unreachable')
    expect(body.error).toBe('Connection refused')
  })

  it('returns 503 when database check exceeds 5 second timeout', async () => {
    // Create a promise that never resolves to simulate timeout
    mockQueryRaw.mockImplementation(() => new Promise(() => {}))

    const responsePromise = GET()

    // Advance timers past the 5 second timeout
    vi.advanceTimersByTime(5001)

    const response = await responsePromise
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.status).toBe('unhealthy')
    expect(body.database).toBe('unreachable')
    expect(body.error).toBe('Database connection timeout')
  })

  it('handles non-Error throw gracefully', async () => {
    mockQueryRaw.mockRejectedValue('string error')

    vi.useRealTimers()
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.status).toBe('unhealthy')
    expect(body.database).toBe('unreachable')
    expect(body.error).toBe('Unknown error')
  })
})
