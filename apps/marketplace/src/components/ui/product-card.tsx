import Link from "next/link";
import {
  RiArrowRightLine,
  RiHeartLine,
  RiImage2Line,
  RiMapPinLine,
  RiStarFill,
  RiStore2Line,
} from "react-icons/ri";

export interface ProductCardProps {
  id: string;
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  unit?: string;
  imageUrl?: string;
  storeName: string;
  storeSlug: string;
  origin?: string;
  rating?: number;
  reviewsCount?: number;
  badge?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
}

export function ProductCard({
  name,
  slug,
  price,
  originalPrice,
  unit,
  imageUrl,
  storeName,
  storeSlug,
  origin,
  rating,
  reviewsCount,
  badge,
  isNew,
  isBestSeller,
}: ProductCardProps) {
  const productUrl = slug ? `/produtos/${slug}` : `/produtos`;
  const storeUrl = storeSlug ? `/lojas/${storeSlug}` : `/produtos`;

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);

  const formattedOriginalPrice = originalPrice
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(originalPrice)
    : null;


  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-2xs">
      {/* Image Container */}
      <Link href={productUrl} className="relative aspect-4/3 sm:aspect-square w-full overflow-hidden bg-stone-100 block cursor-pointer rounded-t-xl">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-300">
            <RiImage2Line className="h-10 w-10 text-stone-300" />
          </div>
        )}

        {/* Top-Left Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap items-center gap-1.5">
          {badge && (
            <span className="rounded-md bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
              {badge}
            </span>
          )}
          {isBestSeller && !badge && (
            <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
              Mais Vendido
            </span>
          )}
          {isNew && !badge && !isBestSeller && (
            <span className="rounded-md bg-stone-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
              Novo
            </span>
          )}
        </div>

        {/* Top-Right Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute top-2.5 right-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-stone-600 hover:text-rose-500 hover:bg-white shadow-2xs backdrop-blur-xs cursor-pointer"
          title="Favoritar produto"
        >
          <RiHeartLine className="h-4 w-4" />
        </button>

        {/* Origin tag at bottom-left */}
        {origin && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1 rounded-md bg-stone-950/80 px-2 py-0.5 text-[10px] font-medium text-stone-100 backdrop-blur-xs shadow-2xs">
            <RiMapPinLine className="h-3 w-3 text-amber-400 shrink-0" />
            <span className="truncate">{origin}</span>
          </div>
        )}
      </Link>

      {/* Card Body Content */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {/* Store Link */}
        <Link
          href={storeUrl}
          className="inline-flex items-center text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer truncate"
        >
          <RiStore2Line className="h-3 w-3 mr-1 shrink-0 text-emerald-600" />
          <span className="truncate">{storeName}</span>
        </Link>

        {/* Title */}
        <Link
          href={productUrl}
          className="mt-1 line-clamp-2 text-xs sm:text-sm font-semibold text-stone-900 leading-snug group-hover:text-emerald-700 cursor-pointer"
        >
          {name}
        </Link>

        {/* Rating & Review */}
        {rating !== undefined && (
          <div className="mt-1.5 flex items-center space-x-1 text-xs">
            <RiStarFill className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-semibold text-stone-800">{rating}</span>
            {reviewsCount !== undefined && (
              <span className="text-stone-400 text-[11px]">({reviewsCount})</span>
            )}
          </div>
        )}

        {/* Price & Action Footer */}
        <div className="mt-auto flex items-end justify-between pt-3.5 border-t border-stone-100/80">
          <div>
            {formattedOriginalPrice && (
              <span className="block text-[10px] text-stone-400 line-through leading-none mb-0.5">
                {formattedOriginalPrice}
              </span>
            )}
            <div className="flex items-baseline space-x-1">
              <span className="text-sm sm:text-base font-bold text-stone-900">
                {formattedPrice}
              </span>
              {unit && (
                <span className="text-[10px] text-stone-500">/ {unit}</span>
              )}
            </div>
          </div>

          <Link
            href={productUrl}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white shadow-2xs cursor-pointer"
          >
            <span>Ver</span>
            <RiArrowRightLine className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
