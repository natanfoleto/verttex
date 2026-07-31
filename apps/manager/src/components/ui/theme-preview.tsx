"use client";

import { PiBell, PiShoppingCart } from "react-icons/pi";
import {
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiImage2Line,
  RiLockLine,
  RiMenu3Line,
  RiSearchLine,
  RiShieldCheckLine,
  RiStarFill,
} from "react-icons/ri";

interface ThemePreviewProps {
  settings: {
    publicName?: string;
    logoUrl?: string | null;
    headerBgColor?: string;
    headerTextColor?: string;
    siteBgColor?: string;
    primaryButtonBgColor?: string;
    primaryButtonTextColor?: string;
    secondaryButtonBgColor?: string;
    secondaryButtonTextColor?: string;
    primaryTextColor?: string;
    secondaryTextColor?: string;
  };
}

export function ThemePreview({ settings }: ThemePreviewProps) {
  const headerBg = settings.headerBgColor || "#15803d";
  const headerText = settings.headerTextColor || "#ffffff";
  const siteBg = settings.siteBgColor || "#f5f5f4";
  const btnPrimaryBg = settings.primaryButtonBgColor || "#16a34a";
  const btnPrimaryText = settings.primaryButtonTextColor || "#ffffff";
  const btnSecondaryBg = settings.secondaryButtonBgColor || "#e7e5e4";
  const btnSecondaryText = settings.secondaryButtonTextColor || "#1c1917";
  const textPrimary = settings.primaryTextColor || "#1c1917";

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 space-y-3 font-sans select-none overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Preview em Tempo Real do Marketplace
          </h3>
        </div>
        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
          Ao Vivo
        </span>
      </div>

      {/* Moldura do Navegador Simulado (Escala Compacta e Fiel) */}
      <div className="w-full rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900 shadow-xl">
        {/* Barra de Endereço do Navegador */}
        <div className="bg-zinc-950 border-b border-zinc-800 px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-rose-500/80" />
            <div className="size-2 rounded-full bg-amber-500/80" />
            <div className="size-2 rounded-full bg-emerald-500/80" />
          </div>
          <div className="rounded-md bg-zinc-900 px-3 py-0.5 text-[9px] font-mono flex items-center gap-1.5 border border-zinc-800/90 text-zinc-400">
            <RiLockLine className="h-2.5 w-2.5 text-emerald-400" />
            <span>marketplace.verttex.com.br</span>
          </div>
          <div className="w-8" />
        </div>

        {/* 1. Header do Marketplace (Header Primário + Secundário Unificados) */}
        <header
          style={{ backgroundColor: headerBg, color: headerText }}
          className="w-full font-sans antialiased shadow-sm transition-colors duration-200"
        >
          <div className="max-w-304 mx-auto">
            {/* Header Main Row */}
            <div className="flex h-11 items-center justify-between gap-3 px-3 sm:px-4">
              {/* Logo & Input de Busca com Espaçamento Ajustado */}
              <div className="flex items-center space-x-4 sm:space-x-6 flex-1 max-w-xl">
                <div className="flex shrink-0 items-center space-x-2">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Logo"
                      className="h-6 max-w-28 object-contain brightness-0 invert"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-xs font-bold text-white shadow-xs">
                        {(settings.publicName || "Verttex").charAt(0)}
                      </div>
                      <span className="text-xs font-extrabold tracking-tight text-white">
                        {settings.publicName || "Verttex"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Input de Pesquisa */}
                <div className="relative hidden sm:flex flex-1 max-w-sm items-center">
                  <RiSearchLine className="absolute left-2.5 h-3 w-3 text-stone-400" />
                  <div className="h-7 w-full pl-7 pr-2 text-[10px] bg-white text-stone-900 rounded-md flex items-center shadow-xs">
                    <span className="text-stone-400 truncate">Buscar produtos, marcas...</span>
                  </div>
                </div>
              </div>

              {/* Botões Primários do Header (Entrar e Criar Conta) */}
              <div className="flex items-center space-x-1.5 text-[10px] font-semibold">
                <button
                  type="button"
                  style={{ backgroundColor: btnPrimaryBg, color: btnPrimaryText }}
                  className="h-7 px-2.5 rounded-md font-semibold transition-opacity hover:opacity-90 shadow-xs cursor-pointer border-none"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  style={{ backgroundColor: btnPrimaryBg, color: btnPrimaryText }}
                  className="h-7 px-2.5 rounded-md font-semibold transition-opacity hover:opacity-90 shadow-xs cursor-pointer border-none"
                >
                  Criar Conta
                </button>
              </div>
            </div>

            {/* Sub-Header Navigation Bar */}
            <nav className="hidden sm:block text-[10px] font-semibold text-inherit pb-1.5 pt-0.5 border-none">
              <div className="flex items-center justify-between px-3 sm:px-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 py-0.5 px-2 rounded-md bg-white/15 text-white">
                    <RiMenu3Line className="h-3 w-3" />
                    <span>Todas as Categorias</span>
                    <RiArrowDownSLine className="h-3 w-3 opacity-70" />
                  </div>
                  <span className="px-1.5 py-0.5 text-white/90 hover:text-white cursor-pointer">
                    Lojas e produtores
                  </span>
                </div>

                {/* Direita do Nav: Favoritos + Notificações & Carrinho à direita dos favoritos */}
                <div className="flex items-center space-x-2">
                  <span className="hover:text-white cursor-pointer flex items-center gap-0.5 text-white/90">
                    Favoritos <RiArrowDownSLine className="h-3 w-3 opacity-70" />
                  </span>

                  {/* Notificações e Carrinho posicionados à direita de Favoritos */}
                  <div className="flex items-center space-x-0.5">
                    <button
                      type="button"
                      className="relative flex size-6 items-center justify-center rounded-md text-inherit transition-colors hover:bg-white/15 cursor-pointer"
                      title="Notificações"
                    >
                      <PiBell className="size-3.5" />
                    </button>

                    <button
                      type="button"
                      className="relative flex size-6 items-center justify-center rounded-md text-inherit transition-colors hover:bg-white/15 cursor-pointer"
                      title="Carrinho"
                    >
                      <PiShoppingCart className="size-3.5" />
                      <span className="absolute -top-1 -right-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[7px] font-bold text-stone-900">
                        2
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </header>

        {/* 2. Banner Principal do Marketplace (Colado no Header e nos Cantos) */}
        <section className="relative w-full overflow-hidden transition-colors duration-200" style={{ backgroundColor: siteBg }}>
          <div className="relative w-full px-3 sm:px-6 md:px-10 py-0">
            {/* Banner Container Fiel */}
            <div className="relative w-full h-28 sm:h-36 rounded-none bg-linear-to-r from-stone-900 via-stone-800 to-amber-950 flex flex-col items-center justify-center text-center p-4 text-white shadow-xs">
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white max-w-lg">
                Título do Banner Principal
              </h2>
              <p className="text-[10px] text-stone-300 max-w-md mt-1 font-normal">
                Subtítulo demonstrativo do banner publicitário do marketplace
              </p>
              <button
                type="button"
                style={{ backgroundColor: btnPrimaryBg, color: btnPrimaryText }}
                className="mt-2 py-1 px-3 rounded-md text-[9px] font-bold shadow-xs cursor-pointer border-none"
              >
                Ver Ofertas
              </button>

              {/* Setas Cápsula de Navegação nas extremidades */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-5 sm:h-10 sm:w-6 rounded-r-full bg-stone-950/70 text-white flex items-center justify-center border border-l-0 border-white/20 cursor-pointer">
                <RiArrowLeftSLine className="h-4 w-4" />
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-5 sm:h-10 sm:w-6 rounded-l-full bg-stone-950/70 text-white flex items-center justify-center border border-r-0 border-white/20 cursor-pointer">
                <RiArrowRightSLine className="h-4 w-4" />
              </div>

              {/* Dots de Paginação na parte inferior centralizada */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                <div className="h-1 w-4 rounded-full bg-white" />
                <div className="h-1 w-1 rounded-full bg-white/40" />
                <div className="h-1 w-1 rounded-full bg-white/40" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Corpo Principal da Página (Fundo Geral Muted + Conteúdo Max 1216px) */}
        <main
          style={{ backgroundColor: siteBg }}
          className="w-full p-3 sm:p-4 transition-colors duration-200"
        >
          <div className="max-w-304 mx-auto space-y-4">
            {/* Card de Seção Branco: Produtos em Destaque */}
            <section className="rounded-xl border border-stone-200/80 bg-white p-3.5 sm:p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h2
                  style={{ color: textPrimary }}
                  className="text-xs sm:text-sm font-bold tracking-tight transition-colors duration-200"
                >
                  Produtos em Destaque
                </h2>
                <div className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-700 cursor-pointer">
                  <span>Ver Catálogo Completo</span>
                  <RiArrowRightLine className="h-3 w-3" />
                </div>
              </div>

              {/* Grid Fiel e Compacto de Produtos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {
                    name: "Queijo Canastra Meia Cura",
                    store: "Laticínios Serra Verde",
                    price: "R$ 49,90",
                    badge: "Mais Vendido",
                    rating: "4.9",
                  },
                  {
                    name: "Café Especial Torrado 500g",
                    store: "Fazenda Sol Nascente",
                    price: "R$ 38,50",
                    badge: "Orgânico",
                    rating: "5.0",
                  },
                  {
                    name: "Mel Puro de Abelha 1kg",
                    store: "Apicultura Regional",
                    price: "R$ 34,00",
                    badge: "Novo",
                    rating: "4.8",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col overflow-hidden rounded-lg border border-stone-200/80 bg-white shadow-xs"
                  >
                    {/* Imagem do Produto */}
                    <div className="relative aspect-4/3 w-full bg-stone-100 flex items-center justify-center text-stone-300">
                      <RiImage2Line className="h-6 w-6 text-stone-300" />
                      <span className="absolute top-1.5 left-1.5 rounded-full bg-emerald-800 px-1.5 py-0.2 text-[8px] font-bold text-white shadow-xs">
                        {item.badge}
                      </span>
                    </div>

                    {/* Dados do Produto */}
                    <div className="flex flex-1 flex-col p-2.5 space-y-1.5">
                      <span className="text-[9px] font-medium text-stone-500 truncate">
                        {item.store}
                      </span>
                      <h3 className="text-[10px] font-bold text-stone-900 truncate">
                        {item.name}
                      </h3>

                      <div className="flex items-center space-x-1 text-[9px] text-amber-500">
                        <RiStarFill className="h-2.5 w-2.5" />
                        <span className="font-semibold text-stone-700">{item.rating}</span>
                      </div>

                      <div className="pt-0.5 text-xs font-extrabold text-stone-900">
                        {item.price}
                      </div>

                      {/* Botões Primário e Secundário */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          style={{ backgroundColor: btnPrimaryBg, color: btnPrimaryText }}
                          className="py-1 px-1.5 rounded-md text-[8px] font-bold text-center border-none shadow-xs cursor-pointer"
                        >
                          Comprar
                        </button>
                        <button
                          type="button"
                          style={{ backgroundColor: btnSecondaryBg, color: btnSecondaryText }}
                          className="py-1 px-1.5 rounded-md text-[8px] font-bold text-center border border-stone-200 cursor-pointer"
                        >
                          Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Card de Seção Branco: Produtores em Destaque */}
            <section className="rounded-xl border border-stone-200/80 bg-white p-3.5 sm:p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h2
                  style={{ color: textPrimary }}
                  className="text-xs sm:text-sm font-bold tracking-tight transition-colors duration-200"
                >
                  Produtores & Lojas Parceiras
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { name: "Sítio Verde Orgânicos", city: "Caxambu, MG", products: "24 produtos" },
                  { name: "Empório da Serra", city: "São Lourenço, MG", products: "18 produtos" },
                ].map((store, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2.5 rounded-lg border border-stone-200/80 bg-stone-50 p-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-800 font-bold text-white text-[10px] shadow-xs">
                      {store.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="text-[10px] font-bold text-stone-900 truncate">{store.name}</h4>
                        <RiShieldCheckLine className="h-3 w-3 text-emerald-600 shrink-0" />
                      </div>
                      <p className="text-[9px] text-stone-500">{store.city} • {store.products}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
