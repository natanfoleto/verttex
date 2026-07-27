"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { RiArrowLeftLine } from "react-icons/ri";

import { EmptyState } from "../../../components/ui/empty-state";
import {
  ProductCard,
  ProductCardProps,
} from "../../../components/ui/product-card";
import { ProductCardSkeleton } from "../../../components/ui/skeleton-loader";
import { apiClient } from "../../../lib/api-client";

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const resolvedParams = use(params);
  const categorySlug = resolvedParams.categorySlug;

  const { data: catalogRes, isLoading } = useQuery<{
    data: any[];
    meta: any;
  }>({
    queryKey: ["public-category-products", categorySlug],
    queryFn: async () => {
      const res = await apiClient(
        `/public/catalog/products?categorySlug=${categorySlug}&page=1&perPage=50`,
      );
      return res;
    },
  });

  const formattedCategoryName = categorySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const productsList = catalogRes?.data || [];

  const mappedProducts: ProductCardProps[] = productsList.map((p: any) => ({
    id: p.id,
    name: p.name,
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
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 font-sans text-stone-900 mb-24 lg:mb-32 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-emerald-800">
            Início
          </Link>
          <span>/</span>
          <Link href="/produtos" className="hover:text-emerald-800">
            Produtos
          </Link>
          <span>/</span>
          <span className="font-semibold text-stone-800">
            {formattedCategoryName}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              {formattedCategoryName}
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Produtos artesanais selecionados na categoria{" "}
              {formattedCategoryName}.
            </p>
          </div>

          <Link
            href="/produtos"
            className="inline-flex cursor-pointer items-center space-x-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-2xs transition-colors hover:border-stone-300 hover:bg-stone-50"
          >
            <RiArrowLeftLine className="h-4 w-4" />
            <span>Voltar aos Produtos</span>
          </Link>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : mappedProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {mappedProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum produto nesta categoria"
          description="Ainda não existem produtos publicados nesta categoria de produto."
          actionLabel="Ver Todos os Produtos"
          onActionClick={() => {
            window.location.href = "/produtos";
          }}
        />
      )}
    </div>
  );
}
