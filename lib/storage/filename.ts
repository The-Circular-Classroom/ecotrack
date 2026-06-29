/**
 * Unique filename generation for Supabase Storage uploads.
 *
 * Combines the original filename stem, user ID, and timestamp to produce
 * a unique storage filename. The timestamp parameter is injectable for
 * deterministic testing.
 *
 * @module lib/storage/filename
 * @validates Requirements 6.2
 */

/**
 * Extracts the stem (name without extension) and extension from a filename.
 * Handles edge cases: multiple dots, no extension, leading dots (dotfiles).
 */
function parseFilename(filename: string): { stem: string; ext: string } {
  // Remove any directory separators — only care about the final filename part
  const basename = filename.replace(/^.*[/\\]/, '')

  // Handle empty string
  if (!basename) {
    return { stem: '', ext: '' }
  }

  // Find the last dot that isn't the first character (dotfiles like .gitignore keep the dot as part of the stem)
  const lastDotIndex = basename.lastIndexOf('.')

  if (lastDotIndex <= 0) {
    // No extension: either no dot at all, or the dot is at position 0 (dotfile with no further extension)
    return { stem: basename, ext: '' }
  }

  return {
    stem: basename.slice(0, lastDotIndex),
    ext: basename.slice(lastDotIndex + 1),
  }
}

/**
 * Generates a unique filename for storage by combining the original filename stem,
 * user ID, and a timestamp.
 *
 * Format: `{stem}_{userId}_{timestamp}.{ext}` (or `{stem}_{userId}_{timestamp}` if no extension)
 *
 * @param originalFilename - The original filename (may include path, extension, multiple dots)
 * @param userId - The uploader's user ID
 * @param timestamp - Unix epoch milliseconds (defaults to Date.now() for production use)
 * @returns A unique filename string
 *
 * @example
 * generateUniqueFilename('donations.csv', 'user123', 1700000000000)
 * // => 'donations_user123_1700000000000.csv'
 *
 * generateUniqueFilename('my.report.2024.xlsx', 'abc', 1700000000000)
 * // => 'my.report.2024_abc_1700000000000.xlsx'
 */
export function generateUniqueFilename(
  originalFilename: string,
  userId: string,
  timestamp: number = Date.now()
): string {
  const { stem, ext } = parseFilename(originalFilename)

  const uniqueName = `${stem}_${userId}_${timestamp}`

  if (ext) {
    return `${uniqueName}.${ext}`
  }

  return uniqueName
}
