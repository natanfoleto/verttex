"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiDiscountPercentLine,
  RiGridLine,
  RiLogoutBoxRLine,
  RiMapPinLine,
  RiMenuLine,
  RiSearchLine,
  RiShoppingBag3Line,
  RiStore2Line,
  RiUser3Line,
} from "react-icons/ri";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverDropdown } from "@/components/ui/hover-dropdown";
import { Input } from "@/components/ui/input";

import { CartSheet } from "../cart/cart-sheet";
import { apiClient } from "../../lib/api-client";
import { useCustomer } from "../../providers/customer-auth-provider";

interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  productsCount: number;
}

export function MarketplaceHeader() {
  const { customer, logout, openAuthModal } = useCustomer();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  // Fetch marketplace settings
  const { data: settings } = useQuery<any>({
    queryKey: ["public-marketplace-settings"],
    queryFn: async () => {
      const res = await apiClient<any>("/public/marketplace/settings");
      return res?.data || res;
    },
  });

  // Fetch categories
  const { data: categories } = useQuery<PublicCategory[]>({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const res = await apiClient<PublicCategory[]>("/public/catalog/categories");
      return res;
    },
  });

  // Fetch cart summary for item counter
  const { data: cartSummary } = useQuery<any>({
    queryKey: ["cart-summary"],
    queryFn: async () => {
      try {
        const res = await apiClient<any>("/customer/cart");
        return res;
      } catch {
        return null;
      }
    },
    enabled: !!customer,
  });

  const cartTotalItems =
    cartSummary?.stores?.reduce(
      (acc: number, store: any) =>
        acc +
        (store.items?.reduce((iAcc: number, item: any) => iAcc + item.quantity, 0) || 0),
      0,
    ) || 0;

  // Group categories into parent & subcategories
  const rootCategories = (categories || []).filter((c) => !c.parentId);
  const subcategoriesMap = new Map<string, PublicCategory[]>();

  (categories || []).forEach((cat) => {
    if (cat.parentId) {
      const existing = subcategoriesMap.get(cat.parentId) || [];
      existing.push(cat);
      subcategoriesMap.set(cat.parentId, existing);
    }
  });

  const displayCategories = rootCategories.length > 0 ? rootCategories : categories || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `/produtos?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full font-sans antialiased">
      {/* ─── Global Top Announcement Bar ─── */}
      {settings?.announcementActive && settings?.announcementText && !announcementDismissed && (
        <div className="relative w-full bg-emerald-950 text-emerald-100 py-1.5 px-4 text-xs font-medium">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center">
            {settings.announcementLink ? (
              <Link href={settings.announcementLink} className="hover:underline font-semibold flex items-center gap-1">
                <span>{settings.announcementText}</span>
                <RiArrowRightSLine className="h-4 w-4 shrink-0" />
              </Link>
            ) : (
              <span>{settings.announcementText}</span>
            )}
            {settings.announcementDismissible !== false && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setAnnouncementDismissed(true)}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-emerald-300 hover:text-white hover:bg-transparent transition-colors cursor-pointer"
                aria-label="Fechar comunicado"
              >
                <RiCloseLine className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ─── Grid Header (12 Colunas Perfeitamente Alinhadas) ─── */}
      <div className="mx-auto max-w-7xl px-4 pt-2 pb-1.5 sm:px-6 lg:px-8">

        {/* ROW 1: Logo (Col 1-3) | Search Input (Col 4-9) | Promo Banner (Col 10-12) */}
        <div className="grid grid-cols-12 items-center gap-4">

          {/* Logo Alinhada na Coluna 1 a 2 (Reduzido para aproximar a busca) */}
          <div className="col-span-6 md:col-span-2 flex items-center">
            <Link href="/" className="inline-flex items-center space-x-2.5 group">
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings?.publicName || "Verttex"}
                  className="h-9 max-w-44 object-contain"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-emerald-950 text-white font-black text-base shadow-xs">
                    {(settings?.publicName || "Verttex").charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black tracking-tight leading-none">
                      {settings?.publicName || "Verttex"}
                    </span>
                    <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5">
                      Mercado Local
                    </span>
                  </div>
                </div>
              )}
            </Link>
          </div>

          {/* Input de Busca Alinhado na Coluna 3 a 8 (6 colunas) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex col-span-6 items-center"
          >
            <div className="relative w-full flex items-center bg-white rounded-xs shadow-xs text-stone-900 overflow-hidden">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos, marcas e muito mais..."
                className="w-full bg-transparent border-none focus-visible:ring-0 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-600 focus:outline-none"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="h-7 w-7 p-0 text-stone-400 hover:text-stone-700 hover:bg-transparent transition-colors cursor-pointer mr-1"
                >
                  <RiCloseLine className="h-4 w-4" />
                </Button>
              )}
              <div className="h-5 w-px bg-stone-200 shrink-0" />
              <Button
                type="submit"
                variant="ghost"
                className="px-3.5 py-2.5 h-auto text-stone-500 hover:text-emerald-800 hover:bg-transparent transition-colors cursor-pointer"
                title="Buscar"
              >
                <RiSearchLine className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Banner Promocional no Topo Direita (Coluna 9 a 12 - 4 colunas) */}
          <div className="hidden md:flex col-span-4 items-center justify-end text-xs font-semibold text-white">
            <Link
              href="/produtos"
              className="inline-flex items-center space-x-2 hover:opacity-90 transition-opacity"
            >
              <RiDiscountPercentLine className="h-5 w-5 text-white" />
              <span className="text-xs font-bold tracking-tight text-white">Ofertas por tempo limitado</span>
            </Link>
          </div>

          {/* Mobile Actions Toggle */}
          <div className="col-span-6 flex items-center justify-end space-x-2 md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-white hover:text-emerald-100 hover:bg-transparent cursor-pointer"
              aria-label="Carrinho"
            >
              <RiShoppingBag3Line className="h-6 w-6" />
              {cartTotalItems > 0 && (
                <Badge className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-950 p-0 text-[10px] font-bold text-white border-none">
                  {cartTotalItems}
                </Badge>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:bg-emerald-700/50"
              aria-label="Menu Mobile"
            >
              {mobileMenuOpen ? <RiCloseLine className="h-6 w-6" /> : <RiMenuLine className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* ROW 2: CEP (Col 1-2) | Menus Nav (Col 3-8) | Auth Controls (Col 9-12) */}
        <div className="hidden md:grid grid-cols-12 items-center gap-4 pt-3.5 pb-0.5">

          {/* CEP / Região Alinhado Exatamente na Coluna 1 a 2 */}
          <div className="col-span-2 flex items-center">
            <Button
              type="button"
              variant="ghost"
              className="group inline-flex items-center p-0! h-auto text-left hover:opacity-90 hover:bg-transparent transition-opacity cursor-pointer"
            >
              <RiMapPinLine className="h-5 w-5 shrink-0 text-white" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-white/80 font-medium">Informe seu</span>
                <span className="text-xs text-white">CEP</span>
              </div>
            </Button>
          </div>

          {/* Menus Principais Alinhados Exatamente na Coluna 3 a 8 */}
          <nav className="col-span-6 flex items-center space-x-4 text-xs font-normal text-white">

            {/* Mega Categories Dropdown usando o componente reutilizável HoverDropdown */}
            <HoverDropdown
              align="left"
              arrowColor="border-b-zinc-800"
              arrowOffset="left-6"
              contentClassName="w-64 rounded-xs bg-zinc-800 border border-zinc-800 p-2 shadow-2xl space-y-0.5 text-white font-sans"
              trigger={
                <button
                  type="button"
                  className="inline-flex items-end gap-0.5 text-xs font-normal text-white hover:opacity-90 transition-opacity cursor-pointer border-none bg-transparent outline-none p-0 focus:outline-none focus:ring-0"
                >
                  <span>Categorias</span>
                  <RiArrowDownSLine className="h-3.5 w-3.5 text-white/75 shrink-0" />
                </button>
              }
            >
              {displayCategories && displayCategories.length > 0 ? (
                <>
                  {displayCategories.slice(0, 10).map((cat) => {
                    const subs = subcategoriesMap.get(cat.id) || [];
                    const hasChildren = subs.length > 0;

                    return (
                      <div key={cat.id} className="relative group/sub">
                        <Link
                          href={`/produtos?categorySlug=${cat.slug}`}
                          className="flex items-center justify-between rounded-xs px-3.5 py-2 text-xs font-normal text-stone-200 hover:bg-zinc-700 hover:text-white transition-colors"
                        >
                          <span className="truncate">{cat.name}</span>
                          {hasChildren && <RiArrowRightSLine className="h-3.5 w-3.5 text-stone-400 shrink-0 ml-2" />}
                        </Link>

                        {/* Subcategories Flyout */}
                        {hasChildren && (
                          <div className="invisible absolute left-full top-0 ml-1 opacity-0 transition-all duration-150 group-hover/sub:visible group-hover/sub:opacity-100 z-50">
                            <div className="w-56 rounded-xs bg-zinc-800 border border-zinc-700 p-2 shadow-2xl space-y-0.5 text-white font-sans">
                              {subs.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/produtos?categorySlug=${sub.slug}`}
                                  className="block rounded-xs px-3.5 py-2 text-xs font-normal text-stone-200 hover:bg-zinc-700 hover:text-white transition-colors"
                                >
                                  <span className="truncate">{sub.name}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <Link
                    href="/categorias"
                    className="block rounded-xs px-3.5 py-2 text-xs font-normal text-stone-200 hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    <span className="truncate">Ver mais categorias</span>
                  </Link>
                </>
              ) : (
                <p className="p-3 text-center text-xs text-stone-400">Nenhuma categoria</p>
              )}
            </HoverDropdown>

            <Link href="/produtos" className="py-1 text-white hover:opacity-80 transition-opacity">
              Ofertas
            </Link>

            <Link href="/produtos" className="py-1 text-white hover:opacity-80 transition-opacity">
              Cupons
            </Link>

            <Link href="/produtos" className="py-1 text-white hover:opacity-80 transition-opacity">
              Supermercado
            </Link>

            <Link href="/lojas" className="py-1 text-white hover:opacity-80 transition-opacity">
              Produtores
            </Link>

            <Link href="/lojas" className="py-1 text-white hover:opacity-80 transition-opacity">
              Vender
            </Link>

            <Link href="/atendimento" className="py-1 text-white hover:opacity-80 transition-opacity">
              Contato
            </Link>
          </nav>

          {/* Controles de Autenticação / Conta Alinhados na Coluna 9 a 12 (Diretamente abaixo das Ofertas) */}
          <div className="col-span-4 flex items-center justify-end space-x-5 text-xs font-normal text-white">
            {customer ? (
              <HoverDropdown
                align="right"
                arrowColor="border-b-white"
                arrowOffset="right-6"
                contentClassName="w-72 rounded-xs bg-white border border-stone-200/80 shadow-2xl text-stone-900 font-sans overflow-hidden"
                trigger={
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-normal text-white hover:opacity-90 transition-opacity cursor-pointer border-none bg-transparent outline-none p-0 focus:outline-none focus:ring-0"
                  >
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarFallback className="bg-white text-stone-900 text-[10px] font-bold uppercase">
                        {customer.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex items-end gap-0.5">
                      <span className="max-w-28 truncate">{customer.name.split(" ")[0]}</span>
                      <RiArrowDownSLine className="h-3.5 w-3.5 text-white/75" />
                    </div>

                  </button>
                }
              >
                {/* User Info Header — Botão clicável que leva ao Perfil */}
                <Link
                  href="/perfil"
                  className="flex items-center justify-between p-4 border-b border-stone-100 hover:bg-stone-50/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Avatar className="h-11 w-11 shrink-0 shadow-xs">
                      <AvatarFallback className="bg-stone-900 text-white text-base font-bold uppercase">
                        {customer.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-stone-900 text-sm truncate leading-tight">
                        {customer.name}
                      </span>
                      <span className="text-[11px] text-stone-500 truncate mt-0.5">
                        {customer.email}
                      </span>
                    </div>
                  </div>
                  <RiArrowRightSLine className="h-5 w-5 text-stone-400 shrink-0 ml-2" />
                </Link>

                {/* Promo Banner Meli+ / Verttex+ */}
                <div className="p-3 border-b border-stone-100">
                  <Link
                    href="/perfil"
                    className="flex items-center justify-between w-full bg-linear-to-r from-pink-600 to-rose-600 text-white text-[11px] font-bold px-3.5 py-2.5 rounded-full hover:brightness-105 transition-all shadow-xs cursor-pointer"
                  >
                    <span>meli+ Assine a partir de R$ 9,90/mês</span>
                    <RiArrowRightSLine className="h-4 w-4 shrink-0 ml-1" />
                  </Link>
                </div>

                {/* Section 1: Compras, Histórico, Perguntas, Opiniões */}
                <div className="border-b border-stone-100 py-1.5">
                  <Link
                    href="/pedidos"
                    className="block px-4 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    Compras
                  </Link>
                  <Link
                    href="/produtos"
                    className="block px-4 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    Histórico
                  </Link>
                  <Link
                    href="/atendimento"
                    className="block px-4 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    Perguntas
                  </Link>
                  <Link
                    href="/perfil"
                    className="block px-4 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    Opiniões
                  </Link>
                </div>

                {/* Section 2: Empréstimos, Assinaturas, Faturamento */}
                <div className="border-b border-stone-100 py-1.5">
                  <Link
                    href="/perfil"
                    className="block px-4 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    Empréstimos
                  </Link>
                  <Link
                    href="/perfil"
                    className="block px-4 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    Assinaturas
                  </Link>
                  <Link
                    href="/perfil"
                    className="block px-4 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    Faturamento
                  </Link>
                </div>

                {/* Section 3: Vender, Resumo */}
                <div className="border-b border-stone-100 py-1.5">
                  <Link
                    href="/lojas"
                    className="block px-4 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    Vender
                  </Link>
                  <Link
                    href="/perfil"
                    className="block px-4 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    Resumo
                  </Link>
                </div>

                {/* Section 4: Sair */}
                <div className="py-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => logout()}
                    className="block w-full text-left justify-start px-4 py-1.5 h-auto text-xs font-medium text-stone-700 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer rounded-none"
                  >
                    Sair
                  </Button>
                </div>
              </HoverDropdown>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => openAuthModal("register")}
                  className="p-0 h-auto text-xs font-normal text-white hover:opacity-80 hover:bg-transparent transition-opacity cursor-pointer border-none shadow-none"
                >
                  Crie a sua conta
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => openAuthModal("login")}
                  className="p-0 h-auto text-xs font-normal text-white hover:opacity-80 hover:bg-transparent transition-opacity cursor-pointer border-none shadow-none"
                >
                  Entre
                </Button>
              </>
            )}

            {/* Link Compras / Pedidos */}
            <Link
              href={customer ? "/pedidos" : "#"}
              onClick={(e) => {
                if (!customer) {
                  e.preventDefault();
                  openAuthModal("login");
                }
              }}
              className="text-white hover:opacity-80 transition-opacity cursor-pointer font-medium"
            >
              Compras
            </Link>

            {/* Menu Favoritos (Hover Dropdown com Fundo Branco - Idêntico ao Modelo) */}
            {customer && (
              <HoverDropdown
                align="right"
                arrowColor="border-b-white"
                arrowOffset="right-6"
                contentClassName="w-80 rounded-xs bg-white border border-stone-200/80 shadow-2xl text-stone-900 font-sans overflow-hidden"
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-end gap-0.5 text-xs font-normal text-white hover:opacity-90 transition-opacity cursor-pointer border-none bg-transparent outline-none focus:outline-none focus:ring-0"
                  >
                    <span>Favoritos</span>
                    <RiArrowDownSLine className="h-3.5 w-3.5 text-white/75 shrink-0" />
                  </button>
                }
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-stone-100">
                  <h4 className="font-semibold text-stone-900 text-sm tracking-tight">
                    Favoritos
                  </h4>
                </div>

                {/* Body */}
                <div className="bg-stone-100 py-12 px-6 text-center">
                  <p className="text-xs text-stone-800 font-normal leading-relaxed max-w-60 mx-auto">
                    Adicione aqui os produtos que você gostou para poder vê-los mais tarde.
                  </p>
                </div>

                {/* Footer */}
                <div className="py-4 px-4 bg-white border-t border-stone-100 text-center">
                  <Link
                    href="/perfil"
                    className="text-xs font-normal text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    Ver todos os favoritos e listas
                  </Link>
                </div>
              </HoverDropdown>
            )}

            {/* Ícone de Carrinho no Final da Linha */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsCartOpen(true)}
              className="relative p-1 h-auto w-auto text-white hover:opacity-80 hover:bg-transparent transition-opacity cursor-pointer"
              title="Carrinho de Compras"
            >
              <RiShoppingBag3Line className="h-5 w-5 text-white" />
              {cartTotalItems > 0 && (
                <Badge className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-950 px-1 p-0 text-[9px] font-bold text-white border-none">
                  {cartTotalItems}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Mobile Menu Drawer ─── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-emerald-700 bg-emerald-700 px-4 py-5 space-y-4 shadow-xl animate-fadeIn text-white">
          {/* Mobile Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex items-center rounded-xs bg-white text-stone-900 px-3 py-2 shadow-xs">
              <RiSearchLine className="h-4 w-4 text-stone-400 shrink-0" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos, marcas e muito mais..."
                className="w-full bg-transparent border-none focus-visible:ring-0 px-2.5 text-sm text-stone-900 placeholder:text-stone-600 focus:outline-none"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="h-6 w-6 p-0 text-stone-400 hover:text-stone-700 hover:bg-transparent cursor-pointer"
                >
                  <RiCloseLine className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>

          {/* Mobile Links */}
          <div className="space-y-1 text-xs font-medium text-white">
            <Link
              href="/produtos"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2.5 rounded-xs px-3 py-2.5 hover:bg-emerald-600/50"
            >
              <RiDiscountPercentLine className="h-4.5 w-4.5 text-white" />
              <span>Ofertas</span>
            </Link>

            <Link
              href="/lojas"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2.5 rounded-xs px-3 py-2.5 hover:bg-emerald-600/50"
            >
              <RiStore2Line className="h-4.5 w-4.5 text-white" />
              <span>Produtores Parceiros</span>
            </Link>

            <Link
              href="/categorias"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2.5 rounded-xs px-3 py-2.5 font-bold hover:bg-emerald-600/50"
            >
              <RiGridLine className="h-4.5 w-4.5 text-white" />
              <span>Ver todas as categorias</span>
            </Link>
          </div>

          {/* Customer Account Mobile */}
          <div className="pt-3 border-t border-emerald-800/40">
            {customer ? (
              <div className="space-y-2">
                <div className="px-3 py-1.5">
                  <p className="text-xs font-bold text-white">{customer.name}</p>
                  <p className="text-[11px] text-white/80">{customer.email}</p>
                </div>
                <Link
                  href="/perfil"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2.5 rounded-xs px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600/50"
                >
                  <RiUser3Line className="h-4 w-4 text-white" />
                  <span>Meu Perfil</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center space-x-2.5 rounded-xs px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-950/20 cursor-pointer"
                >
                  <RiLogoutBoxRLine className="h-4 w-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("login");
                  }}
                  className="bg-emerald-950 text-white hover:bg-emerald-900 font-bold"
                >
                  Entre
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("register");
                  }}
                  className="bg-white/80 text-emerald-950 hover:bg-white font-bold"
                >
                  Crie a sua conta
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Cart Sheet Drawer Component ─── */}
      <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
    </header>
  );
}
