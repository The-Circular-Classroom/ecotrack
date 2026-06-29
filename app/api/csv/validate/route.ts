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
