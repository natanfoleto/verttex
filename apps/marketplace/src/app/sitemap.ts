import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/ofertas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/categorias`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/lojas`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/produtos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]

  let dynamicRoutes: MetadataRoute.Sitemap = []

  try {
    // Fetch public products
    const productsRes = await fetch(
      `${API_BASE_URL}/public/catalog/products?perPage=100`,
      {
        next: { revalidate: 3600 },
      },
    ).catch(() => null)

    if (productsRes?.ok) {
      const json = await productsRes.json().catch(() => null)
      const products = json?.data || json || []
      if (Array.isArray(products)) {
        const productUrls: MetadataRoute.Sitemap = products.map((p: any) => ({
          url: `${BASE_URL}/produtos/${p.slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.9,
        }))
        dynamicRoutes = [...dynamicRoutes, ...productUrls]
      }
    }

    // Fetch public categories
    const categoriesRes = await fetch(
      `${API_BASE_URL}/public/catalog/categories`,
      {
        next: { revalidate: 3600 },
      },
    ).catch(() => null)

    if (categoriesRes?.ok) {
      const json = await categoriesRes.json().catch(() => null)
      const categories = json?.data || json || []
      if (Array.isArray(categories)) {
        const categoryUrls: MetadataRoute.Sitemap = categories.map(
          (c: any) => ({
            url: `${BASE_URL}/categoria/${c.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          }),
        )
        dynamicRoutes = [...dynamicRoutes, ...categoryUrls]
      }
    }

    // Fetch public stores
    const storesRes = await fetch(
      `${API_BASE_URL}/public/catalog/stores?perPage=100`,
      {
        next: { revalidate: 3600 },
      },
    ).catch(() => null)

    if (storesRes?.ok) {
      const json = await storesRes.json().catch(() => null)
      const stores = json?.data || json || []
      if (Array.isArray(stores)) {
        const storeUrls: MetadataRoute.Sitemap = stores.map((s: any) => ({
          url: `${BASE_URL}/produtor/${s.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        }))
        dynamicRoutes = [...dynamicRoutes, ...storeUrls]
      }
    }

    // Fetch public brands
    const brandsRes = await fetch(`${API_BASE_URL}/public/catalog/brands`, {
      next: { revalidate: 3600 },
    }).catch(() => null)

    if (brandsRes?.ok) {
      const json = await brandsRes.json().catch(() => null)
      const brands = json?.data || json || []
      if (Array.isArray(brands)) {
        const brandUrls: MetadataRoute.Sitemap = brands.map((b: any) => ({
          url: `${BASE_URL}/marca/${b.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        }))
        dynamicRoutes = [...dynamicRoutes, ...brandUrls]
      }
    }
  } catch {
    // Fallback gracefully if API is offline
  }

  return [...staticRoutes, ...dynamicRoutes]
}
