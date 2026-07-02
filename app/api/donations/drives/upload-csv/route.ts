import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import * as XLSX from 'xlsx'

const FLAT_DONATION_HEADERS = [
  'item_type_id',
  'item_name',
  'colour_name',
  'gender',
  'user_id',
  'school_id',
  'donation_drive_id',
  'to_stored_at',
  'quantity',
  'to_status',
  'size_name',
  'remarks',
]

const RAW_DONATION_REQUIRED_HEADERS = [
  'school name',
  'donation drive',
  'start date',
  'end date',
  'item type id',
  'item name',
  'user id',
  'school id',
  'donation drive id',
  'size name',
  'storage location',
]

const RAW_DONATION_HEADER_ALIASES: Record<string, string[]> = {
  'donation drive': ['name of donation drive'],
}

const RAW_DONATION_METRIC_HEADERS = [
  { header: 'for psg activities', status: 'for_psg' },
  { header: 'for school', status: 'for_school_stock' },
  { header: 'for school stock', status: 'for_school_stock' },
  { header: 'for tcc repurposing', status: 'for_repurposing' },
  { header: 'for repurposing for tcc storage', status: 'for_repurposing' },
  { header: 'for recycling/disposal', status: 'for_recycling_disposal' },
]

function isRawDonationCsv(headers: string[]): boolean {
  const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()))
  return (
    headerSet.has('school name') &&
    (headerSet.has('donation drive') || headerSet.has('name of donation drive'))
  )
}

function hasRawHeader(headerSet: Set<string>, header: string): boolean {
  if (headerSet.has(header)) return true
  const aliases = RAW_DONATION_HEADER_ALIASES[header] || []
  return aliases.some((alias) => headerSet.has(alias))
}

function parseCsvDate(value: any): Date | null {
  const text = String(value || '').trim()
  if (!text) return null

  // Check if it is an Excel serial date number
  const num = Number(text)
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const date = new Date(Math.round((num - 25569) * 86400 * 1000))
    if (!isNaN(date.getTime())) return date
  }

  const nativeDate = new Date(text)
  if (!isNaN(nativeDate.getTime())) return nativeDate

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const [, dayText, monthText, yearText] = slashMatch
    const day = Number(dayText)
    const month = Number(monthText)
    const year = Number(yearText)
    const parsed = new Date(Date.UTC(year, month - 1, day))
    if (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ) {
      return parsed
    }
  }

  return null
}

function normalizeRawStorageLocation(value: any): string {
  return String(value || '').trim().toLowerCase()
}

function safeIntegerQuantity(value: any): number | null {
  const text = String(value ?? '').trim()
  if (!text) return 0
  const numberValue = Number(text)
  if (!Number.isInteger(numberValue)) return null
  return numberValue
}

function buildRawDonationFlatRows(
  headers: string[],
  dataRows: any[][],
  isAdmin: boolean
): { errors: string[]; flatRows: any[] } {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim())
  const headerSet = new Set(normalizedHeaders)
  const errors: string[] = []
  const flatRows: any[] = []

  const missingHeaders = RAW_DONATION_REQUIRED_HEADERS.filter(
    (h) => !hasRawHeader(headerSet, h)
  )
  if (missingHeaders.length > 0) {
    return {
      errors: [`Missing required raw CSV headers: ${missingHeaders.join(', ')}`],
      flatRows,
    }
  }

  const usableMetricHeaders = RAW_DONATION_METRIC_HEADERS.filter(
    (m) => headerSet.has(m.header) && !(isAdmin && m.status === 'for_psg')
  )

  if (usableMetricHeaders.length === 0) {
    return {
      errors: ['Raw CSV must contain at least one item categorization metric quantity column.'],
      flatRows,
    }
  }

  dataRows.forEach((rowArray, rowIndex) => {
    const actualRowNumber = rowIndex + 2
    if (
      !rowArray ||
      rowArray.every(
        (val) => val === null || val === undefined || String(val).trim() === ''
      )
    ) {
      return
    }

    const row: Record<string, string> = {}
    normalizedHeaders.forEach((h, index) => {
      const cellValue = rowArray[index]
      row[h] = cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : ''
    })

    Object.entries(RAW_DONATION_HEADER_ALIASES).forEach(([header, aliases]) => {
      if (row[header]) return
      const alias = aliases.find((a) => row[a])
      if (alias) row[header] = row[alias]
    })

    // Formula injection checks
    Object.entries(row).forEach(([field, value]) => {
      if (!value) return
      const firstChar = String(value).charAt(0)
      if (['=', '+', '@', '\t', '\r'].includes(firstChar)) {
        errors.push(`Row ${actualRowNumber}: '${field}' starts with '${firstChar}' which could be a formula injection attempt`)
      } else if (firstChar === '-' && String(value).length > 1 && !/^-?\d/.test(String(value))) {
        errors.push(`Row ${actualRowNumber}: '${field}' starts with '-' which could be a formula injection attempt`)
      }
    })

    RAW_DONATION_REQUIRED_HEADERS.forEach((h) => {
      if (!row[h]) errors.push(`Row ${actualRowNumber}: Missing value for '${h}'`)
    })

    const startDate = parseCsvDate(row['start date'])
    const endDate = parseCsvDate(row['end date'])
    if (!startDate) errors.push(`Row ${actualRowNumber}: Start Date must be a valid date.`)
    if (!endDate) errors.push(`Row ${actualRowNumber}: End Date must be a valid date.`)
    if (startDate && endDate && endDate < startDate) {
      errors.push(`Row ${actualRowNumber}: End Date must be on or after Start Date.`)
    }

    const storedAt = normalizeRawStorageLocation(row['storage location'])
    if (!['school', 'tcc'].includes(storedAt)) {
      errors.push(`Row ${actualRowNumber}: Storage Location must be School or TCC.`)
    }

    usableMetricHeaders.forEach((metric) => {
      const quantity = safeIntegerQuantity(row[metric.header])
      if (quantity === null) {
        errors.push(`Row ${actualRowNumber}: ${metric.header} must be an integer quantity.`)
        return
      }
      if (quantity < 0) {
        errors.push(`Row ${actualRowNumber}: ${metric.header} cannot be negative.`)
        return
      }
      if (quantity > 10000) {
        errors.push(`Row ${actualRowNumber}: ${metric.header} exceeds maximum limit of 10,000.`)
        return
      }
      if (quantity === 0) return

      if (storedAt === 'tcc' && metric.status === 'for_psg') {
        return
      }

      if (storedAt === 'school' && metric.status === 'for_repurposing') {
        errors.push(`Row ${actualRowNumber}: For TCC Repurposing is only allowed when Storage Location is TCC.`)
        return
      }

      flatRows.push({
        item_type_id: row['item type id'],
        item_name: row['item name'],
        colour_name: row['colour'] || '',
        gender: row['gender'] || 'Unisex',
        user_id: row['user id'] || row['user_id'] || '',
        school_id: row['school id'] || row['school_id'] || '',
        donation_drive_id: row['donation drive id'] || row['donation_drive_id'] || '',
        to_stored_at: storedAt,
        quantity: quantity,
        to_status: metric.status,
        size_name: row['size name'] || 'One Size',
        remarks: row['remarks'] || '',
      })
    })
  })

  if (errors.length === 0 && flatRows.length === 0) {
    errors.push('Enter at least one item categorization metric quantity.')
  }

  return { errors, flatRows }
}

function rowsToXlsxBuffer(rows: any[]): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: FLAT_DONATION_HEADERS })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Donations')
  return Buffer.from(XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }))
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')

  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'User ID required' },
      { status: 401 }
    )
  }

  if (!requireRole(userRole, 'PsgVolunteer')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'PSG Volunteer or higher role required' },
      { status: 403 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json(
      { error: 'missing_file', message: 'No file provided' },
      { status: 400 }
    )
  }

  // Basic format validations
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
    return NextResponse.json(
      { error: 'invalid_format', message: 'Please upload a CSV (.csv) or Excel (.xls, .xlsx) file.' },
      { status: 400 }
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  let fileBuffer: any = Buffer.from(arrayBuffer)
  let headers: string[] = []
  let dataRows: any[][] = []

  const isExcel = extension === 'xlsx' || extension === 'xls'
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames.includes('Donations')
      ? 'Donations'
      : workbook.SheetNames[0]
    
    if (!sheetName) {
      return NextResponse.json(
        { error: 'empty_file', message: 'The file contains no valid sheets.' },
        { status: 400 }
      )
    }

    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (!jsonData || jsonData.length < 2) {
      return NextResponse.json(
        { error: 'empty_file', message: 'The file must have a header row and at least one data row.' },
        { status: 400 }
      )
    }

    headers = jsonData[0].map((h) => String(h ?? '').trim().toLowerCase())
    dataRows = jsonData.slice(1).filter((row) =>
      row && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: 'parse_failed', message: `Failed to parse file: ${err.message}` },
      { status: 400 }
    )
  }

  // Check unique headers
  const uniqueHeaders = [...new Set(headers)]
  if (uniqueHeaders.length !== headers.length) {
    return NextResponse.json(
      { error: 'duplicate_headers', message: 'File contains duplicate headers' },
      { status: 400 }
    )
  }

  const isRawLayout = !isExcel && isRawDonationCsv(headers)
  const isAdmin = userRole === 'Admin'

  if (isRawLayout) {
    const { errors, flatRows } = buildRawDonationFlatRows(headers, dataRows, isAdmin)

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'validation_failed',
          message: `CSV validation failed with ${errors.length} error(s)`,
          errors: errors.slice(0, 50),
          totalErrors: errors.length,
        },
        { status: 400 }
      )
    }

    // Convert flat rows to Excel
    fileBuffer = rowsToXlsxBuffer(flatRows)
  } else {
    // Validate flat CSV layout
    const expectedHeaders = FLAT_DONATION_HEADERS
    const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: 'missing_headers', message: 'Missing required headers', missingHeaders, expectedHeaders },
        { status: 400 }
      )
    }

    if (dataRows.length > 1000) {
      return NextResponse.json(
        { error: 'too_many_rows', message: `The maximum allowed is 1,000 rows. Found: ${dataRows.length}` },
        { status: 400 }
      )
    }

    // Row validations
    const validationErrors: string[] = []
    const requiredHeaders = ['item_type_id', 'to_stored_at', 'quantity', 'to_status', 'size_name']
    const validStatusValues = ['for_psg', 'for_school_stock', 'for_repurposing', 'for_recycling_disposal']
    const validStoredAtValues = ['school', 'tcc']

    dataRows.forEach((rowArray, rowIndex) => {
      const actualRowNumber = rowIndex + 2
      const rowData: Record<string, string> = {}
      headers.forEach((h, index) => {
        const val = rowArray[index]
        rowData[h] = val !== null && val !== undefined ? String(val).trim() : ''
      })

      // Formula injection
      Object.entries(rowData).forEach(([field, value]) => {
        if (value && typeof value === 'string' && value.length > 0) {
          const firstChar = value.charAt(0)
          if (['=', '+', '@', '\t', '\r'].includes(firstChar)) {
            validationErrors.push(`Row ${actualRowNumber}: "${field}" contains an invalid value — cell data cannot start with "${firstChar}".`)
          } else if (firstChar === '-' && value.length > 1 && !/^-?\d/.test(value)) {
            validationErrors.push(`Row ${actualRowNumber}: "${field}" contains an invalid value — cell data cannot start with "-" unless it is a number.`)
          }
        }
      })

      // Remarks checks
      const remarks = rowData['remarks']
      if (remarks && remarks.length > 0) {
        if (/[<>{}`';\x00$]/.test(remarks)) {
          validationErrors.push(`Row ${actualRowNumber}: Remarks contains a disallowed character.`)
        }
        if (remarks.length > 500) {
          validationErrors.push(`Row ${actualRowNumber}: Remarks is too long (Max 500 characters).`)
        }
      }

      requiredHeaders.forEach((h) => {
        if (!rowData[h]) {
          validationErrors.push(`Row ${actualRowNumber}: "${h}" is required but was left blank.`)
        }
      })

      const qty = rowData['quantity']
      if (qty) {
        const qtyNum = Number(qty)
        if (isNaN(qtyNum) || !Number.isInteger(qtyNum)) {
          validationErrors.push(`Row ${actualRowNumber}: Quantity must be a whole number. Found: "${qty}".`)
        } else if (qtyNum <= 0) {
          validationErrors.push(`Row ${actualRowNumber}: Quantity must be at least 1.`)
        } else if (qtyNum > 10000) {
          validationErrors.push(`Row ${actualRowNumber}: Quantity cannot exceed 10,000.`)
        }
      }

      const storedAt = rowData['to_stored_at']?.toLowerCase().trim()
      if (storedAt && !validStoredAtValues.includes(storedAt)) {
        validationErrors.push(`Row ${actualRowNumber}: Storage Location must be "school" or "tcc". Found: "${storedAt}".`)
      }

      const status = rowData['to_status']?.toLowerCase().replace(/[\s\/_-]+/g, '_')
      if (status && !validStatusValues.includes(status)) {
        validationErrors.push(`Row ${actualRowNumber}: Invalid status value "${status}".`)
      }

      if (storedAt === 'school' && status === 'for_repurposing') {
        validationErrors.push(`Row ${actualRowNumber}: "for_repurposing" is not allowed for items stored at School.`)
      }
    })

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'validation_failed',
          message: `CSV validation failed with ${validationErrors.length} error(s)`,
          errors: validationErrors.slice(0, 50),
          totalErrors: validationErrors.length,
        },
        { status: 400 }
      )
    }
  }

  // Upload to Supabase Storage
  const supabase = await createSupabaseServerClient()
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `pre-processing/${timestamp}_${sanitizedName}${isRawLayout ? '_converted.xlsx' : ''}`

  const { error: uploadError } = await supabase.storage
    .from('donations')
    .upload(storagePath, fileBuffer, {
      contentType: isRawLayout ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json(
      { error: 'upload_failed', message: `Failed to upload file to storage: ${uploadError.message}` },
      { status: 500 }
    )
  }

  // Trigger Edge Function validation in the background (fire-and-forget)
  if (typeof supabase.functions?.invoke === 'function') {
    supabase.functions.invoke('csv-processing', {
      body: { action: 'validate', filePath: storagePath },
    }).catch((err) => {
      console.error('[upload-csv] Failed to trigger Edge Function validate:', err)
    })
  }

  return NextResponse.json(
    {
      success: true,
      message: 'File validation passed. Uploaded to storage and queued for processing.',
      data: {
        uploadId: timestamp.toString(),
        fileName: file.name,
        fileSize: file.size,
        totalRows: dataRows.length,
        s3Key: storagePath,
        uploadedAt: new Date().toISOString(),
      },
    },
    { status: 202 }
  )
}
