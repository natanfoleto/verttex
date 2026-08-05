'use client'

import { useQuery } from '@tanstack/react-query'
import { Menu, ShoppingBag, X } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiDiscountPercentLine,
  RiMapPinLine,
  RiSearchLine,
} from 'react-icons/ri'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverDropdown } from '@/components/ui/hover-dropdown'
import { Input } from '@/components/ui/input'

import { apiClient } from '../../lib/api-client'
import { useCustomer } from '../../providers/customer-auth-provider'
import { CartSheet } from '../cart/cart-sheet'
import { MobileMenuDrawer } from './mobile-menu-drawer'

interface PublicCategory {
  id: string
  name: string
  slug: string
  parentId?: string | null
  productsCount: number
}

interface MarketplaceHeaderSettings {
  publicName?: string
  logoUrl?: string | null
  announcementActive?: boolean
  announcementText?: string | null
  announcementLink?: string | null
  announcementDismissible?: boolean
}

interface CartItemSummary {
  quantity: number
}

interface CartStoreSummary {
  items?: CartItemSummary[]
}

interface CartSummaryData {
  stores?: CartStoreSummary[]
}

export function MarketplaceHeader() {
  const { customer, logout, openAuthModal } = useCustomer()
  const searchParams = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [announcementDismissed, setAnnouncementDismissed] = useState(false)

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '')
  }, [searchParams])

  // Fetch marketplace settings
  const { data: settings } = useQuery<MarketplaceHeaderSettings>({
    queryKey: ['public-marketplace-settings'],
    queryFn: async () => {
      const res = await apiClient<
        MarketplaceHeaderSettings | { data: MarketplaceHeaderSettings }
      >('/public/marketplace/settings')
      return 'data' in res ? res.data : res
    },
  })

  // Fetch categories
  const { data: categories } = useQuery<PublicCategory[]>({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const res = await apiClient<PublicCategory[]>(
        '/public/catalog/categories',
      )
      return res
    },
  })

  // Fetch cart summary for item counter
  const { data: cartSummary } = useQuery<CartSummaryData | null>({
    queryKey: ['cart-summary'],
    queryFn: async () => {
      try {
        const res = await apiClient<CartSummaryData>('/customer/cart')
        return res
      } catch {
        return null
      }
    },
    enabled: !!customer,
  })

  const cartTotalItems =
    cartSummary?.stores?.reduce(
      (acc: number, store: CartStoreSummary) =>
        acc +
        (store.items?.reduce(
          (iAcc: number, item: CartItemSummary) => iAcc + item.quantity,
          0,
        ) || 0),
      0,
    ) || 0

  // Group categories into parent & subcategories
  const rootCategories = (categories || []).filter((c) => !c.parentId)
  const subcategoriesMap = new Map<string, PublicCategory[]>()

  ;(categories || []).forEach((cat) => {
    if (cat.parentId) {
      const existing = subcategoriesMap.get(cat.parentId) || []
      existing.push(cat)
      subcategoriesMap.set(cat.parentId, existing)
    }
  })

  const displayCategories =
    rootCategories.length > 0 ? rootCategories : categories || []

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    window.location.href = `/busca?q=${encodeURIComponent(searchQuery)}`
  }

  return (
    <header className="bg-stone-50 w-full font-sans antialiased">
      {/* ─── Global Top Announcement Bar ─── */}
      {settings?.announcementActive &&
        settings?.announcementText &&
        !announcementDismissed && (
          <div className="relative w-full bg-emerald-950 text-emerald-100 py-1.5 px-4 text-xs font-medium">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center">
              {settings.announcementLink ? (
                <Link
                  href={settings.announcementLink}
                  className="hover:underline font-semibold flex items-center gap-1"
                >
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
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        {/* ROW 1: Logo (Col 1-3) | Search Input (Col 4-9) | Promo Banner (Col 10-12) */}
        <div className="grid grid-cols-12 items-center gap-4">
          {/* Logo Alinhada na Coluna 1 a 2 (Reduzido para aproximar a busca) */}
          <div className="col-span-6 4xl:col-span-2 flex items-center">
            <Link
              href="/"
              className="inline-flex items-center space-x-2.5 group"
            >
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings?.publicName || 'Verttex'}
                  className="h-9 max-w-44 object-contain"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-base shadow-xs">
                    {(settings?.publicName || 'Verttex').charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black tracking-tight leading-none">
                      {settings?.publicName || 'Verttex'}
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
            className="hidden 4xl:flex col-span-6 items-center"
          >
            <div className="relative w-full flex items-center bg-white rounded-md shadow-sm overflow-hidden">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos, marcas e muito mais..."
                className="w-full bg-transparent border-none focus-visible:ring-0 px-4 py-2.5 text-sm placeholder:text-stone-500 focus:outline-none"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery('')}
                  className="h-7 w-7 p-0 text-stone-400 hover:text-stone-700 hover:bg-transparent transition-colors cursor-pointer mr-1"
                >
                  <RiCloseLine className="h-4 w-4" />
                </Button>
              )}
              <div className="h-5 w-px bg-stone-200 shrink-0" />
              <Button
                type="submit"
                variant="ghost"
                className="px-3.5 py-2.5 h-auto text-stone-500 hover:text-emerald-600 hover:bg-transparent transition-colors cursor-pointer"
                title="Buscar"
              >
                <RiSearchLine className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Banner Promocional no Topo Direita (Coluna 9 a 12 - 4 colunas) */}
          <div className="hidden 4xl:flex col-span-4 items-center justify-end text-xs font-semibold">
            <Link
              href="/produtos"
              className="inline-flex items-center space-x-2 hover:opacity-90 transition-opacity"
            >
              <RiDiscountPercentLine className="h-5 w-5" />
              <span className="text-xs font-bold tracking-tight">
                Ofertas por tempo limitado
              </span>
            </Link>
          </div>

          {/* Mobile Actions Toggle */}
          <div className="col-span-6 flex items-center justify-end space-x-1 4xl:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsCartOpen(true)}
              className="relative"
              aria-label="Carrinho"
            >
              <ShoppingBag className="size-5 stroke-[1.5px]" />
              {cartTotalItems > 0 && (
                <Badge className="absolute top-0 right-0 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-emerald-600 p-0 text-[10px] font-bold text-white border-none">
                  {cartTotalItems}
                </Badge>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu Mobile"
            >
              {mobileMenuOpen ? (
                <X className="size-5 stroke-[1.5px]" />
              ) : (
                <Menu className="size-5 stroke-[1.5px]" />
              )}
            </Button>
          </div>
        </div>

        {/* ROW 2: 1. CEP (Col 1-2) | 2. Menus Nav & Auth Unificados (Col 3-12) Alinhados na Base do CEP */}
        <div className="hidden 4xl:grid grid-cols-12 items-end gap-4 pt-2.5 pb-0.5">
          {/* 1. Componente de Informe seu CEP (Coluna 1 a 2) */}
          <div className="col-span-2 flex items-end">
            <Button
              type="button"
              variant="ghost"
              className="group inline-flex items-center space-x-1 p-0! h-auto text-left hover:bg-transparent cursor-pointer"
            >
              <RiMapPinLine className="h-5 w-5 shrink-0 group-hover:text-emerald-600 transition-colors" />
              <div className="flex flex-col leading-tight group-hover:text-emerald-600 transition-colors">
                <span className="text-[10px] opacity-80 font-medium">
                  Informe seu
                </span>
                <span className="text-xs font-medium">CEP</span>
              </div>
            </Button>
          </div>

          {/* 2. Container Unificado dos Menus (Coluna 3 a 12) Alinhado na Base do CEP e com itens 100% alinhados entre si */}
          <div className="col-span-10 flex items-center justify-between self-end">
            {/* Menu Principais & Categorias (Esquerda da Coluna 3-12) */}
            <nav className="flex items-center space-x-4 text-xs font-normal">
              {/* Mega Categories Dropdown usando o componente reutilizável HoverDropdown */}
              <HoverDropdown
                align="left"
                arrowOffset="left-6"
                contentClassName="w-64 overflow-visible"
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center gap-0.5 text-xs font-normal hover:opacity-90 transition-opacity cursor-pointer border-none bg-transparent outline-none p-0 focus:outline-none focus:ring-0"
                  >
                    <span>Categorias</span>
                    <RiArrowDownSLine className="h-3.5 w-3.5 opacity-75 shrink-0" />
                  </button>
                }
              >
                {displayCategories && displayCategories.length > 0 ? (
                  <div className="py-1.5">
                    {displayCategories.slice(0, 10).map((cat) => {
                      const subs = subcategoriesMap.get(cat.id) || []
                      const hasChildren = subs.length > 0

                      const categoryItemLink = (
                        <Link
                          href={`/produtos?categorySlug=${cat.slug}`}
                          className="flex items-center justify-between rounded-xs px-3 py-1.5 text-xs font-normal hover:text-emerald-600 transition-colors"
                        >
                          <span className="truncate">{cat.name}</span>
                          {hasChildren && (
                            <RiArrowRightSLine className="h-3.5 w-3.5 text-stone-400 shrink-0 ml-2" />
                          )}
                        </Link>
                      )

                      if (!hasChildren) {
                        return <div key={cat.id}>{categoryItemLink}</div>
                      }

                      return (
                        <HoverDropdown
                          key={cat.id}
                          groupId="sub"
                          position="right"
                          showArrow={false}
                          contentClassName="w-56 p-2 space-y-0.5"
                          trigger={categoryItemLink}
                        >
                          {subs.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/produtos?categorySlug=${sub.slug}`}
                              className="block rounded-xs px-3.5 py-1.5 text-xs font-normal hover:text-emerald-600 transition-colors"
                            >
                              <span className="truncate">{sub.name}</span>
                            </Link>
                          ))}
                        </HoverDropdown>
                      )
                    })}

                    <Link
                      href="/categorias"
                      className="block rounded-xs px-3.5 py-1.5 text-xs font-normal hover:text-emerald-600 transition-colors"
                    >
                      <span className="truncate">Ver mais categorias</span>
                    </Link>
                  </div>
                ) : (
                  <p className="p-3 text-center text-xs text-stone-400">
                    Nenhuma categoria
                  </p>
                )}
              </HoverDropdown>

              <Link
                href="/produtos"
                className="hover:text-emerald-600 transition-opacity"
              >
                Ofertas
              </Link>

              <Link
                href="/produtos"
                className="hover:text-emerald-600 transition-opacity"
              >
                Cupons
              </Link>

              <Link
                href="/lojas"
                className="hover:text-emerald-600 transition-opacity"
              >
                Produtores
              </Link>

              <Link
                href="/lojas"
                className="hover:text-emerald-600 transition-opacity"
              >
                Vender
              </Link>

              <Link
                href="/atendimento"
                className="hover:text-emerald-600 transition-opacity"
              >
                Contato
              </Link>
            </nav>

            {/* Controles de Autenticação / Conta / Carrinho (Direita da Coluna 3-12) */}
            <div className="flex items-center space-x-5 text-xs font-normal">
              {customer ? (
                <HoverDropdown
                  align="right"
                  arrowOffset="right-6"
                  contentClassName="w-72"
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-normal hover:opacity-90 transition-opacity cursor-pointer border-none bg-transparent outline-none p-0 focus:outline-none focus:ring-0"
                    >
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarFallback className="text-[10px] font-bold uppercase bg-emerald-600 text-white">
                          {customer.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex items-center gap-0.5">
                        <span className="max-w-28 truncate">
                          {customer.name.split(' ')[0]}
                        </span>
                        <RiArrowDownSLine className="h-3.5 w-3.5 opacity-75" />
                      </div>
                    </button>
                  }
                >
                  {/* User Info Header — Botão clicável que leva ao Perfil */}
                  <Link
                    href="/perfil"
                    className="flex items-center justify-between p-4 border-b border-stone-100 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <Avatar className="h-11 w-11 shrink-0 shadow-xs">
                        <AvatarFallback className="bg-emerald-600 text-white text-base font-bold uppercase">
                          {customer.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm truncate leading-tight">
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
                      className="flex items-center justify-between rounded-xs px-3.5 py-1 text-xs font-normal hover:text-emerald-600 transition-colors"
                    >
                      Compras
                    </Link>
                    <Link
                      href="/produtos"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal hover:text-emerald-600 transition-colors"
                    >
                      Histórico
                    </Link>
                    <Link
                      href="/atendimento"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal hover:text-emerald-600 transition-colors"
                    >
                      Perguntas
                    </Link>
                    <Link
                      href="/perfil"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal hover:text-emerald-600 transition-colors"
                    >
                      Opiniões
                    </Link>
                  </div>

                  {/* Section 2: Empréstimos, Assinaturas, Faturamento */}
                  <div className="border-b border-stone-100 py-1.5">
                    <Link
                      href="/perfil"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal hover:text-emerald-600 transition-colors"
                    >
                      Empréstimos
                    </Link>
                    <Link
                      href="/perfil"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal hover:text-emerald-600 transition-colors"
                    >
                      Assinaturas
                    </Link>
                    <Link
                      href="/perfil"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal hover:text-emerald-600 transition-colors"
                    >
                      Faturamento
                    </Link>
                  </div>

                  {/* Section 3: Vender, Resumo */}
                  <div className="border-b border-stone-100 py-1.5">
                    <Link
                      href="/lojas"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal hover:text-emerald-600 transition-colors"
                    >
                      Vender
                    </Link>
                    <Link
                      href="/perfil"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal hover:text-emerald-600 transition-colors"
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
                      className="block w-full text-left justify-start px-4 py-1.5 h-auto text-xs font-medium hover:text-rose-600 transition-colors cursor-pointer rounded-none"
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
                    onClick={() => openAuthModal('register')}
                    className="p-0 h-auto text-xs font-normal hover:text-emerald-600 hover:bg-transparent transition-opacity cursor-pointer border-none shadow-none"
                  >
                    Crie a sua conta
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => openAuthModal('login')}
                    className="p-0 h-auto text-xs font-normal hover:text-emerald-600 hover:bg-transparent transition-opacity cursor-pointer border-none shadow-none"
                  >
                    Entre
                  </Button>
                </>
              )}

              {/* Link Compras / Pedidos */}
              <Link
                href={customer ? '/pedidos' : '#'}
                onClick={(e) => {
                  if (!customer) {
                    e.preventDefault()
                    openAuthModal('login')
                  }
                }}
                className="hover:text-emerald-600 transition-opacity cursor-pointer inline-flex items-center"
              >
                Compras
              </Link>

              {/* Menu Favoritos (Hover Dropdown com Fundo Branco - Idêntico ao Modelo) */}
              {customer && (
                <HoverDropdown
                  align="right"
                  arrowOffset="right-6"
                  contentClassName="w-100"
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center gap-0.5 text-xs font-normal hover:opacity-90 transition-opacity cursor-pointer border-none bg-transparent outline-none focus:outline-none focus:ring-0"
                    >
                      <span>Favoritos</span>
                      <RiArrowDownSLine className="h-3.5 w-3.5 opacity-75 shrink-0" />
                    </button>
                  }
                >
                  {/* Header */}
                  <div className="px-4 py-3">
                    <h4 className="font-medium text-stone-900 text-sm tracking-tight">
                      Favoritos
                    </h4>
                  </div>

                  {/* Body */}
                  <div className="border-y py-12 px-6 text-center">
                    <p className="text-xs text-stone-500 font-normal max-w-60 mx-auto">
                      Adicione aqui os produtos que você gostou para poder
                      vê-los mais tarde.
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="py-4 px-4 text-center">
                    <Link
                      href="/perfil"
                      className="text-xs font-normal text-emerald-600 hover:text-emerald-700 transition-colors"
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
                className="relative p-0.5 h-auto w-auto hover:opacity-80 hover:text-emerald-600 cursor-pointer inline-flex items-center justify-center"
                title="Carrinho de Compras"
              >
                <ShoppingBag className="size-4.5 stroke-[1.5px]" />
                {cartTotalItems > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 p-0 text-[9px] font-bold text-white border-none">
                    {cartTotalItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Menu Drawer Component ─── */}
      <MobileMenuDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        customer={customer}
        logout={logout}
        openAuthModal={openAuthModal}
        displayCategories={displayCategories}
      />

      {/* ─── Cart Sheet Drawer Component ─── */}
      <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
    </header>
  )
}
