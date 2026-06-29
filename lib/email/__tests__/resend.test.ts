/**
 * Unit tests for email notification service (lib/email/resend.ts)
 *
 * Tests cover:
 * 1. Successful send (no retry needed)
 * 2. First send fails, retry succeeds (should not log error)
 * 3. Both sends fail (should log error with console.error, should NOT throw)
 * 4. Email content includes file name
 * 5. Email content includes record counts
 * 6. Validation email includes error list for failed status
 * 7. Processed email sends to multiple recipients
 *
 * **Validates: Requirements 10.5**
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Use vi.hoisted to create mocks that are available during vi.mock hoisting
const { mockSend, mockGetUserById } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockGetUserById: vi.fn(),
}))

// Mock resend module
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}))

// Mock supabase admin client
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        getUserById: (...args: unknown[]) => mockGetUserById(...args),
      },
    },
  },
}))

import {
  sendCsvValidationEmail,
  sendCsvProcessedEmail,
  resolveUserEmail,
} from '../resend'

describe('Email notification service', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('sendWithRetry behavior', () => {
    it('should send successfully without retry on first attempt', async () => {
      mockSend.mockResolvedValueOnce({ data: { id: 'msg-1' }, error: null })

      await sendCsvValidationEmail({
        to: 'user@example.com',
        fileName: 'donations.csv',
        status: 'passed',
        totalRows: 25,
      })

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should retry once on first failure and succeed without logging error', async () => {
      // First attempt fails
      mockSend.mockResolvedValueOnce({ data: null, error: { message: 'Service unavailable' } })
      // Retry succeeds
      mockSend.mockResolvedValueOnce({ data: { id: 'msg-2' }, error: null })

      await sendCsvValidationEmail({
        to: 'user@example.com',
        fileName: 'donations.csv',
        status: 'passed',
        totalRows: 10,
      })

      expect(mockSend).toHaveBeenCalledTimes(2)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should log error when both attempts fail and NOT throw', async () => {
      // First attempt fails
      mockSend.mockResolvedValueOnce({ data: null, error: { message: 'Service down' } })
      // Retry also fails
      mockSend.mockResolvedValueOnce({ data: null, error: { message: 'Still down' } })

      // Should not throw
      await expect(
        sendCsvValidationEmail({
          to: 'user@example.com',
          fileName: 'donations.csv',
          status: 'passed',
          totalRows: 10,
        })
      ).resolves.toBeUndefined()

      expect(mockSend).toHaveBeenCalledTimes(2)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('user@example.com'),
        expect.anything()
      )
    })

    it('should log error when first attempt throws and retry also throws', async () => {
      // First attempt throws
      mockSend.mockRejectedValueOnce(new Error('Network error'))
      // Retry also throws
      mockSend.mockRejectedValueOnce(new Error('Network error again'))

      await expect(
        sendCsvProcessedEmail({
          to: ['user@example.com', 'admin@example.com'],
          fileName: 'test.csv',
          recordsProcessed: 100,
        })
      ).resolves.toBeUndefined()

      expect(mockSend).toHaveBeenCalledTimes(2)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('user@example.com'),
        expect.anything()
      )
    })
  })

  describe('sendCsvValidationEmail - passed status', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({ data: { id: 'msg-ok' }, error: null })
    })

    it('should include file name in the email content', async () => {
      await sendCsvValidationEmail({
        to: 'user@example.com',
        fileName: 'school_donations_2024.csv',
        status: 'passed',
        totalRows: 50,
      })

      const sendCall = mockSend.mock.calls[0][0]
      expect(sendCall.html).toContain('school_donations_2024.csv')
      expect(sendCall.subject).toContain('school_donations_2024.csv')
    })

    it('should include total row count in the email content', async () => {
      await sendCsvValidationEmail({
        to: 'user@example.com',
        fileName: 'donations.csv',
        status: 'passed',
        totalRows: 142,
      })

      const sendCall = mockSend.mock.calls[0][0]
      expect(sendCall.html).toContain('142')
    })
  })

  describe('sendCsvValidationEmail - failed status', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({ data: { id: 'msg-ok' }, error: null })
    })

    it('should include file name in failed validation email', async () => {
      await sendCsvValidationEmail({
        to: 'user@example.com',
        fileName: 'bad_data.xlsx',
        status: 'failed',
        totalRows: 100,
        failedRows: 5,
        errors: [{ row: 1, message: 'Missing item_type_id' }],
      })

      const sendCall = mockSend.mock.calls[0][0]
      expect(sendCall.html).toContain('bad_data.xlsx')
      expect(sendCall.subject).toContain('bad_data.xlsx')
    })

    it('should include total row count and failed row count', async () => {
      await sendCsvValidationEmail({
        to: 'user@example.com',
        fileName: 'data.csv',
        status: 'failed',
        totalRows: 200,
        failedRows: 15,
        errors: [{ row: 3, message: 'User not active' }],
      })

      const sendCall = mockSend.mock.calls[0][0]
      expect(sendCall.html).toContain('200')
      expect(sendCall.html).toContain('15')
    })

    it('should include error list with row numbers and messages', async () => {
      const errors = [
        { row: 2, message: 'Missing size_name' },
        { row: 5, message: 'Inactive user' },
        { row: 8, message: 'Drive not active' },
      ]

      await sendCsvValidationEmail({
        to: 'user@example.com',
        fileName: 'errors.csv',
        status: 'failed',
        totalRows: 50,
        failedRows: 3,
        errors,
      })

      const sendCall = mockSend.mock.calls[0][0]
      for (const err of errors) {
        expect(sendCall.html).toContain(String(err.row))
        expect(sendCall.html).toContain(err.message)
      }
    })

    it('should cap errors at 50 in the email', async () => {
      const errors = Array.from({ length: 75 }, (_, i) => ({
        row: i + 1,
        message: `Error on row ${i + 1}`,
      }))

      await sendCsvValidationEmail({
        to: 'user@example.com',
        fileName: 'many_errors.csv',
        status: 'failed',
        totalRows: 75,
        failedRows: 75,
        errors,
      })

      const sendCall = mockSend.mock.calls[0][0]
      // Row 50 should be present
      expect(sendCall.html).toContain('Error on row 50')
      // Row 51 should NOT be present (cap at 50)
      expect(sendCall.html).not.toContain('Error on row 51')
    })
  })

  describe('sendCsvProcessedEmail', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({ data: { id: 'msg-ok' }, error: null })
    })

    it('should include file name in processed email', async () => {
      await sendCsvProcessedEmail({
        to: ['user@example.com'],
        fileName: 'approved_batch.csv',
        recordsProcessed: 30,
      })

      const sendCall = mockSend.mock.calls[0][0]
      expect(sendCall.html).toContain('approved_batch.csv')
      expect(sendCall.subject).toContain('approved_batch.csv')
    })

    it('should include record count in processed email', async () => {
      await sendCsvProcessedEmail({
        to: ['user@example.com'],
        fileName: 'file.csv',
        recordsProcessed: 256,
      })

      const sendCall = mockSend.mock.calls[0][0]
      expect(sendCall.html).toContain('256')
    })

    it('should send to multiple recipients', async () => {
      const recipients = ['uploader@example.com', 'approver@example.com']

      await sendCsvProcessedEmail({
        to: recipients,
        fileName: 'multi.csv',
        recordsProcessed: 50,
      })

      const sendCall = mockSend.mock.calls[0][0]
      expect(sendCall.to).toEqual(recipients)
    })
  })

  describe('resolveUserEmail', () => {
    it('should return email when user is found', async () => {
      mockGetUserById.mockResolvedValueOnce({
        data: { user: { email: 'found@example.com' } },
        error: null,
      })

      const email = await resolveUserEmail('user-123')
      expect(email).toBe('found@example.com')
      expect(mockGetUserById).toHaveBeenCalledWith('user-123')
    })

    it('should return null when user is not found', async () => {
      mockGetUserById.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'User not found' },
      })

      const email = await resolveUserEmail('nonexistent')
      expect(email).toBeNull()
    })

    it('should return null when supabase throws an error', async () => {
      mockGetUserById.mockRejectedValueOnce(new Error('Connection failed'))

      const email = await resolveUserEmail('user-456')
      expect(email).toBeNull()
    })

    it('should return null when user has no email', async () => {
      mockGetUserById.mockResolvedValueOnce({
        data: { user: { email: undefined } },
        error: null,
      })

      const email = await resolveUserEmail('user-no-email')
      expect(email).toBeNull()
    })
  })
})
