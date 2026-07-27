"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiMapPinLine,
  RiShieldCheckLine,
  RiStore2Line,
} from "react-icons/ri";

import { EmptyState } from "../../../components/ui/empty-state";
import {
  ProductCard,
  ProductCardProps,
} from "../../../components/ui/product-card";
import { ProductCardSkeleton } from "../../../components/ui/skeleton-loader";
import { apiClient } from "../../../lib/api-client";

export default function StoreDetailPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const resolvedParams = use(params);
  const storeSlug = resolvedParams.storeSlug;

  const { data: storeDetails, isLoading } = useQuery<any>({
    queryKey: ["public-store-details", storeSlug],
    queryFn: async () => {
      const res = await apiClient(`/public/catalog/stores/${storeSlug}`);
      return res;
    },
  });

  const formattedStoreName =
    storeDetails?.name ||
    storeSlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const products = storeDetails?.products || [];

  const mappedProducts: ProductCardProps[] = products.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.promotionalPrice || p.price,
    originalPrice: p.promotionalPrice ? p.price : undefined,
    imageUrl:
      p.mainImageUrl ||
      "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80",
    storeName: storeDetails?.name || "Produtor Local",
    storeSlug: storeDetails?.slug || storeSlug,
    origin: "Serra Gaúcha, RS",
    badge: p.isFeatured ? "Destaque" : undefined,
    isBestSeller: p.isFeatured,
  }));

  return (
    <div className="space-y-8 pb-16 font-sans text-stone-900">
      {/* Cover Header Banner */}
      <div className="relative h-64 w-full bg-linear-to-r from-stone-900 to-amber-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            storeDetails?.coverUrl ||
            "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80"
          }
          alt={formattedStoreName}
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-linear-to-t from-stone-900/90 via-stone-900/40 to-transparent" />

        <div className="absolute top-6 left-6 z-10">
          <Link
            href="/lojas"
            className="inline-flex items-center space-x-2 rounded-full border border-white/20 bg-stone-900/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xs transition-colors hover:bg-stone-900 cursor-pointer"
          >
            <RiArrowLeftLine className="h-4 w-4" />
            <span>Voltar aos Produtores</span>
          </Link>
        </div>
      </div>

      {/* Producer Profile Header Box */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 space-y-6 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-md md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start space-x-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-4 border-white bg-amber-800 font-serif text-3xl font-bold text-amber-100 shadow-md">
                {storeDetails?.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={storeDetails.logoUrl}
                    alt={formattedStoreName}
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  formattedStoreName.charAt(0)
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
                    {formattedStoreName}
                  </h1>
                  <RiShieldCheckLine
                    className="h-5 w-5 text-emerald-600"
                    title="Produtor Verificado VERTTEX"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-stone-500">
                  <span className="flex items-center space-x-1">
                    <RiMapPinLine className="h-3.5 w-3.5 text-amber-600" />
                    <span>Serra Gaúcha — RS</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1 font-semibold text-emerald-800">
                    <RiStore2Line className="h-3.5 w-3.5" />
                    <span>Produtor Credenciado VERTTEX</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center space-x-3">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-900">
                🌱 100% Produção Artesanal
              </span>
            </div>
          </div>

          <p className="max-w-3xl border-t border-stone-100 pt-4 text-xs leading-relaxed text-stone-600">
            {storeDetails?.description ||
              "Tradição familiar na elaboração de produtos coloniais e artesanais de alta qualidade no mercado VERTTEX."}
          </p>

          {/* Producer Trust Highlights */}
          <div className="grid grid-cols-1 gap-4 border-t border-stone-100 pt-2 text-xs sm:grid-cols-3">
            <div className="flex items-center space-x-2 text-stone-700">
              <RiCheckLine className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Matéria-prima de origem local</span>
            </div>
            <div className="flex items-center space-x-2 text-stone-700">
              <RiCheckLine className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Sem aditivos ou conservantes químicos</span>
            </div>
            <div className="flex items-center space-x-2 text-stone-700">
              <RiCheckLine className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Selo de inspeção artesanal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Store Products Catalog */}
      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-stone-900">
            Produtos Deste Produtor ({mappedProducts.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : mappedProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mappedProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum produto publicado no momento"
            description="Este produtor ainda não possui produtos ativos no catálogo público."
            actionLabel="Ver Outros Produtores"
            onActionClick={() => {
              window.location.href = "/lojas";
            }}
          />
        )}
      </div>
    </div>
  );
}
