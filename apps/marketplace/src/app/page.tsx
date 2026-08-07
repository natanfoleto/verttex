'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { RiArrowRightLine } from 'react-icons/ri'

import { MarketplaceValueProps } from '../components/layout/marketplace-value-props'
import { MarketplaceCarousel } from '../components/ui/marketplace-carousel'
import { MarketplacePageLoader } from '../components/ui/marketplace-page-loader'
import { ProductSectionCarousel } from '../components/ui/product-section-carousel'
import { StoreCard, StoreCardProps } from '../components/ui/store-card'
import { apiClient } from '../lib/api-client'
import { buildHomeProductSections } from '../lib/home-products'

export default function MarketplaceHomePage() {
  // Temporary baseline until the personalized Home endpoint is implemented.
  // Only real catalog data is rendered; no commercial claims are fabricated.
  const { data: featuredProductsRes, isLoading: isLoadingProducts } = useQuery<{
    data: Array<{
      id: string
      name: string
      slug: string
      price: number
      promotionalPrice?: number | null
      mainImageUrl?: string
      store?: { name: string; slug: string }
      isFeatured?: boolean
    }>
  }>({
    queryKey: ['public-featured-products'],
    queryFn: async () => {
      const res = await apiClient<{
        data: Array<{
          id: string
          name: string
          slug: string
          price: number
          promotionalPrice?: number | null
          mainImageUrl?: string
          store?: { name: string; slug: string }
          isFeatured?: boolean
        }>
      }>('/public/catalog/products?perPage=24')
      return res
    },
  })

  // Query Dynamic Stores Showcase
  const { data: storesRes, isLoading: isLoadingStores } = useQuery<{
    data: Array<{
      id: string
      name: string
      slug: string
      description?: string
      logoUrl?: string
      coverUrl?: string
      productsCount: number
    }>
  }>({
    queryKey: ['public-stores'],
    queryFn: async () => {
      const res = await apiClient<{
        data: Array<{
          id: string
          name: string
          slug: string
          description?: string
          logoUrl?: string
          coverUrl?: string
          productsCount: number
        }>
      }>('/public/catalog/stores?perPage=6')
      return res
    },
  })

  const isInitialLoading =
    (isLoadingProducts || isLoadingStores) && !featuredProductsRes && !storesRes

  const { catalogProducts, offerProducts } = buildHomeProductSections(
    featuredProductsRes?.data ?? [],
  )

  const storesList: StoreCardProps[] =
    storesRes?.data && storesRes.data.length > 0
      ? storesRes.data.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          description: s.description || undefined,
          productsCount: s.productsCount,
          isVerified: true,
          coverUrl: s.coverUrl || undefined,
          logoUrl: s.logoUrl || undefined,
        }))
      : []

  if (isInitialLoading) {
    return (
      <div className="space-y-8 pb-4 font-sans antialiased">
        <MarketplaceCarousel />
        <MarketplacePageLoader label="Carregando produtos e carrosséis..." />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-4 font-sans antialiased">
      {/* Carrossel do Banner Principal */}
      <MarketplaceCarousel />

      <div className="mx-auto max-w-7xl space-y-32 px-4 sm:px-6 lg:px-8">
        {catalogProducts.length > 0 && (
          <ProductSectionCarousel
            title="Produtos do Marketplace"
            products={catalogProducts}
          />
        )}

        {offerProducts.length > 0 && (
          <ProductSectionCarousel
            title="Ofertas e Descontos Imperdíveis"
            products={offerProducts}
          />
        )}

        {/* Lojas e Produtores Parceiros */}
        {storesList.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-base font-bold tracking-tight text-stone-900 sm:text-lg">
                Lojas e Produtores Parceiros
              </h2>
              <Link
                href="/lojas"
                className="flex cursor-pointer items-center space-x-1 text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
              >
                <span>Ver Todos os Produtores</span>
                <RiArrowRightLine className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {storesList.map((s) => (
                <StoreCard key={s.id} {...s} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Seção de Proposta de Valor Exclusiva da Home Page */}
      <MarketplaceValueProps />
    </div>
  )
}
