"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  RiArrowRightLine,
  RiHeartLine,
} from "react-icons/ri";

import { ProductCard, ProductCardProps } from "../components/ui/product-card";
import { StoreCard, StoreCardProps } from "../components/ui/store-card";
import { apiClient } from "../lib/api-client";

export default function MarketplaceHomePage() {
  // Query Dynamic Featured Products
  const { data: featuredProductsRes } = useQuery<{
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
  const { data: storesRes } = useQuery<{
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



  const featuredProducts: ProductCardProps[] =
    featuredProductsRes?.data && featuredProductsRes.data.length > 0
      ? featuredProductsRes.data.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.promotionalPrice || p.price,
          originalPrice: p.promotionalPrice ? p.price : undefined,
          imageUrl:
            p.mainImageUrl ||
            "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80",
          storeName: p.store?.name || "Produtor Artesanal",
          storeSlug: p.store?.slug || "",
        }))
      : [
          {
            id: "p1",
            name: "Queijo Canastra Maturado 60 Dias",
            slug: "queijo-canastra-maturado",
            price: 68.9,
            originalPrice: 79.9,
            unit: "peça (500g)",
            imageUrl:
              "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80",
            storeName: "Queijaria Alvorada",
            storeSlug: "queijaria-alvorada",
            origin: "Farroupilha, RS",
            rating: 4.9,
            reviewsCount: 38,
            badge: "Seleção Especial",
          },
        ];

  const storesList: StoreCardProps[] =
    storesRes?.data && storesRes.data.length > 0
      ? storesRes.data.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          description: s.description || "Produtor artesanal cadastrado no mercado regional VERTTEX.",
          city: "Região",
          state: "RS",
          productsCount: s.productsCount,
          isVerified: true,
          coverUrl:
            s.coverUrl ||
            "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
        }))
      : [
          {
            id: "s1",
            name: "Queijaria Alvorada",
            slug: "queijaria-alvorada",
            description:
              "Tradição familiar na produção de queijos artesanais de leite cru com maturação especial.",
            city: "Farroupilha",
            state: "RS",
            productsCount: 14,
            isVerified: true,
            coverUrl:
              "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
          },
        ];

  return (
    <div className="space-y-24 pb-28 lg:pb-36 font-sans text-stone-900 antialiased">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-stone-900 via-stone-800 to-amber-950 px-4 py-24 text-white sm:px-6 lg:px-8 lg:py-32">
        <div className="absolute top-0 right-0 h-96 w-96 translate-x-24 -translate-y-24 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-24 translate-y-24 rounded-full bg-amber-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:items-center">
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center space-x-2 rounded-full border border-amber-500/40 bg-amber-900/40 px-3.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-xs">
                <RiHeartLine className="h-3.5 w-3.5 text-amber-400" />
                <span>Valorizando o Produtor Local</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
                Sabor artesanal direto da <span className="text-amber-400">nossa terra</span> para a sua mesa.
              </h1>

              <p className="max-w-2xl text-base text-stone-300">
                Conectamos você aos melhores produtores artesanais e coloniais da nossa região. Produtos frescos, autênticos e com rastreabilidade sanitária de lote por FEFO.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/produtos"
                  className="rounded-xl bg-emerald-800 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-900 transition-colors shadow-lg cursor-pointer"
                >
                  Explorar Catálogo
                </Link>
                <Link
                  href="/produtores"
                  className="rounded-xl border border-stone-600 bg-stone-800/80 px-6 py-3.5 text-sm font-bold text-white hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Conhecer Produtores
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-stone-800/60 p-2 shadow-2xl backdrop-blur-md">
                <img
                  src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80"
                  alt="Produtor artesanal"
                  className="h-80 w-full rounded-2xl object-cover sm:h-96"
                />
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Dynamic Featured Products Grid Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
              Produtos em Destaque
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Seleção dos itens mais bem avaliados pelos clientes da nossa região.
            </p>
          </div>
          <Link
            href="/produtos"
            className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 cursor-pointer"
          >
            <span>Ver Catálogo Completo</span>
            <RiArrowRightLine className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      </section>

      {/* Dynamic Partner Stores Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
              Produtores Locais Parceiros
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Conheça as famílias e agroindústrias locais por trás dos nossos produtos.
            </p>
          </div>
          <Link
            href="/produtores"
            className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 cursor-pointer"
          >
            <span>Ver Todos os Produtores</span>
            <RiArrowRightLine className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {storesList.map((s) => (
            <StoreCard key={s.id} {...s} />
          ))}
        </div>
      </section>
    </div>
  );
}
