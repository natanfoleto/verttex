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
  const imageUrl = coverUrl || logoUrl;

  return (
    <div className="group flex flex-col cursor-pointer font-sans">
      {/* Imagem de Capa/Logo sem Container de Borda Externa */}
      <Link
        href={`/lojas/${slug}`}
        className="relative aspect-4/3 sm:aspect-square w-full overflow-hidden bg-stone-100 rounded-sm block cursor-pointer"
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
          <div className="flex h-full w-full items-center justify-center bg-emerald-800 text-white font-serif text-3xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Badge de Produtos no Canto Superior */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center space-x-1 rounded-xs bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
          <RiStore2Line className="h-3 w-3 text-white shrink-0" />
          <span>{productsCount} {productsCount === 1 ? "produto" : "produtos"}</span>
        </div>
      </Link>

      {/* Informações do Produtor — Estilo idêntico ao de Produtos */}
      <div className="flex flex-col pt-2.5">
        {/* Nome do Produtor com Hover Seco Verde */}
        <div className="flex items-center space-x-1.5">
          <Link
            href={`/lojas/${slug}`}
            className="text-xs sm:text-sm text-stone-800 font-normal line-clamp-1 leading-snug group-hover:text-emerald-700 cursor-pointer"
          >
            {name}
          </Link>
          {isVerified && (
            <RiShieldCheckLine
              className="h-4 w-4 text-emerald-600 shrink-0"
              title="Produtor Verificado Verttex"
            />
          )}
        </div>

        {/* Localização */}
        {location && (
          <div className="flex items-center space-x-1 text-xs text-stone-500 mt-1">
            <RiMapPinLine className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Descrição em 2 Linhas */}
        {description && (
          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mt-1">
            {description}
          </p>
        )}

        {/* Badge de Benefício Verde */}
        <div className="mt-1.5">
          <span className="inline-block bg-emerald-50 text-emerald-800 font-medium text-[11px] px-2 py-0.5 rounded-xs leading-tight">
            Produtor Parceiro Verificado
          </span>
        </div>

        {/* Link de Ação Visitar Loja */}
        <Link
          href={`/lojas/${slug}`}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-600 mt-1 hover:underline cursor-pointer"
        >
          <span>Visitar Loja</span>
          <RiArrowRightLine className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </div>
    </div>
  );
}
