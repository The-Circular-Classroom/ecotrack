import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createApiLogger } from '@/lib/logger'

/**
 * POST /api/donation-drive/deny-file
 * Body: { key: string }
 * Requester: Admin
 * Logic: Moves a pending CSV file from pre-processing/ to failed/ in Supabase storage.
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/donation-drive/deny-file')
  const role = request.headers.get('x-user-role')

  if (!requireRole(role, 'Admin')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  let body: { key?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Request body must be valid JSON' },
      { status: 400 }
    )
  }

  let { key } = body
  if (!key || typeof key !== 'string') {
    return NextResponse.json(
      { error: 'missing_field', message: 'key is required' },
      { status: 400 }
    )
  }

  // Normalize key: strip donations/ bucket prefix if sent from legacy
  let normalizedKey = key.replace(/^\/+/, '').trim()
  if (normalizedKey.startsWith('donations/')) {
    normalizedKey = normalizedKey.substring('donations/'.length)
  }

  if (!normalizedKey.startsWith('pre-processing/')) {
    return NextResponse.json(
      { error: 'invalid_key', message: 'Key must be under pre-processing/ folder' },
      { status: 400 }
    )
  }

  const fileName = normalizedKey.substring('pre-processing/'.length)
  if (!fileName) {
    return NextResponse.json(
      { error: 'invalid_key', message: 'Invalid key: missing file name' },
      { status: 400 }
    )
  }

  const failedPath = 'failed/' + fileName

  try {
    const supabase = await createSupabaseServerClient()
    const { error: moveError } = await supabase.storage
      .from('donations')
      .move(normalizedKey, failedPath)

    if (moveError) {
      logger.error('Failed to move file in storage', { error: moveError.message })
      return NextResponse.json(
        { error: 'move_failed', message: `Failed to move file to failed: ${moveError.message}` },
        { status: 500 }
      )
    }

    logger.info('File denied and moved to failed', { key: failedPath })
    return NextResponse.json({
      success: true,
      message: 'File moved to failed.',
      data: { key: 'donations/' + failedPath, previousKey: key }
    })
  } catch (error: any) {
    logger.error('Error denying donation file', { error: error.message })
    return NextResponse.json(
      { error: 'deny_failed', message: error.message },
      { status: 500 }
    )
  }
}
