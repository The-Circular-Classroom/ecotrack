import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { validateFile } from '@/lib/storage/validation'
import { generateUniqueFilename } from '@/lib/storage/filename'
import { prisma } from '@/lib/prisma/client'
import { requireRole } from '@/lib/auth/roles'

type EntityType = 'item_type' | 'school'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'User ID required' },
      { status: 401 }
    )
  }

  const userRole = request.headers.get('x-user-role')
  if (!requireRole(userRole, 'SchoolStaff')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as string | null
  const entityId = formData.get('entityId') as string | null

  if (!file) {
    return NextResponse.json(
      { error: 'missing_file', message: 'No file provided' },
      { status: 400 }
    )
  }

  if (!type || !['item_type', 'school'].includes(type)) {
    return NextResponse.json(
      { error: 'invalid_type', message: "Field 'type' must be 'item_type' or 'school'" },
      { status: 400 }
    )
  }

  if (!entityId) {
    return NextResponse.json(
      { error: 'missing_entity_id', message: "Field 'entityId' is required" },
      { status: 400 }
    )
  }

  // Validate file type and size
  const validation = validateFile(file.name, file.size, 'images')
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'validation_failed', message: validation.error },
      { status: 400 }
    )
  }

  const entityType = type as EntityType
  const entityIdNum = parseInt(entityId, 10)
  if (isNaN(entityIdNum)) {
    return NextResponse.json(
      { error: 'invalid_entity_id', message: "'entityId' must be a valid integer" },
      { status: 400 }
    )
  }

  // Check entity exists and get current image URL
  let existingImageUrl: string | null = null
  try {
    if (entityType === 'item_type') {
      const itemType = await prisma.itemType.findUnique({
        where: { id: entityIdNum },
        select: { imageUrl: true },
      })
      if (!itemType) {
        return NextResponse.json(
          { error: 'not_found', message: 'Item type not found' },
          { status: 404 }
        )
      }
      existingImageUrl = itemType.imageUrl
    } else {
      const school = await prisma.school.findUnique({
        where: { id: entityIdNum },
        select: { logoUrl: true },
      })
      if (!school) {
        return NextResponse.json(
          { error: 'not_found', message: 'School not found' },
          { status: 404 }
        )
      }
      existingImageUrl = school.logoUrl
    }
  } catch {
    return NextResponse.json(
      { error: 'db_error', message: 'Failed to look up entity' },
      { status: 500 }
    )
  }

  const supabase = await createSupabaseServerClient()

  // If entity already has an image, delete the old one from storage
  if (existingImageUrl) {
    const oldPath = extractStoragePath(existingImageUrl)
    if (oldPath) {
      await supabase.storage.from('images').remove([oldPath])
    }
  }

  // Generate unique filename and upload
  const uniqueFilename = generateUniqueFilename(file.name, userId)
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(uniqueFilename, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json(
      { error: 'upload_failed', message: 'Failed to upload image' },
      { status: 500 }
    )
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('images')
    .getPublicUrl(uniqueFilename)

  const publicUrl = publicUrlData.publicUrl

  // Update entity record with the new image URL
  try {
    if (entityType === 'item_type') {
      await prisma.itemType.update({
        where: { id: entityIdNum },
        data: { imageUrl: publicUrl },
      })
    } else {
      await prisma.school.update({
        where: { id: entityIdNum },
        data: { logoUrl: publicUrl },
      })
    }
  } catch {
    // Attempt to clean up uploaded file on DB failure
    await supabase.storage.from('images').remove([uniqueFilename])
    return NextResponse.json(
      { error: 'db_error', message: 'Failed to update entity record' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { url: publicUrl, filename: uniqueFilename },
    { status: 200 }
  )
}

/**
 * Extracts the storage path from a Supabase public URL.
 * Public URLs have the format: {SUPABASE_URL}/storage/v1/object/public/images/{path}
 */
function extractStoragePath(publicUrl: string): string | null {
  const marker = '/storage/v1/object/public/images/'
  const index = publicUrl.indexOf(marker)
  if (index === -1) return null
  return publicUrl.slice(index + marker.length)
}
