export type BucketType = 'donations' | 'images'

export interface FileValidationResult {
  valid: boolean
  error?: string
}

const BUCKET_SIZE_LIMITS: Record<BucketType, number> = {
  donations: 10 * 1024 * 1024, // 10 MB
  images: 5 * 1024 * 1024,     // 5 MB
}

const BUCKET_ALLOWED_EXTENSIONS: Record<BucketType, string[]> = {
  donations: ['csv', 'xls', 'xlsx'],
  images: ['png', 'jpg', 'jpeg', 'webp'],
}

function bytesToMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2)
}

export function validateFileSize(sizeBytes: number, bucket: BucketType): FileValidationResult {
  const maxBytes = BUCKET_SIZE_LIMITS[bucket]

  if (sizeBytes > maxBytes) {
    return {
      valid: false,
      error: `File size ${bytesToMB(sizeBytes)}MB exceeds maximum allowed size of ${bytesToMB(maxBytes)}MB for ${bucket} bucket`,
    }
  }

  return { valid: true }
}

export function validateFileType(filename: string, bucket: BucketType): FileValidationResult {
  const allowedExtensions = BUCKET_ALLOWED_EXTENSIONS[bucket]
  const lastDotIndex = filename.lastIndexOf('.')

  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return {
      valid: false,
      error: `File type '' is not allowed for ${bucket} bucket. Accepted formats: ${allowedExtensions.map(e => `.${e}`).join(', ')}`,
    }
  }

  const extension = filename.slice(lastDotIndex + 1).toLowerCase()

  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File type '.${extension}' is not allowed for ${bucket} bucket. Accepted formats: ${allowedExtensions.map(e => `.${e}`).join(', ')}`,
    }
  }

  return { valid: true }
}

export function validateFile(filename: string, sizeBytes: number, bucket: BucketType): FileValidationResult {
  const typeResult = validateFileType(filename, bucket)
  if (!typeResult.valid) {
    return typeResult
  }

  const sizeResult = validateFileSize(sizeBytes, bucket)
  if (!sizeResult.valid) {
    return sizeResult
  }

  return { valid: true }
}
