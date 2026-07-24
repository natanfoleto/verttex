'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  RiArrowRightLine,
  RiHeartLine,
  RiMapPinLine,
  RiShieldCheckLine,
  RiStore2Line,
} from 'react-icons/ri'

import { Button } from '@/components/ui/button'

import { CategoryCircleCard } from '../components/ui/category-card'
import { ProductCard, ProductCardProps } from '../components/ui/product-card'
import { StoreCard, StoreCardProps } from '../components/ui/store-card'

const MOCK_CATEGORIES = [
  {
    id: '1',
    name: 'Queijos Artesanais',
    slug: 'queijos-artesanais',
    imageUrl:
      'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '2',
    name: 'Vinhos & Bebidas',
    slug: 'vinhos-bebidas',
    imageUrl:
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '3',
    name: 'Doces & Geleias',
    slug: 'doces-geleias',
    imageUrl:
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '4',
    name: 'Méis & Polens',
    slug: 'meis-polens',
    imageUrl:
      'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '5',
    name: 'Embutidos Defumados',
    slug: 'embutidos-defumados',
    imageUrl:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '6',
    name: 'Cafés Especiais',
    slug: 'cafes-especiais',
    imageUrl:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
  },
]

const MOCK_PRODUCTS: ProductCardProps[] = [
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
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=600&q=80',
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
]

const MOCK_STORES: StoreCardProps[] = [
  {
    id: 's1',
    name: 'Queijaria Alvorada',
    slug: 'queijaria-alvorada',
    description:
      'Tradição familiar na produção de queijos artesanais de leite cru com maturação especial.',
    city: 'Farroupilha',
    state: 'RS',
    productsCount: 14,
    isVerified: true,
    coverUrl:
      'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 's2',
    name: 'Vinícola Família Rossi',
    slug: 'vinicola-familia-rossi',
    description:
      'Vinhos coloniais de pequena escala produzidos artesanalmente nos vales da serra.',
    city: 'Bento Gonçalves',
    state: 'RS',
    productsCount: 22,
    isVerified: true,
    coverUrl:
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 's3',
    name: 'Apiário Vale Verde',
    slug: 'apiario-vale-verde',
    description:
      'Mel de florada nativa e produtos apícolas 100% puros e sem aditivos.',
    city: 'Gramado',
    state: 'RS',
    productsCount: 9,
    isVerified: true,
    coverUrl:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
  },
]

export default function MarketplaceHomePage() {
  const [activeTab, setActiveTab] = useState('todos')

  return (
    <div className="space-y-24 pb-28 lg:pb-36 font-sans text-stone-900 antialiased">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-stone-900 via-stone-800 to-amber-950 px-4 py-24 text-white sm:px-6 lg:px-8 lg:py-32">
        <div className="absolute top-0 right-0 h-96 w-96 translate-x-24 -translate-y-24 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-24 translate-y-24 rounded-full bg-amber-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:items-center">
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center space-x-2 rounded-full border border-amber-500/40 bg-amber-900/40 px-3.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-xs">
                <RiHeartLine className="h-3.5 w-3.5 text-amber-400" />
                <span>Valorizando o trabalho de famílias produtoras</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Sabores autênticos com história e origem.
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-stone-300 sm:text-lg">
                Conectamos você aos melhores produtores artesanais da nossa
                região. Compre queijos, vinhos, méis e embutidos diretamente de
                quem produz.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/produtos"
                  className="inline-flex items-center space-x-2 rounded-full bg-emerald-700 px-6 py-3.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-emerald-600"
                >
                  <span>Explorar Produtos</span>
                  <RiArrowRightLine className="h-4 w-4" />
                </Link>

                <Link
                  href="/lojas"
                  className="inline-flex items-center space-x-2 rounded-full border border-stone-600 bg-stone-800/80 px-6 py-3.5 text-xs font-bold text-stone-200 backdrop-blur-xs transition-colors hover:border-amber-400 hover:bg-stone-800 hover:text-white"
                >
                  <RiStore2Line className="h-4 w-4 text-amber-400" />
                  <span>Conhecer Produtores</span>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-4 border-t border-stone-700/60 pt-6 text-xs text-stone-300 sm:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <RiShieldCheckLine className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>100% Verificados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RiMapPinLine className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>Origem Regional</span>
                </div>
              </div>
            </div>

            {/* Hero Image Showcase */}
            <div className="relative lg:col-span-5">
              <div className="relative mx-auto aspect-4/3 max-w-md overflow-hidden rounded-2xl border-4 border-white/10 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
                  alt="Produtos Artesanais da Região"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-stone-900/80 via-transparent to-transparent" />
                <div className="absolute right-4 bottom-4 left-4 rounded-xl bg-white/95 p-4 text-stone-900 shadow-lg backdrop-blur-xs">
                  <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
                    Destaque da Semana
                  </span>
                  <h4 className="text-sm font-bold">
                    Tábua Regional de Queijos & Embutidos
                  </h4>
                  <p className="text-xs text-stone-500">
                    Direto dos produtores da Serra Gaúcha
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop By Categories Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center space-y-2 text-center">
          <span className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
            Navegue por Categoria
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            O que você deseja experimentar hoje?
          </h2>
          <p className="max-w-md text-xs text-stone-500">
            Alimentos e bebidas produzidos com métodos tradicionais e
            matérias-primas locais.
          </p>
        </div>

        <div className="grid grid-cols-2 justify-items-center gap-8 sm:grid-cols-3 md:grid-cols-6">
          {MOCK_CATEGORIES.map((cat) => (
            <CategoryCircleCard
              key={cat.id}
              name={cat.name}
              slug={cat.slug}
              imageUrl={cat.imageUrl}
            />
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
              Seleção Especial
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
              Produtos em Destaque
            </h2>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'queijos', label: 'Queijos' },
              { id: 'vinhos', label: 'Vinhos' },
              { id: 'meis', label: 'Méis' },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="rounded-full"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/produtos"
            className="inline-flex items-center space-x-2 rounded-full border border-stone-300 bg-white px-6 py-3.5 text-xs font-bold text-stone-800 shadow-xs transition-colors hover:border-emerald-700 hover:bg-stone-50 hover:text-emerald-900"
          >
            <span>Ver Todos os Produtos ({MOCK_PRODUCTS.length}+)</span>
            <RiArrowRightLine className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Featured Producers / Stores Section */}
      <section className="border-y border-stone-200/80 bg-stone-100/70 py-20">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-bold tracking-widest text-amber-800 uppercase">
                Produtores Regionais
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
                Conheça Quem Produz
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                Famílias e agroindústrias artesanais credenciadas pela Verttex.
              </p>
            </div>

            <Link
              href="/lojas"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-800 hover:underline"
            >
              <span>Ver todos os produtores</span>
              <RiArrowRightLine className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {MOCK_STORES.map((store) => (
              <StoreCard key={store.id} {...store} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
