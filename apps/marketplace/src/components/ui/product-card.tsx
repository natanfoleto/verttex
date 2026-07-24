import Link from 'next/link'
import {
  RiHeartLine,
  RiMapPinLine,
  RiShoppingBag3Line,
  RiStarFill,
} from 'react-icons/ri'

import { Button } from '@/components/ui/button'

export interface ProductCardProps {
  id: string
  name: string
  price: number
  originalPrice?: number
  unit?: string
  imageUrl?: string
  storeName: string
  storeSlug: string
  origin?: string
  rating?: number
  reviewsCount?: number
  badge?: string
  isNew?: boolean
  isBestSeller?: boolean
}

export function ProductCard({
  name,
  price,
  originalPrice,
  unit,
  imageUrl,
  storeName,
  storeSlug,
  origin,
  rating = 4.9,
  reviewsCount = 12,
  badge,
  isNew,
  isBestSeller,
}: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)

  const formattedOriginalPrice = originalPrice
    ? new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(originalPrice)
    : null

  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-xs transition-colors hover:border-emerald-300 hover:shadow-sm">
      {/* Image Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-stone-100 to-amber-50/40 text-stone-300">
            <RiShoppingBag3Line className="h-12 w-12 text-stone-300" />
          </div>
        )}

        {/* Top Badges overlay */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5">
          {discountPercent && (
            <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
              -{discountPercent}%
            </span>
          )}
          {badge && (
            <span className="rounded-full bg-emerald-800 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
              {badge}
            </span>
          )}
          {isBestSeller && !badge && (
            <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
              Mais Vendido
            </span>
          )}
          {isNew && !badge && !isBestSeller && (
            <span className="rounded-full bg-stone-900 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
              Novo
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-stone-600 shadow-xs backdrop-blur-xs transition-colors hover:bg-white hover:text-rose-500 p-0"
          title="Salvar nos favoritos"
        >
          <RiHeartLine className="h-4 w-4" />
        </Button>

        {/* Origin tag at bottom of image */}
        {origin && (
          <div className="absolute bottom-2 left-3 flex items-center space-x-1 rounded-md bg-stone-900/70 px-2 py-0.5 text-[10px] font-medium text-stone-100 backdrop-blur-xs">
            <RiMapPinLine className="h-3 w-3 text-amber-400" />
            <span>{origin}</span>
          </div>
        )}
      </div>

      {/* Card Body Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Store Link */}
        <Link
          href={`/lojas/${storeSlug}`}
          className="text-[11px] font-medium text-stone-500 transition-colors hover:text-emerald-700 hover:underline"
        >
          {storeName}
        </Link>

        {/* Title */}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-stone-900 transition-colors group-hover:text-emerald-800">
          {name}
        </h3>

        {/* Rating & Review */}
        <div className="mt-2 flex items-center space-x-1 text-xs">
          <RiStarFill className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-semibold text-stone-800">{rating}</span>
          <span className="text-stone-400">({reviewsCount})</span>
        </div>

        {/* Price & Action Footer */}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            {formattedOriginalPrice && (
              <span className="block text-[11px] text-stone-400 line-through">
                {formattedOriginalPrice}
              </span>
            )}
            <div className="flex items-baseline space-x-1">
              <span className="text-base font-bold text-stone-900">
                {formattedPrice}
              </span>
              {unit && (
                <span className="text-[11px] text-stone-500">/ {unit}</span>
              )}
            </div>
          </div>

          <Link
            href={`/lojas/${storeSlug}`}
            className="flex items-center space-x-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors group-hover:bg-emerald-700 group-hover:text-white"
          >
            <span>Ver Loja</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
