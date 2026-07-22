'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  RiArrowDownSLine,
  RiCloseLine,
  RiHeartLine,
  RiLockLine,
  RiLogoutBoxRLine,
  RiMenu3Line,
  RiMenuLine,
  RiSearchLine,
  RiStore2Line,
  RiUser3Line,
  RiUserAddLine,
} from 'react-icons/ri'

import { useCustomer } from '../../providers/customer-auth-provider'

export function MarketplaceHeader() {
  const { customer, logout, openAuthModal } = useCustomer()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    window.location.href = `/produtos?q=${encodeURIComponent(searchQuery)}`
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white font-sans text-stone-900 antialiased shadow-2xs">
      {/* Main Header Row (Logo, Search & Auth) */}
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
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

        {/* Global Search Bar (Center) */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden max-w-lg flex-1 md:flex"
        >
          <div className="relative w-full">
            <RiSearchLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar queijos, vinhos, mel, embutidos ou produtores..."
              className="h-10.5 w-full rounded-lg border border-stone-200 bg-stone-50 pr-10 pl-10 text-xs text-stone-900 placeholder-stone-400 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <RiCloseLine className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {/* User Actions Right */}
        <div className="hidden items-center space-x-3 text-xs font-semibold md:flex">
          {/* Wishlist Link */}
          <Link
            href="/produtos"
            className="h-10.5 inline-flex items-center space-x-1.5 rounded-lg border border-stone-200/80 bg-white px-3.5 text-stone-700 transition-colors hover:border-emerald-300 hover:text-emerald-800"
            title="Favoritos"
          >
            <RiHeartLine className="h-4 w-4 text-rose-600" />
            <span>Favoritos</span>
          </Link>

          {/* User Auth Buttons or Account Dropdown */}
          {customer ? (
            <div className="flex items-center space-x-2">
              <Link
                href="/perfil"
                className="h-10.5 inline-flex items-center space-x-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 text-emerald-900 transition-colors hover:bg-emerald-100"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-800 text-[10px] font-bold text-white uppercase">
                  {customer.name.charAt(0)}
                </div>
                <span className="max-w-28 truncate">{customer.name}</span>
              </Link>

              <button
                onClick={() => logout()}
                className="h-10.5 w-10.5 inline-flex cursor-pointer items-center justify-center rounded-lg border border-stone-200 p-0 text-stone-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                title="Sair da conta"
              >
                <RiLogoutBoxRLine className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="h-10.5 inline-flex cursor-pointer items-center space-x-1 rounded-lg border border-stone-200 bg-white px-4 font-semibold text-stone-700 transition-colors hover:bg-stone-50"
              >
                <RiLockLine className="h-3.5 w-3.5 text-emerald-700" />
                <span>Entrar</span>
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="h-10.5 inline-flex cursor-pointer items-center space-x-1 rounded-lg bg-emerald-800 px-4 font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700"
              >
                <RiUserAddLine className="h-3.5 w-3.5" />
                <span>Criar Conta</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="flex items-center space-x-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="cursor-pointer rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-stone-700 transition-colors hover:bg-stone-100"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? (
              <RiCloseLine className="h-5 w-5" />
            ) : (
              <RiMenuLine className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Tier 3: Secondary Category & Navigation Sub-Header Bar */}
      <nav className="hidden bg-stone-50/90 text-xs font-semibold text-stone-800 pb-2.5 pt-1 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1">
            {/* Mega Dropdown: All Categories */}
            <div className="group relative">
              <button
                type="button"
                className="flex cursor-pointer items-center space-x-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-white transition-colors hover:bg-emerald-700"
              >
                <RiMenu3Line className="h-4 w-4" />
                <span>Todas as Categorias</span>
                <RiArrowDownSLine className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>

              {/* Hover Dropdown Content */}
              <div className="invisible absolute top-full left-0 z-50 pt-1.5 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="w-64 rounded-lg border border-stone-200 bg-white p-2 shadow-xl">
                  <Link
                    href="/categorias/queijos-artesanais"
                    className="flex items-center justify-between rounded-md px-3 py-2 text-stone-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    <span>🧀 Queijos Artesanais</span>
                    <span className="text-[10px] text-stone-400">14 itens</span>
                  </Link>
                  <Link
                    href="/categorias/vinhos-bebidas"
                    className="flex items-center justify-between rounded-md px-3 py-2 text-stone-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    <span>🍷 Vinhos & Bebidas</span>
                    <span className="text-[10px] text-stone-400">22 itens</span>
                  </Link>
                  <Link
                    href="/categorias/doces-geleias"
                    className="flex items-center justify-between rounded-md px-3 py-2 text-stone-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    <span>🍯 Doces & Geleias</span>
                    <span className="text-[10px] text-stone-400">18 itens</span>
                  </Link>
                  <Link
                    href="/categorias/meis-polens"
                    className="flex items-center justify-between rounded-md px-3 py-2 text-stone-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    <span>🐝 Méis & Polens</span>
                    <span className="text-[10px] text-stone-400">9 itens</span>
                  </Link>
                  <Link
                    href="/categorias/embutidos-defumados"
                    className="flex items-center justify-between rounded-md px-3 py-2 text-stone-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    <span>🥓 Embutidos Defumados</span>
                    <span className="text-[10px] text-stone-400">12 itens</span>
                  </Link>
                  <Link
                    href="/categorias/cafes-especiais"
                    className="flex items-center justify-between rounded-md px-3 py-2 text-stone-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    <span>☕ Cafés Especiais</span>
                    <span className="text-[10px] text-stone-400">8 itens</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Direct Category 1: Queijos Submenu */}
            <div className="group relative">
              <Link
                href="/categorias/queijos-artesanais"
                className="flex items-center space-x-1 rounded-lg px-3 py-2.5 text-stone-700 transition-colors hover:bg-stone-200/60 hover:text-stone-900"
              >
                <span>Queijos Artesanais</span>
                <RiArrowDownSLine className="h-3.5 w-3.5 text-stone-400 transition-transform group-hover:rotate-180" />
              </Link>
              <div className="invisible absolute top-full left-0 z-50 pt-1.5 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="w-52 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
                  <Link
                    href="/produtos?q=meia+cura"
                    className="block rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100 hover:text-emerald-900"
                  >
                    Queijo Meia Cura Colonial
                  </Link>
                  <Link
                    href="/produtos?q=parmesao"
                    className="block rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100 hover:text-emerald-900"
                  >
                    Parmesão Maturado 12m
                  </Link>
                  <Link
                    href="/produtos?q=manteiga"
                    className="block rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100 hover:text-emerald-900"
                  >
                    Manteiga de Leite Cru
                  </Link>
                </div>
              </div>
            </div>

            {/* Direct Category 2: Vinhos Submenu */}
            <div className="group relative">
              <Link
                href="/categorias/vinhos-bebidas"
                className="flex items-center space-x-1 rounded-lg px-3 py-2.5 text-stone-700 transition-colors hover:bg-stone-200/60 hover:text-stone-900"
              >
                <span>Vinhos & Bebidas</span>
                <RiArrowDownSLine className="h-3.5 w-3.5 text-stone-400 transition-transform group-hover:rotate-180" />
              </Link>
              <div className="invisible absolute top-full left-0 z-50 pt-1.5 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="w-52 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
                  <Link
                    href="/produtos?q=merlot"
                    className="block rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100 hover:text-emerald-900"
                  >
                    Vinhos Coloniais Merlot
                  </Link>
                  <Link
                    href="/produtos?q=espumante"
                    className="block rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100 hover:text-emerald-900"
                  >
                    Espumantes da Serra
                  </Link>
                  <Link
                    href="/produtos?q=suco"
                    className="block rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100 hover:text-emerald-900"
                  >
                    Sucos 100% Integrais
                  </Link>
                </div>
              </div>
            </div>

            {/* Direct Link 3: Produtores & Lojas Submenu */}
            <div className="group relative">
              <Link
                href="/lojas"
                className="flex items-center space-x-1 rounded-lg px-3 py-2.5 text-stone-700 transition-colors hover:bg-stone-200/60 hover:text-stone-900"
              >
                <RiStore2Line className="h-3.5 w-3.5 text-emerald-700" />
                <span>Produtores & Lojas</span>
                <RiArrowDownSLine className="h-3.5 w-3.5 text-stone-400 transition-transform group-hover:rotate-180" />
              </Link>
              <div className="invisible absolute top-full left-0 z-50 pt-1.5 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="w-56 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
                  <Link
                    href="/lojas"
                    className="block rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100 hover:text-emerald-900"
                  >
                    Todos os Produtores
                  </Link>
                  <Link
                    href="/lojas?regiao=serra-gaucha"
                    className="block rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100 hover:text-emerald-900"
                  >
                    Produtores da Serra Gaúcha
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="animate-fadeIn space-y-4 border-t border-stone-200 bg-white p-4 shadow-lg md:hidden">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <RiSearchLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar produtos ou produtores..."
              className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pr-4 pl-10 text-xs text-stone-900 focus:border-emerald-600 focus:outline-none"
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
              <RiHeartLine className="h-4 w-4 text-emerald-700" />
              <span>Todos os Produtos</span>
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

                <button
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                  className="flex w-full cursor-pointer items-center space-x-2 rounded-lg px-3 py-2.5 font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <RiLogoutBoxRLine className="h-4 w-4" />
                  <span>Sair da Conta</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    openAuthModal('login')
                  }}
                  className="flex cursor-pointer items-center justify-center rounded-lg border border-stone-200 bg-white py-2.5 text-xs font-semibold text-stone-700"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    openAuthModal('register')
                  }}
                  className="flex cursor-pointer items-center justify-center rounded-lg bg-emerald-800 py-2.5 text-xs font-semibold text-white shadow-xs"
                >
                  Criar Conta
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
