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
  city = 'Serra Gaúcha',
  state = 'RS',
  productsCount = 0,
  isVerified = true,
}: StoreCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-xs transition-colors hover:border-emerald-300 hover:shadow-sm">
      {/* Cover Header */}
      <div className="relative h-28 w-full overflow-hidden bg-linear-to-r from-stone-800 to-amber-900">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-30" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Avatar Overlap */}
      <div className="relative px-5 pt-0">
        <div className="-mt-9 flex items-end justify-between">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-amber-800 font-serif text-2xl font-bold text-amber-100 shadow-sm">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{name.charAt(0)}</span>
            )}
          </div>

          <div className="flex items-center space-x-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
            <RiStore2Line className="h-3.5 w-3.5 text-emerald-700" />
            <span>{productsCount} produtos</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5 pt-3">
        <div className="flex items-center space-x-1.5">
          <h3 className="text-base font-bold text-stone-900 transition-colors group-hover:text-emerald-800">
            {name}
          </h3>
          {isVerified && (
            <RiShieldCheckLine
              className="h-4 w-4 text-emerald-600"
              title="Produtor Verificado Verttex"
            />
          )}
        </div>

        {/* Location Badge */}
        <div className="mt-1 flex items-center space-x-1 text-xs text-stone-500">
          <RiMapPinLine className="h-3.5 w-3.5 text-amber-600" />
          <span>
            {city}, {state}
          </span>
        </div>

        {/* Description */}
        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-stone-600">
          {description ||
            'Produtor regional dedicado ao cultivo e elaboração de produtos artesanais autênticos.'}
        </p>

        {/* Action Button */}
        <div className="mt-auto pt-4">
          <Link
            href={`/lojas/${slug}`}
            className="flex items-center justify-center space-x-1.5 rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-700 transition-colors group-hover:border-emerald-600 group-hover:bg-emerald-700 group-hover:text-white"
          >
            <span>Visitar Loja</span>
            <RiArrowRightLine className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
