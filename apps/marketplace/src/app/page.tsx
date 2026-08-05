'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { RiArrowRightLine } from 'react-icons/ri'

import { MarketplaceValueProps } from '../components/layout/marketplace-value-props'
import { MarketplaceCarousel } from '../components/ui/marketplace-carousel'
import { MarketplacePageLoader } from '../components/ui/marketplace-page-loader'
import {
  CarouselProductItem,
  ProductSectionCarousel,
} from '../components/ui/product-section-carousel'
import { StoreCard, StoreCardProps } from '../components/ui/store-card'
import { apiClient } from '../lib/api-client'

export default function MarketplaceHomePage() {
  // Query Dynamic Featured Products
  const { data: featuredProductsRes, isLoading: isLoadingProducts } = useQuery<{
    data: Array<{
      id: string
      name: string
      slug: string
      price: number
      promotionalPrice?: number
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
          promotionalPrice?: number
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

  const allProducts: CarouselProductItem[] =
    featuredProductsRes?.data && featuredProductsRes.data.length > 0
      ? featuredProductsRes.data.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.promotionalPrice || p.price,
          originalPrice: p.promotionalPrice ? p.price : undefined,
          imageUrl: p.mainImageUrl || undefined,
          installments: `3x R$ ${((p.promotionalPrice || p.price) / 3)
            .toFixed(2)
            .replace('.', ',')} com sua Linha de Crédito`,
          benefitBadge: '20% OFF Saldo no Mercado Pago',
          freeShipping: true,
        }))
      : []

  // Seções compostas por conjuntos de produtos
  const section1Products = allProducts.slice(0, 12)
  const section2Products = allProducts.slice(6, 18)
  const section4Products = [...allProducts].reverse().slice(0, 12)

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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-32">
        {/* SEÇÃO 1: Inspirado no último visto */}
        <ProductSectionCarousel
          title="Inspirado no último visto"
          products={
            section1Products.length > 0
              ? section1Products
              : fallbackDemoProducts
          }
        />

        {/* SEÇÃO 2: Ofertas e Descontos Imperdíveis */}
        <ProductSectionCarousel
          title="Ofertas e Descontos Imperdíveis"
          products={
            section2Products.length > 0
              ? section2Products
              : fallbackDemoProducts
          }
        />

        {/* SEÇÃO 4: Recomendados para Você */}
        <ProductSectionCarousel
          title="Recomendados para Você"
          products={
            section4Products.length > 0
              ? section4Products
              : fallbackDemoProducts
          }
        />

        {/* Lojas e Produtores Parceiros */}
        {storesList.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-stone-900">
                Lojas e Produtores Parceiros
              </h2>
              <Link
                href="/lojas"
                className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer transition-colors"
              >
                <span>Ver Todos os Produtores</span>
                <RiArrowRightLine className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

// Fallback visual para demonstrar os carrosséis idênticos ao print quando não houver dados no banco
const fallbackDemoProducts: CarouselProductItem[] = [
  {
    id: 'demo-1',
    name: 'Mesa Escritório Mb Industrial 150x60cm Estrutura Ferro',
    slug: 'mesa-escritorio-industrial',
    price: 238.02,
    originalPrice: 297.52,
    discountPercent: 20,
    installments: '3x R$ 101,05 com sua Linha de Crédito',
    benefitBadge: '20% OFF no Pix',
    freeShipping: true,
    imageUrl:
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&auto=format&fit=crop',
  },
  {
    id: 'demo-2',
    name: 'Mesa Escritório Industrial 150x60 Estrutura Ferro Carvalho',
    slug: 'mesa-escritorio-carvalho',
    price: 212.49,
    originalPrice: 257.52,
    discountPercent: 17,
    installments: '3x R$ 90,21 com sua Linha de Crédito',
    benefitBadge: '20% OFF no Pix',
    freeShipping: true,
    imageUrl:
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&auto=format&fit=crop',
  },
  {
    id: 'demo-3',
    name: 'Mesa Escritório Estudo Trabalho Moderna Industrial',
    slug: 'mesa-escritorio-moderna',
    price: 219.3,
    originalPrice: 297.47,
    discountPercent: 26,
    installments: '3x R$ 93,11 com sua Linha de Crédito',
    benefitBadge: '20% OFF no Pix',
    freeShipping: true,
    imageUrl:
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=500&auto=format&fit=crop',
  },
  {
    id: 'demo-4',
    name: 'Mesa Estilo Industrial Para Escritório 150cm Com Pés...',
    slug: 'mesa-estilo-industrial',
    price: 220.18,
    originalPrice: 262.99,
    discountPercent: 16,
    installments: '3x R$ 93,48 com sua Linha de Crédito',
    benefitBadge: '20% OFF no Pix',
    freeShipping: true,
    imageUrl:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&auto=format&fit=crop',
  },
  {
    id: 'demo-5',
    name: 'Mesa De Computador Escrivaninha Preta Industrial',
    slug: 'mesa-computador-preta',
    price: 257.39,
    originalPrice: 289.0,
    discountPercent: 11,
    installments: '3x R$ 109,28 com sua Linha de Crédito',
    benefitBadge: '20% OFF no Pix',
    freeShipping: true,
    imageUrl:
      'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop',
  },
  {
    id: 'demo-6',
    name: 'Mesa De Computador Escrivaninha Preta Pés de Aço',
    slug: 'mesa-computador-aco',
    price: 189.24,
    originalPrice: 214.0,
    discountPercent: 11,
    installments: '3x R$ 84,57 com sua Linha de Crédito',
    benefitBadge: '20% OFF no Pix',
    freeShipping: true,
    imageUrl:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&auto=format&fit=crop',
  },
]
