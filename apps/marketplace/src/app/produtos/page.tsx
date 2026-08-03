'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { RiCloseLine, RiFilter3Line, RiSearchLine } from 'react-icons/ri'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { EmptyState } from '../../components/ui/empty-state'
import { FilterSidebar } from '../../components/ui/filter-sidebar'
import { MarketplacePageLoader } from '../../components/ui/marketplace-page-loader'
import { ProductCard, ProductCardProps } from '../../components/ui/product-card'
import { apiClient } from '../../lib/api-client'

interface PublicProductCatalogItem {
  id: string
  name: string
  slug: string
  price: number
  promotionalPrice?: number | null
  mainImageUrl?: string | null
  isFeatured?: boolean
  store?: {
    name?: string
    slug?: string
  } | null
}

export default function ProductsListingPage() {
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('categorySlug') || '',
  )
  const [selectedSort, setSelectedSort] = useState('featured')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 12

  // Query Public Categories
  const { data: categories = [] } = useQuery<
    Array<{
      id: string
      name: string
      slug: string
      parentId?: string | null
      productsCount: number
    }>
  >({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const res = await apiClient('/public/catalog/categories')
      return Array.isArray(res) ? res : (res?.data ?? [])
    },
  })

  // Query Public Products Catalog
  const { data: catalogRes, isLoading } = useQuery<{
    data: PublicProductCatalogItem[]
    meta: {
      page: number
      perPage: number
      total: number
      totalPages: number
    }
  }>({
    queryKey: [
      'public-products',
      page,
      perPage,
      searchQuery,
      selectedCategory,
      selectedSort,
    ],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('perPage', String(perPage))
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory) params.append('categorySlug', selectedCategory)
      if (selectedSort) params.append('sort', selectedSort)

      const res = await apiClient(
        `/public/catalog/products?${params.toString()}`,
      )
      return res
    },
  })

  const productsList = catalogRes?.data ?? []
  const meta = catalogRes?.meta
  const totalPages = meta?.totalPages || 1

  const categoriesFormatted = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    count: c.productsCount,
  }))

  const mappedProducts: ProductCardProps[] = productsList.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.promotionalPrice || p.price,
    originalPrice: p.promotionalPrice ? p.price : undefined,
    imageUrl: p.mainImageUrl || undefined,
    storeName: p.store?.name || 'Produtor',
    storeSlug: p.store?.slug || '',
    badge: p.isFeatured ? 'Destaque' : undefined,
    isBestSeller: p.isFeatured,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 font-sans antialiased">
      {/* Breadcrumb & Page Title Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-emerald-800 transition-colors">
            Início
          </Link>
          <span>/</span>
          <span className="font-semibold text-stone-800">Produtos</span>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Catálogo de Produtos Artesanais
            </h1>
            <p className="mt-2 text-xs text-stone-500">
              Explore o melhor da gastronomia e produção regional direto da
              origem.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden cursor-pointer"
          >
            <RiFilter3Line className="h-4 w-4 text-emerald-700" />
            <span>Filtrar Produtos</span>
          </Button>
        </div>
      </div>

      {/* Main Catalog Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:col-span-1 lg:block">
          <div className="sticky top-24">
            <FilterSidebar
              categories={categoriesFormatted}
              activeCategorySlug={selectedCategory}
              activeSort={selectedSort}
              onSelectCategory={(slug) => {
                setSelectedCategory(slug)
                setPage(1)
              }}
              onSelectSort={(sort) => {
                setSelectedSort(sort)
                setPage(1)
              }}
              onClearAll={() => {
                setSelectedCategory('')
                setSelectedSort('featured')
                setSearchQuery('')
                setPage(1)
              }}
            />
          </div>
        </aside>

        {/* Mobile Filter Modal */}
        {mobileFilterOpen && (
          <div className="space-y-4 rounded-md border border-stone-200 p-5 lg:hidden">
            <FilterSidebar
              categories={categoriesFormatted}
              activeCategorySlug={selectedCategory}
              activeSort={selectedSort}
              onSelectCategory={(slug) => {
                setSelectedCategory(slug)
                setMobileFilterOpen(false)
                setPage(1)
              }}
              onSelectSort={(sort) => {
                setSelectedSort(sort)
                setPage(1)
              }}
              onClearAll={() => {
                setSelectedCategory('')
                setSelectedSort('featured')
                setSearchQuery('')
                setPage(1)
              }}
            />
          </div>
        )}

        {/* Product Grid Area */}
        <main className="space-y-6 lg:col-span-3">
          {/* Top Search & Results Counter */}
          <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-xl">
              <RiSearchLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Buscar produtos por nome ou descrição..."
                className="pl-10 pr-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setPage(1)
                  }}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer rounded-full p-0.5"
                >
                  <RiCloseLine className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="shrink-0 text-xs font-medium text-stone-500">
              Mostrando{' '}
              <strong className="font-bold text-stone-900">
                {mappedProducts.length}
              </strong>{' '}
              de{' '}
              <strong className="font-bold text-stone-900">
                {meta?.total || 0}
              </strong>{' '}
              produtos
            </div>
          </div>

          {/* Product Cards Grid / Loader / Empty State */}
          {isLoading ? (
            <MarketplacePageLoader label="Carregando catálogo..." />
          ) : mappedProducts.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-5 sm:gap-6">
                {mappedProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-stone-200 pt-6 text-xs text-stone-600">
                  <span>
                    Página <strong>{page}</strong> de{' '}
                    <strong>{totalPages}</strong>
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="cursor-pointer"
                    >
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="cursor-pointer"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="Nenhum produto encontrado"
              description="Tente ajustar sua busca ou limpar os filtros selecionados para encontrar o que procura."
              actionLabel="Limpar Filtros"
              onActionClick={() => {
                setSelectedCategory('')
                setSearchQuery('')
                setPage(1)
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
}
