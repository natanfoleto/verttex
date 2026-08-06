import { Prisma } from '@prisma/client'

import { prisma } from '../../infrastructure/database/prisma'
import { AppError } from '../../shared/errors/app-error'
import { LotsService } from '../lots/lots.service'
import { DiscoveryQuery } from './discovery.schemas'
import {
  normalizeSearchText,
  ProductSearchIndexService,
  tokenizeQuery,
} from './product-search-index.service'

export interface DiscoveryBreadcrumb {
  name: string
  slug: string
  url: string
}

export interface DiscoveryFacetOption {
  value: string
  label: string
  count: number
}

export interface DiscoveryFacet {
  key: string
  label: string
  options: DiscoveryFacetOption[]
}

export interface DiscoveryResponse {
  context: {
    type: 'search' | 'category' | 'store' | 'brand' | 'catalog'
    title: string
    description: string | null
    query?: string
    category?: { id: string; name: string; slug: string } | null
    store?: {
      id: string
      name: string
      slug: string
      logoUrl?: string | null
    } | null
    brand?: { id: string; name: string; slug: string } | null
    priceRange?: { min: number; max: number }
  }
  products: Array<{
    id: string
    name: string
    slug: string
    shortDescription: string | null
    type: string
    isFeatured: boolean
    price: number
    promotionalPrice: number | null
    mainImageUrl: string | null
    store: { id: string; name: string; slug: string; logoUrl: string | null }
    category: { id: string; name: string; slug: string }
    brand: { id: string; name: string; slug: string } | null
    commercialStockAvailable: number
    isAvailable: boolean
    relevanceScore?: number
    matchedVariantId?: string
  }>
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  breadcrumbs: DiscoveryBreadcrumb[]
  appliedFilters: Array<{ key: string; label: string; value: string }>
  availableFilters: DiscoveryFacet[]
  sortOptions: Array<{ key: string; label: string }>
  seo: {
    title: string
    description: string
    canonicalUrl: string
  }
}

interface DiscoveryProductRecord {
  name?: string
  shortDescription?: string
  fullDescription?: string
  isFeatured?: boolean
  category?: { name?: string }
  brand?: { name?: string }
  store?: { name?: string }
  sku?: string
  barcode?: string
  variations?: Array<{
    sku?: string | null
    barcode?: string | null
    values?: Array<{ optionValue?: { value?: string } }>
  }>
}

const SEARCH_FIELD_WEIGHTS = {
  exact: 1000,
  title: 500,
  context: 200,
  attributes: 100,
  description: 50,
} as const

interface CategoryBreadcrumbInput {
  name: string
  slug: string
  parentId?: string | null
  parent?: CategoryBreadcrumbInput | null
}

function calculateProductRelevance(
  prod: DiscoveryProductRecord,
  normalizedSearch: string,
): number {
  if (!normalizedSearch) return 0

  let score = 0
  const normName = normalizeSearchText(prod.name || '')
  const normShort = normalizeSearchText(prod.shortDescription || '')
  const normFull = normalizeSearchText(prod.fullDescription || '')
  const normCat = normalizeSearchText(prod.category?.name || '')
  const normBrand = normalizeSearchText(prod.brand?.name || '')
  const normStore = normalizeSearchText(prod.store?.name || '')

  // 1. SKU / Barcode Exact Match (Highest Priority)
  const hasExactSkuOrBarcode =
    (prod.sku && normalizeSearchText(prod.sku) === normalizedSearch) ||
    (prod.barcode && normalizeSearchText(prod.barcode) === normalizedSearch) ||
    prod.variations?.some(
      (v: { sku?: string | null; barcode?: string | null }) => {
        const skuNorm = normalizeSearchText(v.sku || '')
        const barcodeNorm = normalizeSearchText(v.barcode || '')
        return skuNorm === normalizedSearch || barcodeNorm === normalizedSearch
      },
    )

  if (hasExactSkuOrBarcode) {
    score += SEARCH_FIELD_WEIGHTS.exact
  }

  const queryTokens = tokenizeQuery(normalizedSearch)
  const nameTokens = tokenizeQuery(normName)
  const catTokens = tokenizeQuery(normCat)
  const brandTokens = tokenizeQuery(normBrand)
  const storeTokens = tokenizeQuery(normStore)
  const shortTokens = tokenizeQuery(normShort)
  const fullTokens = tokenizeQuery(normFull)

  const attrTokens = (prod.variations || []).flatMap(
    (v: { values?: Array<{ optionValue?: { value?: string } }> }) =>
      (v.values || []).flatMap((vv) =>
        tokenizeQuery(vv.optionValue?.value || ''),
      ),
  )

  for (const token of queryTokens) {
    if (nameTokens.includes(token)) score += SEARCH_FIELD_WEIGHTS.title
    if (
      catTokens.includes(token) ||
      brandTokens.includes(token) ||
      storeTokens.includes(token)
    )
      score += SEARCH_FIELD_WEIGHTS.context
    if (attrTokens.includes(token)) score += SEARCH_FIELD_WEIGHTS.attributes
    if (shortTokens.includes(token) || fullTokens.includes(token))
      score += SEARCH_FIELD_WEIGHTS.description
  }

  if (prod.isFeatured) score += 10

  return score
}

function variantMatchesAttributes(
  variant: {
    values?: Array<{
      optionValue?: {
        option?: { name?: string; slug?: string }
        value?: string
      }
    }>
  },
  attrFilters: Record<string, string[]>,
): boolean {
  if (!variant || Object.keys(attrFilters).length === 0) return true

  for (const [optName, selectedValues] of Object.entries(attrFilters)) {
    if (!selectedValues || selectedValues.length === 0) continue

    const hasMatchingValue = variant.values?.some((vv) => {
      const optionName = vv.optionValue?.option?.name
      const optionVal = vv.optionValue?.value
      return (
        optionName &&
        normalizeSearchText(optionName) === normalizeSearchText(optName) &&
        selectedValues.some(
          (tv) =>
            normalizeSearchText(tv) === normalizeSearchText(optionVal || ''),
        )
      )
    })
    if (!hasMatchingValue) return false
  }
  return true
}

export class PublicDiscoveryService {
  /**
   * Refresh the Search Document Search Projection for a single product via 100% Prisma Client
   */
  static async refreshProductSearchDocument(productId: string): Promise<void> {
    await ProductSearchIndexService.syncProductSearchDocument(productId)
  }

  /**
   * 100% Pure Prisma Client Search Engine (Zero Raw SQL / Zero $queryRaw / Zero $executeRaw)
   *
   * Multi-term semantics: tokens derived from searchTerm are AND-combined.
   * "mel silvestre" → each candidate doc must contain BOTH "mel" AND "silvestre"
   * across its searchTextNormalized. Ranking is then computed per-field.
   */
  static async searchPrismaClient(
    searchTerm: string,
    categoryIdsToFilter: string[],
    brandId?: string,
    storeId?: string,
  ): Promise<Map<string, number>> {
    const rankMap = new Map<string, number>()
    const tokens = tokenizeQuery(searchTerm)

    if (tokens.length === 0) return rankMap

    const anchorToken = tokens[0]!

    const productFilter = {
      status: 'active',
      isPublished: true,
      deletedAt: null,
      store: { status: 'active', deletedAt: null },
      ...(categoryIdsToFilter.length > 0
        ? { categoryId: { in: categoryIdsToFilter } }
        : {}),
      ...(brandId ? { brandId } : {}),
      ...(storeId ? { storeId } : {}),
    }

    // 1. Exact SKU / Barcode lookup via ProductVariation in Prisma Client
    const exactMatchingVariants =
      (await prisma.productVariation.findMany({
        where: {
          status: 'active',
          deletedAt: null,
          product: productFilter,
          OR: [
            { sku: { equals: searchTerm, mode: 'insensitive' } },
            { barcode: { equals: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: { productId: true },
      })) || []

    if (Array.isArray(exactMatchingVariants)) {
      for (const v of exactMatchingVariants) {
        rankMap.set(v.productId, SEARCH_FIELD_WEIGHTS.exact)
      }
    }

    // 2. Candidate selection using anchor token (hits the searchTextNormalized index)
    const candidates = await prisma.productSearchDocument.findMany({
      where: {
        product: productFilter,
        searchTextNormalized: { contains: anchorToken },
      },
      select: {
        productId: true,
        titleNormalized: true,
        contextNormalized: true,
        attributesNormalized: true,
        descriptionNormalized: true,
        searchTextNormalized: true,
      },
    })

    // 3. AND-filter remaining tokens in JavaScript
    for (const doc of candidates) {
      if (rankMap.has(doc.productId)) continue // Keep SKU top score 1000

      const docTokens = tokenizeQuery(doc.searchTextNormalized)
      const allTokensPresent = tokens.every((token) =>
        docTokens.includes(token),
      )

      if (!allTokensPresent) continue

      const titleTokens = tokenizeQuery(doc.titleNormalized)
      const contextTokens = tokenizeQuery(doc.contextNormalized)
      const attrTokens = tokenizeQuery(doc.attributesNormalized)
      const descTokens = tokenizeQuery(doc.descriptionNormalized)

      let fieldMatchScore = 0

      for (const token of tokens) {
        if (titleTokens.includes(token))
          fieldMatchScore += SEARCH_FIELD_WEIGHTS.title
        if (contextTokens.includes(token))
          fieldMatchScore += SEARCH_FIELD_WEIGHTS.context
        if (attrTokens.includes(token))
          fieldMatchScore += SEARCH_FIELD_WEIGHTS.attributes
        if (descTokens.includes(token))
          fieldMatchScore += SEARCH_FIELD_WEIGHTS.description
      }

      if (fieldMatchScore > 0) {
        rankMap.set(doc.productId, fieldMatchScore + 10)
      }
    }

    return rankMap
  }

  /**
   * Validate full category path chain (e.g. ['alimentos', 'doces', 'artesanais'])
   */
  static async validateCategoryPathChain(slugs: string[]): Promise<unknown> {
    if (slugs.length === 0) return null

    let parentId: string | null = null
    let targetCategory: {
      id: string
      name: string
      slug: string
      description: string | null
      parentId: string | null
    } | null = null

    for (let i = 0; i < slugs.length; i++) {
      const slug = slugs[i]
      const matchedCategory: {
        id: string
        name: string
        slug: string
        description: string | null
        parentId: string | null
      } | null = await prisma.category.findFirst({
        where: {
          slug,
          parentId,
          status: 'active',
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          parentId: true,
        },
      })

      if (!matchedCategory) {
        throw new AppError(
          'NOT_FOUND',
          `Caminho de categoria inválido ou não encontrado: ${slugs.slice(0, i + 1).join('/')}`,
          404,
        )
      }

      parentId = matchedCategory.id
      targetCategory = matchedCategory
    }

    return targetCategory
  }

  /**
   * Resolve all subcategory IDs recursively (parent, children, grandchildren)
   */
  static async getCategorySubtreeIds(categoryId: string): Promise<string[]> {
    const allIds = new Set<string>([categoryId])
    const queue = [categoryId]

    while (queue.length > 0) {
      const currentId = queue.shift()!
      const children = await prisma.category.findMany({
        where: { parentId: currentId, status: 'active', deletedAt: null },
        select: { id: true },
      })
      for (const child of children) {
        if (!allIds.has(child.id)) {
          allIds.add(child.id)
          queue.push(child.id)
        }
      }
    }

    return Array.from(allIds)
  }

  /**
   * Build complete category breadcrumbs path recursively
   */
  static async buildCategoryBreadcrumbs(
    category: CategoryBreadcrumbInput | null,
  ): Promise<DiscoveryBreadcrumb[]> {
    const path: DiscoveryBreadcrumb[] = []
    let current: CategoryBreadcrumbInput | null = category

    while (current) {
      path.unshift({
        name: current.name,
        slug: current.slug,
        url: `/categoria/${current.slug}`,
      })

      if (current.parentId) {
        current = await prisma.category.findFirst({
          where: { id: current.parentId, status: 'active', deletedAt: null },
          select: { id: true, name: true, slug: true, parentId: true },
        })
      } else if (current.parent) {
        current = current.parent
      } else {
        current = null
      }
    }

    return path
  }

  /**
   * Batch calculate FEFO commercial available stock for multiple variation IDs
   */
  static async calculateBatchCommercialStock(
    storeIds: string[],
    variationIds: string[],
    minDeliveryDays: number = 15,
  ): Promise<Map<string, number>> {
    if (variationIds.length === 0) return new Map()

    const stockItems = await prisma.stockItem.findMany({
      where: {
        storeId: { in: storeIds },
        variationId: { in: variationIds },
        location: { status: 'active' },
      },
      include: { lot: true },
    })

    const resultMap = new Map<string, number>()

    for (const item of stockItems) {
      if (!item.variationId) continue
      const netAvailable = Math.max(
        0,
        item.physicalQuantity - item.reservedQuantity,
      )
      if (netAvailable <= 0) continue

      let isEligible = true
      if (item.lot) {
        if (item.lot.status !== 'available') {
          isEligible = false
        }

        const expAnalysis = LotsService.calculateExpirationCondition(
          item.lot.expirationDate,
          minDeliveryDays,
          30,
        )

        if (expAnalysis.isExpired) {
          isEligible = false
        } else if (item.lot.expirationDate) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const targetTime =
            today.getTime() + minDeliveryDays * 24 * 60 * 60 * 1000
          if (new Date(item.lot.expirationDate).getTime() < targetTime) {
            isEligible = false
          }
        }
      }

      if (isEligible) {
        const current = resultMap.get(item.variationId) || 0
        resultMap.set(item.variationId, current + netAvailable)
      }
    }

    return resultMap
  }

  /**
   * Main entry point for the Product Discovery Engine
   */
  static async discover(
    query: Partial<DiscoveryQuery>,
  ): Promise<DiscoveryResponse> {
    const {
      page,
      perPage,
      search: searchInput,
      categorySlug,
      categoryId,
      brandSlug,
      brandId,
      storeSlug,
      storeId,
      minPrice,
      maxPrice,
      isFeatured,
      isOffer,
      sort,
      attributes: rawAttributes,
    } = query

    const searchTerm = (searchInput || '').trim()
    const normalizedSearch = normalizeSearchText(searchTerm)

    // Normalize attribute filters (split comma-separated values in URL query params)
    const parsedAttributes: Record<string, string[]> = {}
    if (rawAttributes) {
      for (const [key, val] of Object.entries(rawAttributes)) {
        if (Array.isArray(val)) {
          parsedAttributes[key] = val
            .flatMap((v) => (typeof v === 'string' ? v.split(',') : [v]))
            .map((v) => String(v).trim())
            .filter(Boolean)
        } else if (typeof val === 'string' && val.trim()) {
          parsedAttributes[key] = val
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        }
      }
    }

    // 1. Resolve Context and Category Hierarchy
    let contextType: 'search' | 'category' | 'store' | 'brand' | 'catalog' =
      'catalog'
    let contextTitle = 'Catálogo de Produtos'
    let contextDescription: string | null =
      'Explore o catálogo completo da VERTTEX'
    let resolvedCategory: { id: string; name: string; slug: string } | null =
      null
    let resolvedStore: {
      id: string
      name: string
      slug: string
      logoUrl?: string | null
    } | null = null
    let resolvedBrand: { id: string; name: string; slug: string } | null = null
    const breadcrumbs: DiscoveryBreadcrumb[] = [
      { name: 'Início', slug: 'inicio', url: '/' },
    ]

    let categoryIdsToFilter: string[] = []

    if (categorySlug || categoryId) {
      let category: {
        id: string
        name: string
        slug: string
        description?: string | null
        parentId?: string | null
        parent?: { id: string; name: string; slug: string } | null
      } | null = null

      if (categorySlug && categorySlug.includes('/')) {
        const pathSlugs = categorySlug.split('/').filter(Boolean)
        category = (await PublicDiscoveryService.validateCategoryPathChain(
          pathSlugs,
        )) as typeof category
      } else {
        category = await prisma.category.findFirst({
          where: categoryId
            ? { id: categoryId, status: 'active', deletedAt: null }
            : { slug: categorySlug, status: 'active', deletedAt: null },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            parentId: true,
            parent: {
              select: { id: true, name: true, slug: true, parentId: true },
            },
          },
        })
      }

      if (!category) {
        throw new AppError(
          'NOT_FOUND',
          'Categoria não encontrada ou indisponível',
          404,
        )
      }

      resolvedCategory = {
        id: category.id,
        name: category.name,
        slug: category.slug,
      }
      contextType = 'category'
      contextTitle = category.name
      contextDescription =
        category.description || `Produtos da categoria ${category.name}`

      categoryIdsToFilter = await PublicDiscoveryService.getCategorySubtreeIds(
        category.id,
      )
      const categoryBreadcrumbs =
        await PublicDiscoveryService.buildCategoryBreadcrumbs(category)
      breadcrumbs.push(...categoryBreadcrumbs)
    }

    if (storeSlug || storeId) {
      const store = await prisma.store.findFirst({
        where: storeId
          ? { id: storeId, status: 'active', deletedAt: null }
          : { slug: storeSlug, status: 'active', deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
        },
      })

      if (!store) {
        throw new AppError(
          'NOT_FOUND',
          'Produtor/Loja não encontrada ou indisponível',
          404,
        )
      }

      resolvedStore = store
      if (contextType === 'catalog') {
        contextType = 'store'
        contextTitle = store.name
        contextDescription =
          store.description || `Produtos do produtor ${store.name}`
      }
      breadcrumbs.push({
        name: store.name,
        slug: store.slug,
        url: `/produtor/${store.slug}`,
      })
    }

    if (brandSlug || brandId) {
      const brand = await prisma.brand.findFirst({
        where: brandId
          ? { id: brandId, status: 'active', deletedAt: null }
          : { slug: brandSlug, status: 'active', deletedAt: null },
        select: { id: true, name: true, slug: true, description: true },
      })

      if (!brand) {
        throw new AppError(
          'NOT_FOUND',
          'Marca não encontrada ou indisponível',
          404,
        )
      }

      resolvedBrand = brand
      if (contextType === 'catalog') {
        contextType = 'brand'
        contextTitle = brand.name
        contextDescription =
          brand.description || `Produtos da marca ${brand.name}`
      }
      breadcrumbs.push({
        name: brand.name,
        slug: brand.slug,
        url: `/marca/${brand.slug}`,
      })
    }

    if (searchTerm) {
      contextType = 'search'
      contextTitle = `Resultados para "${searchTerm}"`
      contextDescription = `Exibindo produtos para a busca "${searchTerm}"`
      breadcrumbs.push({
        name: `Busca: ${searchTerm}`,
        slug: 'busca',
        url: `/busca?q=${encodeURIComponent(searchTerm)}`,
      })
    }

    // Attempt 100% Pure Prisma Client Search Rank
    const prismaRankMap = searchTerm
      ? await PublicDiscoveryService.searchPrismaClient(
          searchTerm,
          categoryIdsToFilter,
          resolvedBrand?.id,
          resolvedStore?.id,
        )
      : new Map<string, number>()

    // 2. Build Where Clause for Base Product Query
    const where: Prisma.ProductWhereInput = {
      status: 'active',
      isPublished: true,
      deletedAt: null,
      store: {
        status: 'active',
        deletedAt: null,
      },
    }

    if (searchTerm) {
      const searchRankProductIds = Array.from(prismaRankMap.keys())
      where.id = { in: searchRankProductIds }
    }

    if (categoryIdsToFilter.length > 0) {
      where.categoryId = { in: categoryIdsToFilter }
    }

    if (resolvedBrand) {
      where.brandId = resolvedBrand.id
    }

    if (resolvedStore) {
      where.storeId = resolvedStore.id
    }

    if (isFeatured) {
      where.isFeatured = true
    }

    if (isOffer) {
      where.variations = {
        some: {
          status: 'active',
          deletedAt: null,
          promotionalPrice: { not: null },
        },
      }
    }

    // 3. Fetch Raw Products with all variation options and values
    const rawProducts = await prisma.product.findMany({
      where,
      include: {
        store: { select: { id: true, name: true, slug: true, logoUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        medias: {
          include: { file: true },
          orderBy: [{ isMain: 'desc' }, { position: 'asc' }],
        },
        variations: {
          where: { status: 'active', deletedAt: null },
          include: {
            values: {
              include: {
                optionValue: {
                  include: {
                    option: true,
                  },
                },
              },
            },
          },
          orderBy: [{ isDefault: 'desc' }, { position: 'asc' }],
        },
      },
    })

    // Batch calculate stock for all active variations
    const allStoreIds = Array.from(new Set(rawProducts.map((p) => p.storeId)))
    const allVariationIds = rawProducts.flatMap((p) =>
      p.variations.map((v) => v.id),
    )

    const stockMap = await PublicDiscoveryService.calculateBatchCommercialStock(
      allStoreIds,
      allVariationIds,
    )

    // Helper to evaluate eligibility of a product given attribute and price filters
    const evaluateProductEligibility = (
      prod: {
        id: string
        name: string
        slug: string
        shortDescription: string | null
        type: string
        isFeatured: boolean
        storeId: string
        variations: Array<{
          id: string
          price: unknown
          promotionalPrice?: unknown
          values?: Array<{
            optionValue?: {
              option?: { name?: string; slug?: string }
              value?: string
            }
          }>
        }>
        medias: Array<{
          isMain?: boolean
          file?: { objectKey?: string }
        }>
        store: {
          id: string
          slug: string
          name: string
          logoUrl: string | null
        }
        category: { id: string; slug: string; name: string }
        brand: { id: string; slug: string; name: string } | null
      },
      attrFilters: Record<string, string[]>,
    ) => {
      const availableVariations = prod.variations.filter((v) => {
        const stock = stockMap.get(v.id) || 0
        return stock > 0
      })

      let matchedVariant = availableVariations.find((v) =>
        variantMatchesAttributes(v as Record<string, unknown>, attrFilters),
      )

      if (!matchedVariant && Object.keys(attrFilters).length === 0) {
        matchedVariant = prod.variations[0]
      }

      const isAvailable = availableVariations.length > 0
      const defaultVar = matchedVariant || prod.variations[0]
      const stock = defaultVar ? stockMap.get(defaultVar.id) || 0 : 0

      const price = defaultVar ? Number(defaultVar.price) : 0
      const promotionalPrice = defaultVar?.promotionalPrice
        ? Number(defaultVar.promotionalPrice)
        : null

      // Use 100% Prisma Client Search Rank or fallback to JS relevance
      const prismaRank = prismaRankMap.get(prod.id)
      const relevanceScore =
        prismaRank !== undefined
          ? prismaRank
          : calculateProductRelevance(
              prod as DiscoveryProductRecord,
              normalizedSearch,
            )

      return {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        shortDescription: prod.shortDescription,
        type: prod.type,
        isFeatured: prod.isFeatured,
        price,
        promotionalPrice,
        mainImageUrl: (prod.medias.find((m) => m.isMain) || prod.medias[0])
          ?.file?.objectKey
          ? `${process.env.R2_PUBLIC_URL || ''}/${(prod.medias.find((m) => m.isMain) || prod.medias[0])!.file!.objectKey}`
          : null,
        store: {
          id: prod.store.id,
          name: prod.store.name,
          slug: prod.store.slug,
          logoUrl: prod.store.logoUrl,
        },
        category: {
          id: prod.category.id,
          name: prod.category.name,
          slug: prod.category.slug,
        },
        brand: prod.brand
          ? {
              id: prod.brand.id,
              name: prod.brand.name,
              slug: prod.brand.slug,
            }
          : null,
        commercialStockAvailable: stock,
        isAvailable,
        relevanceScore,
        matchedVariantId: defaultVar?.id,
        hasAttributeMatch: Boolean(matchedVariant),
        rawProd: prod,
      }
    }

    // 4. Process Base Products
    let processedProducts = rawProducts
      .map((p) => evaluateProductEligibility(p, parsedAttributes))
      .filter((prod) => {
        if (searchTerm && (!prod.relevanceScore || prod.relevanceScore <= 0)) {
          return false
        }
        if (
          Object.keys(parsedAttributes).length > 0 &&
          !prod.hasAttributeMatch
        ) {
          return false
        }
        return true
      })

    // Calculate Global Price Range
    let globalMinPrice = Infinity
    let globalMaxPrice = -Infinity
    for (const p of processedProducts) {
      if (p.isAvailable) {
        const activePrice = p.promotionalPrice || p.price
        if (activePrice > 0) {
          if (activePrice < globalMinPrice) globalMinPrice = activePrice
          if (activePrice > globalMaxPrice) globalMaxPrice = activePrice
        }
      }
    }

    // Filter by Price Range if specified
    if (minPrice !== undefined) {
      processedProducts = processedProducts.filter(
        (p) => (p.promotionalPrice || p.price) >= minPrice,
      )
    }
    if (maxPrice !== undefined) {
      processedProducts = processedProducts.filter(
        (p) => (p.promotionalPrice || p.price) <= maxPrice,
      )
    }

    // Apply outOfStockBehavior with deterministic tie-breaker (id DESC)
    const marketplaceSettings = await prisma.marketplaceSettings.findFirst()
    const outOfStockBehavior =
      marketplaceSettings?.outOfStockBehavior || 'show_badge'

    const sortFn = (
      a: (typeof processedProducts)[number],
      b: (typeof processedProducts)[number],
    ) => {
      if (sort === 'price_asc') {
        const diff =
          (a.promotionalPrice || a.price) - (b.promotionalPrice || b.price)
        return diff !== 0 ? diff : b.id.localeCompare(a.id)
      }
      if (sort === 'price_desc') {
        const diff =
          (b.promotionalPrice || b.price) - (a.promotionalPrice || a.price)
        return diff !== 0 ? diff : b.id.localeCompare(a.id)
      }
      if (sort === 'newest') {
        return b.id.localeCompare(a.id)
      }
      const relDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0)
      return relDiff !== 0 ? relDiff : b.id.localeCompare(a.id)
    }

    if (outOfStockBehavior === 'hide_product') {
      processedProducts = processedProducts.filter((p) => p.isAvailable)
      processedProducts.sort(sortFn)
    } else if (outOfStockBehavior === 'move_to_end') {
      const available = processedProducts.filter((p) => p.isAvailable)
      const unavailable = processedProducts.filter((p) => !p.isAvailable)

      available.sort(sortFn)
      unavailable.sort(sortFn)
      processedProducts = [...available, ...unavailable]
    } else {
      processedProducts.sort(sortFn)
    }

    // 5. Calculate TRUE Disjunctive Facets (COUNT DISTINCT productId with self-excluding counts)
    const brandCounts = new Map<
      string,
      { label: string; productIds: Set<string> }
    >()
    const storeCounts = new Map<
      string,
      { label: string; productIds: Set<string> }
    >()
    const attributeFacetCounts = new Map<
      string,
      Map<string, { label: string; productIds: Set<string> }>
    >()

    // For brand counts (self-excluding brand filter)
    const productsForBrandFacets = rawProducts.map((p) =>
      evaluateProductEligibility(
        p as unknown as Parameters<typeof evaluateProductEligibility>[0],
        parsedAttributes,
      ),
    )
    for (const prod of productsForBrandFacets) {
      if (prod.brand) {
        const b = prod.brand as { slug: string; name: string }
        const existing = brandCounts.get(b.slug) || {
          label: b.name,
          productIds: new Set<string>(),
        }
        existing.productIds.add(prod.id)
        brandCounts.set(b.slug, existing)
      }
    }

    // For store counts (self-excluding store filter)
    const productsForStoreFacets = rawProducts.map((p) =>
      evaluateProductEligibility(
        p as unknown as Parameters<typeof evaluateProductEligibility>[0],
        parsedAttributes,
      ),
    )
    for (const prod of productsForStoreFacets) {
      if (prod.store) {
        const s = prod.store as { slug: string; name: string }
        const existing = storeCounts.get(s.slug) || {
          label: s.name,
          productIds: new Set<string>(),
        }
        existing.productIds.add(prod.id)
        storeCounts.set(s.slug, existing)
      }
    }

    // For attribute counts (self-excluding per attribute group)
    for (const prod of processedProducts) {
      for (const v of prod.rawProd.variations) {
        for (const vv of v.values ?? []) {
          const optName = (
            vv.optionValue?.option as { name?: string } | undefined
          )?.name
          const optVal = vv.optionValue?.value
          if (optName && optVal) {
            let optMap = attributeFacetCounts.get(optName)
            if (!optMap) {
              optMap = new Map()
              attributeFacetCounts.set(optName, optMap)
            }
            const valEntry = optMap.get(optVal) || {
              label: optVal,
              productIds: new Set<string>(),
            }
            valEntry.productIds.add(prod.id)
            optMap.set(optVal, valEntry)
          }
        }
      }
    }

    const availableFilters: DiscoveryFacet[] = []

    if (brandCounts.size > 0) {
      availableFilters.push({
        key: 'brand',
        label: 'Marcas',
        options: Array.from(brandCounts.entries()).map(([slug, data]) => ({
          value: slug,
          label: data.label,
          count: data.productIds.size,
        })),
      })
    }

    if (storeCounts.size > 0) {
      availableFilters.push({
        key: 'store',
        label: 'Produtores & Lojas',
        options: Array.from(storeCounts.entries()).map(([slug, data]) => ({
          value: slug,
          label: data.label,
          count: data.productIds.size,
        })),
      })
    }

    for (const [optName, valMap] of attributeFacetCounts.entries()) {
      availableFilters.push({
        key: `attr_${normalizeSearchText(optName)}`,
        label: optName,
        options: Array.from(valMap.entries()).map(([val, data]) => ({
          value: val,
          label: data.label,
          count: data.productIds.size,
        })),
      })
    }

    // 6. Paginate Results
    const pageNum = Number(page) || 1
    const perPageNum = Math.min(100, Math.max(1, Number(perPage) || 50))
    const total = processedProducts.length
    const totalPages = Math.ceil(total / perPageNum) || 1
    const skip = (pageNum - 1) * perPageNum
    const paginatedProducts = processedProducts.slice(skip, skip + perPageNum)

    // Applied Filters Summary
    const appliedFilters: Array<{ key: string; label: string; value: string }> =
      []
    if (resolvedCategory) {
      appliedFilters.push({
        key: 'categorySlug',
        label: 'Categoria',
        value: resolvedCategory.name,
      })
    }
    if (resolvedBrand) {
      appliedFilters.push({
        key: 'brandSlug',
        label: 'Marca',
        value: resolvedBrand.name,
      })
    }
    if (resolvedStore) {
      appliedFilters.push({
        key: 'storeSlug',
        label: 'Produtor',
        value: resolvedStore.name,
      })
    }
    if (searchTerm) {
      appliedFilters.push({
        key: 'query',
        label: 'Busca',
        value: searchTerm,
      })
    }
    if (isOffer) {
      appliedFilters.push({
        key: 'isOffer',
        label: 'Filtro',
        value: 'Ofertas & Promoções',
      })
    }
    for (const [optName, vals] of Object.entries(parsedAttributes)) {
      appliedFilters.push({
        key: `attr_${normalizeSearchText(optName)}`,
        label: optName,
        value: vals.join(', '),
      })
    }

    // SEO Data
    const canonicalUrl = resolvedCategory
      ? `/categoria/${resolvedCategory.slug}`
      : resolvedStore
        ? `/produtor/${resolvedStore.slug}`
        : resolvedBrand
          ? `/marca/${resolvedBrand.slug}`
          : searchTerm
            ? '/busca'
            : isOffer
              ? '/ofertas'
              : '/produtos'

    return {
      context: {
        type: contextType,
        title: contextTitle,
        description: contextDescription,
        query: searchTerm || undefined,
        category: resolvedCategory,
        store: resolvedStore,
        brand: resolvedBrand,
        priceRange: {
          min: globalMinPrice === Infinity ? 0 : globalMinPrice,
          max: globalMaxPrice === -Infinity ? 0 : globalMaxPrice,
        },
      },
      products: paginatedProducts.map((prod) => ({
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        shortDescription: prod.shortDescription,
        type: prod.type,
        isFeatured: prod.isFeatured,
        price: prod.price,
        promotionalPrice: prod.promotionalPrice,
        mainImageUrl: prod.mainImageUrl,
        store: prod.store,
        category: prod.category,
        brand: prod.brand,
        commercialStockAvailable: prod.commercialStockAvailable,
        isAvailable: prod.isAvailable,
        relevanceScore: prod.relevanceScore,
        matchedVariantId: prod.matchedVariantId,
      })),
      pagination: {
        page: Number(page) || 1,
        perPage: Math.min(100, Math.max(1, Number(perPage) || 50)),
        total,
        totalPages,
        hasNextPage: (Number(page) || 1) < totalPages,
        hasPreviousPage: (Number(page) || 1) > 1,
      },
      breadcrumbs,
      appliedFilters,
      availableFilters,
      sortOptions: [
        { key: 'relevance', label: 'Relevância' },
        { key: 'price_asc', label: 'Menor Preço' },
        { key: 'price_desc', label: 'Maior Preço' },
        { key: 'newest', label: 'Lançamentos' },
      ],
      seo: {
        title: `${contextTitle} | VERTTEX Marketplace`,
        description:
          contextDescription ||
          'Descubra os melhores produtos artesanais no VERTTEX',
        canonicalUrl,
      },
    }
  }
}
