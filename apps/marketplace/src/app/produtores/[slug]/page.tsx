"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import {
  RiArrowLeftLine,
  RiShoppingBag3Line,
  RiStore2Line,
} from "react-icons/ri";

import { apiClient } from "../../../lib/api-client";

interface StoreDetailsResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  products: {
    id: string;
    name: string;
    slug: string;
    shortDescription?: string;
    price: number;
    promotionalPrice?: number;
    mainImageUrl?: string;
    category: { id: string; name: string; slug: string };
    commercialStockAvailable: number;
    isAvailable: boolean;
  }[];
  totalProducts: number;
}

export default function ProducerStorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);

  const { data: store, isLoading, isError } = useQuery<StoreDetailsResponse>({
    queryKey: ["public-store", resolvedParams.slug],
    queryFn: async () => {
      const res = await apiClient<StoreDetailsResponse>(
        `/public/catalog/stores/${resolvedParams.slug}`,
      );
      return res;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8 py-12 font-sans antialiased">
        <div className="h-48 w-full animate-pulse rounded-3xl bg-stone-200" />
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 animate-pulse rounded-2xl bg-stone-200" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded-md bg-stone-200" />
            <div className="h-4 w-32 animate-pulse rounded-md bg-stone-200" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !store) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center font-sans antialiased">
        <RiStore2Line className="mx-auto h-16 w-16 text-stone-300" />
        <h1 className="mt-4 text-2xl font-bold text-stone-900">
          Produtor não encontrado
        </h1>
        <p className="mt-2 text-xs text-stone-500">
          A loja parceira solicitada não existe ou está inativa.
        </p>
        <Link
          href="/produtos"
          className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 cursor-pointer"
        >
          <RiArrowLeftLine className="h-4 w-4" />
          <span>Voltar ao Catálogo</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8 py-12 font-sans text-stone-900 antialiased">
      {/* Banner / Cover Header */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-stone-900 text-white shadow-md">
        {store.coverUrl ? (
          <img
            src={store.coverUrl}
            alt={store.name}
            className="h-56 w-full object-cover opacity-60"
          />
        ) : (
          <div className="h-56 w-full bg-linear-to-r from-emerald-900 via-stone-800 to-amber-900 opacity-90" />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-stone-950/80 via-transparent to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-white bg-amber-50 text-amber-900 font-black text-2xl shadow-lg">
              {store.logoUrl ? (
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                store.name.charAt(0)
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {store.name}
              </h1>
              <p className="text-xs font-semibold text-amber-400">
                Produtor Artesanal Parceiro
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Info */}
      {store.description && (
        <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
          <h2 className="text-sm font-bold text-stone-900">Sobre o Produtor</h2>
          <p className="mt-2 text-xs text-stone-600 leading-relaxed">
            {store.description}
          </p>
        </div>
      )}

      {/* Published Products Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <h2 className="text-xl font-bold text-stone-900">
            Produtos do Produtor ({store.totalProducts})
          </h2>
        </div>

        {store.products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {store.products.map((product) => (
              <Link
                key={product.id}
                href={`/produtos/${product.slug}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-4 transition-all hover:border-emerald-300 hover:shadow-md cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-100">
                    {product.mainImageUrl ? (
                      <img
                        src={product.mainImageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-300">
                        <RiShoppingBag3Line className="h-12 w-12" />
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      {product.category.name}
                    </span>
                    <h3 className="font-bold text-stone-900 text-sm group-hover:text-emerald-800 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </div>
                </div>

                <div className="mt-4 border-t border-stone-100 pt-3 flex items-center justify-between">
                  <span className="font-extrabold text-stone-900 text-sm">
                    R$ {(product.promotionalPrice || product.price).toFixed(2)}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-500">
                    Ver Detalhes →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-stone-500">
            Este produtor ainda não possui produtos listados.
          </div>
        )}
      </div>
    </div>
  );
}
