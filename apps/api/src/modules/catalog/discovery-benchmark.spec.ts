import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { PublicDiscoveryService } from './discovery.service'
import {
  normalizeSearchText,
  ProductSearchIndexService,
} from './product-search-index.service'

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

// Helper to generate N mock products and search documents for benchmark testing
function generateMockProducts(count: number) {
  const products = []
  const searchDocs = []

  for (let i = 1; i <= count; i++) {
    const id = `prod-bench-${i}`
    const isMel = i % 2 === 0
    const isSilvestre = i % 4 === 0
    const isAmburana = i % 5 === 0
    const isBoaEsperanca = i % 3 === 0

    const name = isMel
      ? `Mel ${isSilvestre ? 'Silvestre' : 'Orgânico'} Puro ${i}`
      : `Queijo Artesanal ${i}`

    const shortDesc = isBoaEsperanca
      ? 'Sítio Boa Esperança'
      : 'Produto da Serra'
    const attrVal = isAmburana ? 'Madeira Amburana' : 'Padrão'
    const priceNum = 10 + (i % 100)

    products.push({
      id,
      name,
      slug: `produto-${i}`,
      shortDescription: shortDesc,
      fullDescription: `Descrição detalhada do produto ${i}`,
      type: 'simple',
      isFeatured: i <= 10,
      status: 'active',
      isPublished: true,
      storeId: isBoaEsperanca ? 'store-boa-esperanca' : 'store-padrao',
      categoryId: isMel ? 'cat-mel' : 'cat-queijos',
      brandId: 'brand-1',
      store: {
        id: isBoaEsperanca ? 'store-boa-esperanca' : 'store-padrao',
        name: isBoaEsperanca ? 'Engenho Boa Esperança' : 'Loja Padrão',
        slug: isBoaEsperanca ? 'boa-esperanca' : 'loja-padrao',
        logoUrl: null,
      },
      category: {
        id: isMel ? 'cat-mel' : 'cat-queijos',
        name: isMel ? 'Mel' : 'Queijos',
        slug: isMel ? 'mel' : 'queijos',
      },
      brand: { id: 'brand-1', name: 'Serra Verde', slug: 'serra-verde' },
      medias: [],
      variations: [
        {
          id: `var-${i}`,
          sku: `SKU-BENCH-${i}`,
          barcode: `7890000${i}`,
          price: priceNum.toFixed(2),
          promotionalPrice: i % 3 === 0 ? (priceNum * 0.8).toFixed(2) : null,
          isDefault: true,
          status: 'active',
          deletedAt: null,
          values: [
            {
              optionValue: {
                value: attrVal,
                option: { name: 'Sabor' },
              },
            },
          ],
        },
      ],
    })

    const searchText = normalizeSearchText(
      `${name} ${isMel ? 'mel' : 'queijo'} ${shortDesc} ${attrVal}`,
    )

    searchDocs.push({
      productId: id,
      titleNormalized: normalizeSearchText(name),
      contextNormalized: normalizeSearchText(
        `Mel Queijos ${isBoaEsperanca ? 'Boa Esperança' : ''}`,
      ),
      attributesNormalized: normalizeSearchText(attrVal),
      descriptionNormalized: normalizeSearchText(shortDesc),
      searchTextNormalized: searchText,
    })
  }

  return { products, searchDocs }
}

describe('Etapa 8 — Product Discovery Benchmark de Desempenho (1k, 5k e 10k produtos)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const volumeTestCases = [1000, 5000, 10000]

  volumeTestCases.forEach((volume) => {
    describe(`Benchmark com catálogo de ${volume.toLocaleString('pt-BR')} produtos`, () => {
      it(`1. Busca simples ('mel') com ${volume} produtos`, async () => {
        const { products, searchDocs } = generateMockProducts(volume)

        vi.mocked(prisma.category.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.store.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.brand.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
          outOfStockBehavior: 'show_badge',
        } as unknown as Awaited<
          ReturnType<typeof prisma.marketplaceSettings.findFirst>
        >)
        vi.mocked(prisma.productVariation.findMany).mockResolvedValue([])

        const melCandidates = searchDocs.filter((d) =>
          d.searchTextNormalized.includes('mel'),
        )
        vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue(
          melCandidates as unknown as Awaited<
            ReturnType<typeof prisma.productSearchDocument.findMany>
          >,
        )

        const melProducts = products.filter((p) =>
          melCandidates.some((c) => c.productId === p.id),
        )
        vi.mocked(prisma.product.findMany).mockResolvedValue(
          melProducts as unknown as Awaited<
            ReturnType<typeof prisma.product.findMany>
          >,
        )
        vi.mocked(prisma.stockItem.findMany).mockResolvedValue([])

        const startTime = performance.now()
        const result = await PublicDiscoveryService.discover({
          page: 1,
          perPage: 12,
          sort: 'relevance',
          search: 'mel',
        })
        const durationMs = performance.now() - startTime

        console.log(
          `[Benchmark ${volume} prods] Busca simples ('mel'): ${durationMs.toFixed(2)}ms (${result.pagination.total} candidatos)`,
        )

        expect(result.products.length).toBeLessThanOrEqual(12)
        expect(result.pagination.total).toBe(melProducts.length)
        expect(durationMs).toBeGreaterThanOrEqual(0)
      })

      it(`2. Busca multi-termo ('mel silvestre') com ${volume} produtos`, async () => {
        const { products, searchDocs } = generateMockProducts(volume)

        vi.mocked(prisma.category.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.store.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.brand.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
          outOfStockBehavior: 'show_badge',
        } as unknown as Awaited<
          ReturnType<typeof prisma.marketplaceSettings.findFirst>
        >)
        vi.mocked(prisma.productVariation.findMany).mockResolvedValue([])

        const melCandidates = searchDocs.filter((d) =>
          d.searchTextNormalized.includes('mel'),
        )
        vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue(
          melCandidates as unknown as Awaited<
            ReturnType<typeof prisma.productSearchDocument.findMany>
          >,
        )

        const matchingProds = products.filter((p) =>
          melCandidates.some(
            (c) =>
              c.productId === p.id &&
              c.searchTextNormalized.includes('silvestre'),
          ),
        )
        vi.mocked(prisma.product.findMany).mockResolvedValue(
          matchingProds as unknown as Awaited<
            ReturnType<typeof prisma.product.findMany>
          >,
        )
        vi.mocked(prisma.stockItem.findMany).mockResolvedValue([])

        const startTime = performance.now()
        const result = await PublicDiscoveryService.discover({
          page: 1,
          perPage: 12,
          sort: 'relevance',
          search: 'mel silvestre',
        })
        const durationMs = performance.now() - startTime

        console.log(
          `[Benchmark ${volume} prods] Busca multi-termo ('mel silvestre'): ${durationMs.toFixed(2)}ms`,
        )

        expect(result.products.length).toBeLessThanOrEqual(12)
        expect(durationMs).toBeGreaterThanOrEqual(0)
      })

      it(`3. Busca por contexto ('Boa Esperança') com ${volume} produtos`, async () => {
        const { products, searchDocs } = generateMockProducts(volume)

        vi.mocked(prisma.category.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.store.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.brand.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
          outOfStockBehavior: 'show_badge',
        } as unknown as Awaited<
          ReturnType<typeof prisma.marketplaceSettings.findFirst>
        >)
        vi.mocked(prisma.productVariation.findMany).mockResolvedValue([])

        const candidates = searchDocs.filter((d) =>
          d.searchTextNormalized.includes('boa'),
        )
        vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue(
          candidates as unknown as Awaited<
            ReturnType<typeof prisma.productSearchDocument.findMany>
          >,
        )

        const matchingProds = products.filter((p) =>
          candidates.some((c) => c.productId === p.id),
        )
        vi.mocked(prisma.product.findMany).mockResolvedValue(
          matchingProds as unknown as Awaited<
            ReturnType<typeof prisma.product.findMany>
          >,
        )
        vi.mocked(prisma.stockItem.findMany).mockResolvedValue([])

        const startTime = performance.now()
        const result = await PublicDiscoveryService.discover({
          page: 1,
          perPage: 12,
          sort: 'relevance',
          search: 'Boa Esperança',
        })
        const durationMs = performance.now() - startTime

        console.log(
          `[Benchmark ${volume} prods] Busca por contexto ('Boa Esperança'): ${durationMs.toFixed(2)}ms`,
        )

        expect(result.context.type).toBe('search')
        expect(durationMs).toBeGreaterThanOrEqual(0)
      })

      it(`4. Busca por atributo ('amburana') com ${volume} produtos`, async () => {
        const { products, searchDocs } = generateMockProducts(volume)

        vi.mocked(prisma.category.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.store.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.brand.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
          outOfStockBehavior: 'show_badge',
        } as unknown as Awaited<
          ReturnType<typeof prisma.marketplaceSettings.findFirst>
        >)
        vi.mocked(prisma.productVariation.findMany).mockResolvedValue([])

        const candidates = searchDocs.filter((d) =>
          d.searchTextNormalized.includes('amburana'),
        )
        vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue(
          candidates as unknown as Awaited<
            ReturnType<typeof prisma.productSearchDocument.findMany>
          >,
        )

        const matchingProds = products.filter((p) =>
          candidates.some((c) => c.productId === p.id),
        )
        vi.mocked(prisma.product.findMany).mockResolvedValue(
          matchingProds as unknown as Awaited<
            ReturnType<typeof prisma.product.findMany>
          >,
        )
        vi.mocked(prisma.stockItem.findMany).mockResolvedValue([])

        const startTime = performance.now()
        const result = await PublicDiscoveryService.discover({
          page: 1,
          perPage: 12,
          sort: 'relevance',
          search: 'amburana',
        })
        const durationMs = performance.now() - startTime

        console.log(
          `[Benchmark ${volume} prods] Busca por atributo ('amburana'): ${durationMs.toFixed(2)}ms`,
        )

        expect(result.products.length).toBeGreaterThan(0)
        expect(durationMs).toBeGreaterThanOrEqual(0)
      })

      it(`5. Termo inexistente ('xyz-inexistente') com ${volume} produtos`, async () => {
        vi.mocked(prisma.category.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.store.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.brand.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
          outOfStockBehavior: 'show_badge',
        } as unknown as Awaited<
          ReturnType<typeof prisma.marketplaceSettings.findFirst>
        >)
        vi.mocked(prisma.productVariation.findMany).mockResolvedValue([])
        vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([])
        vi.mocked(prisma.product.findMany).mockResolvedValue([])
        vi.mocked(prisma.stockItem.findMany).mockResolvedValue([])

        const startTime = performance.now()
        const result = await PublicDiscoveryService.discover({
          page: 1,
          perPage: 12,
          sort: 'relevance',
          search: 'xyz-inexistente',
        })
        const durationMs = performance.now() - startTime

        console.log(
          `[Benchmark ${volume} prods] Termo inexistente: ${durationMs.toFixed(2)}ms`,
        )

        expect(result.products).toHaveLength(0)
        expect(durationMs).toBeGreaterThanOrEqual(0)
      })

      it(`6. Paginação profunda (page=5) com ${volume} produtos`, async () => {
        const { products } = generateMockProducts(volume)

        vi.mocked(prisma.category.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.store.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.brand.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
          outOfStockBehavior: 'show_badge',
        } as unknown as Awaited<
          ReturnType<typeof prisma.marketplaceSettings.findFirst>
        >)
        vi.mocked(prisma.productVariation.findMany).mockResolvedValue([])
        vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([])
        vi.mocked(prisma.product.findMany).mockResolvedValue(
          products as unknown as Awaited<
            ReturnType<typeof prisma.product.findMany>
          >,
        )
        vi.mocked(prisma.stockItem.findMany).mockResolvedValue([])

        const startTime = performance.now()
        const result = await PublicDiscoveryService.discover({
          page: 5,
          perPage: 12,
          sort: 'newest',
        })
        const durationMs = performance.now() - startTime

        console.log(
          `[Benchmark ${volume} prods] Paginação (page=5): ${durationMs.toFixed(2)}ms`,
        )

        expect(result.pagination.page).toBe(5)
        expect(result.products.length).toBeLessThanOrEqual(12)
        expect(durationMs).toBeGreaterThanOrEqual(0)
      })

      it(`7. Busca + Filtros/Facetas (mel + minPrice=20 + categoria=mel) com ${volume} produtos`, async () => {
        const { products, searchDocs } = generateMockProducts(volume)

        vi.mocked(prisma.category.findFirst).mockResolvedValue({
          id: 'cat-mel',
          name: 'Mel',
          slug: 'mel',
          description: 'Mel artesanal',
          parentId: null,
          parent: null,
        } as unknown as Awaited<ReturnType<typeof prisma.category.findFirst>>)
        vi.mocked(prisma.category.findMany).mockResolvedValue([])
        vi.mocked(prisma.store.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.brand.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
          outOfStockBehavior: 'show_badge',
        } as unknown as Awaited<
          ReturnType<typeof prisma.marketplaceSettings.findFirst>
        >)
        vi.mocked(prisma.productVariation.findMany).mockResolvedValue([])

        const melCandidates = searchDocs.filter((d) =>
          d.searchTextNormalized.includes('mel'),
        )
        vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue(
          melCandidates as unknown as Awaited<
            ReturnType<typeof prisma.productSearchDocument.findMany>
          >,
        )

        const matchingProds = products.filter(
          (p) =>
            p.categoryId === 'cat-mel' &&
            melCandidates.some((c) => c.productId === p.id),
        )
        vi.mocked(prisma.product.findMany).mockResolvedValue(
          matchingProds as unknown as Awaited<
            ReturnType<typeof prisma.product.findMany>
          >,
        )
        vi.mocked(prisma.stockItem.findMany).mockResolvedValue([])

        const startTime = performance.now()
        const result = await PublicDiscoveryService.discover({
          page: 1,
          perPage: 12,
          sort: 'price_asc',
          categorySlug: 'mel',
          minPrice: 20,
          search: 'mel',
        })
        const durationMs = performance.now() - startTime

        console.log(
          `[Benchmark ${volume} prods] Busca + Filtros + Facetas: ${durationMs.toFixed(2)}ms`,
        )

        expect(result.context.type).toBe('search')
        expect(durationMs).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Diagnóstico de Discrepância (ProductSearchIndexService)', () => {
    it('8. getDiscrepancyReport identifica produtos sem documento e documentos órfãos', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        { id: 'prod-1' },
        { id: 'prod-2' },
      ] as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>)

      vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([
        { productId: 'prod-1' },
        { productId: 'orphan-prod' },
      ] as unknown as Awaited<
        ReturnType<typeof prisma.productSearchDocument.findMany>
      >)

      const report = await ProductSearchIndexService.getDiscrepancyReport()

      expect(report.totalActiveProducts).toBe(2)
      expect(report.totalSearchDocuments).toBe(2)
      expect(report.missingDocumentProductIds).toEqual(['prod-2'])
      expect(report.orphanDocumentProductIds).toEqual(['orphan-prod'])
    })
  })
})
