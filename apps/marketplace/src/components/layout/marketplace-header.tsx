"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiGridLine,
  RiLogoutBoxRLine,
  RiMenuLine,
  RiSearchLine,
  RiStore2Line,
  RiUser3Line,
} from "react-icons/ri";
import { PiBell, PiShoppingCart } from "react-icons/pi";
import { BsHeartHalf } from "react-icons/bs";

import { Button } from "@/components/ui/button";

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

  const { data: settings } = useQuery<any>({
    queryKey: ["public-marketplace-settings"],
    queryFn: async () => {
      const res = await apiClient<any>("/public/marketplace/settings");
      return res?.data || res;
    },
  });

  // Categories query

  const { data: categories } = useQuery<PublicCategory[]>({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const res = await apiClient<PublicCategory[]>("/public/catalog/categories");
      return res;
    },
  });


  // Group categories for header dropdown: root categories and subcategories map
  const rootCategories = (categories || []).filter((c) => !c.parentId);
  const subcategoriesMap = new Map<string, PublicCategory[]>();

  (categories || []).forEach((cat) => {
    if (cat.parentId) {
      const existing = subcategoriesMap.get(cat.parentId) || [];
      existing.push(cat);
      subcategoriesMap.set(cat.parentId, existing);
    }
  });

  const displayCategories =
    rootCategories.length > 0 ? rootCategories : categories || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `/produtos?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <header
      style={{
        backgroundColor: "var(--color-header-bg, #15803d)",
        color: "var(--color-header-text, #ffffff)",
      }}
      className="sticky top-0 z-50 font-sans antialiased shadow-sm"
    >
      {/* Barra de Aviso Global / Comunicado */}
      {settings?.announcementActive && settings?.announcementText && !announcementDismissed && (
        <div
          style={{
            backgroundColor: settings.announcementBgColor || "#1e293b",
            color: settings.announcementTextColor || "#ffffff",
          }}
          className="relative w-full py-2 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 z-50 shadow-xs"
        >
          {settings.announcementLink ? (
            <Link href={settings.announcementLink} className="hover:underline">
              {settings.announcementText}
            </Link>
          ) : (
            <span>{settings.announcementText}</span>
          )}
          {settings.announcementDismissible !== false && (
            <button
              type="button"
              onClick={() => setAnnouncementDismissed(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-80 hover:opacity-100 cursor-pointer"
              aria-label="Fechar anúncio"
            >
              <RiCloseLine className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Main Header Row (2 Main Groups: Left (Logo + Search) & Right (Auth Buttons)) */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Group 1: Logo & Search Input */}
        <div className="flex items-center space-x-6 sm:space-x-10 flex-1 max-w-3xl">
          {/* Brand Logo */}
          <Link href="/" className="group flex shrink-0 items-center space-x-3">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings?.publicName || "Verttex"}
                className="h-10 max-w-44 object-contain"
              />
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/20 text-xl font-bold text-white shadow-xs backdrop-blur-xs">
                  {(settings?.publicName || "Verttex").charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold tracking-tight text-white leading-none">
                    {settings?.publicName || "Verttex"}
                  </span>
                </div>
              </>
            )}
          </Link>

          {/* Global Search Bar — Totalmente quadrado, ícone no final com divisor e fonte maior (text-sm) */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden w-full max-w-lg md:flex"
          >
            <div className="flex w-full items-center bg-white rounded-none overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos, marcas e muito mais..."
                className="w-full flex-1 bg-transparent px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none border-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                >
                  <RiCloseLine className="h-4 w-4" />
                </button>
              )}
              <div className="h-4 w-px bg-stone-300 shrink-0 mx-1" />
              <button
                type="submit"
                className="flex items-center justify-center px-3 py-2 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                title="Buscar"
              >
                <RiSearchLine className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Group 2: User Actions Right */}
        <div className="hidden items-center space-x-3 text-xs font-semibold md:flex">
          {/* User Auth Buttons or Account Dropdown */}
          {customer ? (
            <div className="group relative flex items-center">
              <button
                type="button"
                className="inline-flex items-center space-x-2 py-1 px-1 text-xs font-semibold text-white/90 transition-colors hover:text-white cursor-pointer"
              >
                {/* Avatar Redondo */}
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-white text-xs font-bold uppercase shadow-xs border border-white/30 shrink-0">
                  {customer.name.charAt(0)}
                </div>
                <span className="max-w-28 truncate">{customer.name}</span>
                <RiArrowDownSLine className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" />
              </button>

              {/* Dropdown Menu — Réplica fiel do design Mercado Livre / Mercado Pago */}
              <div className="invisible absolute right-0 top-full z-50 pt-1.5 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="w-72 rounded-none bg-white shadow-xl overflow-hidden text-stone-900 font-sans">
                  {/* User Info Header — Botão clicável que leva ao Perfil */}
                  <Link
                    href="/perfil"
                    className="flex items-center justify-between p-4 border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-white text-base font-bold uppercase shrink-0 shadow-xs">
                        {customer.name.charAt(0)}
                      </div>
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
                  <div className="p-4 border-b border-stone-100">
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
                      href="/perfil"
                      className="block px-4 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                    >
                      Compras
                    </Link>
                    <Link
                      href="/perfil"
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

                  {/* Section 2: Empréstimos, Assinaturas, Mercado Play, Faturamento */}
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
                      className="flex items-center justify-between px-4 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                    >
                      <span>Mercado Play</span>
                      <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase">
                        GRÁTIS
                      </span>
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
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="block w-full text-left px-4 py-1.5 text-xs font-medium text-stone-700 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                size="sm"
                onClick={() => openAuthModal("login")}
                style={{
                  backgroundColor: "var(--color-btn-primary-bg, #16a34a)",
                  color: "var(--color-btn-primary-text, #ffffff)",
                }}
                className="font-semibold hover:opacity-90 transition-opacity border-none cursor-pointer rounded-sm"
              >
                Entrar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => openAuthModal("register")}
                style={{
                  backgroundColor: "var(--color-btn-primary-bg, #16a34a)",
                  color: "var(--color-btn-primary-text, #ffffff)",
                }}
                className="font-semibold hover:opacity-90 transition-opacity border-none cursor-pointer rounded-sm"
              >
                Criar Conta
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="flex items-center space-x-3 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 bg-white/10 text-white border-white/20 hover:bg-white/20 rounded-sm cursor-pointer"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? (
              <RiCloseLine className="h-5 w-5" />
            ) : (
              <RiMenuLine className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Tier 3: Secondary Category & Navigation Sub-Header Bar (Unificada com a cor do Header) */}
      <nav className="hidden text-xs font-semibold text-white py-1 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left Navigation: Categories Dropdown & Lojas e produtores */}
          <div className="flex items-center space-x-2">
            {/* Mega Dropdown: All Categories */}
            <div className="group relative">
              <button
                type="button"
                className="inline-flex items-center space-x-1 py-1 px-1 text-xs font-semibold text-white/90 transition-colors hover:text-white cursor-pointer"
              >
                <span>Categorias</span>
                <RiArrowDownSLine className="h-4 w-4 text-white/70" />
              </button>

              {/* Hover Dropdown Content */}
              <div className="invisible absolute top-full left-0 z-50 pt-1.5 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="w-64 rounded-none bg-white p-2 shadow-xl space-y-1 text-stone-900">
                  {displayCategories && displayCategories.length > 0 ? (
                    <>
                      {displayCategories.slice(0, 10).map((cat) => {
                        const subs = subcategoriesMap.get(cat.id) || [];
                        const hasChildren = subs.length > 0;

                        return (
                          <div key={cat.id} className="group/sub relative">
                            <Link
                              href={`/produtos?categorySlug=${cat.slug}`}
                              className="flex items-center justify-between rounded-none px-3 py-2 text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900 cursor-pointer text-xs font-medium"
                            >
                              <span className="truncate">{cat.name}</span>
                              {hasChildren && (
                                <RiArrowRightSLine className="h-4 w-4 text-stone-400 group-hover/sub:text-stone-700 transition-colors ml-2 shrink-0" />
                              )}
                            </Link>

                            {/* Subcategories Flyout Dropdown to the Right */}
                            {hasChildren && (
                              <div className="invisible absolute left-full top-0 ml-1 z-50 opacity-0 transition-all duration-150 group-hover/sub:visible group-hover/sub:opacity-100">
                                <div className="w-56 rounded-none bg-white p-2 shadow-xl space-y-1 text-stone-900">
                                  {subs.map((sub) => (
                                    <Link
                                      key={sub.id}
                                      href={`/produtos?categorySlug=${sub.slug}`}
                                      className="flex items-center justify-between rounded-none px-3 py-2 text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors text-xs font-medium cursor-pointer"
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
                        className="flex items-center justify-between rounded-none px-3 py-2 text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900 cursor-pointer text-xs font-semibold"
                      >
                        <span className="truncate">Ver mais categorias</span>
                      </Link>
                    </>
                  ) : (
                    <div className="px-3 py-2 text-stone-400 text-xs text-center">
                      Nenhuma categoria
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lojas e produtores Link */}
            <Link
              href="/lojas"
              className="inline-flex items-center py-1 px-1 text-xs font-semibold text-white/90 transition-colors hover:text-white cursor-pointer"
            >
              <span>Lojas e produtores</span>
            </Link>
          </div>

          {/* Right Navigation: Favorites Dropdown, Notifications & Cart Icon */}
          <div className="flex items-center space-x-3">
            {/* Favorites Dropdown */}
            <div className="group relative flex items-center">
              <button
                type="button"
                className="inline-flex items-center space-x-1 py-1 px-1 text-xs font-semibold text-white/90 transition-colors hover:text-white cursor-pointer"
              >
                <span>Favoritos</span>
                <RiArrowDownSLine className="h-4 w-4 text-white/70" />
              </button>

              {/* Hover Dropdown Content */}
              <div className="invisible absolute right-0 top-full z-50 pt-1.5 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="w-80 rounded-none bg-white shadow-xl overflow-hidden text-stone-900">
                  {/* Dropdown Header */}
                  <div className="bg-white px-4 py-3 border-b border-stone-100">
                    <h3 className="font-semibold text-stone-900 text-sm">Favoritos</h3>
                  </div>

                  {/* Dropdown Body */}
                  <div className="bg-stone-50 px-6 py-10 text-center">
                    <p className="text-xs font-normal text-stone-700 leading-relaxed max-w-55 mx-auto">
                      Adicione aqui os produtos que você gostou para poder vê-los mais tarde.
                    </p>
                  </div>

                  {/* Dropdown Footer */}
                  <div className="bg-white px-4 py-3 text-center border-t border-stone-100">
                    <Link
                      href="/produtos"
                      className="text-xs font-medium text-stone-700 hover:text-stone-900 transition-colors"
                    >
                      Ver todos os favoritos e listas
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications & Cart Button Group */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                className="inline-flex items-center justify-center p-1 text-inherit transition-opacity hover:opacity-80 cursor-pointer"
                title="Notificações"
              >
                <PiBell className="size-5" />
              </button>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="inline-flex items-center justify-center p-1 text-inherit transition-opacity hover:opacity-80 cursor-pointer"
                title="Ver Carrinho"
              >
                <PiShoppingCart className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="animate-fadeIn space-y-4 border-t border-stone-200 bg-white p-4 shadow-lg md:hidden">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex w-full items-center bg-white rounded-none overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos, marcas e muito mais..."
                className="w-full flex-1 bg-transparent px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none border-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                >
                  <RiCloseLine className="h-4 w-4" />
                </button>
              )}
              <div className="h-4 w-px bg-stone-300 shrink-0 mx-1" />
              <button
                type="submit"
                className="flex items-center justify-center px-3 py-2 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                title="Buscar"
              >
                <RiSearchLine className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Navigation Links */}
          <div className="space-y-2 text-sm font-semibold">
            <Link
              href="/lojas"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 rounded-lg px-3 py-2.5 text-stone-700 hover:bg-stone-100"
            >
              <RiStore2Line className="h-4 w-4 text-emerald-700" />
              <span>Produtores Parceiros</span>
            </Link>

            <Link
              href="/produtos"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 rounded-lg px-3 py-2.5 text-stone-700 hover:bg-stone-100"
            >
              <BsHeartHalf className="h-4 w-4 text-emerald-700" />
              <span>Todos os Produtos</span>
            </Link>

            <Link
              href="/categorias"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 rounded-lg px-3 py-2.5 text-emerald-800 font-bold hover:bg-emerald-50"
            >
              <RiGridLine className="h-4 w-4 text-emerald-700" />
              <span>Ver todas as categorias</span>
            </Link>

            {customer ? (
              <>
                <Link
                  href="/perfil"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 rounded-lg px-3 py-2.5 text-stone-700 hover:bg-stone-100"
                >
                  <RiUser3Line className="h-4 w-4 text-emerald-700" />
                  <span>Meu Perfil ({customer.name})</span>
                </Link>

                <Button
                  variant="ghost"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full justify-start space-x-2 font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <RiLogoutBoxRLine className="h-4 w-4" />
                  <span>Sair da Conta</span>
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("login");
                  }}
                >
                  Entrar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("register");
                  }}
                >
                  Criar Conta
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Sheet Drawer */}
      <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
    </header>
  );
}
