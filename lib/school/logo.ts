/**
 * Helper to resolve school logo URLs.
 * Handles full HTTP URLs, relative storage paths in Supabase `static-assets` bucket,
 * API proxy routes, and default fallbacks.
 */
export function resolveSchoolLogoUrl(
  logoUrl?: string | null,
  schoolId?: number | string
): string {
  if (logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== '') {
    const trimmed = logoUrl.trim()
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed
    }
    const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/static-assets/${cleanPath}`
    }
  }

  if (schoolId) {
    return `/api/school/${schoolId}/logo`
  }

  return '/images/Logo-Symbol-green-stem.png'
}
