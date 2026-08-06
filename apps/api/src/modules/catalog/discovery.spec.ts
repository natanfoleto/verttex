import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { AppError } from '../../shared/errors/app-error'
import { PublicDiscoveryService } from './discovery.service'

vi.mock('../../infrastructure/database/prisma', () => ({
  prisma: {
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    store: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    brand: {
      findFirst: vi.fn(),
    },
    stockItem: {
      findMany: vi.fn(),
    },
    marketplaceSettings: {
      findFirst: vi.fn(),
    },
    productVariation: {
      findMany: vi.fn(),
    },
    productSearchDocument: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

describe('Product Discovery Engine (PublicDiscoveryService)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return unified discovery response for catalog search', async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
      outOfStockBehavior: 'show_badge',
    } as unknown as Awaited<
      ReturnType<typeof prisma.marketplaceSettings.findFirst>
    >)

    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([])
    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([
      {
        productId: 'prod-1',
        titleNormalized: 'mel silvestre 500g',
        contextNormalized: 'mel apiario serra serra verde',
        attributesNormalized: '500g',
        descriptionNormalized: 'mel puro',
      },
    ] as unknown as Awaited<
      ReturnType<typeof prisma.productSearchDocument.findMany>
    >)

    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: 'prod-1',
        name: 'Mel Silvestre 500g',
        slug: 'mel-silvestre-500g',
        shortDescription: 'Mel puro de florada silvestre',
        fullDescription: 'Colheita artesanal',
        type: 'simple',
        isFeatured: true,
        status: 'active',
        isPublished: true,
        storeId: 'store-1',
        categoryId: 'cat-1',
        brandId: 'brand-1',
        createdAt: new Date(),
        store: {
          id: 'store-1',
          name: 'Apiário Serra',
          slug: 'apiario-serra',
          logoUrl: null,
        },
        category: { id: 'cat-1', name: 'Mel', slug: 'mel' },
        brand: { id: 'brand-1', name: 'Serra Verde', slug: 'serra-verde' },
        medias: [],
        variations: [
          {
            id: 'var-1',
            sku: 'MEL-500G',
            price: '35.00' as unknown as number,
            promotionalPrice: null,
            status: 'active',
            isDefault: true,
            values: [],
          },
        ],
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>)

    vi.mocked(prisma.stockItem.findMany).mockResolvedValue([
      {
        id: 'stock-1',
        storeId: 'store-1',
        variationId: 'var-1',
        physicalQuantity: 10,
        reservedQuantity: 0,
        lot: {
          id: 'lot-1',
          status: 'available',
          expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.stockItem.findMany>>)

    const result = await PublicDiscoveryService.discover({
      page: 1,
      perPage: 12,
      search: 'mel',
      sort: 'relevance',
    })

    expect(result).toBeDefined()
    expect(result.context.type).toBe('search')
    expect(result.context.title).toContain('mel')
    expect(result.products).toHaveLength(1)
    expect(result.products[0]?.name).toBe('Mel Silvestre 500g')
    expect(result.products[0]?.commercialStockAvailable).toBe(10)
    expect(result.products[0]?.isAvailable).toBe(true)
    expect(result.availableFilters).toHaveLength(2)
    expect(result.seo.canonicalUrl).toContain('/busca')
  })

  it('should prioritize exact SKU match in relevance ranking', async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
      outOfStockBehavior: 'show_badge',
    } as unknown as Awaited<
      ReturnType<typeof prisma.marketplaceSettings.findFirst>
    >)

    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([
      { productId: 'prod-sku-match' } as unknown as Awaited<
        ReturnType<typeof prisma.productVariation.findMany>
      >[number],
    ])
    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([
      {
        id: 'doc-desc-1',
        productId: 'prod-description-only',
        titleNormalized: 'cachaca prata',
        contextNormalized: 'cachacas alambique',
        attributesNormalized: '',
        descriptionNormalized:
          'exact-sku-999 garrafa de cachaca artesanal de minas',
        searchTextNormalized: 'exact-sku-999',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
    ] as unknown as Awaited<
      ReturnType<typeof prisma.productSearchDocument.findMany>
    >)

    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: 'prod-description-only',
        name: 'Cachaça Prata',
        slug: 'cachaca-prata',
        shortDescription: 'Garrafa de cachaça artesanal de minas',
        fullDescription: 'Qualidade premium',
        type: 'simple',
        isFeatured: false,
        status: 'active',
        isPublished: true,
        storeId: 'store-1',
        categoryId: 'cat-1',
        brandId: null,
        store: {
          id: 'store-1',
          name: 'Alambique',
          slug: 'alambique',
          logoUrl: null,
        },
        category: { id: 'cat-1', name: 'Cachaças', slug: 'cachacas' },
        brand: null,
        medias: [],
        variations: [
          {
            id: 'var-1',
            sku: 'CACHACA-PRATA-700ML',
            price: '40.00',
            values: [],
          },
        ],
      },
      {
        id: 'prod-sku-match',
        name: 'Cachaça Envelhecida Ouro',
        slug: 'cachaca-ouro',
        shortDescription: 'Cachaça premium ouro',
        fullDescription: 'Barril de carvalho',
        type: 'simple',
        isFeatured: false,
        status: 'active',
        isPublished: true,
        storeId: 'store-1',
        categoryId: 'cat-1',
        brandId: null,
        store: {
          id: 'store-1',
          name: 'Alambique',
          slug: 'alambique',
          logoUrl: null,
        },
        category: { id: 'cat-1', name: 'Cachaças', slug: 'cachacas' },
        brand: null,
        medias: [],
        variations: [
          { id: 'var-2', sku: 'EXACT-SKU-999', price: '80.00', values: [] },
        ],
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>)

    vi.mocked(prisma.stockItem.findMany).mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof prisma.stockItem.findMany>>,
    )

    const result = await PublicDiscoveryService.discover({
      page: 1,
      perPage: 12,
      search: 'EXACT-SKU-999',
      sort: 'relevance',
    })

    expect(result.products).toHaveLength(2)
    expect(result.products[0]?.id).toBe('prod-sku-match')
    expect(result.products[0]?.relevanceScore).toBeGreaterThan(500)
  })

  it('should validate full category path chain (parent -> child)', async () => {
    vi.mocked(prisma.category.findFirst)
      .mockResolvedValueOnce({
        id: 'cat-alimentos',
        name: 'Alimentos',
        slug: 'alimentos',
        parentId: null,
      } as unknown as Awaited<ReturnType<typeof prisma.category.findFirst>>)
      .mockResolvedValueOnce({
        id: 'cat-doces',
        name: 'Doces',
        slug: 'doces',
        parentId: 'cat-alimentos',
      } as unknown as Awaited<ReturnType<typeof prisma.category.findFirst>>)

    vi.mocked(prisma.category.findMany).mockResolvedValue([])
    vi.mocked(prisma.product.findMany).mockResolvedValue([])
    vi.mocked(prisma.stockItem.findMany).mockResolvedValue([])
    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([])
    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([])

    const result = await PublicDiscoveryService.discover({
      page: 1,
      perPage: 12,
      categorySlug: 'alimentos/doces',
      sort: 'relevance',
    })

    expect(result.context.type).toBe('category')
    expect(result.context.title).toBe('Doces')
  })

  it('should throw 404 AppError when full category path chain is invalid', async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null)

    await expect(
      PublicDiscoveryService.discover({
        page: 1,
        perPage: 12,
        sort: 'relevance',
        categorySlug: 'alimentos/caminho-invalido',
      }),
    ).rejects.toThrow(AppError)
  })
})
