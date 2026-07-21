'use client'

import Link from 'next/link'
import { use } from 'react'
import { RiArrowLeftLine } from 'react-icons/ri'

import {
  ProductCard,
  ProductCardProps,
} from '../../../components/ui/product-card'

const MOCK_CATEGORY_PRODUCTS: ProductCardProps[] = [
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
    name: 'Queijo Parmesão Artesanal Maturado 12 Meses',
    price: 78.0,
    unit: 'peça (500g)',
    imageUrl:
      'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80',
    storeName: 'Queijaria Alvorada',
    storeSlug: 'queijaria-alvorada',
    origin: 'Serra Gaúcha, RS',
    rating: 5.0,
    reviewsCount: 42,
    badge: 'Edição Especial',
  },
]

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>
}) {
  const resolvedParams = use(params)
  const categorySlug = resolvedParams.categorySlug

  const formattedCategoryName = categorySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 font-sans text-stone-900 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-4 border-b border-stone-200 pb-6">
        <div className="flex items-center space-x-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-emerald-800">
            Início
          </Link>
          <span>/</span>
          <Link href="/produtos" className="hover:text-emerald-800">
            Produtos
          </Link>
          <span>/</span>
          <span className="font-semibold text-stone-800">
            {formattedCategoryName}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/produtos"
            className="rounded-lg border border-stone-200 p-2.5 text-stone-600 transition-colors hover:bg-stone-100"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
              {formattedCategoryName}
            </h1>
            <p className="mt-1 text-xs text-stone-500">
              Produtos artesanais selecionados na categoria{' '}
              {formattedCategoryName}.
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_CATEGORY_PRODUCTS.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </div>
  )
}
