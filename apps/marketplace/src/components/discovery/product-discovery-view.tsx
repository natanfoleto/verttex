'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import {
  RiArrowRightSLine,
  RiArrowLeftSLine,
  RiCloseLine,
  RiFilter3Line,
  RiSearchLine,
} from 'react-icons/ri'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { EmptyState } from '../ui/empty-state'
import { MarketplacePageLoader } from '../ui/marketplace-page-loader'
import { ProductCard } from '../ui/product-card'
import { apiClient } from '../../lib/api-client'

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

export interface DiscoveryApiResponse {
  success: boolean
  data: {
    context: {
      type: 'search' | 'category' | 'store' | 'brand' | 'catalog'
      title: string
      description?: string | null
      query?: string
      category?: { id: string; name: string; slug: string } | null
      store?: { id: string; name: string; slug: string; logoUrl?: string | null } | null
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
}

export interface ProductDiscoveryViewProps {
  initialCategorySlug?: string
  initialStoreSlug?: string
  initialBrandSlug?: string
  initialQuery?: string
  overrideTitle?: string
  overrideDescription?: string
}

export function ProductDiscoveryView({
  initialCategorySlug,
  initialStoreSlug,
  initialBrandSlug,
  initialQuery,
  overrideTitle,
  overrideDescription,
}: ProductDiscoveryViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const query = searchParams.get('q') || initialQuery || ''
  const categorySlug = searchParams.get('categorySlug') || initialCategorySlug || ''
  const storeSlug = searchParams.get('storeSlug') || initialStoreSlug || ''
  const brandSlug = searchParams.get('brandSlug') || initialBrandSlug || ''
  const sort = searchParams.get('sort') || 'relevance'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(query)

  // Construct URL parameters dynamically
  const buildApiParams = () => {
    const params = new URLSearchParams()
    params.append('page', String(page))
    params.append('perPage', '12')
    params.append('sort', sort)

    if (query) params.append('q', query)
    if (categorySlug) params.append('categorySlug', categorySlug)
    if (storeSlug) params.append('storeSlug', storeSlug)
    if (brandSlug) params.append('brandSlug', brandSlug)
    if (minPrice) params.append('minPrice', minPrice)
    if (maxPrice) params.append('maxPrice', maxPrice)

    // Forward attribute params
    searchParams.forEach((val, key) => {
      if (key.startsWith('attr_')) {
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
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/busca'

    router.push(`${pathname}${queryStr}`)
  }

  // Handle Search Form Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrl({ q: searchInput.trim() || null })
  }

  // Query Product Discovery Engine API
  const { data: discoveryRes, isLoading } = useQuery<DiscoveryApiResponse>({
    queryKey: ['product-discovery', buildApiParams()],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await apiClient<DiscoveryApiResponse>(`/public/catalog/discover?${buildApiParams()}`)
      return res
    },
  })

  const discoveryData = discoveryRes?.data
  const products = discoveryData?.products ?? []
  const pagination = discoveryData?.pagination
  const availableFilters = discoveryData?.availableFilters ?? []
  const breadcrumbs = discoveryData?.breadcrumbs ?? []
  const context = discoveryData?.context

  const title = overrideTitle || context?.title || 'Catálogo de Produtos'
  const description = overrideDescription || context?.description || 'Explore nosso catálogo de produtos artesanais'

  const hasActiveFilters = Boolean(
    query || categorySlug || storeSlug || brandSlug || minPrice || maxPrice ||
    Array.from(searchParams.keys()).some((k) => k.startsWith('attr_'))
  )

  const clearAllFilters = () => {
    setSearchInput('')
    router.push(typeof window !== 'undefined' ? window.location.pathname : '/busca')
  }

  if (isLoading && !discoveryData) {
    return <MarketplacePageLoader />
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-16">
      {/* ─── Breadcrumbs ─── */}
      <div className="bg-white border-b border-stone-200 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav className="flex items-center space-x-1.5 text-xs text-stone-500 overflow-x-auto">
            {breadcrumbs.map((crumb, idx) => (
              <div key={crumb.url + idx} className="flex items-center space-x-1.5 shrink-0">
                {idx > 0 && <RiArrowRightSLine className="h-3.5 w-3.5 text-stone-400" />}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="font-semibold text-emerald-800">{crumb.name}</span>
                ) : (
                  <Link href={crumb.url} className="hover:text-stone-900 transition-colors">
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* ─── Page Header & Search Bar ─── */}
      <div className="bg-white border-b border-stone-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-stone-600 mt-1 max-w-2xl">
                  {description}
                </p>
              )}
            </div>

            {/* In-Page Search Box */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80 shrink-0">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 bg-stone-50 border-stone-300 text-xs focus:bg-white"
                />
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              </div>
              <Button type="submit" size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer">
                Buscar
              </Button>
            </form>
          </div>

          {/* Active Filters Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
              <span className="text-xs font-semibold text-stone-500 mr-1">
                Filtros ativos:
              </span>
              {query && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs py-1 px-2.5 gap-1.5 font-medium">
                  <span>Busca: "{query}"</span>
                  <button type="button" onClick={() => updateUrl({ q: null })} className="hover:text-emerald-950 cursor-pointer">
                    <RiCloseLine className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {categorySlug && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs py-1 px-2.5 gap-1.5 font-medium">
                  <span>Categoria: {context?.category?.name || categorySlug}</span>
                  <button type="button" onClick={() => updateUrl({ categorySlug: null })} className="hover:text-emerald-950 cursor-pointer">
                    <RiCloseLine className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {brandSlug && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs py-1 px-2.5 gap-1.5 font-medium">
                  <span>Marca: {context?.brand?.name || brandSlug}</span>
                  <button type="button" onClick={() => updateUrl({ brandSlug: null })} className="hover:text-emerald-950 cursor-pointer">
                    <RiCloseLine className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {storeSlug && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs py-1 px-2.5 gap-1.5 font-medium">
                  <span>Produtor: {context?.store?.name || storeSlug}</span>
                  <button type="button" onClick={() => updateUrl({ storeSlug: null })} className="hover:text-emerald-950 cursor-pointer">
                    <RiCloseLine className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-stone-500 hover:text-stone-900 h-7 px-2 cursor-pointer font-medium"
              >
                Limpar todos
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <RiFilter3Line className="h-4 w-4 text-emerald-700" />
                  <span>Filtros do Catálogo</span>
                </h3>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs text-emerald-700 hover:underline font-semibold cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Dynamic Facets */}
              {availableFilters.map((facet) => (
                <div key={facet.key} className="space-y-2.5 border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                  <h4 className="text-xs font-bold text-stone-800 tracking-wide uppercase">
                    {facet.label}
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {facet.options.map((opt) => {
                      const isActive =
                        searchParams.get(facet.key) === opt.value ||
                        searchParams.get(`${facet.key}Slug`) === opt.value

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const paramKey = facet.key === 'brand' ? 'brandSlug' : facet.key === 'store' ? 'storeSlug' : facet.key
                            updateUrl({ [paramKey]: isActive ? null : opt.value })
                          }}
                          className={`w-full flex items-center justify-between text-xs py-1 px-2 rounded-md transition-colors text-left cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 font-bold text-emerald-800'
                              : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full shrink-0 font-medium ml-2">
                            {opt.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Results Listing Column */}
          <main className="flex-1 space-y-6">
            {/* Control Bar: Total Count & Sorting */}
            <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
              <div className="text-xs text-stone-600 font-medium">
                Exibindo <span className="font-bold text-stone-900">{products.length}</span> de{' '}
                <span className="font-bold text-stone-900">{pagination?.total || 0}</span> produtos
              </div>

              <div className="flex items-center gap-3 justify-between sm:justify-end">
                {/* Mobile Filter Toggle Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                  className="lg:hidden text-xs gap-1.5 border-stone-300 cursor-pointer"
                >
                  <RiFilter3Line className="h-4 w-4 text-emerald-700" />
                  <span>Filtros</span>
                </Button>

                {/* Sort Select Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 font-medium shrink-0">Ordenar:</span>
                  <select
                    value={sort}
                    onChange={(e) => updateUrl({ sort: e.target.value })}
                    className="h-8 text-xs bg-white border border-stone-300 rounded-md px-2 font-medium text-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
                  >
                    <option value="relevance">Mais Relevantes</option>
                    <option value="price_asc">Menor Preço</option>
                    <option value="price_desc">Maior Preço</option>
                    <option value="newest">Lançamentos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Grid / Empty State */}
            {products.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-8 shadow-xs">
                <EmptyState
                  title={query ? `Nenhum produto encontrado para "${query}"` : 'Nenhum produto disponível'}
                  description="Tente ajustar seus termos de busca ou remover alguns filtros aplicados para expandir o catálogo."
                  actionLabel={hasActiveFilters ? 'Limpar Todos os Filtros' : undefined}
                  onActionClick={hasActiveFilters ? clearAllFilters : undefined}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    id={prod.id}
                    name={prod.name}
                    slug={prod.slug}
                    price={prod.promotionalPrice || prod.price}
                    originalPrice={prod.promotionalPrice ? prod.price : undefined}
                    imageUrl={prod.mainImageUrl || undefined}
                    storeName={prod.store?.name}
                    storeSlug={prod.store?.slug}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-between shadow-xs">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => updateUrl({ page: String(page - 1) })}
                  className="text-xs gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RiArrowLeftSLine className="h-4 w-4" />
                  <span>Anterior</span>
                </Button>

                <div className="text-xs font-semibold text-stone-700">
                  Página {pagination.page} de {pagination.totalPages}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => updateUrl({ page: String(page + 1) })}
                  className="text-xs gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span>Próxima</span>
                  <RiArrowRightSLine className="h-4 w-4" />
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
