'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { IconType } from 'react-icons'
import {
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiDashboardLine,
  RiLockPasswordLine,
  RiLogoutBoxRLine,
  RiMenuLine,
  RiShieldLine,
  RiStoreLine,
  RiUser3Line,
  RiUserLine,
} from 'react-icons/ri'

import { useAuth } from '../../providers/auth-provider'

export interface NavChildItem {
  label: string
  href: string
  icon?: IconType
  show?: boolean
}

export interface NavItem {
  label: string
  href?: string
  icon: IconType
  show?: boolean
  children?: NavChildItem[]
}

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, ability, logout } = useAuth()
  const pathname = usePathname()

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('verttex:sidebar-collapsed')
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved))
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('verttex:sidebar-collapsed', JSON.stringify(next))
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  const navItems: NavItem[] = [
    {
      label: 'Painel Principal',
      href: '/',
      icon: RiDashboardLine,
      show: true,
    },
    {
      label: 'Gestão de Acessos',
      icon: RiShieldLine,
      show: ability.can('read', 'User') || ability.can('read', 'Role'),
      children: [
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
      ],
    },
    {
      label: 'Lojas Parceiras',
      href: '/lojas',
      icon: RiStoreLine,
      show: ability.can('read', 'Store'),
    },
  ]

  // Filter items based on permissions
  const visibleNavItems = navItems.filter((item) => {
    if (item.show === false) return false
    if (item.children) {
      const visibleChildren = item.children.filter(
        (child) => child.show !== false
      )
      return visibleChildren.length > 0
    }
    return true
  })

  // Format breadcrumb title based on active path
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    if (pathname.startsWith('/usuarios')) return 'Usuários Gestores'
    if (pathname.startsWith('/cargos')) return 'Cargos e Permissões'
    if (pathname.startsWith('/lojas')) return 'Lojas Parceiras'
    if (pathname.startsWith('/perfil')) return 'Meu Perfil'
    return 'Painel Manager'
  }

  const renderNavLinks = (collapsed: boolean) => (
    <nav className="space-y-1 p-3">
      {visibleNavItems.map((item) => {
        const Icon = item.icon
        const hasChildren = Boolean(item.children && item.children.length > 0)
        const visibleChildren =
          item.children?.filter((child) => child.show !== false) || []

        const isChildActive = visibleChildren.some((child) =>
          pathname.startsWith(child.href)
        )
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : item.href
              ? pathname.startsWith(item.href)
              : isChildActive

        const isSubmenuOpen = openSubmenus[item.label] ?? isChildActive

        if (hasChildren) {
          if (collapsed) {
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className={`flex w-full cursor-pointer items-center justify-center rounded-xl p-2.5 transition-colors ${
                      isActive
                        ? 'bg-zinc-800 font-semibold text-emerald-400'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="space-y-1">
                  <p className="font-semibold">{item.label}</p>
                  {visibleChildren.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block py-0.5 text-xs text-zinc-300 hover:text-emerald-400"
                    >
                      {child.label}
                    </Link>
                  ))}
                </TooltipContent>
              </Tooltip>
            )
          }

          return (
            <div key={item.label} className="space-y-1">
              <button
                onClick={() => toggleSubmenu(item.label)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800/80 font-semibold text-emerald-400'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
                <RiArrowRightSLine
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    isSubmenuOpen
                      ? 'rotate-90 text-emerald-400'
                      : 'text-zinc-500'
                  }`}
                />
              </button>

              {isSubmenuOpen && (
                <div className="ml-3 space-y-1 border-l border-zinc-800/80 pr-2 pl-4">
                  {visibleChildren.map((child) => {
                    const ChildIcon = child.icon || RiArrowRightSLine
                    const isChildRouteActive = pathname.startsWith(child.href)

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center space-x-2.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                          isChildRouteActive
                            ? 'border-emerald-800/50 bg-emerald-950/50 font-semibold text-emerald-400'
                            : 'border-transparent text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                        }`}
                      >
                        <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="whitespace-nowrap">{child.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        }

        if (collapsed) {
          return (
            <Tooltip key={item.href || item.label}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href || '#'}
                  className={`flex items-center justify-center rounded-xl p-2.5 transition-colors ${
                    isActive
                      ? 'bg-zinc-800 font-semibold text-emerald-400'
                      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          )
        }

        return (
          <Link
            key={item.href || item.label}
            href={item.href || '#'}
            className={`flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-zinc-800 font-semibold text-emerald-400'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden shrink-0 flex-col justify-between border-r border-zinc-800 bg-zinc-900/60 transition-all duration-300 lg:flex ${
            isCollapsed ? 'w-16' : 'w-72'
          }`}
        >
          <div>
            {/* Sidebar Header */}
            <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
              {!isCollapsed && (
                <Link href="/" className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-md shadow-emerald-950">
                    V
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base leading-none font-bold tracking-tight text-zinc-100">
                      Verttex
                    </span>
                    <span className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                      Backoffice
                    </span>
                  </div>
                </Link>
              )}
              <button
                onClick={toggleCollapse}
                className={`cursor-pointer rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 ${
                  isCollapsed ? 'mx-auto' : 'ml-auto'
                }`}
                title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
              >
                {isCollapsed ? (
                  <RiArrowRightSLine className="h-5 w-5" />
                ) : (
                  <RiArrowLeftSLine className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Navigation Links */}
            {renderNavLinks(isCollapsed)}
          </div>

          {/* Footer App Info */}
          {!isCollapsed && (
            <div className="border-t border-zinc-800/60 p-4 text-center">
              <span className="font-mono text-[11px] text-zinc-500">
                Verttex Manager v1.0.0
              </span>
            </div>
          )}
        </aside>

        {/* Main Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/40 px-4 backdrop-blur-md lg:px-8">
            <div className="flex items-center space-x-3">
              {/* Mobile Drawer Trigger */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="cursor-pointer rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100">
                      <RiMenuLine className="h-6 w-6" />
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-72 border-zinc-800 bg-zinc-900 p-0"
                  >
                    <SheetHeader className="border-b border-zinc-800 p-4 text-left">
                      <SheetTitle className="flex items-center space-x-3 text-zinc-100">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-md shadow-emerald-950">
                          V
                        </div>
                        <span>Verttex Manager</span>
                      </SheetTitle>
                    </SheetHeader>
                    {renderNavLinks(false)}
                  </SheetContent>
                </Sheet>
              </div>

              {/* Breadcrumb Title */}
              <div className="flex items-center space-x-2 text-sm font-medium">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  {getPageTitle()}
                </span>
              </div>
            </div>

            {/* User Profile Dropdown Menu */}
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex cursor-pointer items-center space-x-2.5 text-left outline-none">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-sm font-semibold text-emerald-300">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden flex-col text-left sm:flex">
                      <span className="text-xs font-semibold whitespace-nowrap text-zinc-200">
                        {user?.name || 'Usuário'}
                      </span>
                      <span className="text-[10px] whitespace-nowrap text-zinc-400">
                        {user?.role?.name || 'Gestor'}
                      </span>
                    </div>
                    <RiArrowDownSLine className="h-4 w-4 shrink-0 text-zinc-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-100 w-64">
                  <DropdownMenuLabel className="font-normal text-zinc-100 normal-case">
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-sm font-bold whitespace-nowrap text-zinc-100">
                        {user?.name || 'Usuário'}
                      </span>
                      <span className="truncate text-xs font-normal text-zinc-400">
                        {user?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/perfil"
                      className="flex items-center space-x-2"
                    >
                      <RiUser3Line className="h-4 w-4 text-zinc-400" />
                      <span>Meu perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/perfil#senha"
                      className="flex items-center space-x-2"
                    >
                      <RiLockPasswordLine className="h-4 w-4 text-zinc-400" />
                      <span>Alterar senha</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="flex items-center space-x-2 text-rose-400 focus:bg-rose-950/50 focus:text-rose-300"
                  >
                    <RiLogoutBoxRLine className="h-4 w-4" />
                    <span>Encerrar sessão</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content Container - Full Width */}
          <main className="w-full flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
