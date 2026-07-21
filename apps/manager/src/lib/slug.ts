/**
 * Sanitizes a given text string into a URL-friendly slug.
 *
 * Rules:
 * 1. Convert to lowercase
 * 2. Remove accents/diacritics (NFD normalization)
 * 3. Remove special characters (keep only letters, numbers, spaces, hyphens)
 * 4. Replace spaces with single hyphens
 * 5. Condense multiple hyphens into a single hyphen
 * 6. Trim hyphens from beginning and end
 */
export function sanitizeSlug(value: string): string {
  if (!value) return ''
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
