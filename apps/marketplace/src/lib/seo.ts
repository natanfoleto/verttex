import type { Metadata } from 'next'

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) {
    const vercelHost = process.env.VERCEL_URL.replace(/^https?:\/\//, '')
    return `https://${vercelHost}`
  }
  return 'http://localhost:3000'
}

export const APP_BASE_URL = getAppBaseUrl()
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
export const SITE_NAME = 'VERTTEX Marketplace'



/**
 * Sanitizes user input string for safe usage in metadata title/description.
 */
export function sanitizeMetaText(text: string): string {
  if (!text) return ''
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
}

/**
 * Checks if searchParams contains active filtering/search/sorting parameters.
 * Note: Pagination (`page`) alone is NOT a filter; it represents a page in a sequence.
 */
export function hasActiveFilters(
  searchParams?: Record<string, string | string[] | undefined>,
): boolean {
  if (!searchParams) return false
  const keys = Object.keys(searchParams)
  const filterKeys = [
    'brand',
    'brandSlug',
    'store',
    'storeSlug',
    'category',
    'categorySlug',
    'minPrice',
    'maxPrice',
    'priceMin',
    'priceMax',
    'attributes',
    'sort',
    'search',
    'q',
  ]

  return keys.some((k) => {
    if (k.startsWith('attr_')) return true
    if (!filterKeys.includes(k)) return false
    const val = searchParams[k]
    return val !== undefined && val !== ''
  })
}

/**
 * Extract page number if page > 1 for sequence canonicals.
 */
export function getPageNumber(
  searchParams?: Record<string, string | string[] | undefined>,
): number | undefined {
  if (!searchParams?.page) return undefined
  const rawPage = Array.isArray(searchParams.page)
    ? searchParams.page[0]
    : searchParams.page
  const parsed = parseInt(rawPage || '', 10)
  return !isNaN(parsed) && parsed > 1 ? parsed : undefined
}

export interface BuildMetadataOptions {
  title: string
  description: string
  canonicalPath: string // e.g. "/categoria/alimentos/mel"
  noIndex?: boolean
  hasFilters?: boolean // true if sort, search, brand, price, attributes filters are present
  page?: number // page number (> 1) if pagination is active without filters
  ogImage?: string | null
  type?: 'website' | 'article'
}

export function buildMetadata({
  title,
  description,
  canonicalPath,
  noIndex = false,
  hasFilters = false,
  page,
  ogImage,
  type = 'website',
}: BuildMetadataOptions): Metadata {
  const cleanTitle = sanitizeMetaText(title)
  const cleanDescription = sanitizeMetaText(description)

  // Clean canonical path without query params
  const cleanCanonicalPath = canonicalPath.split('?')[0] || '/'

  // Indexing policy: noindex if explicitly requested OR if filters/sort applied
  const shouldIndex = !noIndex && !hasFilters

  // Canonical URL logic:
  // - If clean page 1: /categoria/alimentos/mel
  // - If clean page > 1 (no filters): /categoria/alimentos/mel?page=2 (self-referential sequence)
  // - If filters applied (noindex): /categoria/alimentos/mel
  let canonicalUrl = `${APP_BASE_URL}${cleanCanonicalPath}`
  if (shouldIndex && page && page > 1) {
    canonicalUrl = `${APP_BASE_URL}${cleanCanonicalPath}?page=${page}`
  }

  const images = ogImage ? [{ url: ogImage }] : undefined

  return {
    title: cleanTitle,
    description: cleanDescription,
    metadataBase: new URL(APP_BASE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
        follow: true,
      },
    },
    openGraph: {
      title: `${cleanTitle} | ${SITE_NAME}`,
      description: cleanDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'pt_BR',
      type,
      images,
    },
  }
}

/**
 * Safely fetches context from Public Discovery API for server-side metadata generation.
 */
export async function fetchDiscoveryContext(query: Record<string, string>) {
  try {
    const params = new URLSearchParams(query)
    const res = await fetch(
      `${API_BASE_URL}/public/catalog/discover?${params.toString()}`,
      {
        next: { revalidate: 60 },
      },
    )
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || null
  } catch {
    return null
  }
}

/**
 * Safely fetches store details from backend for server-side metadata generation.
 */
export async function fetchStoreDetails(slug: string) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/public/catalog/stores/${encodeURIComponent(slug)}`,
      {
        next: { revalidate: 60 },
      },
    )
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || null
  } catch {
    return null
  }
}

/**
 * Safely fetches product details from backend for server-side metadata generation.
 */
export async function fetchProductDetails(slug: string) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/public/catalog/products/${encodeURIComponent(slug)}`,
      {
        next: { revalidate: 60 },
      },
    )
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || null
  } catch {
    return null
  }
}
