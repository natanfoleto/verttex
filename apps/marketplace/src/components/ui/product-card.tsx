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
    <div className="group flex flex-col cursor-pointer">
      {/* Foto do Produto */}
      <Link
        href={productUrl}
        className="relative aspect-square w-full overflow-hidden bg-stone-100 rounded-sm block cursor-pointer"
      >
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
          className="text-xs sm:text-sm font-normal line-clamp-2 leading-snug group-hover:text-emerald-700 cursor-pointer text-stone-800"
        >
          {name}
        </Link>

        {/* Preço de Tabela Riscado */}
        {formattedOriginalPrice && (
          <span className="text-xs text-stone-400 line-through leading-none mt-1.5">
            {formattedOriginalPrice}
          </span>
        )}

        {/* Preço Atual + Badge % OFF Verde */}
        <div className="flex items-baseline space-x-1.5 mt-1">
          <span className="text-lg sm:text-xl font-bold leading-none">
            R$ {integerPrice}
            <sup className="text-xs font-bold align-super ml-0.5">
              {decimalCents}
            </sup>
          </span>
          {calcDiscount && calcDiscount > 0 ? (
            <span className="bg-emerald-600 text-white font-bold text-xs px-1.5 py-0.5 rounded-xs leading-none">
              {calcDiscount}% OFF
            </span>
          ) : null}
        </div>

        {/* Parcelamento / Linha de Crédito */}
        <span className="text-xs text-stone-600 leading-tight mt-1">
          {installments ||
            `3x R$ ${(price / 3).toFixed(2).replace('.', ',')} com sua Linha de Crédito`}
        </span>

        {/* Badge de Benefício em Verde Suave */}
        {benefitBadge !== null && (
          <div className="mt-1">
            <span className="inline-block bg-emerald-50 text-emerald-800 font-medium text-[11px] px-2 py-0.5 rounded-xs leading-tight">
              {benefitBadge || '20% OFF no Pix'}
            </span>
          </div>
        )}

        {/* Frete Grátis */}
        {freeShipping !== false && (
          <span className="text-xs font-semibold text-emerald-600 mt-1">
            Frete grátis
          </span>
        )}
      </div>
    </div>
  )
}
