/**
 * Utility for resolving uniform graphic image URLs from Supabase Storage.
 *
 * The static assets bucket (`static-assets`) stores uniform images under:
 *   uniform-graphics/general/{category_folder}/{Category_Prefix}_-_{colour_slug}.png
 *
 * This module maps the DB category name and colour name to the correct storage path.
 * Falls back to `null` when no matching asset exists.
 */

/**
 * Maps a DB category name to the storage folder name and file-prefix used
 * inside `uniform-graphics/general/`.
 *
 * folder  – the subfolder inside /general/
 * prefix  – the title-case prefix before "_-_" in the filename
 *            e.g. "PE_Shirt" produces "PE_Shirt_-_{colour}.png"
 */
const CATEGORY_TO_STORAGE: Record<string, { folder: string; prefix: string } | null> = {
  'PE Shirt':       { folder: 'pe_shirt',       prefix: 'PE_Shirt' },
  'PE Shorts':      { folder: 'pe_shorts',       prefix: 'PE_Shorts' },
  'Gym Shorts':     { folder: 'pe_shorts',       prefix: 'PE_Shorts' }, // closest match
  'Pinafore':       { folder: 'pinafore',        prefix: 'Pinafore' },
  'Polo Shirt':     { folder: 'polo_shirt',      prefix: 'Polo_Shirt' },
  'Uniform Shirt':  { folder: 'uniform_shirt',   prefix: 'Uniform_Shirt' },
  'Uniform Shorts': { folder: 'uniform_shorts',  prefix: 'Uniform_Shorts' },
  'Uniform Pants':  { folder: 'uniform_pants',   prefix: 'Uniform_Pants' },
  'Uniform Skirt':  { folder: 'uniform_skirt',   prefix: 'Skirt' },
  'Skort':          { folder: 'uniform_skirt',   prefix: 'Skirt' }, // no dedicated skort folder
  'House Shirt':    { folder: 'uniform_shirt',   prefix: 'Uniform_Shirt' }, // best match
  // These have no graphic assets in storage:
  'Belt':           null,
  'Cap':            null,
  'Tie':            null,
  'Other Shirts':   null,
  'Others':         null,
}

/**
 * Maps a DB colour name to the colour slug used in storage filenames.
 * Storage filenames use lowercase with underscores for spaces.
 */
const COLOUR_TO_STORAGE: Record<string, string | null> = {
  'Beige':       'beige',
  'Black':       'black',
  'Blue':        'dark_blue',
  'Brown':       'brown',
  'Dark Green':  'dark_green',
  'Gold':        null,
  'Green':       'light_green',
  'Grey':        'light_grey',
  'Khaki':       'beige',        // closest match
  'Light Blue':  'light_blue',
  'Maroon':      'maroon',
  'Navy Blue':   'dark_blue',
  'Orange':      null,           // not in storage
  'Pink':        null,
  'Purple':      'purple',
  'Red':         'red',
  'Royal Blue':  'medium_blue',
  'Silver':      null,
  'White':       'white',
  'Yellow':      'yellow',
}

/**
 * Builds the public Supabase Storage URL for a uniform graphic.
 *
 * @param supabaseUrl  - `process.env.NEXT_PUBLIC_SUPABASE_URL`
 * @param categoryName - The category name from the DB (e.g., "PE Shirt")
 * @param colourName   - The primary colour name from the DB (e.g., "Maroon")
 * @returns            - Full public URL or `null` if no asset is available
 */
export function getUniformImageUrl(
  supabaseUrl: string,
  categoryName: string | null | undefined,
  colourName: string | null | undefined
): string | null {
  if (!supabaseUrl || !categoryName || !colourName) return null

  const categoryEntry = CATEGORY_TO_STORAGE[categoryName]
  if (!categoryEntry) return null

  const colourSlug = COLOUR_TO_STORAGE[colourName]
  if (!colourSlug) return null

  const storagePath = `uniform-graphics/general/${categoryEntry.folder}/${categoryEntry.prefix}_-_${colourSlug}.png`

  return `${supabaseUrl}/storage/v1/object/public/static-assets/${storagePath}`
}
