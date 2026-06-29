import { describe, it, expect } from 'vitest'
import { generateUniqueFilename } from './filename'

describe('generateUniqueFilename', () => {
  it('generates filename with stem, userId, and timestamp', () => {
    const result = generateUniqueFilename('donations.csv', 'user123', 1700000000000)
    expect(result).toBe('donations_user123_1700000000000.csv')
  })

  it('handles filenames with multiple dots', () => {
    const result = generateUniqueFilename('my.report.2024.xlsx', 'abc', 1700000000000)
    expect(result).toBe('my.report.2024_abc_1700000000000.xlsx')
  })

  it('handles filenames with no extension', () => {
    const result = generateUniqueFilename('README', 'user1', 1700000000000)
    expect(result).toBe('README_user1_1700000000000')
  })

  it('handles dotfiles (leading dot, no further extension)', () => {
    const result = generateUniqueFilename('.gitignore', 'user1', 1700000000000)
    expect(result).toBe('.gitignore_user1_1700000000000')
  })

  it('handles dotfiles with extension', () => {
    const result = generateUniqueFilename('.env.local', 'user1', 1700000000000)
    expect(result).toBe('.env_user1_1700000000000.local')
  })

  it('strips directory path from filename', () => {
    const result = generateUniqueFilename('/path/to/file.csv', 'user1', 1700000000000)
    expect(result).toBe('file_user1_1700000000000.csv')
  })

  it('strips Windows-style path from filename', () => {
    const result = generateUniqueFilename('C:\\Users\\docs\\file.csv', 'user1', 1700000000000)
    expect(result).toBe('file_user1_1700000000000.csv')
  })

  it('produces different filenames for different timestamps', () => {
    const result1 = generateUniqueFilename('data.csv', 'user1', 1700000000000)
    const result2 = generateUniqueFilename('data.csv', 'user1', 1700000000001)
    expect(result1).not.toBe(result2)
  })

  it('produces different filenames for different userIds', () => {
    const result1 = generateUniqueFilename('data.csv', 'user1', 1700000000000)
    const result2 = generateUniqueFilename('data.csv', 'user2', 1700000000000)
    expect(result1).not.toBe(result2)
  })

  it('contains the original stem in the output', () => {
    const result = generateUniqueFilename('donations.csv', 'user123', 1700000000000)
    expect(result).toContain('donations')
  })

  it('contains the userId in the output', () => {
    const result = generateUniqueFilename('donations.csv', 'user123', 1700000000000)
    expect(result).toContain('user123')
  })

  it('contains the timestamp in the output', () => {
    const result = generateUniqueFilename('donations.csv', 'user123', 1700000000000)
    expect(result).toContain('1700000000000')
  })

  it('defaults timestamp to Date.now() when not provided', () => {
    const before = Date.now()
    const result = generateUniqueFilename('file.csv', 'user1')
    const after = Date.now()

    // Extract the timestamp from the generated filename
    const match = result.match(/_(\d+)\.csv$/)
    expect(match).not.toBeNull()
    const ts = Number(match![1])
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })

  it('handles empty filename gracefully', () => {
    const result = generateUniqueFilename('', 'user1', 1700000000000)
    expect(result).toBe('_user1_1700000000000')
  })
})
