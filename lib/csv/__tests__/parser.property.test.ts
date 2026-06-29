/**
 * Property 15: CSV and Excel parsing equivalence
 * Feature: aws-to-vercel-supabase-migration
 *
 * For any tabular dataset (headers + rows), parsing it as CSV and parsing it as Excel
 * (with the same data content) SHALL produce structurally equivalent ParseResult objects
 * (same headers, same row values, same totalRows).
 *
 * **Validates: Requirements 7.8**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as XLSX from 'xlsx'
import { parseFile } from '../parser'

/**
 * Arbitrary for simple alphanumeric strings (avoids commas, quotes, newlines
 * that would cause CSV escaping issues).
 */
const ALPHANUM_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')

const alphanumStringArb = fc.array(fc.constantFrom(...ALPHANUM_CHARS), { minLength: 1, maxLength: 15 })
  .map(arr => arr.join(''))

/**
 * Arbitrary for a unique set of headers (non-empty, alphanumeric, unique values).
 */
const headersArb = fc.uniqueArray(alphanumStringArb, { minLength: 1, maxLength: 8 })
  .filter(headers => headers.length >= 1)

/**
 * Arbitrary for a single row of cell values (alphanumeric strings).
 */
function rowArb(numColumns: number): fc.Arbitrary<string[]> {
  return fc.array(alphanumStringArb, { minLength: numColumns, maxLength: numColumns })
}

/**
 * Arbitrary for a tabular dataset: headers + at least 1 row of data.
 */
const tabularDataArb = headersArb.chain(headers =>
  fc.array(rowArb(headers.length), { minLength: 1, maxLength: 20 })
    .map(rows => ({ headers, rows }))
)

/**
 * Create a CSV buffer from headers and rows.
 */
function createCsvBuffer(headers: string[], rows: string[][]): Buffer {
  const lines = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ]
  return Buffer.from(lines.join('\n'), 'utf-8')
}

/**
 * Create an Excel (xlsx) buffer from headers and rows using XLSX.utils.aoa_to_sheet.
 */
function createExcelBuffer(headers: string[], rows: string[][]): Buffer {
  const wb = XLSX.utils.book_new()
  const aoa = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

describe('Feature: aws-to-vercel-supabase-migration, Property 15: CSV and Excel parsing equivalence', () => {
  it('SHALL produce structurally equivalent ParseResult for CSV and Excel with the same data', () => {
    fc.assert(
      fc.property(
        tabularDataArb,
        ({ headers, rows }) => {
          const csvBuffer = createCsvBuffer(headers, rows)
          const xlsxBuffer = createExcelBuffer(headers, rows)

          const csvResult = parseFile(csvBuffer, 'data.csv')
          const xlsxResult = parseFile(xlsxBuffer, 'data.xlsx')

          // Both should parse successfully
          expect(csvResult.success).toBe(true)
          expect(xlsxResult.success).toBe(true)

          if (csvResult.success && xlsxResult.success) {
            // Same headers
            expect(csvResult.data.headers).toEqual(xlsxResult.data.headers)
            // Same row values
            expect(csvResult.data.rows).toEqual(xlsxResult.data.rows)
            // Same totalRows
            expect(csvResult.data.totalRows).toEqual(xlsxResult.data.totalRows)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL produce the same totalRows count for both formats', () => {
    fc.assert(
      fc.property(
        tabularDataArb,
        ({ headers, rows }) => {
          const csvBuffer = createCsvBuffer(headers, rows)
          const xlsxBuffer = createExcelBuffer(headers, rows)

          const csvResult = parseFile(csvBuffer, 'file.csv')
          const xlsxResult = parseFile(xlsxBuffer, 'file.xlsx')

          expect(csvResult.success).toBe(true)
          expect(xlsxResult.success).toBe(true)

          if (csvResult.success && xlsxResult.success) {
            expect(csvResult.data.totalRows).toBe(rows.length)
            expect(xlsxResult.data.totalRows).toBe(rows.length)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL produce equivalent headers regardless of format', () => {
    fc.assert(
      fc.property(
        tabularDataArb,
        ({ headers, rows }) => {
          const csvBuffer = createCsvBuffer(headers, rows)
          const xlsxBuffer = createExcelBuffer(headers, rows)

          const csvResult = parseFile(csvBuffer, 'test.csv')
          const xlsxResult = parseFile(xlsxBuffer, 'test.xlsx')

          expect(csvResult.success).toBe(true)
          expect(xlsxResult.success).toBe(true)

          if (csvResult.success && xlsxResult.success) {
            expect(csvResult.data.headers).toEqual(headers)
            expect(xlsxResult.data.headers).toEqual(headers)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('SHALL produce equivalent row data indexed by header regardless of format', () => {
    fc.assert(
      fc.property(
        tabularDataArb,
        ({ headers, rows }) => {
          const csvBuffer = createCsvBuffer(headers, rows)
          const xlsxBuffer = createExcelBuffer(headers, rows)

          const csvResult = parseFile(csvBuffer, 'check.csv')
          const xlsxResult = parseFile(xlsxBuffer, 'check.xlsx')

          expect(csvResult.success).toBe(true)
          expect(xlsxResult.success).toBe(true)

          if (csvResult.success && xlsxResult.success) {
            // For each row, each header key should map to the same value
            for (let i = 0; i < rows.length; i++) {
              for (let j = 0; j < headers.length; j++) {
                const header = headers[j]
                expect(csvResult.data.rows[i][header]).toBe(xlsxResult.data.rows[i][header])
                expect(csvResult.data.rows[i][header]).toBe(rows[i][j])
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
