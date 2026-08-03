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
    <div className="4xl:hidden border-t border-stone-200 bg-white shadow-2xl animate-fadeIn text-stone-900 font-sans">
      {/* Header Top Section (Logado vs Deslogado) */}
      {customer ? (
        <div className="bg-emerald-600 p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 bg-emerald-500">
              <AvatarFallback className="bg-emerald-500 text-white uppercase">
                {customer.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col min-w-0">
              <span className="font-bold text-white text-base truncate leading-tight">
                {customer.name}
              </span>
              <Link
                href="/perfil"
                onClick={onClose}
                className="text-xs text-white/90 font-medium inline-flex items-center gap-0.5 hover:underline mt-0.5"
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
            className="flex items-center justify-between w-full bg-linear-to-r from-pink-600 to-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-full hover:brightness-105 transition-all shadow-xs cursor-pointer"
          >
            <span>verttex+ Assine a partir de R$ 9,90/mês</span>
            <RiArrowRightSLine className="h-4 w-4 shrink-0 ml-1" />
          </Link>
        </div>
      ) : (
        <div className="bg-emerald-600 p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="h-14 w-14 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
              <RiUser3Line className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-white">Bem-vindo</span>
              <span className="text-xs text-white/90 leading-tight mt-0.5">
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
              className="flex-1 bg-white hover:text-emerald-600 hover:bg-stone-50 rounded-sm text-xs font-semibold cursor-pointer"
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
              className="flex-1 bg-white hover:text-emerald-600 hover:bg-stone-50 rounded-sm text-xs font-semibold cursor-pointer"
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
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-emerald-600 bg-stone-100/70"
        >
          <RiHome4Line className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>Início</span>
        </Link>

        {customer && (
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
          >
            <RiNotification3Line className="h-5 w-5 shrink-0 text-stone-600" />
            <span>Avisos</span>
          </Link>
        )}

        {customer && (
          <Link
            href="/pedidos"
            onClick={onClose}
            className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
          >
            <RiShoppingBag3Line className="h-5 w-5 shrink-0 text-stone-600" />
            <span>Compras</span>
          </Link>
        )}

        {customer && (
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
          >
            <RiHeart3Line className="h-5 w-5 shrink-0 text-stone-600" />
            <span>Favoritos</span>
          </Link>
        )}

        <Link
          href="/produtos"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
        >
          <RiDiscountPercentLine className="h-5 w-5 shrink-0 text-stone-600" />
          <span>Ofertas</span>
        </Link>

        <Link
          href="/produtos"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
        >
          <RiCoupon3Line className="h-5 w-5 shrink-0 text-stone-600" />
          <span>Cupons</span>
        </Link>

        <Link
          href="/produtos"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
        >
          <RiHistoryLine className="h-5 w-5 shrink-0 text-stone-600" />
          <span>Histórico</span>
        </Link>

        {customer && (
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
          >
            <RiUser3Line className="h-5 w-5 shrink-0 text-stone-600" />
            <span>Minha conta</span>
          </Link>
        )}

        <Link
          href="/atendimento"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
        >
          <RiCustomerService2Line className="h-5 w-5 shrink-0 text-stone-600" />
          <span>Contato</span>
        </Link>

        {/* Divider */}
        <div className="border-t border-stone-200 my-2" />

        {/* Section 2: Catalog & Stores */}
        <Link
          href="/produtos"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
        >
          <RiShoppingBasket2Line className="h-5 w-5 shrink-0 text-stone-600" />
          <span>Supermercado</span>
        </Link>

        <Link
          href="/lojas"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
        >
          <RiStore2Line className="h-5 w-5 shrink-0 text-stone-600" />
          <span>Produtores Parceiros</span>
        </Link>

        {/* Expandable Categorias */}
        <div>
          <button
            type="button"
            onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
            className="flex w-full items-center justify-between px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors cursor-pointer"
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
            <div className="bg-stone-50/80 py-1.5 px-4 pl-12 space-y-1 border-y border-stone-100">
              {displayCategories && displayCategories.length > 0 ? (
                displayCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/produtos?categorySlug=${cat.slug}`}
                    onClick={onClose}
                    className="block py-2 text-xs font-medium text-stone-700 hover:text-emerald-600 transition-colors"
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
        <div className="border-t border-stone-200 my-2" />

        {/* Section 3: Seller & Account */}
        {customer && (
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
          >
            <RiFileList3Line className="h-5 w-5 shrink-0 text-stone-600" />
            <span>Resumo</span>
          </Link>
        )}

        <Link
          href="/lojas"
          onClick={onClose}
          className="flex items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
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
            className="flex w-full items-center space-x-3.5 px-5 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <RiLogoutBoxRLine className="h-5 w-5 shrink-0 text-rose-500" />
            <span>Sair</span>
          </button>
        )}
      </nav>
    </div>
  )
}
