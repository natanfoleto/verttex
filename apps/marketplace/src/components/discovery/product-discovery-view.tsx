'use client'
/* eslint-disable react/forbid-elements */

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import {
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiFilter3Line,
} from 'react-icons/ri'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { apiClient } from '../../lib/api-client'
import { EmptyState } from '../ui/empty-state'
import { MarketplacePageLoader } from '../ui/marketplace-page-loader'
import { ProductCard } from '../ui/product-card'

export interface DiscoveryProduct {
  id: string
  name: string
  slug: string
  shortDescription?: string | null
  type: string
  isFeatured?: boolean
  price: number
  promotionalPrice?: number | null
  mainImageUrl?: string | null
  store: { id: string; name: string; slug: string; logoUrl?: string | null }
  category: { id: string; name: string; slug: string }
  brand?: { id: string; name: string; slug: string } | null
  commercialStockAvailable: number
  isAvailable: boolean
  matchedVariantId?: string
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

export interface DiscoveryBreadcrumb {
  name: string
  slug: string
  url: string
}

export interface DiscoveryData {
  context: {
    type: 'search' | 'category' | 'store' | 'brand' | 'catalog'
    title: string
    description?: string | null
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
  products: DiscoveryProduct[]
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

export interface ProductDiscoveryViewProps {
  initialCategorySlug?: string
  initialStoreSlug?: string
  initialBrandSlug?: string
  initialQuery?: string
  initialIsOffer?: boolean
  overrideTitle?: string
  overrideDescription?: string
}

export function ProductDiscoveryView({
  initialCategorySlug,
  initialStoreSlug,
  initialBrandSlug,
  initialQuery,
  initialIsOffer,
  overrideTitle,
}: ProductDiscoveryViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const query = searchParams.get('q') || initialQuery || ''
  const categorySlug =
    searchParams.get('categorySlug') || initialCategorySlug || ''
  const storeSlug = searchParams.get('storeSlug') || initialStoreSlug || ''
  const brandSlug = searchParams.get('brandSlug') || initialBrandSlug || ''
  const sort = searchParams.get('sort') || 'relevance'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const isOffer =
    searchParams.get('isOffer') === 'true' || initialIsOffer || false

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [inputMinPrice, setInputMinPrice] = useState(minPrice)
  const [inputMaxPrice, setInputMaxPrice] = useState(maxPrice)

  // Construct URL parameters dynamically
  const buildApiParams = () => {
    const params = new URLSearchParams()
    params.append('page', String(page))
    params.append('perPage', '50')
    params.append('sort', sort)

    if (query) params.append('q', query)
    if (categorySlug) params.append('categorySlug', categorySlug)
    if (storeSlug) params.append('storeSlug', storeSlug)
    if (brandSlug) params.append('brandSlug', brandSlug)
    if (minPrice) params.append('minPrice', minPrice)
    if (maxPrice) params.append('maxPrice', maxPrice)
    if (isOffer) params.append('isOffer', 'true')

    // Forward attribute params
    searchParams.forEach((val, key) => {
      if (key.startsWith('attr_') || key.startsWith('attributes[')) {
        params.append(key, val)
      }
    })

    return params.toString()
  }

  // Update URL state
  const updateUrl = (newParams: Record<string, string | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))

    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === '') {
        current.delete(key)
      } else {
        current.set(key, val)
      }
    })

    // Reset page to 1 when filters change (unless page itself is updated)
    if (!('page' in newParams)) {
      current.set('page', '1')
    }

    const search = current.toString()
    const queryStr = search ? `?${search}` : ''
    const pathname =
      typeof window !== 'undefined' ? window.location.pathname : '/busca'

    router.push(`${pathname}${queryStr}`)
  }

  // Query Product Discovery Engine API
  const { data: discoveryData, isLoading } = useQuery<DiscoveryData>({
    queryKey: ['product-discovery', buildApiParams()],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await apiClient<DiscoveryData>(
        `/public/catalog/discover?${buildApiParams()}`,
      )
      return res
    },
  })

  const products: DiscoveryProduct[] =
    discoveryData?.products ||
    (discoveryData as unknown as { items?: DiscoveryProduct[] })?.items ||
    []

  const pagination = discoveryData?.pagination
  const availableFilters = discoveryData?.availableFilters ?? []
  const breadcrumbs = discoveryData?.breadcrumbs ?? []
  const context = discoveryData?.context

  const title =
    overrideTitle || context?.title || query || 'Catálogo de Produtos'

  const hasActiveFilters = Boolean(
    query ||
    categorySlug ||
    storeSlug ||
    brandSlug ||
    minPrice ||
    maxPrice ||
    isOffer ||
    Array.from(searchParams.keys()).some(
      (k) => k.startsWith('attr_') || k.startsWith('attributes['),
    ),
  )

  const clearAllFilters = () => {
    setInputMinPrice('')
    setInputMaxPrice('')
    router.push(
      typeof window !== 'undefined' ? window.location.pathname : '/busca',
    )
  }

  if (isLoading && !discoveryData) {
    return <MarketplacePageLoader />
  }

  return (
    <div className="min-h-screen pt-4 pb-16 font-sans text-stone-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mobile Filter Drawer Button */}
        <div className="mb-4 flex items-center justify-between border-b border-stone-200 pb-4 lg:hidden">
          <div className="text-xs font-medium text-stone-600">
            {pagination?.total || products.length} resultados
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="cursor-pointer gap-1.5 border-stone-300 bg-white text-xs"
          >
            <RiFilter3Line className="h-4 w-4 text-emerald-700" />
            <span>Filtros</span>
          </Button>
        </div>

        {/* Layout de Duas Colunas: Sidebar Esquerda + Grid de Produtos Direita */}
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:gap-10">
          {/* ─── SIDEBAR ESQUERDA (Breadcrumb, Título, Resultados, Filtros) ─── */}
          <aside
            className={`w-full shrink-0 space-y-5 lg:w-60 ${
              mobileFilterOpen
                ? 'block rounded-lg bg-white p-4 shadow-md'
                : 'hidden lg:block'
            }`}
          >
            {/* 1. Breadcrumbs Empilhados no Topo da Sidebar */}
            {breadcrumbs.length > 0 && (
              <nav className="flex flex-wrap items-center gap-1 text-[12px] leading-tight font-normal text-stone-500">
                {breadcrumbs.map((crumb, idx) => (
                  <span
                    key={crumb.url + idx}
                    className="inline-flex items-center gap-1"
                  >
                    {idx > 0 && (
                      <span className="font-light text-stone-400">&gt;</span>
                    )}
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="font-normal text-stone-700">
                        {crumb.name}
                      </span>
                    ) : (
                      <Link
                        href={crumb.url}
                        className="transition-colors hover:text-stone-900 hover:underline"
                      >
                        {crumb.name}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            )}

            {/* 2. Título Principal da Busca / Categoria & Contagem de Resultados */}
            <div className="space-y-1 pt-1">
              <h1 className="text-2xl leading-tight font-bold tracking-tight text-stone-900 capitalize sm:text-[26px]">
                {title}
              </h1>
              <p className="text-xs font-normal text-stone-500">
                {pagination?.total ?? products.length}{' '}
                {(pagination?.total ?? products.length) === 1
                  ? 'resultado'
                  : 'resultados'}
              </p>
            </div>

            {/* 3. Chips de Filtros Ativos com Botão 'X' */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {query && (
                  <Badge
                    variant="outline"
                    className="gap-1.5 rounded-sm border-stone-300 bg-white px-2 py-0.5 text-[11px] font-normal text-stone-700 shadow-2xs hover:bg-stone-50"
                  >
                    <span>{query}</span>
                    <button
                      type="button"
                      onClick={() => updateUrl({ q: null })}
                      className="cursor-pointer hover:text-stone-950"
                    >
                      <RiCloseLine className="h-3.5 w-3.5 text-stone-400" />
                    </button>
                  </Badge>
                )}
                {categorySlug && (
                  <Badge
                    variant="outline"
                    className="gap-1.5 rounded-sm border-stone-300 bg-white px-2 py-0.5 text-[11px] font-normal text-stone-700 shadow-2xs hover:bg-stone-50"
                  >
                    <span>{context?.category?.name || categorySlug}</span>
                    <button
                      type="button"
                      onClick={() => updateUrl({ categorySlug: null })}
                      className="cursor-pointer hover:text-stone-950"
                    >
                      <RiCloseLine className="h-3.5 w-3.5 text-stone-400" />
                    </button>
                  </Badge>
                )}
                {brandSlug && (
                  <Badge
                    variant="outline"
                    className="gap-1.5 rounded-sm border-stone-300 bg-white px-2 py-0.5 text-[11px] font-normal text-stone-700 shadow-2xs hover:bg-stone-50"
                  >
                    <span>{context?.brand?.name || brandSlug}</span>
                    <button
                      type="button"
                      onClick={() => updateUrl({ brandSlug: null })}
                      className="cursor-pointer hover:text-stone-950"
                    >
                      <RiCloseLine className="h-3.5 w-3.5 text-stone-400" />
                    </button>
                  </Badge>
                )}
                {storeSlug && (
                  <Badge
                    variant="outline"
                    className="gap-1.5 rounded-sm border-stone-300 bg-white px-2 py-0.5 text-[11px] font-normal text-stone-700 shadow-2xs hover:bg-stone-50"
                  >
                    <span>{context?.store?.name || storeSlug}</span>
                    <button
                      type="button"
                      onClick={() => updateUrl({ storeSlug: null })}
                      className="cursor-pointer hover:text-stone-950"
                    >
                      <RiCloseLine className="h-3.5 w-3.5 text-stone-400" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* 4. Facetas e Grupos de Filtro (Categorias, Marcas, Lojas, Preço) */}
            <div className="space-y-5 pt-1">
              {/* Filtro de Preço (Min / Max) */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-stone-900">Preço</h3>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={inputMinPrice}
                    onChange={(e) => setInputMinPrice(e.target.value)}
                    className="w-1/2 rounded-sm border border-stone-300 bg-white px-2 py-1 text-xs focus:outline-none"
                  />
                  <span className="text-xs text-stone-400">-</span>
                  <input
                    type="number"
                    placeholder="Máx"
                    value={inputMaxPrice}
                    onChange={(e) => setInputMaxPrice(e.target.value)}
                    className="w-1/2 rounded-sm border border-stone-300 bg-white px-2 py-1 text-xs focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateUrl({
                        minPrice: inputMinPrice || null,
                        maxPrice: inputMaxPrice || null,
                      })
                    }
                    className="cursor-pointer border-stone-300 bg-white px-2 py-1 text-xs"
                  >
                    OK
                  </Button>
                </div>
                {context?.priceRange &&
                  (context.priceRange.min > 0 ||
                    context.priceRange.max > 0) && (
                    <p className="text-[11px] text-stone-400">
                      Faixa: R$ {context.priceRange.min} - R${' '}
                      {context.priceRange.max}
                    </p>
                  )}
              </div>

              {availableFilters.map((facet) => {
                const paramKey =
                  facet.key === 'category'
                    ? 'categorySlug'
                    : facet.key === 'brand'
                      ? 'brandSlug'
                      : facet.key === 'store'
                        ? 'storeSlug'
                        : facet.key

                const isAttrFacet =
                  facet.key.startsWith('attr_') ||
                  !['category', 'brand', 'store'].includes(facet.key)

                return (
                  <div key={facet.key} className="space-y-2">
                    <h3 className="text-xs font-semibold text-stone-900">
                      {facet.label}
                    </h3>
                    <div className="space-y-1 text-xs">
                      {facet.options.map((opt) => {
                        const currentRaw =
                          searchParams.get(paramKey) ||
                          searchParams.get(facet.key) ||
                          ''
                        const currentValues = currentRaw
                          ? currentRaw.split(',')
                          : []
                        const isActive = currentValues.includes(opt.value)

                        const handleFacetClick = () => {
                          if (isAttrFacet) {
                            const newValues = isActive
                              ? currentValues.filter((v) => v !== opt.value)
                              : [...currentValues, opt.value]
                            updateUrl({
                              [paramKey]:
                                newValues.length > 0
                                  ? newValues.join(',')
                                  : null,
                            })
                          } else {
                            updateUrl({
                              [paramKey]: isActive ? null : opt.value,
                            })
                          }
                        }

                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={handleFacetClick}
                            className={`block w-full cursor-pointer truncate py-0.5 text-left transition-colors ${
                              isActive
                                ? 'font-bold text-emerald-700'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            {opt.label}{' '}
                            <span className="text-[11px] text-stone-400">
                              ({opt.count})
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>

          {/* ─── SEÇÃO DE PRODUTOS DIREITA ─── */}
          <main className="w-full flex-1 space-y-4">
            {/* 5. Ordenação Alinhada à Direita no Topo dos Produtos */}
            <div className="flex items-center justify-end gap-1.5 pb-1 text-xs font-normal text-stone-600">
              <span className="text-stone-500">Ordenar por</span>
              <div className="relative inline-flex items-center">
                <select
                  value={sort}
                  onChange={(e) => updateUrl({ sort: e.target.value })}
                  className="cursor-pointer appearance-none bg-transparent py-0.5 pr-4 text-xs font-semibold text-stone-900 focus:outline-none"
                >
                  <option value="relevance">Mais relevantes</option>
                  <option value="price_asc">Menor preço</option>
                  <option value="price_desc">Maior preço</option>
                  <option value="newest">Lançamentos</option>
                </select>
                <RiArrowDownSLine className="pointer-events-none absolute top-1/2 right-0 h-3.5 w-3.5 -translate-y-1/2 text-stone-600" />
              </div>
            </div>

            {/* Grid de Cards de Produtos (4 Colunas em Telas Grandes) */}
            {products.length === 0 ? (
              <EmptyState
                title={
                  query
                    ? `Nenhum produto encontrado para "${query}"`
                    : 'Nenhum produto disponível'
                }
                description="Tente ajustar seus termos de busca ou remover alguns filtros aplicados para expandir o catálogo."
                actionLabel={
                  hasActiveFilters ? 'Limpar Todos os Filtros' : undefined
                }
                onActionClick={hasActiveFilters ? clearAllFilters : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {products.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    id={prod.id}
                    name={prod.name}
                    slug={prod.slug}
                    price={prod.promotionalPrice || prod.price}
                    originalPrice={
                      prod.promotionalPrice ? prod.price : undefined
                    }
                    imageUrl={prod.mainImageUrl || undefined}
                    storeName={prod.store?.name}
                    storeSlug={prod.store?.slug}
                    isAvailable={prod.isAvailable}
                  />
                ))}
              </div>
            )}

            {/* Controle de Paginação */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between rounded-md border border-stone-200 bg-white p-4 shadow-2xs">
                {pagination.hasPreviousPage ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="cursor-pointer gap-1 bg-white text-xs"
                  >
                    <Link
                      href={(() => {
                        const current = new URLSearchParams(
                          Array.from(searchParams.entries()),
                        )
                        if (page - 1 <= 1) current.delete('page')
                        else current.set('page', String(page - 1))
                        const str = current.toString()
                        return str ? `?${str}` : '?'
                      })()}
                    >
                      <RiArrowLeftSLine className="h-4 w-4" />
                      <span>Anterior</span>
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    className="gap-1 bg-white text-xs opacity-50"
                  >
                    <RiArrowLeftSLine className="h-4 w-4" />
                    <span>Anterior</span>
                  </Button>
                )}

                <div className="text-xs font-semibold text-stone-700">
                  Página {pagination.page} de {pagination.totalPages}
                </div>

                {pagination.hasNextPage ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="cursor-pointer gap-1 bg-white text-xs"
                  >
                    <Link
                      href={(() => {
                        const current = new URLSearchParams(
                          Array.from(searchParams.entries()),
                        )
                        current.set('page', String(page + 1))
                        return `?${current.toString()}`
                      })()}
                    >
                      <span>Próxima</span>
                      <RiArrowRightSLine className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    className="gap-1 bg-white text-xs opacity-50"
                  >
                    <span>Próxima</span>
                    <RiArrowRightSLine className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
