'use client'

import Link from 'next/link'
import {
  RiLockLine,
  RiLogoutBoxRLine,
  RiSearchLine,
  RiStore2Line,
  RiUser3Line,
  RiUserAddLine,
} from 'react-icons/ri'

import { useCustomer } from '../../providers/customer-auth-provider'

export function MarketplaceHeader() {
  const { customer, logout } = useCustomer()

  return (
    <header className="sticky top-0 z-50 border-b border-amber-900/40 bg-amber-950/95 text-amber-50 backdrop-blur">
      {/* Top Utility Bar */}
      <div className="border-b border-amber-800/30 bg-amber-900/30 px-4 py-1.5 text-center text-[11px] font-medium text-amber-200/80">
        Conectando você aos melhores produtores artesanais da nossa região 🌾
      </div>

      {/* Main Header Container */}
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex shrink-0 items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-xl font-bold text-white shadow-md shadow-amber-950">
            V
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl leading-none font-extrabold tracking-tight text-white">
              Verttex
            </span>
            <span className="mt-0.5 font-sans text-[10px] tracking-widest text-amber-300/80 uppercase">
              Mercado Regional
            </span>
          </div>
        </Link>

        {/* Global Product & Producer Search Bar */}
        <div className="relative hidden max-w-lg flex-1 md:flex">
          <RiSearchLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-amber-400/60" />
          <input
            type="text"
            placeholder="Buscar queijos, vinhos, mel, embutidos ou produtores..."
            className="w-full rounded-full border border-amber-800/60 bg-amber-900/40 py-2 pr-4 pl-10 text-xs text-white placeholder-amber-400/50 transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Navigation Links & User Actions */}
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/lojas"
            className="hidden items-center space-x-1.5 text-amber-200 transition-colors hover:text-white sm:flex"
          >
            <RiStore2Line className="h-4 w-4 text-amber-400" />
            <span>Produtores</span>
          </Link>

          <Link
            href="/produtos"
            className="hidden text-amber-200 transition-colors hover:text-white sm:inline-block"
          >
            Produtos
          </Link>

          {/* User Auth Buttons or Menu */}
          {customer ? (
            <div className="flex items-center space-x-3">
              <Link
                href="/perfil"
                className="flex items-center space-x-2 rounded-full border border-amber-700/60 bg-amber-900/60 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-900"
              >
                <RiUser3Line className="h-4 w-4 text-amber-400" />
                <span className="max-w-30 truncate">{customer.name}</span>
              </Link>
              <button
                onClick={() => logout()}
                className="rounded-full p-2 text-amber-400 transition-colors hover:bg-amber-900/50 hover:text-rose-300"
                title="Sair da conta"
              >
                <RiLogoutBoxRLine className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-xs">
              <Link
                href="/login"
                className="flex items-center space-x-1 rounded-full border border-amber-800 px-3.5 py-2 font-medium text-amber-200 transition-colors hover:bg-amber-900/60"
              >
                <RiLockLine className="h-3.5 w-3.5 text-amber-400" />
                <span>Entrar</span>
              </Link>
              <Link
                href="/cadastro"
                className="flex items-center space-x-1 rounded-full bg-amber-600 px-4 py-2 font-semibold text-white shadow-md shadow-amber-950 transition-colors hover:bg-amber-500"
              >
                <RiUserAddLine className="h-3.5 w-3.5" />
                <span>Criar Conta</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
