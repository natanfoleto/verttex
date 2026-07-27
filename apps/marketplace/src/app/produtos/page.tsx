"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { RiFilter3Line, RiSearchLine } from "react-icons/ri";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { EmptyState } from "../../components/ui/empty-state";
import { FilterSidebar } from "../../components/ui/filter-sidebar";
import {
  ProductCard,
  ProductCardProps,
} from "../../components/ui/product-card";
import { ProductCardSkeleton } from "../../components/ui/skeleton-loader";
import { apiClient } from "../../lib/api-client";

export default function ProductsListingPage() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSort, setSelectedSort] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 12;

  // Query Public Categories
  const { data: categories = [] } = useQuery<
    Array<{ id: string; name: string; slug: string; productsCount: number }>
  >({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const res = await apiClient("/public/catalog/categories");
      return Array.isArray(res) ? res : res?.data ?? [];
    },
  });

  // Query Public Products Catalog
  const { data: catalogRes, isLoading } = useQuery<{
    data: any[];
    meta: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: [
      "public-products",
      page,
      perPage,
      searchQuery,
      selectedCategory,
      selectedSort,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("perPage", String(perPage));
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("categorySlug", selectedCategory);
      if (selectedSort) params.append("sort", selectedSort);

      const res = await apiClient(`/public/catalog/products?${params.toString()}`);
      return res;
    },
  });

  const productsList = catalogRes?.data ?? [];
  const meta = catalogRes?.meta;
  const totalPages = meta?.totalPages || 1;

  const categoriesFormatted = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: c.productsCount,
  }));

  const mappedProducts: ProductCardProps[] = productsList.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.promotionalPrice || p.price,
    originalPrice: p.promotionalPrice ? p.price : undefined,
    imageUrl:
      p.mainImageUrl ||
      "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80",
    storeName: p.store?.name || "Produtor Local",
    storeSlug: p.store?.slug || "",
    origin: "Serra Gaúcha, RS",
    badge: p.isFeatured ? "Destaque" : undefined,
    isBestSeller: p.isFeatured,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 pb-28 font-sans text-stone-900 lg:pb-36 sm:px-6 lg:px-8">
      {/* Breadcrumb & Page Title Header */}
      <div className="space-y-3 border-b border-stone-200/80 pb-6">
        <div className="flex items-center space-x-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-emerald-800">
            Início
          </Link>
          <span>/</span>
          <span className="font-semibold text-stone-800">Produtos</span>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Catálogo de Produtos Artesanais
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Explore o melhor da gastronomia e produção regional direto da
              origem.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden cursor-pointer"
          >
            <RiFilter3Line className="h-4 w-4 text-emerald-700" />
            <span>Filtrar Produtos</span>
          </Button>
        </div>
      </div>

      {/* Main Catalog Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:col-span-1 lg:block">
          <div className="sticky top-24 rounded-xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <FilterSidebar
              categories={categoriesFormatted}
              activeCategorySlug={selectedCategory}
              activeSort={selectedSort}
              onSelectCategory={(slug) => {
                setSelectedCategory(slug);
                setPage(1);
              }}
              onSelectSort={(sort) => {
                setSelectedSort(sort);
                setPage(1);
              }}
              onClearAll={() => {
                setSelectedCategory("");
                setSelectedSort("featured");
                setSearchQuery("");
                setPage(1);
              }}
            />
          </div>
        </aside>

        {/* Mobile Filter Modal */}
        {mobileFilterOpen && (
          <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-md lg:hidden">
            <FilterSidebar
              categories={categoriesFormatted}
              activeCategorySlug={selectedCategory}
              activeSort={selectedSort}
              onSelectCategory={(slug) => {
                setSelectedCategory(slug);
                setMobileFilterOpen(false);
                setPage(1);
              }}
              onSelectSort={(sort) => {
                setSelectedSort(sort);
                setPage(1);
              }}
              onClearAll={() => {
                setSelectedCategory("");
                setSelectedSort("featured");
                setSearchQuery("");
                setPage(1);
              }}
            />
          </div>
        )}

        {/* Product Grid Area */}
        <main className="space-y-8 lg:col-span-3">
          {/* Top Search & Results Counter */}
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
                placeholder="Buscar produtos por nome ou descrição..."
                className="h-10 pl-10 text-xs"
              />
            </div>

            <div className="shrink-0 text-xs font-medium text-stone-500">
              Mostrando{" "}
              <strong className="font-bold text-stone-900">
                {mappedProducts.length}
              </strong>{" "}
              de{" "}
              <strong className="font-bold text-stone-900">
                {meta?.total || 0}
              </strong>{" "}
              produtos
            </div>
          </div>

          {/* Product Cards Grid / Skeleton / Empty State */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : mappedProducts.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {mappedProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-stone-200 pt-6 text-xs text-stone-600">
                  <span>
                    Página <strong>{page}</strong> de{" "}
                    <strong>{totalPages}</strong>
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
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
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
              title="Nenhum produto encontrado"
              description="Tente ajustar sua busca ou limpar os filtros selecionados para encontrar o que procura."
              actionLabel="Limpar Filtros"
              onActionClick={() => {
                setSelectedCategory("");
                setSearchQuery("");
                setPage(1);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
