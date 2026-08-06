import { describe, expect, it } from 'vitest'

import { publicProductListQuerySchema } from './catalog.schemas'
import { PublicCatalogService } from './catalog.service'

describe('Public Catalog Service Integration Tests', () => {
  it('should validate and transform all frontend sort query parameters gracefully', () => {
    const sortParams = [
      'relevancia',
      'menor-preco',
      'maior-preco',
      'mais-vendidos',
      'featured',
      'price_asc',
      'price_desc',
      'newest',
    ]

    for (const sortValue of sortParams) {
      const parsed = publicProductListQuerySchema.parse({ sort: sortValue })
      expect(['featured', 'price_asc', 'price_desc', 'newest']).toContain(
        parsed.sort,
      )
    }
  })

  it('should list public products with availability status and commercial stock calculation', async () => {
    const result = await PublicCatalogService.listPublicProducts({
      page: 1,
      perPage: 20,
      sort: 'featured',
    })

    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)

    for (const item of result.data) {
      expect(item.isAvailable).toBeDefined()
      expect(typeof item.commercialStockAvailable).toBe('number')
    }
  })

  it('should list active public categories', async () => {
    const categories = await PublicCatalogService.listPublicCategories()
    expect(Array.isArray(categories)).toBe(true)
    for (const cat of categories) {
      expect(cat.id).toBeDefined()
      expect(cat.name).toBeDefined()
      expect(cat.slug).toBeDefined()
    }
  })

  it('should list active public brands', async () => {
    const brands = await PublicCatalogService.listPublicBrands()
    expect(Array.isArray(brands)).toBe(true)
    for (const brand of brands) {
      expect(brand.id).toBeDefined()
      expect(brand.name).toBeDefined()
    }
  })

  it('should list active public partner stores', async () => {
    const result = await PublicCatalogService.listPublicStores({
      page: 1,
      perPage: 20,
    })
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
  })
})
