import type { Metadata } from 'next'

export const SITE_NAME = 'VERTTEX Marketplace'
export const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

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
 * Checks if searchParams contains active filtering/search/pagination params.
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
    'page',
    'perPage',
    'search',
    'q',
  ]
  return keys.some(
    (k) =>
      filterKeys.includes(k) &&
      searchParams[k] !== undefined &&
      searchParams[k] !== '',
  )
}

export interface BuildMetadataOptions {
  title: string
  description: string
  canonicalPath: string // e.g. "/categoria/alimentos/mel"
  noIndex?: boolean
  hasFilters?: boolean
  ogImage?: string | null
  type?: 'website' | 'article'
}

export function buildMetadata({
  title,
  description,
  canonicalPath,
  noIndex = false,
  hasFilters = false,
  ogImage,
  type = 'website',
}: BuildMetadataOptions): Metadata {
  const cleanTitle = sanitizeMetaText(title)
  const cleanDescription = sanitizeMetaText(description)

  // Clean canonical path without query params
  const cleanCanonicalPath = canonicalPath.split('?')[0] || '/'
  const canonicalUrl = `${APP_BASE_URL}${cleanCanonicalPath}`

  // Indexing policy: noindex if explicitly requested OR if filters/pagination applied
  const shouldIndex = !noIndex && !hasFilters

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
