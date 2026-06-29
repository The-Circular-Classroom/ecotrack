/**
 * Pagination utility functions.
 * Extracts clamping logic from route handlers for testability and reuse.
 */

/**
 * Clamps a page size value to the range [1, 100].
 * Returns the default page size (20) for null, undefined, or NaN inputs.
 *
 * @param input - The raw page size value (may be null, undefined, or NaN)
 * @returns The effective page size, guaranteed to be in [1, 100]
 */
export function clampPageSize(input: number | null | undefined): number {
  if (input === null || input === undefined || isNaN(input)) return 20
  return Math.min(100, Math.max(1, input))
}
