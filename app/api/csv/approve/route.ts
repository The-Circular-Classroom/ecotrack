import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole } from '@/lib/auth/roles'
import { parseFile } from '@/lib/csv/parser'
import { processApprovedCsv } from '@/lib/csv/processor'

/**
 * POST /api/csv/approve
 *
 * Admin approves a validated CSV file, triggering the processor to create
 * Transaction and InventoryBalance records in the database atomically.
 *
 * Body: { filePath: string } — the path to the validated file (e.g., "validated/filename.csv")
 * Requires: Admin role only
 *
 * Requirements: 7.7, 7.10
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

  // Require Admin role
  if (!requireRole(userRole, 'Admin')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Admin role required' },
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

  // Verify the file is in the validated/ folder
  if (!filePath.startsWith('validated/')) {
    return NextResponse.json(
      { error: 'invalid_path', message: 'File must be in the validated/ folder' },
      { status: 400 }
    )
  }

  // Download file from Supabase Storage
  const supabase = await createSupabaseServerClient()

  // Try calling the Supabase Edge Function first
  if (typeof supabase.functions?.invoke === 'function') {
    const { data, error } = await supabase.functions.invoke('csv-processing', {
      body: { action: 'approve', filePath, approverUserId: userId },
    })

    if (!error && data) {
      if (data.error === 'processing_failed') {
        return NextResponse.json(
          { error: 'processing_failed', message: data.message },
          { status: 500 }
        )
      }
      return NextResponse.json(data, { status: 200 })
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
    return NextResponse.json(
      {
        error: 'parse_failed',
        message: parseResult.error.message,
      },
      { status: 422 }
    )
  }

  // Process the approved CSV — creates transactions and updates balances atomically
  const result = await processApprovedCsv(
    parseResult.data.rows,
    prisma,
    supabase,
    filePath,
    userId
  )

  if (result.success) {
    return NextResponse.json(
      {
        status: 'processed',
        transactionsCreated: result.transactionsCreated,
        balancesUpdated: result.balancesUpdated,
        ...(result.error ? { warning: result.error } : {}),
      },
      { status: 200 }
    )
  } else {
    // Processing failed — file remains in validated/, all DB changes rolled back
    return NextResponse.json(
      {
        error: 'processing_failed',
        message: result.error ?? 'Failed to process CSV file',
      },
      { status: 500 }
    )
  }
}
