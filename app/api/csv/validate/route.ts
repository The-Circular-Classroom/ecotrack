import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole } from '@/lib/auth/roles'
import { parseFile } from '@/lib/csv/parser'
import { validateDonationCsv } from '@/lib/csv/validator'

/**
 * POST /api/csv/validate
 *
 * Triggered after a CSV file is uploaded to pre-processing/.
 * Downloads the file from Supabase Storage, parses it, validates each row
 * against the database, and moves the file to validated/ or failed/ depending on results.
 *
 * Body: { filePath: string } — the path in the donations bucket (e.g., "pre-processing/filename.csv")
 * Requires: SchoolStaff+ role
 *
 * Requirements: 7.5, 7.6
 */
export async function GET(request: NextRequest) {
  // Check authentication
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')

  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Authentication required' },
      { status: 401 }
    )
  }

  // Require SchoolStaff+ role
  if (!requireRole(userRole, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff or higher role required' },
      { status: 403 }
    )
  }

  const supabase = await createSupabaseServerClient()
  const key = request.nextUrl.searchParams.get('key')

  if (key) {
    const normalizedKey = key.replace(/^\/+/, '')
    const allowedPrefixes = ['failed/', 'pre-processing/', 'validated/']
    const isAllowed = allowedPrefixes.some((p) => normalizedKey.startsWith(p))
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'invalid_key', message: 'Requested file key is not authorized' },
        { status: 400 }
      )
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('donations')
      .download(normalizedKey)

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: 'download_failed', message: `Failed to download file: ${downloadError?.message ?? 'File not found'}` },
        { status: 404 }
      )
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filename = normalizedKey.split('/').pop() ?? normalizedKey

    // Parse the file
    const parseResult = parseFile(buffer, filename)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'parse_failed', message: parseResult.error.message },
        { status: 422 }
      )
    }

    const { headers, rows } = parseResult.data
    let schoolName: string | null = null
    let uploaderName: string | null = null
    let donationDriveName: string | null = null

    if (rows.length > 0) {
      const firstRow = rows[0]
      const getCaseInsensitiveField = (row: Record<string, string>, fieldName: string) => {
        if (fieldName in row) return row[fieldName]
        const lower = fieldName.toLowerCase()
        const foundKey = Object.keys(row).find((k) => k.toLowerCase() === lower)
        return foundKey ? row[foundKey] : undefined
      }

      const schoolIdVal = getCaseInsensitiveField(firstRow, 'school_id')
      if (schoolIdVal) {
        const schoolId = parseInt(schoolIdVal, 10)
        if (!isNaN(schoolId)) {
          const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { schoolName: true },
          })
          schoolName = school?.schoolName ?? null
        }
      }

      const userIdVal = getCaseInsensitiveField(firstRow, 'user_id')
      if (userIdVal) {
        const uId = parseInt(userIdVal, 10)
        if (!isNaN(uId)) {
          const user = await prisma.user.findUnique({
            where: { id: uId },
            select: { firstName: true, lastName: true, email: true },
          })
          if (user) {
            uploaderName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
          }
        }
      }

      const driveIdVal = getCaseInsensitiveField(firstRow, 'donation_drive_id')
      if (driveIdVal) {
        const driveId = parseInt(driveIdVal, 10)
        if (!isNaN(driveId)) {
          const drive = await prisma.donationDrive.findUnique({
            where: { id: driveId },
            select: { driveName: true },
          })
          donationDriveName = drive?.driveName ?? null
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          headers,
          rows,
          metadata: {
            schoolName,
            uploaderName,
            donationDriveName,
            totalRows: rows.length,
            sourceRows: rows.length,
            hiddenPsgRows: 0,
          },
        },
      },
      { status: 200 }
    )
  }

  try {
    const listFolder = async (folderName: string) => {
      const { data, error } = await supabase.storage
        .from('donations')
        .list(folderName)
      if (error) throw error
      return (data || []).map((file) => ({
        key: `${folderName}/${file.name}`,
        size: file.metadata?.size ?? 0,
        lastModified: file.updated_at || file.created_at || new Date().toISOString(),
        etag: file.id || null,
        folder: folderName,
      }))
    }

    const [failedFiles, pendingFiles, validatedFiles] = await Promise.all([
      listFolder('failed'),
      listFolder('pre-processing'),
      listFolder('validated'),
    ])

    const allFiles = [...failedFiles, ...pendingFiles, ...validatedFiles]

    return NextResponse.json(
      {
        success: true,
        data: {
          folders: ['validated', 'pre-processing', 'failed'],
          count: allFiles.length,
          files: allFiles,
          byFolder: {
            failed: failedFiles.length,
            'pre-processing': pendingFiles.length,
            validated: validatedFiles.length,
          },
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: 'list_failed', message: error.message || 'Failed to list files' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Check authentication
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')

  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Authentication required' },
      { status: 401 }
    )
  }

  // Require SchoolStaff+ role
  if (!requireRole(userRole, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'SchoolStaff or higher role required' },
      { status: 403 }
    )
  }

  // Parse request body
  let body: { filePath?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Request body must be valid JSON' },
      { status: 400 }
    )
  }

  const { filePath } = body
  if (!filePath || typeof filePath !== 'string') {
    return NextResponse.json(
      { error: 'missing_field', message: 'filePath is required' },
      { status: 400 }
    )
  }

  // Download file from Supabase Storage
  const supabase = await createSupabaseServerClient()

  // Try calling the Supabase Edge Function first
  if (typeof supabase.functions?.invoke === 'function') {
    const { data, error } = await supabase.functions.invoke('csv-processing', {
      body: { action: 'validate', filePath },
    })

    if (!error && data) {
      return NextResponse.json(data, { status: data.success ? 200 : 422 })
    }

    if (error) {
      return NextResponse.json(
        { error: 'function_failed', message: error.message },
        { status: 500 }
      )
    }
  }

  // Fallback to local processing if Supabase function invoker is not defined (e.g. in tests)
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('donations')
    .download(filePath)

  if (downloadError || !fileData) {
    return NextResponse.json(
      { error: 'download_failed', message: `Failed to download file: ${downloadError?.message ?? 'File not found'}` },
      { status: 404 }
    )
  }

  // Convert Blob to Buffer
  const arrayBuffer = await fileData.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Extract filename from path for parser
  const filename = filePath.split('/').pop() ?? filePath

  // Parse the file
  const parseResult = parseFile(buffer, filename)
  if (!parseResult.success) {
    // Move to failed/ folder
    const failedPath = filePath.replace(/^pre-processing\//, 'failed/')
    await supabase.storage.from('donations').move(filePath, failedPath)

    return NextResponse.json(
      {
        error: 'parse_failed',
        message: parseResult.error.message,
        filePath: failedPath,
      },
      { status: 422 }
    )
  }

  // Validate rows against database
  const validationResult = await validateDonationCsv(parseResult.data.rows, prisma)

  if (validationResult.valid) {
    // All rows valid: move to validated/ folder
    const validatedPath = filePath.replace(/^pre-processing\//, 'validated/')
    const { error: moveError } = await supabase.storage
      .from('donations')
      .move(filePath, validatedPath)

    if (moveError) {
      return NextResponse.json(
        {
          error: 'move_failed',
          message: `Validation passed but failed to move file: ${moveError.message}`,
          validation: validationResult,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        status: 'validated',
        filePath: validatedPath,
        totalRows: parseResult.data.totalRows,
        validRows: validationResult.validRows,
      },
      { status: 200 }
    )
  } else {
    // Validation errors: move to failed/ folder
    const failedPath = filePath.replace(/^pre-processing\//, 'failed/')
    const { error: moveError } = await supabase.storage
      .from('donations')
      .move(filePath, failedPath)

    if (moveError) {
      return NextResponse.json(
        {
          error: 'move_failed',
          message: `Validation failed and could not move file: ${moveError.message}`,
          validation: validationResult,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        status: 'failed',
        filePath: failedPath,
        totalRows: parseResult.data.totalRows,
        validRows: validationResult.validRows,
        invalidRows: validationResult.invalidRows,
        errors: validationResult.errors,
      },
      { status: 422 }
    )
  }
}
