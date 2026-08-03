import Link from 'next/link'

export interface CategoryCardProps {
  name: string
  slug: string
  icon?: string
  imageUrl?: string
  itemsCount?: number
  isActive?: boolean
}

export function CategoryCircleCard({
  name,
  slug,
  imageUrl,
  isActive,
}: CategoryCardProps) {
  return (
    <Link
      href={`/categorias/${slug}`}
      className="group flex flex-col items-center space-y-2 text-center"
    >
      <div
        className={`relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 transition-colors sm:h-28 sm:w-28 ${
          isActive
            ? 'border-emerald-700 ring-2 ring-emerald-600/30'
            : 'border-stone-200/80 bg-stone-100 group-hover:border-emerald-600'
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-100 to-amber-200/60 font-serif text-2xl font-bold text-amber-900">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <span
        className={`text-xs font-semibold transition-colors ${
          isActive
            ? 'text-emerald-800'
            : 'text-stone-800 group-hover:text-emerald-700'
        }`}
      >
        {name}
      </span>
    </Link>
  )
}

export function CategoryPill({
  name,
  slug,
  itemsCount,
  isActive,
}: CategoryCardProps) {
  return (
    <Link
      href={`/categorias/${slug}`}
      className={`inline-flex items-center space-x-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
        isActive
          ? 'bg-emerald-800 text-white shadow-xs'
          : 'border border-stone-200 bg-white text-stone-700 hover:border-emerald-300 hover:bg-stone-50 hover:text-emerald-800'
      }`}
    >
      <span>{name}</span>
      {itemsCount !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
            isActive
              ? 'bg-emerald-900 text-emerald-100'
              : 'bg-stone-100 text-stone-500'
          }`}
        >
          {itemsCount}
        </span>
      )}
    </Link>
  )
}
