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
    <header className="sticky top-0 z-50 bg-amber-950/95 backdrop-blur border-b border-amber-900/40 text-amber-50">
      {/* Top Utility Bar */}
      <div className="bg-amber-900/30 text-[11px] font-medium py-1.5 px-4 text-center text-amber-200/80 border-b border-amber-800/30">
        Conectando você aos melhores produtores artesanais da nossa região 🌾
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-amber-600 flex items-center justify-center font-bold text-xl text-white shadow-md shadow-amber-950">
            V
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl leading-none tracking-tight text-white font-serif">
              Verttex
            </span>
            <span className="text-[10px] text-amber-300/80 font-sans tracking-widest uppercase mt-0.5">
              Mercado Regional
            </span>
          </div>
        </Link>

        {/* Global Product & Producer Search Bar */}
        <div className="hidden md:flex flex-1 max-w-lg relative">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400/60" />
          <input
            type="text"
            placeholder="Buscar queijos, vinhos, mel, embutidos ou produtores..."
            className="w-full pl-10 pr-4 py-2 bg-amber-900/40 border border-amber-800/60 rounded-full text-xs text-white placeholder-amber-400/50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
          />
        </div>

        {/* Navigation Links & User Actions */}
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/lojas"
            className="hidden sm:flex items-center space-x-1.5 text-amber-200 hover:text-white transition-colors"
          >
            <RiStore2Line className="h-4 w-4 text-amber-400" />
            <span>Produtores</span>
          </Link>

          <Link
            href="/produtos"
            className="hidden sm:inline-block text-amber-200 hover:text-white transition-colors"
          >
            Produtos
          </Link>

          {/* User Auth Buttons or Menu */}
          {customer ? (
            <div className="flex items-center space-x-3">
              <Link
                href="/perfil"
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-900/60 hover:bg-amber-900 border border-amber-700/60 text-xs font-semibold text-amber-100 transition-colors"
              >
                <RiUser3Line className="h-4 w-4 text-amber-400" />
                <span className="max-w-30 truncate">{customer.name}</span>
              </Link>
              <button
                onClick={() => logout()}
                className="p-2 rounded-full text-amber-400 hover:text-rose-300 hover:bg-amber-900/50 transition-colors"
                title="Sair da conta"
              >
                <RiLogoutBoxRLine className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-xs">
              <Link
                href="/login"
                className="flex items-center space-x-1 px-3.5 py-2 rounded-full border border-amber-800 text-amber-200 hover:bg-amber-900/60 transition-colors font-medium"
              >
                <RiLockLine className="h-3.5 w-3.5 text-amber-400" />
                <span>Entrar</span>
              </Link>
              <Link
                href="/cadastro"
                className="flex items-center space-x-1 px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-950 transition-colors"
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
