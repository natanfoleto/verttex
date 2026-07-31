"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { PiBell, PiShoppingCart } from "react-icons/pi";
import {
  RiArrowDownSLine,
  RiArrowRightLine,
  RiImage2Line,
  RiLockLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiStarFill,
  RiStore2Line,
  RiUserAddLine,
} from "react-icons/ri";

function PreviewContent() {
  const searchParams = useSearchParams();

  const headerBg = searchParams.get("headerBg") || "#15803d";
  const headerText = searchParams.get("headerText") || "#ffffff";
  const siteBg = searchParams.get("siteBg") || "#f5f5f4";
  const primaryBtnBg = searchParams.get("primaryBtnBg") || "#16a34a";
  const primaryBtnText = searchParams.get("primaryBtnText") || "#ffffff";
  const secondaryBtnBg = searchParams.get("secondaryBtnBg") || "#e7e5e4";
  const secondaryBtnText = searchParams.get("secondaryBtnText") || "#1c1917";
  const primaryText = searchParams.get("primaryText") || "#1c1917";
  const publicName = searchParams.get("publicName") || "VERTTEX Marketplace";
  const carouselTitlePosition = searchParams.get("carouselTitlePosition") || "CENTER";
  const carouselTitleHAlign = searchParams.get("carouselTitleHAlign") || "LEFT";

  const titlePosClasses =
    carouselTitlePosition === "TOP"
      ? "justify-start pt-6 sm:pt-10"
      : carouselTitlePosition === "BOTTOM"
        ? "justify-end pb-6 sm:pb-10"
        : "justify-center";

  const titleHAlignClasses =
    carouselTitleHAlign === "RIGHT"
      ? "items-end text-right"
      : carouselTitleHAlign === "CENTER"
        ? "items-center text-center"
        : "items-start text-left";

  return (
    <div
      style={{ backgroundColor: siteBg }}
      className="min-h-screen font-sans text-stone-900 antialiased select-none"
    >
      {/* Top Banner Informativo do Manager */}
      <div className="bg-zinc-950 border-b border-zinc-800 text-zinc-300 text-xs py-2 px-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-emerald-400" />
          <span className="font-bold text-zinc-100">
            Pré-visualização — {publicName}
          </span>
        </div>
        <span className="text-[11px] text-zinc-400">
          Visualizando personalização de cores e texto
        </span>
      </div>

      {/* 1. Header Fiel do Marketplace */}
      <header
        style={{ backgroundColor: headerBg, color: headerText }}
        className="sticky top-8 z-40 font-sans antialiased shadow-sm transition-colors duration-200"
      >
        {/* Main Header Row */}
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          {/* Logo & Search */}
          <div className="flex items-center space-x-6 sm:space-x-10 flex-1 max-w-3xl">
            <div className="flex shrink-0 items-center space-x-3 cursor-default">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xl font-bold text-white shadow-xs">
                  {publicName.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold tracking-tight text-white">
                    {publicName}
                  </span>
                  <span className="-mt-1 text-[10px] font-semibold tracking-widest text-white/80 uppercase">
                    Mercado Regional
                  </span>
                </div>
              </div>
            </div>

            <div className="relative hidden w-full max-w-lg md:flex">
              <div className="relative w-full">
                <RiSearchLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <div className="h-9 pr-10 pl-10 text-xs bg-white text-stone-900 placeholder:text-stone-400 border-none shadow-xs rounded-md flex items-center">
                  <span className="text-stone-400">Buscar produtos, marcas e muito mais...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden items-center space-x-3 text-xs font-semibold md:flex">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                style={{ backgroundColor: primaryBtnBg, color: primaryBtnText }}
                className="h-9 px-3.5 font-semibold border-none rounded-md shadow-xs flex items-center gap-1.5 cursor-default"
              >
                <RiLockLine className="h-3.5 w-3.5" />
                <span>Entrar</span>
              </button>
              <button
                type="button"
                style={{ backgroundColor: primaryBtnBg, color: primaryBtnText }}
                className="h-9 px-3.5 font-semibold border-none rounded-md shadow-xs flex items-center gap-1.5 cursor-default"
              >
                <RiUserAddLine className="h-3.5 w-3.5" />
                <span>Criar Conta</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Header Nav */}
        <nav className="hidden text-xs font-semibold text-inherit py-1 md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2">
              <div className="inline-flex items-center space-x-1 py-1 px-1 text-xs font-semibold text-white/90 cursor-default">
                <span>Categorias</span>
                <RiArrowDownSLine className="h-4 w-4 text-white/70" />
              </div>
              <div className="inline-flex items-center py-1 px-1 text-xs font-semibold text-white/90 cursor-default">
                <span>Lojas e produtores</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center space-x-1 py-1 px-1 text-xs font-semibold text-white/90 cursor-default">
                <span>Favoritos</span>
                <RiArrowDownSLine className="h-4 w-4 text-white/70" />
              </div>
              <div className="flex items-center space-x-1">
                <div className="inline-flex items-center justify-center p-1 text-inherit cursor-pointer">
                  <PiBell className="size-5" />
                </div>
                <div className="inline-flex items-center justify-center p-1 text-inherit cursor-pointer">
                  <PiShoppingCart className="size-5" />
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* 2. Carrossel — clone exato do marketplace-carousel.tsx */}
      <section
        className="group relative w-full bg-stone-50 py-0 mb-8 sm:mb-12 overflow-hidden"
        aria-label="Carrossel de Banners"
      >
        <div className="relative w-full aspect-18/5 overflow-hidden">
          <div className="flex w-full h-full">
            <div className="w-full h-full shrink-0 flex-none relative px-6 sm:px-12 md:px-20 lg:px-32 bg-stone-50">
              <div
                className={`w-full h-full bg-linear-to-br from-stone-900 via-stone-800 to-amber-950 flex flex-col p-8 text-white rounded-xs ${titlePosClasses} ${titleHAlignClasses}`}
              >
                {carouselTitlePosition !== "NONE" && (
                  <>
                    <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                      Sabor artesanal direto da terra para a sua mesa
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-300 max-w-xl mt-2 font-normal">
                      Conectamos você aos melhores produtores locais da nossa região.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-1.5">
            <div className="h-1.5 w-6 rounded-full bg-white shadow-xs" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
          </div>
        </div>

        {/* Botões cápsula idênticos */}
        <button
          type="button"
          aria-label="Banner anterior"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex h-10 w-8 sm:h-12 sm:w-10 md:h-16 md:w-16 items-center justify-center rounded-r-full bg-white shadow-none border-[1.5px] border-l-0 border-stone-300 text-stone-800 opacity-100 cursor-pointer"
        >
          <FiChevronLeft className="size-4 sm:size-5 md:size-7 text-stone-800 stroke-[1.25]" />
        </button>
        <button
          type="button"
          aria-label="Próximo banner"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex h-10 w-8 sm:h-12 sm:w-10 md:h-16 md:w-16 items-center justify-center rounded-l-full bg-white shadow-none border-[1.5px] border-r-0 border-stone-300 text-stone-800 opacity-100 cursor-pointer"
        >
          <FiChevronRight className="size-4 sm:size-5 md:size-7 text-stone-800 stroke-[1.25]" />
        </button>
      </section>

      {/* 3. Conteúdo Principal */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10 pb-20">
        {/* Produtos em Destaque */}
        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h2 style={{ color: primaryText }} className="text-lg font-bold tracking-tight sm:text-xl">
              Produtos em Destaque
            </h2>
            <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 cursor-default">
              <span>Ver Catálogo Completo</span>
              <RiArrowRightLine className="h-4 w-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Queijo Canastra Meia Cura 500g", store: "Laticínios Serra Verde", price: "R$ 49,90", oldPrice: "R$ 59,90", badge: "Mais Vendido", rating: 4.9, reviews: 28 },
              { name: "Café Especial Torrado em Grãos 500g", store: "Fazenda Sol Nascente", price: "R$ 38,50", badge: "Orgânico", rating: 5.0, reviews: 14 },
              { name: "Mel Puro de Abelha Silvestre 1kg", store: "Apicultura Regional", price: "R$ 34,00", badge: "Novo", rating: 4.8, reviews: 9 },
              { name: "Azeite de Oliva Extra Virgem 500ml", store: "Olivival Mantiqueira", price: "R$ 68,00", oldPrice: "R$ 75,00", badge: "-10%", rating: 4.9, reviews: 32 },
            ].map((item, idx) => (
              <div key={idx} className="group relative flex flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-xs">
                <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100 flex items-center justify-center">
                  <RiImage2Line className="h-12 w-12 text-stone-300" />
                  <div className="absolute top-3 left-3 z-10">
                    <span className="rounded-full bg-emerald-800 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      {item.badge}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4 space-y-2">
                  <span className="text-[11px] font-medium text-stone-500 truncate">{item.store}</span>
                  <h3 className="text-xs font-bold text-stone-900 line-clamp-2 min-h-8">{item.name}</h3>
                  <div className="flex items-center space-x-1 text-xs text-amber-500">
                    <RiStarFill className="h-3.5 w-3.5" />
                    <span className="font-semibold text-stone-700">{item.rating}</span>
                    <span className="text-[10px] text-stone-400">({item.reviews})</span>
                  </div>
                  <div className="pt-1 flex items-baseline space-x-2">
                    <span className="text-base font-extrabold text-stone-900">{item.price}</span>
                    {"oldPrice" in item && item.oldPrice && (
                      <span className="text-xs text-stone-400 line-through">{item.oldPrice}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 mt-auto">
                    <button type="button" style={{ backgroundColor: primaryBtnBg, color: primaryBtnText }} className="py-2 px-3 rounded-lg text-xs font-bold border-none shadow-xs cursor-default">
                      Comprar
                    </button>
                    <button type="button" style={{ backgroundColor: secondaryBtnBg, color: secondaryBtnText }} className="py-2 px-3 rounded-lg text-xs font-bold border border-stone-200/90 cursor-default">
                      Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Lojas Parceiras */}
        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h2 style={{ color: primaryText }} className="text-lg font-bold tracking-tight sm:text-xl">
              Produtores & Lojas Parceiras
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Sítio Verde Orgânicos", location: "Caxambu, MG", products: 24 },
              { name: "Empório Artesanal da Serra", location: "São Lourenço, MG", products: 18 },
              { name: "Fazenda Mantiqueira", location: "Passa Quatro, MG", products: 31 },
            ].map((store, idx) => (
              <div key={idx} className="flex flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-xs">
                <div className="relative h-24 w-full bg-linear-to-r from-stone-800 to-amber-950 p-3 flex justify-end">
                  <span className="h-6 flex items-center space-x-1 rounded-full bg-stone-900/80 px-2.5 text-[10px] font-semibold text-white">
                    <RiStore2Line className="h-3 w-3 text-emerald-400" />
                    <span>{store.products} produtos</span>
                  </span>
                </div>
                <div className="p-4 pt-0 relative flex-1 space-y-2">
                  <div className="-mt-8 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white bg-emerald-800 text-xl font-bold text-white shadow-sm">
                    {store.name.charAt(0)}
                  </div>
                  <div className="flex items-center space-x-1 pt-1">
                    <h3 className="text-sm font-bold text-stone-900">{store.name}</h3>
                    <RiShieldCheckLine className="h-4 w-4 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-xs text-stone-500">{store.location}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function MarketplacePreviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-400">Carregando preview...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
