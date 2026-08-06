import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { PublicDiscoveryService } from './discovery.service'
import { normalizeSearchText } from './product-search-index.service'

vi.mock('../../infrastructure/database/prisma', () => ({
  prisma: {
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    store: {
      findFirst: vi.fn(),
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

function mockPrisma<T extends (...args: never[]) => unknown>(fn: T) {
  return vi.mocked(
    fn as unknown as (
      ...args: Parameters<T>
    ) => Promise<Awaited<ReturnType<T>>>,
  )
}

describe('Discovery Quality — Ranking & Relevância de Pesquisa', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockPrisma(prisma.category.findFirst).mockResolvedValue(null)
    mockPrisma(prisma.store.findFirst).mockResolvedValue(null)
    mockPrisma(prisma.brand.findFirst).mockResolvedValue(null)

    mockPrisma(prisma.stockItem.findMany).mockImplementation(
      async (args?: Parameters<typeof prisma.stockItem.findMany>[0]) => {
        const varIds: string[] =
          (args?.where?.variationId as { in?: string[] } | undefined)?.in || []
        return varIds.map((vId) => ({
          id: `stock-${vId}`,
          variationId: vId,
          physicalQuantity: 100,
          reservedQuantity: 0,
          storeId: 'st-1',
          location: { status: 'active' },
          lot: { status: 'available', expirationDate: new Date('2028-01-01') },
        })) as unknown as Awaited<ReturnType<typeof prisma.stockItem.findMany>>
      },
    )

    mockPrisma(prisma.marketplaceSettings.findFirst).mockResolvedValue({
      id: 'settings-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      bannerPosition: 'NO_DISPLAY',
      outOfStockBehavior: 'show_badge',
      platformPublicName: 'VERTTEX',
      globalNoticeActive: false,
      globalNoticeMessage: null,
      globalNoticeType: null,
    } as unknown as Awaited<
      ReturnType<typeof prisma.marketplaceSettings.findFirst>
    >)

    mockPrisma(prisma.productVariation.findMany).mockResolvedValue(
      [] as unknown as Awaited<
        ReturnType<typeof prisma.productVariation.findMany>
      >,
    )
  })

  it('12. Ranking por pesos de campos: Título > Contexto > Atributos > Descrição', async () => {
    const term = 'quixaba'
    const termNorm = normalizeSearchText(term)

    const mockSearchDocs = [
      {
        productId: 'prod-desc',
        titleNormalized: 'produto d',
        contextNormalized: 'categoria generica',
        attributesNormalized: 'padrao',
        descriptionNormalized: `extrato de ${termNorm} artesanal`,
        searchTextNormalized: `produto d categoria generica padrao extrato de ${termNorm} artesanal`,
        price: 10,
        inStock: true,
      },
      {
        productId: 'prod-title',
        titleNormalized: `suco de ${termNorm} puro`,
        contextNormalized: 'categoria generica',
        attributesNormalized: 'padrao',
        descriptionNormalized: 'descricao generica',
        searchTextNormalized: `suco de ${termNorm} puro categoria generica padrao descricao generica`,
        price: 10,
        inStock: true,
      },
      {
        productId: 'prod-attr',
        titleNormalized: 'produto c',
        contextNormalized: 'categoria generica',
        attributesNormalized: `ingrediente ${termNorm}`,
        descriptionNormalized: 'descricao generica',
        searchTextNormalized: `produto c categoria generica ingrediente ${termNorm} descricao generica`,
        price: 10,
        inStock: true,
      },
      {
        productId: 'prod-context',
        titleNormalized: 'produto b',
        contextNormalized: `marca ${termNorm} artesanal`,
        attributesNormalized: 'padrao',
        descriptionNormalized: 'descricao generica',
        searchTextNormalized: `produto b marca ${termNorm} artesanal padrao descricao generica`,
        price: 10,
        inStock: true,
      },
    ]

    const mockFullProducts = mockSearchDocs.map((d) => ({
      id: d.productId,
      name: d.titleNormalized,
      slug: d.productId,
      price: d.price,
      isPublished: true,
      status: 'active',
      deletedAt: null,
      storeId: 'st-1',
      category: { id: 'cat-1', name: 'Cat', slug: 'cat' },
      store: {
        id: 'st-1',
        name: 'Store',
        slug: 'store',
        isPublished: true,
        status: 'active',
        deletedAt: null,
      },
      images: [{ url: 'https://example.com/img.jpg' }],
      medias: [{ isMain: true, file: { objectKey: 'img.jpg' } }],
      variations: [
        {
          id: `v-${d.productId}`,
          price: d.price,
          values: [],
          stockItems: [{ quantity: 10 }],
        },
      ],
    }))

    mockPrisma(prisma.productSearchDocument.findMany).mockImplementation(
      async (
        args?: Parameters<typeof prisma.productSearchDocument.findMany>[0],
      ) => {
        let result = [...mockSearchDocs]
        const searchWhere = args?.where?.searchTextNormalized as
          { contains?: string } | undefined
        if (searchWhere?.contains) {
          const token = searchWhere.contains
          result = result.filter((d) => d.searchTextNormalized.includes(token))
        }
        return result as unknown as Awaited<
          ReturnType<typeof prisma.productSearchDocument.findMany>
        >
      },
    )

    mockPrisma(prisma.product.findMany).mockImplementation(
      async (args?: Parameters<typeof prisma.product.findMany>[0]) => {
        const idIn = (args?.where as { id?: { in?: string[] } } | undefined)?.id
          ?.in
        if (idIn) {
          return mockFullProducts.filter((p) =>
            idIn.includes(p.id),
          ) as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>
        }
        if (args?.where?.OR) {
          return [] as unknown as Awaited<
            ReturnType<typeof prisma.product.findMany>
          >
        }
        return mockFullProducts as unknown as Awaited<
          ReturnType<typeof prisma.product.findMany>
        >
      },
    )

    const res = await PublicDiscoveryService.discover({
      search: term,
      page: 1,
      perPage: 50,
    })
    const receivedOrder = res.products.map((p) => p.id)

    const expectedOrder = [
      'prod-title',
      'prod-context',
      'prod-attr',
      'prod-desc',
    ]

    if (JSON.stringify(receivedOrder) !== JSON.stringify(expectedOrder)) {
      console.error(`
---------------------------------------------------
FALHA DE RANKING POR PESO DE CAMPO:
Esperado: ${expectedOrder.join(' -> ')}
Recebido: ${receivedOrder.join(' -> ')}
---------------------------------------------------`)
    }

    expect(receivedOrder).toEqual(expectedOrder)
  })

  it('13. Ranking multi-campo: Título + Contexto vence produto apenas com Título', async () => {
    const mockSearchDocs = [
      {
        productId: 'prod-single-match',
        titleNormalized: 'mel silvestre orgânico',
        contextNormalized: 'generico',
        attributesNormalized: '',
        descriptionNormalized: '',
        searchTextNormalized: 'mel silvestre orgânico generico',
        price: 30,
        inStock: true,
      },
      {
        productId: 'prod-multi-match',
        titleNormalized: 'mel silvestre orgânico',
        contextNormalized: 'mel artesanal serra',
        attributesNormalized: 'mel de abelha',
        descriptionNormalized: '',
        searchTextNormalized:
          'mel silvestre orgânico mel artesanal serra mel de abelha',
        price: 30,
        inStock: true,
      },
    ]

    const mockFullProducts = mockSearchDocs.map((d) => ({
      id: d.productId,
      name: d.titleNormalized,
      slug: d.productId,
      price: d.price,
      isPublished: true,
      status: 'active',
      deletedAt: null,
      storeId: 'st-1',
      category: { id: 'c1', name: 'Cat', slug: 'cat' },
      store: {
        id: 's1',
        name: 'St',
        slug: 'st',
        isPublished: true,
        status: 'active',
        deletedAt: null,
      },
      images: [],
      medias: [{ isMain: true, file: { objectKey: 'img.jpg' } }],
      variations: [
        {
          id: `v-${d.productId}`,
          price: d.price,
          values: [],
          stockItems: [{ quantity: 10 }],
        },
      ],
    }))

    mockPrisma(prisma.productSearchDocument.findMany).mockImplementation(
      async (
        args?: Parameters<typeof prisma.productSearchDocument.findMany>[0],
      ) => {
        let result = [...mockSearchDocs]
        const searchWhere = args?.where?.searchTextNormalized as
          { contains?: string } | undefined
        if (searchWhere?.contains) {
          const token = searchWhere.contains
          result = result.filter((d) => d.searchTextNormalized.includes(token))
        }
        return result as unknown as Awaited<
          ReturnType<typeof prisma.productSearchDocument.findMany>
        >
      },
    )

    mockPrisma(prisma.product.findMany).mockImplementation(
      async (args?: Parameters<typeof prisma.product.findMany>[0]) => {
        const idIn = (args?.where as { id?: { in?: string[] } } | undefined)?.id
          ?.in
        if (idIn) {
          return mockFullProducts.filter((p) =>
            idIn.includes(p.id),
          ) as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>
        }
        if (args?.where?.OR) {
          return [] as unknown as Awaited<
            ReturnType<typeof prisma.product.findMany>
          >
        }
        return mockFullProducts as unknown as Awaited<
          ReturnType<typeof prisma.product.findMany>
        >
      },
    )

    const res = await PublicDiscoveryService.discover({
      search: 'mel',
      page: 1,
      perPage: 50,
    })
    expect(res.products[0]?.id).toBe('prod-multi-match')
  })

  it('14. SKU exato deve ser o 1º colocado', async () => {
    const mockSearchDocs = [
      {
        productId: 'prod-regular',
        sku: 'PROD-100',
        titleNormalized: 'mel silvestre',
        contextNormalized: '',
        attributesNormalized: '',
        descriptionNormalized: '',
        searchTextNormalized: 'mel silvestre',
        price: 20,
        inStock: true,
      },
      {
        productId: 'prod-sku-match',
        sku: 'MEL-SILV-500G',
        titleNormalized: 'outro produto',
        contextNormalized: '',
        attributesNormalized: '',
        descriptionNormalized: '',
        searchTextNormalized: 'outro produto',
        price: 20,
        inStock: true,
      },
    ]

    const mockFullProducts = mockSearchDocs.map((d) => ({
      id: d.productId,
      name: d.titleNormalized,
      slug: d.productId,
      price: d.price,
      isPublished: true,
      status: 'active',
      deletedAt: null,
      storeId: 'st-1',
      category: { id: 'c1', name: 'Cat', slug: 'cat' },
      store: {
        id: 's1',
        name: 'St',
        slug: 'st',
        isPublished: true,
        status: 'active',
        deletedAt: null,
      },
      images: [],
      medias: [{ isMain: true, file: { objectKey: 'img.jpg' } }],
      variations: [
        {
          id: `v-${d.productId}`,
          price: d.price,
          values: [],
          stockItems: [{ quantity: 10 }],
        },
      ],
    }))

    mockPrisma(prisma.productSearchDocument.findMany).mockImplementation(
      async (
        args?: Parameters<typeof prisma.productSearchDocument.findMany>[0],
      ) => {
        let result = [...mockSearchDocs]
        const searchWhere = args?.where?.searchTextNormalized as
          { contains?: string } | undefined
        if (searchWhere?.contains) {
          const token = searchWhere.contains
          result = result.filter((d) => d.searchTextNormalized.includes(token))
        }
        return result as unknown as Awaited<
          ReturnType<typeof prisma.productSearchDocument.findMany>
        >
      },
    )

    mockPrisma(prisma.productVariation.findMany).mockImplementation(
      async (args?: Parameters<typeof prisma.productVariation.findMany>[0]) => {
        if (args?.where?.OR && Array.isArray(args.where.OR)) {
          const firstOr = args.where.OR[0] as
            { sku?: { equals?: string } } | undefined
          const skuTerm = firstOr?.sku?.equals
          if (skuTerm === 'MEL-SILV-500G') {
            return [{ productId: 'prod-sku-match' }] as unknown as Awaited<
              ReturnType<typeof prisma.productVariation.findMany>
            >
          }
        }
        return [] as unknown as Awaited<
          ReturnType<typeof prisma.productVariation.findMany>
        >
      },
    )

    mockPrisma(prisma.product.findMany).mockImplementation(
      async (args?: Parameters<typeof prisma.product.findMany>[0]) => {
        const idIn = (args?.where as { id?: { in?: string[] } } | undefined)?.id
          ?.in
        if (idIn) {
          return mockFullProducts.filter((p) =>
            idIn.includes(p.id),
          ) as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>
        }
        return mockFullProducts as unknown as Awaited<
          ReturnType<typeof prisma.product.findMany>
        >
      },
    )

    const res = await PublicDiscoveryService.discover({
      search: 'MEL-SILV-500G',
      page: 1,
      perPage: 50,
    })
    expect(res.products[0]?.id).toBe('prod-sku-match')
  })

  it('15. Barcode/GTIN exato deve ser o 1º colocado no ranking de relevância', async () => {
    const mockSearchDocs = [
      {
        productId: 'prod-regular-barcode',
        barcode: '7890000000000',
        titleNormalized: 'cachaca artesanal',
        contextNormalized: '',
        attributesNormalized: '',
        descriptionNormalized: '',
        searchTextNormalized: 'cachaca artesanal',
        price: 50,
        inStock: true,
      },
      {
        productId: 'prod-barcode-match',
        barcode: '7891234560035',
        titleNormalized: 'outro produto',
        contextNormalized: '',
        attributesNormalized: '',
        descriptionNormalized: '',
        searchTextNormalized: 'outro produto',
        price: 50,
        inStock: true,
      },
    ]

    const mockFullProducts = mockSearchDocs.map((d) => ({
      id: d.productId,
      name: d.titleNormalized,
      slug: d.productId,
      price: d.price,
      barcode: d.barcode,
      isPublished: true,
      status: 'active',
      deletedAt: null,
      storeId: 'st-1',
      category: { id: 'c1', name: 'Cat', slug: 'cat' },
      store: {
        id: 's1',
        name: 'St',
        slug: 'st',
        isPublished: true,
        status: 'active',
        deletedAt: null,
      },
      images: [],
      medias: [{ isMain: true, file: { objectKey: 'img.jpg' } }],
      variations: [
        {
          id: `v-${d.productId}`,
          barcode: d.barcode,
          price: d.price,
          values: [],
          stockItems: [{ quantity: 10 }],
        },
      ],
    }))

    mockPrisma(prisma.productSearchDocument.findMany).mockImplementation(
      async (
        args?: Parameters<typeof prisma.productSearchDocument.findMany>[0],
      ) => {
        let result = [...mockSearchDocs]
        const searchWhere = args?.where?.searchTextNormalized as
          { contains?: string } | undefined
        if (searchWhere?.contains) {
          const token = searchWhere.contains
          result = result.filter((d) => d.searchTextNormalized.includes(token))
        }
        return result as unknown as Awaited<
          ReturnType<typeof prisma.productSearchDocument.findMany>
        >
      },
    )

    mockPrisma(prisma.productVariation.findMany).mockImplementation(
      async (args?: Parameters<typeof prisma.productVariation.findMany>[0]) => {
        if (args?.where?.OR && Array.isArray(args.where.OR)) {
          const secondOr = args.where.OR[1] as
            { barcode?: { equals?: string } } | undefined
          const barcodeTerm = secondOr?.barcode?.equals
          if (barcodeTerm === '7891234560035') {
            return [{ productId: 'prod-barcode-match' }] as unknown as Awaited<
              ReturnType<typeof prisma.productVariation.findMany>
            >
          }
        }
        return [] as unknown as Awaited<
          ReturnType<typeof prisma.productVariation.findMany>
        >
      },
    )

    mockPrisma(prisma.product.findMany).mockImplementation(
      async (args?: Parameters<typeof prisma.product.findMany>[0]) => {
        const w = args?.where as Record<string, unknown>
        if (w?.OR && Array.isArray(w.OR)) {
          const firstOr = w.OR[0] as { sku?: { equals?: string } } | undefined
          const secondOr = w.OR[1] as
            { barcode?: { equals?: string } } | undefined
          const skuTerm = firstOr?.sku?.equals
          const barcodeTerm = secondOr?.barcode?.equals

          if (barcodeTerm === '7891234560035' || skuTerm === '7891234560035') {
            return mockFullProducts.filter(
              (p) => p.id === 'prod-barcode-match',
            ) as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>
          }
        }
        const idIn = (args?.where as { id?: { in?: string[] } } | undefined)?.id
          ?.in
        if (idIn) {
          return mockFullProducts.filter((p) =>
            idIn.includes(p.id),
          ) as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>
        }
        return mockFullProducts as unknown as Awaited<
          ReturnType<typeof prisma.product.findMany>
        >
      },
    )

    const res = await PublicDiscoveryService.discover({
      search: '7891234560035',
      page: 1,
      perPage: 50,
    })
    expect(res.products.length).toBeGreaterThan(0)
    expect(res.products[0]?.id).toBe('prod-barcode-match')
    expect(res.products[0]?.relevanceScore).toBe(1000)
  })

  it('16. Proteção numérica exata dos pesos de campo no ranking através do engine real (title=510, context=210, attr=110, desc=60)', async () => {
    const term = 'quixaba'
    const termNorm = normalizeSearchText(term)

    const mockSearchDocs = [
      {
        productId: 'prod-title',
        titleNormalized: `suco de ${termNorm} puro`,
        contextNormalized: 'categoria generica',
        attributesNormalized: 'padrao',
        descriptionNormalized: 'descricao generica',
        searchTextNormalized: `suco de ${termNorm} puro categoria generica padrao descricao generica`,
        price: 10,
        inStock: true,
      },
      {
        productId: 'prod-context',
        titleNormalized: 'produto b',
        contextNormalized: `marca ${termNorm} artesanal`,
        attributesNormalized: 'padrao',
        descriptionNormalized: 'descricao generica',
        searchTextNormalized: `produto b marca ${termNorm} artesanal padrao descricao generica`,
        price: 10,
        inStock: true,
      },
      {
        productId: 'prod-attr',
        titleNormalized: 'produto c',
        contextNormalized: 'categoria generica',
        attributesNormalized: `ingrediente ${termNorm}`,
        descriptionNormalized: 'descricao generica',
        searchTextNormalized: `produto c categoria generica ingrediente ${termNorm} descricao generica`,
        price: 10,
        inStock: true,
      },
      {
        productId: 'prod-desc',
        titleNormalized: 'produto d',
        contextNormalized: 'categoria generica',
        attributesNormalized: 'padrao',
        descriptionNormalized: `extrato de ${termNorm} artesanal`,
        searchTextNormalized: `produto d categoria generica padrao extrato de ${termNorm} artesanal`,
        price: 10,
        inStock: true,
      },
    ]

    const mockFullProducts = mockSearchDocs.map((d) => ({
      id: d.productId,
      name: d.titleNormalized,
      slug: d.productId,
      price: d.price,
      isPublished: true,
      status: 'active',
      deletedAt: null,
      storeId: 'st-1',
      category: { id: 'cat-1', name: 'Cat', slug: 'cat' },
      store: {
        id: 'st-1',
        name: 'Store',
        slug: 'store',
        isPublished: true,
        status: 'active',
        deletedAt: null,
        logoUrl: null,
      },
      images: [{ url: 'https://example.com/img.jpg' }],
      medias: [{ isMain: true, file: { objectKey: 'img.jpg' } }],
      variations: [
        {
          id: `v-${d.productId}`,
          price: d.price,
          values: [],
          stockItems: [{ quantity: 10 }],
        },
      ],
    }))

    mockPrisma(prisma.productSearchDocument.findMany).mockImplementation(
      async (
        args?: Parameters<typeof prisma.productSearchDocument.findMany>[0],
      ) => {
        let result = [...mockSearchDocs]
        const searchWhere = args?.where?.searchTextNormalized as
          { contains?: string } | undefined
        if (searchWhere?.contains) {
          const token = searchWhere.contains
          result = result.filter((d) => d.searchTextNormalized.includes(token))
        }
        return result as unknown as Awaited<
          ReturnType<typeof prisma.productSearchDocument.findMany>
        >
      },
    )

    mockPrisma(prisma.product.findMany).mockImplementation(
      async (args?: Parameters<typeof prisma.product.findMany>[0]) => {
        const idIn = (args?.where as { id?: { in?: string[] } } | undefined)?.id
          ?.in
        if (idIn) {
          return mockFullProducts.filter((p) =>
            idIn.includes(p.id),
          ) as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>
        }
        return mockFullProducts as unknown as Awaited<
          ReturnType<typeof prisma.product.findMany>
        >
      },
    )

    const res = await PublicDiscoveryService.discover({
      search: term,
      page: 1,
      perPage: 50,
    })

    const scoresById = Object.fromEntries(
      res.products.map((p) => [p.id, p.relevanceScore]),
    )

    expect(scoresById['prod-title']).toBe(510) // 500 (title) + 10 (text match bonus)
    expect(scoresById['prod-context']).toBe(210) // 200 (context) + 10 (text match bonus)
    expect(scoresById['prod-attr']).toBe(110) // 100 (attributes) + 10 (text match bonus)
    expect(scoresById['prod-desc']).toBe(60) // 50 (description) + 10 (text match bonus)
  })
})
