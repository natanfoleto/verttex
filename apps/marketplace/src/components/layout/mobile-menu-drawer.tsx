'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCoupon3Line,
  RiCustomerService2Line,
  RiDiscountPercentLine,
  RiFileList3Line,
  RiGridLine,
  RiHeart3Line,
  RiHistoryLine,
  RiHome4Line,
  RiLogoutBoxRLine,
  RiNotification3Line,
  RiPriceTag3Line,
  RiShoppingBag3Line,
  RiShoppingBasket2Line,
  RiStore2Line,
  RiUser3Line,
} from 'react-icons/ri'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PublicCategory {
  id: string
  name: string
  slug: string
  parentId?: string | null
  productsCount: number
}

interface MobileCustomer {
  name: string
  email: string
}

interface MobileMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  customer: MobileCustomer | null
  logout: () => void
  openAuthModal: (mode: 'login' | 'register') => void
  displayCategories: PublicCategory[]
}

export function MobileMenuDrawer({
  isOpen,
  onClose,
  customer,
  logout,
  openAuthModal,
  displayCategories,
}: MobileMenuDrawerProps) {
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false)

  if (!isOpen) return null

  return (
    <div className="4xl:hidden animate-fadeIn border-t border-stone-200 bg-white font-sans text-stone-900 shadow-2xl">
      {/* Header Top Section (Logado vs Deslogado) */}
      {customer ? (
        <div className="space-y-3 bg-emerald-600 p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 bg-emerald-500">
              <AvatarFallback className="bg-emerald-500 text-white uppercase">
                {customer.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base leading-tight font-bold text-white">
                {customer.name}
              </span>
              <Link
                href="/perfil"
                onClick={onClose}
                className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-medium text-white/90 hover:underline"
              >
                <span>Meu perfil</span>
                <RiArrowRightSLine className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Promo Banner Verttex+ */}
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex w-full cursor-pointer items-center justify-between rounded-full bg-linear-to-r from-pink-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:brightness-105"
          >
            <span>verttex+ Assine a partir de R$ 9,90/mês</span>
            <RiArrowRightSLine className="ml-1 h-4 w-4 shrink-0" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3 bg-emerald-600 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
              <RiUser3Line className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white">Bem-vindo</span>
              <span className="mt-0.5 text-xs leading-tight text-white/90">
                Entra na sua conta para ver suas compras, favoritos etc.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              onClick={() => {
                onClose()
                openAuthModal('login')
              }}
              className="flex-1 cursor-pointer rounded-sm bg-white text-xs font-semibold hover:bg-stone-50 hover:text-emerald-600"
            >
              Entre
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose()
                openAuthModal('register')
              }}
              className="flex-1 cursor-pointer rounded-sm bg-white text-xs font-semibold hover:bg-stone-50 hover:text-emerald-600"
            >
              Crie a sua conta
            </Button>
          </div>
        </div>
      )}

      {/* Section 1: Core Navigation Items */}
      <nav className="py-2.5">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center space-x-3.5 bg-stone-100/70 px-5 py-3 text-sm font-semibold text-emerald-600"
        >
          <RiHome4Line className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>Início</span>
        </Link>

        {customer && (
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
          >
            <RiNotification3Line className="h-5 w-5 shrink-0 text-stone-600" />
            <span>Avisos</span>
          </Link>
        )}

        {customer && (
          <Link
            href="/pedidos"
            onClick={onClose}
            className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
          >
            <RiShoppingBag3Line className="h-5 w-5 shrink-0 text-stone-600" />
            <span>Compras</span>
          </Link>
        )}

        {customer && (
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
          >
            <RiHeart3Line className="h-5 w-5 shrink-0 text-stone-600" />
            <span>Favoritos</span>
          </Link>
        )}

        <Link
          href="/ofertas"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
        >
          <RiDiscountPercentLine className="h-5 w-5 shrink-0 text-stone-600" />
          <span>Ofertas</span>
        </Link>

        <Link
          href="/produtos"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
        >
          <RiCoupon3Line className="h-5 w-5 shrink-0 text-stone-600" />
          <span>Cupons</span>
        </Link>

        <Link
          href="/produtos"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
        >
          <RiHistoryLine className="h-5 w-5 shrink-0 text-stone-600" />
          <span>Histórico</span>
        </Link>

        {customer && (
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
          >
            <RiUser3Line className="h-5 w-5 shrink-0 text-stone-600" />
            <span>Minha conta</span>
          </Link>
        )}

        <Link
          href="/atendimento"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
        >
          <RiCustomerService2Line className="h-5 w-5 shrink-0 text-stone-600" />
          <span>Contato</span>
        </Link>

        {/* Divider */}
        <div className="my-2 border-t border-stone-200" />

        {/* Section 2: Catalog & Stores */}
        <Link
          href="/produtos"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
        >
          <RiShoppingBasket2Line className="h-5 w-5 shrink-0 text-stone-600" />
          <span>Supermercado</span>
        </Link>

        <Link
          href="/lojas"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
        >
          <RiStore2Line className="h-5 w-5 shrink-0 text-stone-600" />
          <span>Produtores Parceiros</span>
        </Link>

        {/* Expandable Categorias */}
        <div>
          <button
            type="button"
            onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
            className="flex w-full cursor-pointer items-center justify-between px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
          >
            <div className="flex items-center space-x-3.5">
              <RiGridLine className="h-5 w-5 shrink-0 text-stone-600" />
              <span>Categorias</span>
            </div>
            <RiArrowDownSLine
              className={cn(
                'h-5 w-5 text-stone-500 transition-transform duration-200',
                isMobileCategoriesOpen && 'rotate-180',
              )}
            />
          </button>

          {isMobileCategoriesOpen && (
            <div className="space-y-1 border-y border-stone-100 bg-stone-50/80 px-4 py-1.5 pl-12">
              {displayCategories && displayCategories.length > 0 ? (
                displayCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/produtos?categorySlug=${cat.slug}`}
                    onClick={onClose}
                    className="block py-2 text-xs font-medium text-stone-700 transition-colors hover:text-emerald-600"
                  >
                    {cat.name}
                  </Link>
                ))
              ) : (
                <p className="py-2 text-xs text-stone-400">Nenhuma categoria</p>
              )}
              <Link
                href="/categorias"
                onClick={onClose}
                className="block py-2 text-xs hover:underline"
              >
                Ver todas as categorias
              </Link>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-2 border-t border-stone-200" />

        {/* Section 3: Seller & Account */}
        {customer && (
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
          >
            <RiFileList3Line className="h-5 w-5 shrink-0 text-stone-600" />
            <span>Resumo</span>
          </Link>
        )}

        <Link
          href="/lojas"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
        >
          <RiPriceTag3Line className="h-5 w-5 shrink-0 text-stone-600" />
          <span>Vender</span>
        </Link>

        {customer && (
          <button
            type="button"
            onClick={() => {
              logout()
              onClose()
            }}
            className="flex w-full cursor-pointer items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
          >
            <RiLogoutBoxRLine className="h-5 w-5 shrink-0 text-rose-500" />
            <span>Sair</span>
          </button>
        )}
      </nav>
    </div>
  )
}
