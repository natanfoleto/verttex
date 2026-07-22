'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { use, useState } from 'react'
import {
  RiArrowLeftLine,
  RiCheckboxCircleLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiCloseLine,
  RiFilter3Line,
  RiFlashlightLine,
  RiRefreshLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiShieldCrossLine,
} from 'react-icons/ri'
import { toast } from 'sonner'

import { NativeSelect } from '@/components/ui/native-select'
import { apiClient } from '../../../../../lib/api-client'
import { invalidateUsers } from '../../../../../lib/query-keys'

const MODULE_TRANSLATIONS: Record<string, string> = {
  User: 'Usuários',
  users: 'Usuários',
  user: 'Usuários',
  Store: 'Lojas',
  stores: 'Lojas',
  store: 'Lojas',
  Role: 'Cargos',
  roles: 'Cargos',
  role: 'Cargos',
  Permission: 'Permissões',
  permissions: 'Permissões',
  permission: 'Permissões',
  Audit: 'Auditoria',
  audit: 'Auditoria',
  auditoria: 'Auditoria',
  Product: 'Produtos',
  products: 'Produtos',
  product: 'Produtos',
  Category: 'Categorias',
  categories: 'Categorias',
  category: 'Categorias',
  Order: 'Pedidos',
  orders: 'Pedidos',
  order: 'Pedidos',
  Customer: 'Clientes',
  customers: 'Clientes',
  customer: 'Clientes',
}

function getModuleLabel(mod: string) {
  const pt = MODULE_TRANSLATIONS[mod] || mod
  return `${pt} (${mod.toLowerCase()})`
}

export default function UserPermissionsPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const resolvedParams = use(params)
  const userId = resolvedParams.userId
  const queryClient = useQueryClient()

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'granted' | 'denied'>('all')
  const [overrideFilter, setOverrideFilter] = useState<'all' | 'inherit' | 'allow' | 'deny'>('all')
  const [actionTypeFilter, setActionTypeFilter] = useState<'all' | 'read' | 'create' | 'update' | 'delete' | 'manage'>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => apiClient(`/users/${userId}`),
  })

  const { data: allPermissions, isLoading: isLoadingPerms } = useQuery({
    queryKey: ['all-permissions'],
    queryFn: () => apiClient('/permissions'),
  })

  const updatePermissionsMutation = useMutation({
    mutationFn: (
      overrides: Array<{ permissionId: string; effect: 'allow' | 'deny' }>
    ) =>
      apiClient(`/users/${userId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ overrides }),
      }),
    onSuccess: () => {
      invalidateUsers(queryClient, userId)
      toast.success('Exceções de permissão atualizadas com sucesso!')
    },
    onError: (err: Error) => {
      toast.error('Erro ao atualizar permissões', {
        description: err.message,
      })
    },
  })

  if (isLoadingUser || isLoadingPerms) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100" />
      </div>
    )
  }

  // Build Role Permissions Sets
  const rolePermissionIds = new Set<string>()
  const rolePermissionKeys = new Set<string>()
  const isSystemAdmin = user?.role?.key === 'admin'

  user?.role?.permissions?.forEach((rp: any) => {
    if (rp.permissionId) rolePermissionIds.add(rp.permissionId)
    if (rp.permission?.id) rolePermissionIds.add(rp.permission.id)
    if (rp.permission?.key) rolePermissionKeys.add(rp.permission.key)
  })

  // Current Overrides Map
  const currentOverridesMap = new Map<string, 'allow' | 'deny'>()
  user?.permissions?.forEach(
    (up: { permissionId: string; effect: 'allow' | 'deny' }) => {
      currentOverridesMap.set(up.permissionId, up.effect)
    }
  )

  // Helper function to resolve effective status and visual indicators
  const getEffectiveInfo = (perm: { id: string; key: string }) => {
    const override = currentOverridesMap.get(perm.id)
    const isRoleGranted =
      isSystemAdmin ||
      rolePermissionIds.has(perm.id) ||
      rolePermissionKeys.has(perm.key)

    if (override === 'allow') {
      return {
        isGranted: true,
        source: 'Exceção (Permitido)',
        badgeClass: 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300',
        icon: RiCheckboxCircleLine,
        type: 'override_allow',
      }
    }

    if (override === 'deny') {
      return {
        isGranted: false,
        source: 'Exceção (Bloqueado)',
        badgeClass: 'bg-rose-950/80 border-rose-700/80 text-rose-300',
        icon: RiCloseCircleLine,
        type: 'override_deny',
      }
    }

    if (isRoleGranted) {
      return {
        isGranted: true,
        source: `Herdado (${user?.role?.name || 'Cargo'})`,
        badgeClass: 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400',
        icon: RiCheckboxCircleLine,
        type: 'inherit_granted',
      }
    }

    return {
      isGranted: false,
      source: `Sem acesso no cargo (${user?.role?.name || 'Cargo'})`,
      badgeClass: 'bg-rose-950/40 border-rose-900/50 text-rose-400',
      icon: RiCloseCircleLine,
      type: 'inherit_denied',
    }
  }

  // Calculate Global Metrics
  const totalCount = allPermissions?.length || 0
  let grantedCount = 0
  let deniedCount = 0
  let overrideCount = currentOverridesMap.size

  const availableModulesSet = new Set<string>()

  allPermissions?.forEach((perm: any) => {
    if (perm.module) availableModulesSet.add(perm.module)
    const info = getEffectiveInfo(perm)
    if (info.isGranted) grantedCount++
    else deniedCount++
  })

  const availableModules = Array.from(availableModulesSet).sort()

  // Toggle Override Action
  const handleToggleOverride = (
    permissionId: string,
    effect: 'allow' | 'deny' | 'inherit'
  ) => {
    const newOverrides: Array<{
      permissionId: string
      effect: 'allow' | 'deny'
    }> = []

    allPermissions?.forEach(
      (perm: { id: string }) => {
        let currentEffect = currentOverridesMap.get(perm.id)
        if (perm.id === permissionId) {
          if (effect === 'inherit') return
          currentEffect = effect
        }
        if (currentEffect) {
          newOverrides.push({ permissionId: perm.id, effect: currentEffect })
        }
      }
    )

    updatePermissionsMutation.mutate(newOverrides)
  }

  // Filter Permissions
  const filteredPermissions = allPermissions?.filter((perm: any) => {
    const effective = getEffectiveInfo(perm)
    const override = currentOverridesMap.get(perm.id)

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesKey = perm.key.toLowerCase().includes(q)
      const matchesDesc = perm.description?.toLowerCase().includes(q)
      const matchesMod = perm.module?.toLowerCase().includes(q)
      if (!matchesKey && !matchesDesc && !matchesMod) return false
    }

    // Status filter
    if (statusFilter === 'granted' && !effective.isGranted) return false
    if (statusFilter === 'denied' && effective.isGranted) return false

    // Override action filter
    if (overrideFilter === 'inherit' && override) return false
    if (overrideFilter === 'allow' && override !== 'allow') return false
    if (overrideFilter === 'deny' && override !== 'deny') return false

    // Operation type filter
    if (actionTypeFilter !== 'all') {
      const k = perm.key.toLowerCase()
      if (actionTypeFilter === 'read' && !k.includes('read') && !k.includes('list')) return false
      if (actionTypeFilter === 'create' && !k.includes('create') && !k.includes('add')) return false
      if (actionTypeFilter === 'update' && !k.includes('update') && !k.includes('edit')) return false
      if (actionTypeFilter === 'delete' && !k.includes('delete') && !k.includes('remove')) return false
      if (actionTypeFilter === 'manage' && !k.includes('manage') && !k.includes('admin')) return false
    }

    // Module filter
    if (moduleFilter !== 'all' && perm.module !== moduleFilter) return false

    return true
  })

  // Group filtered permissions by module
  const permissionsByModule = new Map<
    string,
    Array<{ id: string; key: string; module: string; description: string }>
  >()

  filteredPermissions?.forEach((perm: any) => {
    const mod = perm.module || 'Outros'
    if (!permissionsByModule.has(mod)) {
      permissionsByModule.set(mod, [])
    }
    permissionsByModule.get(mod)!.push(perm)
  })

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    overrideFilter !== 'all' ||
    actionTypeFilter !== 'all' ||
    moduleFilter !== 'all'

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setOverrideFilter('all')
    setActionTypeFilter('all')
    setModuleFilter('all')
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/usuarios/${userId}`}
            className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Permissões do Usuário — {user?.name}
            </h1>
            <p className="text-sm text-zinc-400">
              Cargo Padrão: <strong className="text-zinc-200">{user?.role?.name}</strong> ({user?.role?.key})
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <span className="block text-xs font-semibold text-zinc-400">Total no Sistema</span>
          <span className="mt-1 block text-2xl font-bold text-zinc-100">{totalCount}</span>
        </div>

        <div className="rounded-2xl border border-emerald-950/60 bg-emerald-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-semibold text-emerald-400">Permissões Concedidas</span>
            <RiShieldCheckLine className="h-5 w-5 text-emerald-400" />
          </div>
          <span className="mt-1 block text-2xl font-bold text-emerald-300">{grantedCount}</span>
        </div>

        <div className="rounded-2xl border border-rose-950/60 bg-rose-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-semibold text-rose-400">Permissões Bloqueadas</span>
            <RiShieldCrossLine className="h-5 w-5 text-rose-400" />
          </div>
          <span className="mt-1 block text-2xl font-bold text-rose-300">{deniedCount}</span>
        </div>

        <div className="rounded-2xl border border-amber-950/60 bg-amber-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-semibold text-amber-400">Exceções Individuais</span>
            <RiFlashlightLine className="h-5 w-5 text-amber-400" />
          </div>
          <span className="mt-1 block text-2xl font-bold text-amber-300">{overrideCount}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider text-zinc-300 uppercase">
            <RiFilter3Line className="h-4 w-4 text-emerald-400" />
            <span>Filtros de Permissão</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="cursor-pointer text-xs font-medium text-amber-400 hover:underline"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          {/* Search */}
          <div className="relative md:col-span-1">
            <RiSearchLine className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar permissão..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pr-3 pl-9 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <NativeSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Status: Todos</option>
            <option value="granted">Concedidas</option>
            <option value="denied">Bloqueadas</option>
          </NativeSelect>

          {/* Override Action Filter */}
          <NativeSelect
            value={overrideFilter}
            onChange={(e) => setOverrideFilter(e.target.value as any)}
          >
            <option value="all">Ação: Todas</option>
            <option value="inherit">Herdar</option>
            <option value="allow">Permitir</option>
            <option value="deny">Negar</option>
          </NativeSelect>

          {/* Operation Filter */}
          <NativeSelect
            value={actionTypeFilter}
            onChange={(e) => setActionTypeFilter(e.target.value as any)}
          >
            <option value="all">Operação: Todas</option>
            <option value="read">Ler / Listar</option>
            <option value="create">Criar</option>
            <option value="update">Editar</option>
            <option value="delete">Excluir</option>
            <option value="manage">Gerenciar</option>
          </NativeSelect>

          {/* Module Filter */}
          <NativeSelect
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <option value="all">Módulo: Todos</option>
            {availableModules.map((mod) => (
              <option key={mod} value={mod}>
                {getModuleLabel(mod)}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {/* Main List */}
      <div className="w-full space-y-6">
        {permissionsByModule.size > 0 ? (
          Array.from(permissionsByModule.entries()).map(([moduleName, perms]) => (
            <div
              key={moduleName}
              className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/60 p-4">
                <span className="text-xs font-semibold tracking-wider text-zinc-200 uppercase">
                  Módulo: {getModuleLabel(moduleName)}
                </span>
                <span className="rounded bg-zinc-900 px-2 py-0.5 text-xs text-zinc-400">
                  {perms.length} {perms.length === 1 ? 'permissão' : 'permissões'}
                </span>
              </div>

              <div className="divide-y divide-zinc-800/60">
                {perms.map((perm) => {
                  const currentEffect = currentOverridesMap.get(perm.id)
                  const effective = getEffectiveInfo(perm)
                  const Icon = effective.icon

                  return (
                    <div
                      key={perm.id}
                      className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-zinc-800/20 md:flex-row md:items-center"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-zinc-100">
                            {perm.key}
                          </span>
                          
                          {/* Visual Effective Status Badge */}
                          <span
                            className={`inline-flex items-center space-x-1 rounded-md border px-2 py-0.5 text-[11px] font-medium shadow-xs ${effective.badgeClass}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{effective.isGranted ? 'Concedida' : 'Bloqueada'}</span>
                            <span className="opacity-75">({effective.source})</span>
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400">
                          {perm.description}
                        </p>
                      </div>

                      {/* Override Action Controls */}
                      <div className="flex shrink-0 items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleOverride(perm.id, 'allow')}
                          disabled={updatePermissionsMutation.isPending}
                          className={`inline-flex cursor-pointer items-center space-x-1 rounded-xl border px-3 py-1.5 text-xs transition-all ${
                            currentEffect === 'allow'
                              ? 'border-emerald-700 bg-emerald-950 font-semibold text-emerald-300 shadow-xs'
                              : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          <RiCheckLine className="h-3.5 w-3.5" />
                          <span>Permitir</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleOverride(perm.id, 'deny')}
                          disabled={updatePermissionsMutation.isPending}
                          className={`inline-flex cursor-pointer items-center space-x-1 rounded-xl border px-3 py-1.5 text-xs transition-all ${
                            currentEffect === 'deny'
                              ? 'border-rose-700 bg-rose-950 font-semibold text-rose-300 shadow-xs'
                              : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          <RiCloseLine className="h-3.5 w-3.5" />
                          <span>Negar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleOverride(perm.id, 'inherit')}
                          disabled={updatePermissionsMutation.isPending}
                          className={`inline-flex cursor-pointer items-center space-x-1 rounded-xl border px-3 py-1.5 text-xs transition-all ${
                            !currentEffect
                              ? 'border-zinc-700 bg-zinc-800 font-semibold text-zinc-200 shadow-xs'
                              : 'border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                          }`}
                          title="Herdar permissão do cargo"
                        >
                          <RiRefreshLine className="h-3.5 w-3.5" />
                          <span>Herdar</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <p className="text-sm text-zinc-400">
              Nenhuma permissão encontrada com os filtros selecionados.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-3 inline-flex cursor-pointer items-center space-x-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-semibold text-amber-400 transition-colors hover:bg-zinc-900"
              >
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
