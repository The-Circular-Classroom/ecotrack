import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { parseFile, ParseOutcome } from './parser'

function createCsvBuffer(content: string): Buffer {
  return Buffer.from(content, 'utf-8')
}

function createExcelBuffer(headers: string[], rows: string[][]): Buffer {
  const wb = XLSX.utils.book_new()
  const data = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

describe('parseFile', () => {
  describe('CSV parsing', () => {
    it('parses a valid CSV file with headers and data rows', () => {
      const csv = 'item_type_id,size_name,user_id,school_id,donation_drive_id,to_stored_at,quantity,to_status\n1,M,10,5,3,warehouse,2,ForSale'
      const result = parseFile(createCsvBuffer(csv), 'donations.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.headers).toEqual([
          'item_type_id', 'size_name', 'user_id', 'school_id',
          'donation_drive_id', 'to_stored_at', 'quantity', 'to_status',
        ])
        expect(result.data.rows).toHaveLength(1)
        expect(result.data.rows[0].item_type_id).toBe('1')
        expect(result.data.rows[0].size_name).toBe('M')
        expect(result.data.rows[0].quantity).toBe('2')
        expect(result.data.totalRows).toBe(1)
      }
    })

    it('parses multiple rows correctly', () => {
      const csv = 'item_type_id,quantity\n1,5\n2,10\n3,15'
      const result = parseFile(createCsvBuffer(csv), 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rows).toHaveLength(3)
        expect(result.data.totalRows).toBe(3)
        expect(result.data.rows[0].item_type_id).toBe('1')
        expect(result.data.rows[1].quantity).toBe('10')
        expect(result.data.rows[2].quantity).toBe('15')
      }
    })

    it('trims whitespace from headers and values', () => {
      const csv = ' item_type_id , quantity \n 1 , 5 '
      const result = parseFile(createCsvBuffer(csv), 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.headers).toEqual(['item_type_id', 'quantity'])
        expect(result.data.rows[0].item_type_id).toBe('1')
        expect(result.data.rows[0].quantity).toBe('5')
      }
    })

    it('skips completely empty rows', () => {
      const csv = 'item_type_id,quantity\n1,5\n,,\n2,10'
      const result = parseFile(createCsvBuffer(csv), 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rows).toHaveLength(2)
        expect(result.data.totalRows).toBe(2)
      }
    })
  })

  describe('Excel parsing', () => {
    it('parses a valid .xlsx file', () => {
      const headers = ['item_type_id', 'size_name', 'quantity']
      const rows = [['1', 'M', '5'], ['2', 'L', '10']]
      const buffer = createExcelBuffer(headers, rows)
      const result = parseFile(buffer, 'donations.xlsx')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.headers).toEqual(headers)
        expect(result.data.rows).toHaveLength(2)
        expect(result.data.rows[0].item_type_id).toBe('1')
        expect(result.data.rows[1].size_name).toBe('L')
        expect(result.data.totalRows).toBe(2)
      }
    })

    it('accepts .xls extension', () => {
      const headers = ['item_type_id', 'quantity']
      const rows = [['1', '5']]
      const buffer = createExcelBuffer(headers, rows)
      const result = parseFile(buffer, 'donations.xls')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rows).toHaveLength(1)
      }
    })
  })

  describe('error cases', () => {
    it('returns error for empty file (no data rows after header)', () => {
      const csv = 'item_type_id,size_name,quantity'
      const result = parseFile(createCsvBuffer(csv), 'empty.csv')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe('File contains no valid data rows')
      }
    })

    it('returns error for file with only empty rows after header', () => {
      const csv = 'item_type_id,quantity\n,,\n,,'
      const result = parseFile(createCsvBuffer(csv), 'empty.csv')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe('File contains no valid data rows')
      }
    })

    it('returns error for completely empty file', () => {
      const result = parseFile(Buffer.from(''), 'empty.csv')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe('File contains no valid data rows')
      }
    })

    it('returns error for unsupported file format', () => {
      const result = parseFile(Buffer.from('data'), 'file.pdf')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('Unsupported file format')
      }
    })
  })

  describe('format equivalence', () => {
    it('produces the same result for CSV and Excel with identical data', () => {
      const headers = ['item_type_id', 'size_name', 'quantity']
      const rows = [['1', 'M', '5'], ['2', 'L', '10']]

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const csvResult = parseFile(createCsvBuffer(csvContent), 'test.csv')
      const xlsxResult = parseFile(createExcelBuffer(headers, rows), 'test.xlsx')

      expect(csvResult.success).toBe(true)
      expect(xlsxResult.success).toBe(true)
      if (csvResult.success && xlsxResult.success) {
        expect(csvResult.data.headers).toEqual(xlsxResult.data.headers)
        expect(csvResult.data.rows).toEqual(xlsxResult.data.rows)
        expect(csvResult.data.totalRows).toEqual(xlsxResult.data.totalRows)
      }
    })
  })
})
