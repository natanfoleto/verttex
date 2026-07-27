"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { RiSearchLine } from "react-icons/ri";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { EmptyState } from "../../components/ui/empty-state";
import { StoreCardSkeleton } from "../../components/ui/skeleton-loader";
import { StoreCard, StoreCardProps } from "../../components/ui/store-card";
import { apiClient } from "../../lib/api-client";

export default function StoresListingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  const { data: storesRes, isLoading } = useQuery<{
    data: any[];
    meta: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ["public-stores", page, perPage, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("perPage", String(perPage));
      if (searchQuery) params.append("search", searchQuery);

      const res = await apiClient(`/public/catalog/stores?${params.toString()}`);
      return res;
    },
  });

  const storesList = storesRes?.data ?? [];
  const meta = storesRes?.meta;
  const totalPages = meta?.totalPages || 1;

  const mappedStores: StoreCardProps[] = storesList.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description || "Produtor regional parceiro do mercado VERTTEX.",
    city: "Serra Gaúcha",
    state: "RS",
    productsCount: s.productsCount || 0,
    isVerified: true,
    coverUrl:
      s.coverUrl ||
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
    logoUrl: s.logoUrl || undefined,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 pb-28 font-sans text-stone-900 lg:pb-36 sm:px-6 lg:px-8">
      {/* Breadcrumb & Title */}
      <div className="space-y-3 border-b border-stone-200/80 pb-6">
        <div className="flex items-center space-x-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-emerald-800">
            Início
          </Link>
          <span>/</span>
          <span className="font-semibold text-stone-800">Produtores</span>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Produtores & Lojas Parceiras
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Conheça os produtores locais e marcas artesanais que trazem
              sabores autênticos.
            </p>
          </div>
        </div>
      </div>

      {/* Top Search Bar */}
      <div className="flex flex-col items-stretch justify-between gap-4 rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <RiSearchLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar produtor por nome ou descrição..."
            className="h-10 pl-10 text-xs"
          />
        </div>

        <div className="shrink-0 text-xs font-medium text-stone-500">
          Mostrando{" "}
          <strong className="font-bold text-stone-900">
            {mappedStores.length}
          </strong>{" "}
          de{" "}
          <strong className="font-bold text-stone-900">
            {meta?.total || 0}
          </strong>{" "}
          produtores
        </div>
      </div>

      {/* Stores Grid Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StoreCardSkeleton key={i} />
          ))}
        </div>
      ) : mappedStores.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {mappedStores.map((store) => (
              <StoreCard key={store.id} {...store} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-200 pt-6 text-xs text-stone-600">
              <span>
                Página <strong>{page}</strong> de <strong>{totalPages}</strong>
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="cursor-pointer"
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="cursor-pointer"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="Nenhum produtor encontrado"
          description="Tente ajustar os termos da sua busca para encontrar o produtor desejado."
          actionLabel="Limpar Busca"
          onActionClick={() => {
            setSearchQuery("");
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
