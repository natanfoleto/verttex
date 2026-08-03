'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { IconType } from 'react-icons'
import {
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBarChartBoxLine,
  RiCheckLine,
  RiComputerLine,
  RiDashboardLine,
  RiFolder3Line,
  RiHistoryLine,
  RiImageLine,
  RiLogoutBoxRLine,
  RiMenuLine,
  RiMoonLine,
  RiNotification3Line,
  RiPaletteLine,
  RiPriceTag3Line,
  RiRefreshLine,
  RiShieldLine,
  RiShoppingBag3Line,
  RiStackLine,
  RiStoreLine,
  RiSunLine,
  RiUser3Line,
  RiUserLine,
} from 'react-icons/ri'

import { Button } from '@/components/ui/button'
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

import { useAuth } from '../../providers/auth-provider'
import { useTheme } from '../../providers/theme-provider'

interface AdminLayoutProps {
  children: ReactNode
}

interface NavItem {
  label: string
  href?: string
  icon: IconType
  show?: boolean
  children?: {
    label: string
    href: string
    icon: IconType
    show?: boolean
    disabled?: boolean
    badge?: string
  }[]
}

const SIDEBAR_COLLAPSED_KEY = 'verttex_sidebar_collapsed'
const SUBMENU_STATE_KEY = 'verttex_submenu_state'

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, ability, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  // State to manage sidebar collapsed state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)

  // State to manage open submenus
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})

  // Load saved sidebar state from localStorage on mount
  useEffect(() => {
    const savedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (savedCollapsed !== null) {
      setIsCollapsed(savedCollapsed === 'true')
    }

    const savedSubmenus = localStorage.getItem(SUBMENU_STATE_KEY)
    if (savedSubmenus !== null) {
      try {
        setOpenSubmenus(JSON.parse(savedSubmenus))
      } catch {
        // Ignore parse error
      }
    }
  }, [])

  // Toggle sidebar collapse state
  const toggleCollapse = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(nextState))
  }

  // Toggle individual submenu
  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) => {
      const nextState = { ...prev, [label]: !prev[label] }
      localStorage.setItem(SUBMENU_STATE_KEY, JSON.stringify(nextState))
      return nextState
    })
  }

  // Define navigation items with RBAC permissions (Enterprise Hierarchy)
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: RiDashboardLine,
    },
    {
      label: 'Vendas & Operações',
      icon: RiShoppingBag3Line,
      show: true,
      children: [
        {
          label: 'Pedidos & Expedição',
          href: '/pedidos',
          icon: RiShoppingBag3Line,
          show: true,
        },
        {
          label: 'Trocas & Quarentena',
          href: '/devolucoes',
          icon: RiRefreshLine,
          show: true,
        },
      ],
    },
    {
      label: 'Catálogo & Inventário',
      icon: RiFolder3Line,
      show:
        ability.can('read', 'Product') ||
        ability.can('read', 'Category') ||
        ability.can('read', 'Brand'),
      children: [
        {
          label: 'Produtos',
          href: '/produtos',
          icon: RiFolder3Line,
          show: ability.can('read', 'Product'),
        },
        {
          label: 'Estoque & Lotes FEFO',
          href: '/estoque',
          icon: RiStackLine,
          show:
            ability.can('read', 'Product') || ability.can('read', 'Inventory'),
        },
        {
          label: 'Categorias',
          href: '/categorias',
          icon: RiFolder3Line,
          show: ability.can('read', 'Category'),
        },
        {
          label: 'Marcas',
          href: '/marcas',
          icon: RiPriceTag3Line,
          show: ability.can('read', 'Brand'),
        },
      ],
    },
    {
      label: 'Relatórios & BI',
      href: '/relatorios',
      icon: RiBarChartBoxLine,
      show: true,
    },
    {
      label: 'Lojas Parceiras',
      href: '/lojas',
      icon: RiStoreLine,
      show: ability.can('read', 'Store'),
    },
    {
      label: 'Aparência e Conteúdo',
      icon: RiPaletteLine,
      show: ability.can('read', 'Marketplace'),
      children: [
        {
          label: 'Carrossel do Site',
          href: '/marketplace/carousel',
          icon: RiImageLine,
          show: ability.can('read', 'Marketplace'),
        },
        {
          label: 'Documentos Legais',
          href: '/marketplace/legal',
          icon: RiShieldLine,
          show: true,
          disabled: true,
          badge: 'Em breve',
        },
        {
          label: 'Configurações Globais',
          href: '/marketplace/settings',
          icon: RiStoreLine,
          show: ability.can('read', 'Marketplace'),
        },
      ],
    },
    {
      label: 'Central de Notificações',
      href: '/notificacoes',
      icon: RiNotification3Line,
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
      label: 'Logs de Auditoria',
      href: '/auditoria',
      icon: RiHistoryLine,
      show: ability.can('read', 'AuditLog'),
    },
  ]

  // Filter items based on permissions
  const visibleNavItems = navItems.filter((item) => {
    if (item.show === false) return false
    if (item.children) {
      const visibleChildren = item.children.filter(
        (child) => child.show !== false,
      )
      return visibleChildren.length > 0
    }
    return true
  })

  // Format breadcrumb title based on active path (returns parent menu group name or top item name)
  const getPageTitle = () => {
    for (const item of navItems) {
      if (item.children && item.children.length > 0) {
        const matchesChild = item.children.some(
          (child) => child.href !== '#' && pathname.startsWith(child.href),
        )
        if (matchesChild) {
          return item.label
        }
      }
      if (item.href && item.href !== '#') {
        if (
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        ) {
          return item.label
        }
      }
    }
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
          pathname.startsWith(child.href),
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSubmenu(item.label)}
                    className={`flex w-full cursor-pointer items-center justify-center rounded-xl p-2.5 transition-colors ${
                      isActive
                        ? 'bg-zinc-800 font-semibold text-emerald-400'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                  </Button>
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
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggleSubmenu(item.label)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors h-auto ${
                  isActive
                    ? 'font-semibold text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
                <RiArrowDownSLine
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isSubmenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </Button>

              {isSubmenuOpen && (
                <div className="ml-4 space-y-1 border-l border-zinc-800 pl-3">
                  {visibleChildren.map((child) => {
                    const ChildIcon = child.icon
                    const isSubActive =
                      !child.disabled && pathname.startsWith(child.href)

                    if (child.disabled) {
                      return (
                        <div
                          key={child.label}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 opacity-60 cursor-not-allowed select-none"
                          title="Recurso em desenvolvimento"
                        >
                          <div className="flex items-center space-x-2.5">
                            <ChildIcon className="h-4 w-4 shrink-0 text-zinc-600" />
                            <span className="whitespace-nowrap">
                              {child.label}
                            </span>
                          </div>
                          {child.badge && (
                            <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 border border-zinc-700/60">
                              {child.badge}
                            </span>
                          )}
                        </div>
                      )
                    }

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center space-x-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                          isSubActive
                            ? 'bg-zinc-800 font-semibold text-emerald-400'
                            : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                        }`}
                      >
                        <ChildIcon className="h-4 w-4 shrink-0" />
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
                  className={`flex w-full cursor-pointer items-center justify-center rounded-xl p-2.5 transition-colors ${
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
      <div className="flex h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100 antialiased">
        {/* Desktop Sidebar (Fixed) */}
        <aside
          className={`hidden h-screen shrink-0 flex-col justify-between border-r border-zinc-800 bg-zinc-900/60 transition-all duration-300 lg:flex ${
            isCollapsed ? 'w-16' : 'w-72'
          }`}
        >
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Sidebar Header */}
            <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4">
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
                      Gestor de negócios
                    </span>
                  </div>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
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
              </Button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 py-2">{renderNavLinks(isCollapsed)}</div>
          </div>

          {/* Footer App Info */}
          {!isCollapsed && (
            <div className="shrink-0 border-t border-zinc-800/60 p-4 text-center">
              <span className="font-mono text-[11px] text-zinc-500">
                Verttex Manager v1.0.0
              </span>
            </div>
          )}
        </aside>

        {/* Main Area Container */}
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          {/* Top Header */}
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/40 px-4 backdrop-blur-md lg:px-8">
            <div className="flex items-center space-x-3">
              {/* Mobile Drawer Trigger */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      <RiMenuLine className="h-6 w-6" />
                    </Button>
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

            {/* Header Right Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Theme Toggle Dropdown */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 cursor-pointer rounded-xl border border-zinc-800/60 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                      >
                        {theme === 'light' ? (
                          <RiSunLine className="h-4.5 w-4.5 text-amber-400" />
                        ) : theme === 'dark' ? (
                          <RiMoonLine className="h-4.5 w-4.5 text-emerald-400" />
                        ) : (
                          <RiComputerLine className="h-4.5 w-4.5 text-zinc-300" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Alterar tema da aplicação</p>
                  </TooltipContent>
                </Tooltip>

                <DropdownMenuContent
                  align="end"
                  className="w-40 bg-zinc-950 border-zinc-800 z-100"
                >
                  <DropdownMenuLabel className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Tema do Painel
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setTheme('light')}
                    className="flex items-center justify-between text-xs text-zinc-200 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <RiSunLine className="h-4 w-4 text-amber-400" />
                      <span>Claro</span>
                    </div>
                    {theme === 'light' && (
                      <RiCheckLine className="h-4 w-4 text-emerald-400" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme('dark')}
                    className="flex items-center justify-between text-xs text-zinc-200 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <RiMoonLine className="h-4 w-4 text-emerald-400" />
                      <span>Escuro</span>
                    </div>
                    {theme === 'dark' && (
                      <RiCheckLine className="h-4 w-4 text-emerald-400" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme('system')}
                    className="flex items-center justify-between text-xs text-zinc-200 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <RiComputerLine className="h-4 w-4 text-zinc-400" />
                      <span>Sistema</span>
                    </div>
                    {theme === 'system' && (
                      <RiCheckLine className="h-4 w-4 text-emerald-400" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications Dropdown */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-9 w-9 cursor-pointer rounded-xl border border-zinc-800/60 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                      >
                        <RiNotification3Line className="h-4.5 w-4.5" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Notificações</p>
                  </TooltipContent>
                </Tooltip>

                <DropdownMenuContent
                  align="end"
                  className="w-80 bg-zinc-950 border-zinc-800 z-100"
                >
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-100">
                      Notificações
                    </span>
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                      Sistema Ativo
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-3 space-y-2.5">
                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-2.5 space-y-1">
                      <p className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                        <span>Lote L-2026-CAN-02</span>
                        <span className="text-[10px] text-amber-400 font-mono">
                          18d rest.
                        </span>
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Próximo do vencimento. Priorize saída via FEFO.
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-2.5 space-y-1">
                      <p className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                        <span>Auditoria & Segurança</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Hoje
                        </span>
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Todos os acessos e movimentações foram registrados.
                      </p>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Vertical Divider */}
              <div className="h-5 w-px bg-zinc-800/80 shrink-0 mx-1" />

              {/* User Profile Dropdown Menu (No Gray Hover Background Block) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex cursor-pointer items-center space-x-2.5 text-left outline-none rounded-xl p-1.5 transition-colors group bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent border-none shadow-none h-auto"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-800/40 group-hover:ring-emerald-500/60 transition-all">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden flex-col text-left sm:flex">
                      <span className="text-xs font-semibold whitespace-nowrap text-zinc-200 group-hover:text-emerald-500 transition-colors">
                        {user?.name || 'Usuário'}
                      </span>
                      <span className="text-[10px] whitespace-nowrap text-zinc-400 group-hover:text-emerald-600 transition-colors">
                        {user?.role?.name || 'Gestor'}
                      </span>
                    </div>
                    <RiArrowDownSLine className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="z-100 w-64 bg-zinc-950 border-zinc-800"
                >
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
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <RiUser3Line className="h-4 w-4 text-zinc-400" />
                      <span>Meu perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="flex items-center space-x-2 text-rose-400 focus:bg-rose-950/50 focus:text-rose-300 cursor-pointer"
                  >
                    <RiLogoutBoxRLine className="h-4 w-4" />
                    <span>Encerrar sessão</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content Container - Scroll Y Exclusive to Main Area */}
          <main className="w-full flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
