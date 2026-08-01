"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  RiArrowRightLine,
} from "react-icons/ri";

import { ProductCard, ProductCardProps } from "../components/ui/product-card";
import { StoreCard, StoreCardProps } from "../components/ui/store-card";
import { MarketplaceCarousel } from "../components/ui/marketplace-carousel";
import { MarketplaceFullPageLoader } from "../components/ui/marketplace-page-loader";
import { apiClient } from "../lib/api-client";

export default function MarketplaceHomePage() {
  // Query Dynamic Featured Products
  const { data: featuredProductsRes, isLoading: isLoadingProducts } = useQuery<{
    data: Array<{
      id: string;
      name: string;
      slug: string;
      price: number;
      promotionalPrice?: number;
      mainImageUrl?: string;
      store?: { name: string; slug: string };
      isFeatured?: boolean;
    }>;
  }>({
    queryKey: ["public-featured-products"],
    queryFn: async () => {
      const res = await apiClient("/public/catalog/products?isFeatured=true&perPage=8");
      return res;
    },
  });

  // Query Dynamic Stores Showcase
  const { data: storesRes, isLoading: isLoadingStores } = useQuery<{
    data: Array<{
      id: string;
      name: string;
      slug: string;
      description?: string;
      logoUrl?: string;
      coverUrl?: string;
      productsCount: number;
    }>;
  }>({
    queryKey: ["public-stores"],
    queryFn: async () => {
      const res = await apiClient("/public/catalog/stores?perPage=6");
      return res;
    },
  });

  const isInitialLoading = (isLoadingProducts || isLoadingStores) && !featuredProductsRes && !storesRes;

  const featuredProducts: ProductCardProps[] =
    featuredProductsRes?.data && featuredProductsRes.data.length > 0
      ? featuredProductsRes.data.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.promotionalPrice || p.price,
        originalPrice: p.promotionalPrice ? p.price : undefined,
        imageUrl: p.mainImageUrl || undefined,
        storeName: p.store?.name || "Produtor",
        storeSlug: p.store?.slug || "",
      }))
      : [];

  const storesList: StoreCardProps[] =
    storesRes?.data && storesRes.data.length > 0
      ? storesRes.data.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description || undefined,
        productsCount: s.productsCount,
        isVerified: true,
        coverUrl: s.coverUrl || undefined,
        logoUrl: s.logoUrl || undefined,
      }))
      : [];

  if (isInitialLoading) {
    return <MarketplaceFullPageLoader label="Carregando produtos e produtores..." />;
  }

  return (
    <div className="space-y-10 pb-20 lg:pb-28 font-sans text-stone-900 antialiased">
      {/* Carrossel do Marketplace */}
      <MarketplaceCarousel />

      {/* Dynamic Featured Products Grid Section — Sem card envolvente */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-bold tracking-tight text-stone-900 sm:text-lg">
              Produtos em Destaque
            </h2>
            <Link
              href="/produtos"
              className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer transition-colors"
            >
              <span>Ver Catálogo Completo</span>
              <RiArrowRightLine className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}

      {/* Dynamic Partner Stores Section — Sem card envolvente */}
      {storesList.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-bold tracking-tight text-stone-900 sm:text-lg">
              Lojas e Produtores Parceiros
            </h2>
            <Link
              href="/lojas"
              className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer transition-colors"
            >
              <span>Ver Todos os Produtores</span>
              <RiArrowRightLine className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {storesList.map((s) => (
              <StoreCard key={s.id} {...s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
