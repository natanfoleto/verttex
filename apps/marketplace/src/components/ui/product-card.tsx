import Link from 'next/link'
import { RiImage2Line } from 'react-icons/ri'

export interface ProductCardProps {
  id: string
  name: string
  slug?: string
  price: number
  originalPrice?: number
  unit?: string
  imageUrl?: string
  storeName?: string
  storeSlug?: string
  origin?: string
  rating?: number
  reviewsCount?: number
  badge?: string
  isNew?: boolean
  isBestSeller?: boolean
  discountPercent?: number
  installments?: string
  benefitBadge?: string | null
  freeShipping?: boolean
  isAvailable?: boolean
}

export function ProductCard({
  name,
  slug = '',
  price,
  originalPrice,
  imageUrl,
  discountPercent,
  installments,
  benefitBadge,
  freeShipping = true,
  isAvailable = true,
}: ProductCardProps) {
  const integerPrice = Math.floor(price)
  const decimalCents = (price % 1).toFixed(2).substring(2).padStart(2, '0')

  const formattedOriginalPrice = originalPrice
    ? new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(originalPrice)
    : null

  const calcDiscount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : discountPercent

  const productUrl = slug ? `/produtos/${slug}` : '/produtos'

  return (
    <div
      className={`group flex cursor-pointer flex-col ${!isAvailable ? 'opacity-80' : ''}`}
    >
      {/* Foto do Produto */}
      <Link
        href={productUrl}
        className="relative block aspect-square w-full cursor-pointer overflow-hidden rounded-sm bg-stone-100"
      >
        {!isAvailable && (
          <div className="absolute top-2 left-2 z-10 rounded-xs bg-stone-900/85 px-2 py-0.5 text-[10px] font-bold tracking-wider text-stone-100 uppercase">
            Esgotado
          </div>
        )}
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-300">
            <RiImage2Line className="h-12 w-12 text-stone-300" />
          </div>
        )}
      </Link>

      {/* Informações do Produto com Verde Emerald Padrão */}
      <div className="flex flex-col pt-3">
        {/* Título com Hover Seco Verde */}
        <Link
          href={productUrl}
          className="line-clamp-2 cursor-pointer text-xs leading-snug font-normal text-stone-800 group-hover:text-emerald-700 sm:text-sm"
        >
          {name}
        </Link>

        {/* Preço de Tabela Riscado */}
        {formattedOriginalPrice && (
          <span className="mt-1.5 text-xs leading-none text-stone-400 line-through">
            {formattedOriginalPrice}
          </span>
        )}

        {/* Preço Atual + Badge % OFF Verde */}
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className="text-lg leading-none font-bold sm:text-xl">
            R$ {integerPrice}
            <sup className="ml-0.5 align-super text-xs font-bold">
              {decimalCents}
            </sup>
          </span>
          {calcDiscount && calcDiscount > 0 ? (
            <span className="rounded-xs bg-emerald-600 px-1.5 py-0.5 text-xs leading-none font-bold text-white">
              {calcDiscount}% OFF
            </span>
          ) : null}
        </div>

        {/* Parcelamento / Linha de Crédito */}
        <span className="mt-1 text-xs leading-tight text-stone-600">
          {installments ||
            `3x R$ ${(price / 3).toFixed(2).replace('.', ',')} com sua Linha de Crédito`}
        </span>

        {/* Badge de Benefício em Verde Suave */}
        {benefitBadge !== null && (
          <div className="mt-1">
            <span className="inline-block rounded-xs bg-emerald-50 px-2 py-0.5 text-[11px] leading-tight font-medium text-emerald-800">
              {benefitBadge || '20% OFF no Pix'}
            </span>
          </div>
        )}

        {/* Frete Grátis */}
        {freeShipping !== false && (
          <span className="mt-1 text-xs font-semibold text-emerald-600">
            Frete grátis
          </span>
        )}
      </div>
    </div>
  )
}
