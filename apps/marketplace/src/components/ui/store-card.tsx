import Link from "next/link";
import {
  RiArrowRightLine,
  RiMapPinLine,
  RiShieldCheckLine,
  RiStore2Line,
} from "react-icons/ri";

export interface StoreCardProps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  logoUrl?: string;
  city?: string;
  state?: string;
  productsCount?: number;
  isVerified?: boolean;
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
  const location = city && state ? `${city}, ${state}` : city || state || undefined;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-md border border-stone-200/80 bg-white shadow-xs transition-colors hover:border-emerald-500 hover:shadow-sm">
      {/* Cover Header — Taller Cover Height (h-32) */}
      <div className="relative h-32 w-full overflow-hidden bg-linear-to-r from-stone-800 to-amber-900">
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

        {/* Top-Right Products Count Badge */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center space-x-1.5 rounded-sm border border-white/20 bg-stone-900/75 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs shadow-xs">
          <RiStore2Line className="h-3.5 w-3.5 text-emerald-400" />
          <span>{productsCount} {productsCount === 1 ? "produto" : "produtos"}</span>
        </div>
      </div>

      {/* Avatar Overlap */}
      <div className="relative px-4 pt-0">
        <div className="-mt-8 flex items-end">
          <div className="flex h-15 w-15 shrink-0 items-center justify-center overflow-hidden rounded-md border-2 border-white bg-emerald-800 font-serif text-xl font-bold text-emerald-100 shadow-sm">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`Logo de ${name}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-4 pt-2.5">
        <div className="flex items-center space-x-1.5">
          <h3 className="text-sm font-bold text-stone-900 transition-colors group-hover:text-emerald-800">
            {name}
          </h3>
          {isVerified && (
            <RiShieldCheckLine
              className="h-4 w-4 text-emerald-600 shrink-0"
              title="Produtor Verificado Verttex"
            />
          )}
        </div>

        {/* Location Badge */}
        {location && (
          <div className="mt-1 flex items-center space-x-1 text-xs text-stone-500">
            <RiMapPinLine className="h-3.5 w-3.5 text-amber-600" />
            <span>{location}</span>
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-600">
            {description}
          </p>
        )}

        {/* Action Button */}
        <div className="mt-auto pt-3.5">
          <Link
            href={`/lojas/${slug}`}
            className="flex items-center justify-center space-x-1.5 rounded-sm border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors group-hover:border-emerald-600 group-hover:bg-emerald-700 group-hover:text-white"
          >
            <span>Visitar Loja</span>
            <RiArrowRightLine className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
