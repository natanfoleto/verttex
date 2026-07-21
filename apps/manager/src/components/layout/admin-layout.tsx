'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import {
  RiDashboardLine,
  RiLogoutBoxRLine,
  RiShieldLine,
  RiStoreLine,
  RiUser3Line,
  RiUserLine,
} from 'react-icons/ri'

import { useAuth } from '../../providers/auth-provider'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, ability, logout } = useAuth()
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Painel Principal',
      href: '/',
      icon: RiDashboardLine,
      show: true,
    },
    {
      label: 'Usuários Gestores',
      href: '/usuarios',
      icon: RiUserLine,
      show: ability.can('read', 'User'),
    },
    {
      label: 'Cargos e Permissões',
      href: '/cargos',
      icon: RiShieldLine,
      show: ability.can('read', 'Role'),
    },
    {
      label: 'Lojas Parceiras',
      href: '/lojas',
      icon: RiStoreLine,
      show: ability.can('read', 'Store'),
    },
  ]

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 antialiased font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="h-16 border-b border-zinc-800 flex items-center px-6">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-900/40">
                V
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-none text-zinc-100 tracking-tight">
                  Verttex
                </span>
                <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">
                  Gestão Central
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-800 text-emerald-400 font-semibold'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/30 space-y-3">
          <Link
            href="/perfil"
            className={`flex items-center space-x-3 p-2 rounded-md transition-colors ${
              pathname === '/perfil'
                ? 'bg-zinc-800 text-zinc-100'
                : 'hover:bg-zinc-800/60 text-zinc-300'
            }`}
          >
            <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-200 shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate text-zinc-200">
                {user?.name || 'Usuário'}
              </span>
              <span className="text-xs text-zinc-500 truncate">
                {user?.role?.name || 'Gestor'}
              </span>
            </div>
            <RiUser3Line className="h-4 w-4 text-zinc-500 shrink-0" />
          </Link>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-md border border-zinc-800 transition-colors"
          >
            <RiLogoutBoxRLine className="h-4 w-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/30 px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-zinc-400 font-medium">
            <span>Gestão Monorepo</span>
            <span>/</span>
            <span className="text-zinc-200 capitalize">
              {pathname === '/' ? 'Dashboard' : pathname.split('/')[1]}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
              Ambiente Ativo
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
