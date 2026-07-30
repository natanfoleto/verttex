"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiGridLine,
  RiLockLine,
  RiLogoutBoxRLine,
  RiMenu3Line,
  RiMenuLine,
  RiSearchLine,
  RiStore2Line,
  RiUser3Line,
  RiUserAddLine,
} from "react-icons/ri";
import { PiBell, PiShoppingCart } from "react-icons/pi";
import { BsHeartHalf } from "react-icons/bs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { CartSheet, CartSummary } from "../cart/cart-sheet";
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

  const { data: cartSummary } = useQuery<CartSummary>({
    queryKey: ["cart-summary"],
    queryFn: async () => {
      const res = await apiClient<CartSummary>("/cart");
      return res;
    },
  });

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
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white font-sans text-stone-900 antialiased shadow-2xs">
      {/* Main Header Row (2 Main Groups: Left (Logo + Search) & Right (Auth Buttons)) */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Group 1: Logo & Search Input */}
        <div className="flex items-center space-x-4 sm:space-x-6 flex-1 max-w-3xl">
          {/* Brand Logo */}
          <Link href="/" className="group flex shrink-0 items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-800 text-xl font-bold text-white shadow-xs">
              V
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-stone-900 transition-colors group-hover:text-emerald-800">
                Verttex
              </span>
              <span className="-mt-1 text-[10px] font-semibold tracking-widest text-amber-700 uppercase">
                Mercado Regional
              </span>
            </div>
          </Link>

          {/* Global Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden w-full max-w-lg md:flex"
          >
            <div className="relative w-full">
              <RiSearchLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos, marcas e muito mais..."
                className="h-9 pr-10 pl-10 text-xs"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-3 h-6 w-6 -translate-y-1/2 p-0 text-stone-400 hover:text-stone-600"
                >
                  <RiCloseLine className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Group 2: User Actions Right */}
        <div className="hidden items-center space-x-3 text-xs font-semibold md:flex">
          {/* User Auth Buttons or Account Dropdown */}
          {customer ? (
            <div className="flex items-center space-x-2">
              <Link
                href="/perfil"
                className="h-9 inline-flex items-center space-x-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 text-emerald-900 transition-colors hover:bg-emerald-100"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-800 text-[10px] font-bold text-white uppercase">
                  {customer.name.charAt(0)}
                </div>
                <span className="max-w-28 truncate">{customer.name}</span>
              </Link>

              <Button
                variant="outline"
                size="icon"
                onClick={() => logout()}
                className="h-9 w-9 p-0 text-stone-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                title="Sair da conta"
              >
                <RiLogoutBoxRLine className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => openAuthModal("login")}
                className="h-9 px-3.5"
              >
                <RiLockLine className="h-3.5 w-3.5 text-emerald-700" />
                <span>Entrar</span>
              </Button>
              <Button
                type="button"
                onClick={() => openAuthModal("register")}
                className="h-9 px-3.5"
              >
                <RiUserAddLine className="h-3.5 w-3.5" />
                <span>Criar Conta</span>
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
            className="p-2.5"
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

      {/* Tier 3: Secondary Category & Navigation Sub-Header Bar */}
      <nav className="hidden bg-stone-50/90 text-xs font-semibold text-stone-800 pb-2.5 pt-1 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left Navigation: Categories Dropdown & Lojas e produtores */}
          <div className="flex items-center space-x-2">
            {/* Mega Dropdown: All Categories */}
            <div className="group relative">
              <Button type="button" className="py-2.5">
                <RiMenu3Line className="h-4 w-4" />
                <span>Todas as Categorias</span>
                <RiArrowDownSLine className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </Button>

              {/* Hover Dropdown Content */}
              <div className="invisible absolute top-full left-0 z-50 pt-1.5 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="w-64 rounded-lg border border-stone-200 bg-white p-2 shadow-xl space-y-1">
                  {displayCategories && displayCategories.length > 0 ? (
                    <>
                      {displayCategories.slice(0, 10).map((cat) => {
                        const subs = subcategoriesMap.get(cat.id) || [];
                        const hasChildren = subs.length > 0;

                        return (
                          <div key={cat.id} className="group/sub relative">
                            <Link
                              href={`/produtos?categorySlug=${cat.slug}`}
                              className="flex items-center justify-between rounded-md px-3 py-2 text-stone-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer text-xs"
                            >
                              <span className="truncate">{cat.name}</span>
                              {hasChildren && (
                                <RiArrowRightSLine className="h-4 w-4 text-stone-400 group-hover/sub:text-emerald-800 transition-colors ml-2 shrink-0" />
                              )}
                            </Link>

                            {/* Subcategories Flyout Dropdown to the Right */}
                            {hasChildren && (
                              <div className="invisible absolute left-full top-0 ml-1 z-50 opacity-0 transition-all duration-150 group-hover/sub:visible group-hover/sub:opacity-100">
                                <div className="w-56 rounded-lg border border-stone-200 bg-white p-2 shadow-xl space-y-1">
                                  {subs.map((sub) => (
                                    <Link
                                      key={sub.id}
                                      href={`/produtos?categorySlug=${sub.slug}`}
                                      className="flex items-center justify-between rounded-md px-3 py-2 text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors text-xs cursor-pointer"
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
                        className="flex items-center justify-between rounded-md px-3 py-2 text-stone-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer text-xs font-semibold"
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

            {/* Lojas e produtores Link (No Icon) */}
            <Link
              href="/lojas"
              className="flex items-center rounded-lg px-3 py-2.5 text-stone-700 transition-colors hover:bg-stone-200/60 hover:text-stone-900 cursor-pointer"
            >
              <span>Lojas e produtores</span>
            </Link>
          </div>

          {/* Right Navigation: Favorites Dropdown, Notifications & Cart Icon */}
          <div className="flex items-center space-x-0.5">
            {/* Favorites Dropdown */}
            <div className="group relative flex items-center">
              <button
                type="button"
                className="flex h-8 items-center space-x-1 px-1.5 text-xs font-semibold text-stone-700 transition-colors hover:text-stone-900 cursor-pointer"
              >
                <span>Favoritos</span>
                <RiArrowDownSLine className="h-4 w-4 text-stone-500" />
              </button>

              {/* Hover Dropdown Content (Mercado Livre Style) */}
              <div className="invisible absolute right-0 top-full z-50 pt-1.5 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="w-80 rounded-lg border border-stone-200 bg-white shadow-xl overflow-hidden">
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
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      Ver todos os favoritos e listas
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications Button */}
            <button
              type="button"
              className="relative flex size-8 items-center justify-center rounded-lg text-stone-600 transition-colors hover:text-emerald-800 cursor-pointer"
              title="Notificações"
            >
              <PiBell className="size-4.5" />
            </button>

            {/* Cart Button (Icon Only with Badge) */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex size-8 items-center justify-center rounded-lg text-stone-600 transition-colors hover:text-emerald-800 cursor-pointer"
              title="Ver Carrinho"
            >
              <PiShoppingCart className="size-4.5" />
              {cartSummary && cartSummary.itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-800 px-1 text-[9px] font-bold text-white">
                  {cartSummary.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="animate-fadeIn space-y-4 border-t border-stone-200 bg-white p-4 shadow-lg md:hidden">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <RiSearchLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar produtos ou produtores..."
              className="pl-10 text-xs"
            />
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
