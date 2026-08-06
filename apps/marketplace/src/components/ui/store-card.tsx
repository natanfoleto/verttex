import Link from 'next/link'
import {
  RiArrowRightLine,
  RiMapPinLine,
  RiShieldCheckLine,
  RiStore2Line,
} from 'react-icons/ri'

export interface StoreCardProps {
  id: string
  name: string
  slug: string
  description?: string
  coverUrl?: string
  logoUrl?: string
  city?: string
  state?: string
  productsCount?: number
  isVerified?: boolean
}

export function StoreCard({
  name,
  slug,
  description,
  coverUrl,
  logoUrl,
  city,
  state,
  productsCount = 0,
  isVerified = true,
}: StoreCardProps) {
  const location =
    city && state ? `${city}, ${state}` : city || state || undefined
  const imageUrl = coverUrl || logoUrl

  return (
    <div className="group flex cursor-pointer flex-col font-sans">
      {/* Imagem de Capa/Logo sem Container de Borda Externa */}
      <Link
        href={`/lojas/${slug}`}
        className="relative block aspect-4/3 w-full cursor-pointer overflow-hidden rounded-sm bg-stone-100 sm:aspect-square"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-emerald-800 text-3xl font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Badge de Produtos no Canto Superior */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center space-x-1 rounded-xs bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
          <RiStore2Line className="h-3 w-3 shrink-0 text-white" />
          <span>
            {productsCount} {productsCount === 1 ? 'produto' : 'produtos'}
          </span>
        </div>
      </Link>

      {/* Informações do Produtor — Estilo idêntico ao de Produtos */}
      <div className="flex flex-col pt-2.5">
        {/* Nome do Produtor com Hover Seco Verde */}
        <div className="flex items-center space-x-1.5">
          <Link
            href={`/lojas/${slug}`}
            className="line-clamp-1 cursor-pointer text-xs leading-snug font-normal text-stone-800 group-hover:text-emerald-700 sm:text-sm"
          >
            {name}
          </Link>
          {isVerified && (
            <RiShieldCheckLine
              className="h-4 w-4 shrink-0 text-emerald-600"
              title="Produtor Verificado Verttex"
            />
          )}
        </div>

        {/* Localização */}
        {location && (
          <div className="mt-1 flex items-center space-x-1 text-xs text-stone-500">
            <RiMapPinLine className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Descrição em 2 Linhas */}
        {description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">
            {description}
          </p>
        )}

        {/* Badge de Benefício Verde */}
        <div className="mt-1.5">
          <span className="inline-block rounded-xs bg-emerald-50 px-2 py-0.5 text-[11px] leading-tight font-medium text-emerald-800">
            Produtor Parceiro Verificado
          </span>
        </div>

        {/* Link de Ação Visitar Loja */}
        <Link
          href={`/lojas/${slug}`}
          className="mt-1 inline-flex cursor-pointer items-center space-x-1 text-xs font-semibold text-emerald-600 hover:underline"
        >
          <span>Visitar Loja</span>
          <RiArrowRightLine className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </div>
    </div>
  )
}
