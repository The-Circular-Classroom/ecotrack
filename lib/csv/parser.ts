import * as XLSX from 'xlsx'

export interface ParsedRow {
  item_type_id: string
  size_name: string
  user_id: string
  school_id: string
  donation_drive_id: string
  to_stored_at: string
  quantity: string
  to_status: string
  [key: string]: string
}

export interface ParseResult {
  headers: string[]
  rows: ParsedRow[]
  totalRows: number
}

export interface ParseError {
  message: string
}

export type ParseOutcome =
  | { success: true; data: ParseResult }
  | { success: false; error: ParseError }

/**
 * Parses a CSV or Excel file buffer and returns structured row data.
 *
 * @param buffer - The file content as a Buffer
 * @param filename - The original filename (used to determine format from extension)
 * @returns ParseOutcome with either parsed data or an error
 */
export function parseFile(buffer: Buffer, filename: string): ParseOutcome {
  const extension = filename.toLowerCase().split('.').pop()

  if (!extension || !['csv', 'xls', 'xlsx'].includes(extension)) {
    return {
      success: false,
      error: { message: `Unsupported file format: .${extension ?? '(none)'}. Accepted formats: .csv, .xls, .xlsx` },
    }
  }

  const workbook = XLSX.read(buffer, { type: 'buffer' })

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return {
      success: false,
      error: { message: 'File contains no valid data rows' },
    }
  }

  const sheet = workbook.Sheets[sheetName]
  const rawData: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  })

  if (rawData.length === 0) {
    return {
      success: false,
      error: { message: 'File contains no valid data rows' },
    }
  }

  const headers = rawData[0].map((h) => String(h).trim())
  const dataRows = rawData.slice(1)

  // Filter out completely empty rows
  const nonEmptyRows = dataRows.filter((row) =>
    row.some((cell) => String(cell).trim() !== '')
  )

  if (nonEmptyRows.length === 0) {
    return {
      success: false,
      error: { message: 'File contains no valid data rows' },
    }
  }

  const rows: ParsedRow[] = nonEmptyRows.map((row) => {
    const parsedRow: Record<string, string> = {}
    headers.forEach((header, index) => {
      parsedRow[header] = index < row.length ? String(row[index]).trim() : ''
    })
    return parsedRow as ParsedRow
  })

  return {
    success: true,
    data: {
      headers,
      rows,
      totalRows: rows.length,
    },
  }
}
