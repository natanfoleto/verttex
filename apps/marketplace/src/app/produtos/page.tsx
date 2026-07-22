'use client'

import Link from 'next/link'
import { useState } from 'react'
import { RiFilter3Line, RiSearchLine } from 'react-icons/ri'

import { EmptyState } from '../../components/ui/empty-state'
import { FilterSidebar } from '../../components/ui/filter-sidebar'
import { ProductCard, ProductCardProps } from '../../components/ui/product-card'

const CATEGORIES = [
  {
    id: '1',
    name: 'Queijos Artesanais',
    slug: 'queijos-artesanais',
    count: 14,
  },
  { id: '2', name: 'Vinhos & Bebidas', slug: 'vinhos-bebidas', count: 22 },
  { id: '3', name: 'Doces & Geleias', slug: 'doces-geleias', count: 18 },
  { id: '4', name: 'Méis & Polens', slug: 'meis-polens', count: 9 },
  {
    id: '5',
    name: 'Embutidos Defumados',
    slug: 'embutidos-defumados',
    count: 12,
  },
  { id: '6', name: 'Cafés Especiais', slug: 'cafes-especiais', count: 8 },
]

const PRODUCTS_DATA: ProductCardProps[] = [
  {
    id: 'p1',
    name: 'Queijo Colonial Meia Cura da Serra',
    price: 48.9,
    originalPrice: 58.9,
    unit: 'peça (500g)',
    imageUrl:
      'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80',
    storeName: 'Queijaria Alvorada',
    storeSlug: 'queijaria-alvorada',
    origin: 'Serra Gaúcha, RS',
    rating: 4.9,
    reviewsCount: 38,
    isBestSeller: true,
  },
  {
    id: 'p2',
    name: 'Vinho Tinto Colonial Merlot Reserva',
    price: 64.9,
    unit: 'garrafa (750ml)',
    imageUrl:
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    storeName: 'Vinícola Família Rossi',
    storeSlug: 'vinicola-familia-rossi',
    origin: 'Bento Gonçalves, RS',
    rating: 4.8,
    reviewsCount: 24,
    badge: 'Produtor Local',
  },
  {
    id: 'p3',
    name: 'Mel Puro Silvestre Florada Nativa',
    price: 34.9,
    originalPrice: 39.9,
    unit: 'pote (500g)',
    imageUrl:
      'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=600&q=80',
    storeName: 'Apiário Vale Verde',
    storeSlug: 'apiario-vale-verde',
    origin: 'Gramado, RS',
    rating: 5.0,
    reviewsCount: 52,
    isNew: true,
  },
  {
    id: 'p4',
    name: 'Salame Colonial Defumado na Lenha',
    price: 38.5,
    unit: 'unidade (400g)',
    imageUrl:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    storeName: 'Embutidos Tradição',
    storeSlug: 'embutidos-tradicao',
    origin: 'Caxias do Sul, RS',
    rating: 4.7,
    reviewsCount: 19,
  },
  {
    id: 'p5',
    name: 'Geleia Artesanal de Uva Isabel',
    price: 24.9,
    unit: 'pote (300g)',
    imageUrl:
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    storeName: 'Doces da Colônia',
    storeSlug: 'doces-da-colonia',
    origin: 'Garibaldi, RS',
    rating: 4.9,
    reviewsCount: 15,
  },
  {
    id: 'p6',
    name: 'Café Torrado em Grãos Especiais',
    price: 42.0,
    unit: 'pacote (500g)',
    imageUrl:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    storeName: 'Cafés da Serra',
    storeSlug: 'cafes-da-serra',
    origin: 'Nova Petrópolis, RS',
    rating: 4.8,
    reviewsCount: 31,
  },
]

export default function ProductsListingPage() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSort, setSelectedSort] = useState('relevancia')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 6

  const filteredProducts = PRODUCTS_DATA.filter((product) => {
    if (
      searchQuery &&
      !product.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }
    return true
  })

  const totalPages = Math.ceil(filteredProducts.length / perPage) || 1
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * perPage,
    page * perPage
  )

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 pb-28 font-sans text-stone-900 lg:pb-36 sm:px-6 lg:px-8">
      {/* Breadcrumb & Page Title Header */}
      <div className="space-y-3 border-b border-stone-200/80 pb-6">
        <div className="flex items-center space-x-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-emerald-800">
            Início
          </Link>
          <span>/</span>
          <span className="font-semibold text-stone-800">Produtos</span>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Catálogo de Produtos Artesanais
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Explore o melhor da gastronomia e produção regional direto da
              origem.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="inline-flex items-center space-x-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-xs lg:hidden"
          >
            <RiFilter3Line className="h-4 w-4 text-emerald-700" />
            <span>Filtrar Produtos</span>
          </button>
        </div>
      </div>

      {/* Main Catalog Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:col-span-1 lg:block">
          <div className="sticky top-24 rounded-xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <FilterSidebar
              categories={CATEGORIES}
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
                setSelectedSort('relevancia')
                setSearchQuery('')
                setPage(1)
              }}
            />
          </div>
        </aside>

        {/* Mobile Filter Modal / Accordion */}
        {mobileFilterOpen && (
          <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-md lg:hidden">
            <FilterSidebar
              categories={CATEGORIES}
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
                setSelectedSort('relevancia')
                setSearchQuery('')
                setPage(1)
              }}
            />
          </div>
        )}

        {/* Product Grid Area */}
        <main className="space-y-8 lg:col-span-3">
          {/* Top Search & Results Counter */}
          <div className="flex flex-col items-stretch justify-between gap-4 rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <RiSearchLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Filtrar por nome de produto..."
                className="h-10 w-full rounded-lg border border-stone-200 bg-stone-50 pr-4 pl-10 text-xs text-stone-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="shrink-0 text-xs font-medium text-stone-500">
              Mostrando{' '}
              <strong className="font-bold text-stone-900">
                {paginatedProducts.length}
              </strong>{' '}
              de{' '}
              <strong className="font-bold text-stone-900">
                {filteredProducts.length}
              </strong>{' '}
              produtos
            </div>
          </div>

          {/* Product Cards Grid */}
          {paginatedProducts.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-stone-200 pt-6 text-xs text-stone-600">
                  <span>
                    Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="cursor-pointer rounded-lg border border-stone-200 bg-white px-3.5 py-2 font-medium transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="cursor-pointer rounded-lg border border-stone-200 bg-white px-3.5 py-2 font-medium transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Próxima
                    </button>
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
