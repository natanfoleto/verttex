const STORAGE_KEY = 'verttex:search:recent:v1'
const MAX_RECENT_ITEMS = 6

function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const validItems = parsed.filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0,
    )

    // Deduplicate accent/case insensitively while preserving array
    const result: string[] = []
    const seenNorms = new Set<string>()

    for (const item of validItems) {
      const norm = normalizeSearchText(item)
      if (!seenNorms.has(norm)) {
        seenNorms.add(norm)
        result.push(item.trim())
      }
      if (result.length >= MAX_RECENT_ITEMS) break
    }

    return result
  } catch {
    // Robust error handling for SecurityError, JSON parse error, or blocked storage
    return []
  }
}

export function addRecentSearch(query: string): string[] {
  const cleanQuery = (query || '').trim()
  if (!cleanQuery) {
    return getRecentSearches()
  }

  if (typeof window === 'undefined') {
    return [cleanQuery]
  }

  try {
    const current = getRecentSearches()
    const normQuery = normalizeSearchText(cleanQuery)

    // Remove existing case & accent insensitive duplicate
    const filtered = current.filter(
      (item) => normalizeSearchText(item) !== normQuery,
    )

    // Insert cleanQuery at index 0 and cap at MAX_RECENT_ITEMS
    const updated = [cleanQuery, ...filtered].slice(0, MAX_RECENT_ITEMS)

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch {
    return [cleanQuery]
  }
}

export function removeRecentSearch(query: string): string[] {
  const normTarget = normalizeSearchText(query || '')
  if (!normTarget || typeof window === 'undefined') {
    return getRecentSearches()
  }

  try {
    const current = getRecentSearches()
    const updated = current.filter(
      (item) => normalizeSearchText(item) !== normTarget,
    )

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch {
    return []
  }
}

export function clearRecentSearches(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }

  return []
}
