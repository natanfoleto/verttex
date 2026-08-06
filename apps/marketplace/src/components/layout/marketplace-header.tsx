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
    <header className="w-full bg-stone-50 font-sans antialiased">
      {/* ─── Global Top Announcement Bar ─── */}
      {settings?.announcementActive &&
        settings?.announcementText &&
        !announcementDismissed && (
          <div className="relative w-full bg-emerald-950 px-4 py-1.5 text-xs font-medium text-emerald-100">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center">
              {settings.announcementLink ? (
                <Link
                  href={settings.announcementLink}
                  className="flex items-center gap-1 font-semibold hover:underline"
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
                  className="absolute top-1/2 right-4 h-6 w-6 -translate-y-1/2 cursor-pointer p-0 text-emerald-300 transition-colors hover:bg-transparent hover:text-white"
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
          <div className="4xl:col-span-2 col-span-6 flex items-center">
            <Link
              href="/"
              className="group inline-flex items-center space-x-2.5"
            >
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings?.publicName || 'Verttex'}
                  className="h-9 max-w-44 object-contain"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-base font-black text-white shadow-xs">
                    {(settings?.publicName || 'Verttex').charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg leading-none font-black tracking-tight">
                      {settings?.publicName || 'Verttex'}
                    </span>
                    <span className="mt-0.5 text-[9px] font-bold tracking-widest uppercase">
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
            className="4xl:flex col-span-6 hidden items-center"
          >
            <div className="relative flex w-full items-center overflow-hidden rounded-md bg-white shadow-sm">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos, marcas e muito mais..."
                className="w-full border-none bg-transparent px-4 py-2.5 text-sm placeholder:text-stone-500 focus:outline-none focus-visible:ring-0"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery('')}
                  className="mr-1 h-7 w-7 cursor-pointer p-0 text-stone-400 transition-colors hover:bg-transparent hover:text-stone-700"
                >
                  <RiCloseLine className="h-4 w-4" />
                </Button>
              )}
              <div className="h-5 w-px shrink-0 bg-stone-200" />
              <Button
                type="submit"
                variant="ghost"
                className="h-auto cursor-pointer px-3.5 py-2.5 text-stone-500 transition-colors hover:bg-transparent hover:text-emerald-600"
                title="Buscar"
              >
                <RiSearchLine className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Banner Promocional no Topo Direita (Coluna 9 a 12 - 4 colunas) */}
          <div className="4xl:flex col-span-4 hidden items-center justify-end text-xs font-semibold">
            <Link
              href="/produtos"
              className="inline-flex items-center space-x-2 transition-opacity hover:opacity-90"
            >
              <RiDiscountPercentLine className="h-5 w-5" />
              <span className="text-xs font-bold tracking-tight">
                Ofertas por tempo limitado
              </span>
            </Link>
          </div>

          {/* Mobile Actions Toggle */}
          <div className="4xl:hidden col-span-6 flex items-center justify-end space-x-1">
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
                <Badge className="absolute top-0 right-0 flex h-4.5 min-w-4.5 items-center justify-center rounded-full border-none bg-emerald-600 p-0 text-[10px] font-bold text-white">
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
        <div className="4xl:grid hidden grid-cols-12 items-end gap-4 pt-2.5 pb-0.5">
          {/* 1. Componente de Informe seu CEP (Coluna 1 a 2) */}
          <div className="col-span-2 flex items-end">
            <Button
              type="button"
              variant="ghost"
              className="group inline-flex h-auto cursor-pointer items-center space-x-1 p-0! text-left hover:bg-transparent"
            >
              <RiMapPinLine className="h-5 w-5 shrink-0 transition-colors group-hover:text-emerald-600" />
              <div className="flex flex-col leading-tight transition-colors group-hover:text-emerald-600">
                <span className="text-[10px] font-medium opacity-80">
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
                    className="inline-flex cursor-pointer items-center gap-0.5 border-none bg-transparent p-0 text-xs font-normal transition-opacity outline-none hover:opacity-90 focus:ring-0 focus:outline-none"
                  >
                    <span>Categorias</span>
                    <RiArrowDownSLine className="h-3.5 w-3.5 shrink-0 opacity-75" />
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
                          className="flex items-center justify-between rounded-xs px-3 py-1.5 text-xs font-normal transition-colors hover:text-emerald-600"
                        >
                          <span className="truncate">{cat.name}</span>
                          {hasChildren && (
                            <RiArrowRightSLine className="ml-2 h-3.5 w-3.5 shrink-0 text-stone-400" />
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
                              className="block rounded-xs px-3.5 py-1.5 text-xs font-normal transition-colors hover:text-emerald-600"
                            >
                              <span className="truncate">{sub.name}</span>
                            </Link>
                          ))}
                        </HoverDropdown>
                      )
                    })}

                    <Link
                      href="/categorias"
                      className="block rounded-xs px-3.5 py-1.5 text-xs font-normal transition-colors hover:text-emerald-600"
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
                className="transition-opacity hover:text-emerald-600"
              >
                Ofertas
              </Link>

              <Link
                href="/produtos"
                className="transition-opacity hover:text-emerald-600"
              >
                Cupons
              </Link>

              <Link
                href="/lojas"
                className="transition-opacity hover:text-emerald-600"
              >
                Produtores
              </Link>

              <Link
                href="/lojas"
                className="transition-opacity hover:text-emerald-600"
              >
                Vender
              </Link>

              <Link
                href="/atendimento"
                className="transition-opacity hover:text-emerald-600"
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
                      className="inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-xs font-normal transition-opacity outline-none hover:opacity-90 focus:ring-0 focus:outline-none"
                    >
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarFallback className="bg-emerald-600 text-[10px] font-bold text-white uppercase">
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
                    className="flex cursor-pointer items-center justify-between border-b border-stone-100 p-4 transition-colors hover:bg-stone-100"
                  >
                    <div className="flex min-w-0 items-center space-x-3">
                      <Avatar className="h-11 w-11 shrink-0 shadow-xs">
                        <AvatarFallback className="bg-emerald-600 text-base font-bold text-white uppercase">
                          {customer.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm leading-tight font-bold">
                          {customer.name}
                        </span>
                        <span className="mt-0.5 truncate text-[11px] text-stone-500">
                          {customer.email}
                        </span>
                      </div>
                    </div>
                    <RiArrowRightSLine className="ml-2 h-5 w-5 shrink-0 text-stone-400" />
                  </Link>

                  {/* Promo Banner Meli+ / Verttex+ */}
                  <div className="border-b border-stone-100 p-3">
                    <Link
                      href="/perfil"
                      className="flex w-full cursor-pointer items-center justify-between rounded-full bg-linear-to-r from-pink-600 to-rose-600 px-3.5 py-2.5 text-[11px] font-bold text-white shadow-xs transition-all hover:brightness-105"
                    >
                      <span>meli+ Assine a partir de R$ 9,90/mês</span>
                      <RiArrowRightSLine className="ml-1 h-4 w-4 shrink-0" />
                    </Link>
                  </div>

                  {/* Section 1: Compras, Histórico, Perguntas, Opiniões */}
                  <div className="border-b border-stone-100 py-1.5">
                    <Link
                      href="/pedidos"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1 text-xs font-normal transition-colors hover:text-emerald-600"
                    >
                      Compras
                    </Link>
                    <Link
                      href="/produtos"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal transition-colors hover:text-emerald-600"
                    >
                      Histórico
                    </Link>
                    <Link
                      href="/atendimento"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal transition-colors hover:text-emerald-600"
                    >
                      Perguntas
                    </Link>
                    <Link
                      href="/perfil"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal transition-colors hover:text-emerald-600"
                    >
                      Opiniões
                    </Link>
                  </div>

                  {/* Section 2: Empréstimos, Assinaturas, Faturamento */}
                  <div className="border-b border-stone-100 py-1.5">
                    <Link
                      href="/perfil"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal transition-colors hover:text-emerald-600"
                    >
                      Empréstimos
                    </Link>
                    <Link
                      href="/perfil"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal transition-colors hover:text-emerald-600"
                    >
                      Assinaturas
                    </Link>
                    <Link
                      href="/perfil"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal transition-colors hover:text-emerald-600"
                    >
                      Faturamento
                    </Link>
                  </div>

                  {/* Section 3: Vender, Resumo */}
                  <div className="border-b border-stone-100 py-1.5">
                    <Link
                      href="/lojas"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal transition-colors hover:text-emerald-600"
                    >
                      Vender
                    </Link>
                    <Link
                      href="/perfil"
                      className="flex items-center justify-between rounded-xs px-3.5 py-1.5 text-xs font-normal transition-colors hover:text-emerald-600"
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
                      className="block h-auto w-full cursor-pointer justify-start rounded-none px-4 py-1.5 text-left text-xs font-medium transition-colors hover:text-rose-600"
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
                    className="h-auto cursor-pointer border-none p-0 text-xs font-normal shadow-none transition-opacity hover:bg-transparent hover:text-emerald-600"
                  >
                    Crie a sua conta
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => openAuthModal('login')}
                    className="h-auto cursor-pointer border-none p-0 text-xs font-normal shadow-none transition-opacity hover:bg-transparent hover:text-emerald-600"
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
                className="inline-flex cursor-pointer items-center transition-opacity hover:text-emerald-600"
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
                      className="inline-flex cursor-pointer items-center gap-0.5 border-none bg-transparent text-xs font-normal transition-opacity outline-none hover:opacity-90 focus:ring-0 focus:outline-none"
                    >
                      <span>Favoritos</span>
                      <RiArrowDownSLine className="h-3.5 w-3.5 shrink-0 opacity-75" />
                    </button>
                  }
                >
                  {/* Header */}
                  <div className="px-4 py-3">
                    <h4 className="text-sm font-medium tracking-tight text-stone-900">
                      Favoritos
                    </h4>
                  </div>

                  {/* Body */}
                  <div className="border-y px-6 py-12 text-center">
                    <p className="mx-auto max-w-60 text-xs font-normal text-stone-500">
                      Adicione aqui os produtos que você gostou para poder
                      vê-los mais tarde.
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-4 text-center">
                    <Link
                      href="/perfil"
                      className="text-xs font-normal text-emerald-600 transition-colors hover:text-emerald-700"
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
                className="relative inline-flex h-auto w-auto cursor-pointer items-center justify-center p-0.5 hover:text-emerald-600 hover:opacity-80"
                title="Carrinho de Compras"
              >
                <ShoppingBag className="size-4.5 stroke-[1.5px]" />
                {cartTotalItems > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-none bg-emerald-600 p-0 px-1 text-[9px] font-bold text-white">
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
