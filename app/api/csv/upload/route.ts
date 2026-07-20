import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { validateFile } from '@/lib/storage/validation'
import { generateUniqueFilename } from '@/lib/storage/filename'
import { requireRole } from '@/lib/auth/roles'

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
      { error: 'forbidden', message: 'PsgVolunteer or higher access required' },
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

  // Validate file type and size
  const validation = validateFile(file.name, file.size, 'donations')
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'validation_failed', message: validation.error },
      { status: 400 }
    )
  }

  // Generate unique filename
  const uniqueFilename = generateUniqueFilename(file.name, userId)
  const storagePath = `pre-processing/${uniqueFilename}`

  // Upload to Supabase Storage
  const supabase = await createSupabaseServerClient()
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('donations')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) {
    return NextResponse.json(
      { error: 'upload_failed', message: 'Failed to upload file' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { path: storagePath, filename: uniqueFilename },
    { status: 201 }
  )
}
