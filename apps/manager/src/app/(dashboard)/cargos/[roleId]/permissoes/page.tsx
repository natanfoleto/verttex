'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiUser3Line,
  RiUserSharedLine,
  RiCloseLine,
  RiSearchLine,
} from 'react-icons/ri'
import { toast } from 'sonner'

import { apiClient } from '../../../../../lib/api-client'
import { invalidateRoles } from '../../../../../lib/query-keys'

interface UserItem {
  id: string
  name: string
  email: string
}

export default function RolePermissionsPage({
  params,
}: {
  params: Promise<{ roleId: string }>
}) {
  const resolvedParams = use(params)
  const roleId = resolvedParams.roleId
  const queryClient = useQueryClient()

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<
    Set<string>
  >(new Set())
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  // Propagation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [strategy, setStrategy] = useState<'ALL' | 'PRESERVE_ALL' | 'CUSTOM'>('ALL')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [userSearch, setUserSearch] = useState('')

  const { data: role, isLoading: isLoadingRole } = useQuery({
    queryKey: ['role-detail', roleId],
    queryFn: () => apiClient(`/roles/${roleId}`),
  })

  const { data: allPermissions, isLoading: isLoadingPerms } = useQuery({
    queryKey: ['all-permissions'],
    queryFn: () => apiClient('/permissions'),
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-for-role', roleId],
    queryFn: () => apiClient<{ data: UserItem[] }>(`/users?roleId=${roleId}&perPage=100`),
    enabled: isModalOpen,
  })

  const roleUsers = usersData?.data || []

  useEffect(() => {
    if (role?.rolePermissions) {
      const initialSet = new Set<string>(
        role.rolePermissions.map(
          (rp: { permissionId: string }) => rp.permissionId
        )
      )
      setSelectedPermissionIds(initialSet)
    }
  }, [role])

  const updateRolePermissionsMutation = useMutation({
    mutationFn: (payload: {
      permissionIds: string[]
      strategy: 'ALL' | 'PRESERVE_ALL' | 'CUSTOM'
      targetUserIds?: string[]
    }) =>
      apiClient(`/roles/${roleId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidateRoles(queryClient, roleId)
      setIsModalOpen(false)
      toast.success('Permissões do cargo atualizadas com sucesso!')
      setFeedbackMessage('Permissões do cargo atualizadas com sucesso!')
      setTimeout(() => setFeedbackMessage(null), 3000)
    },
    onError: () => {
      toast.error('Erro ao atualizar permissões do cargo.')
    },
  })

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleOpenSaveModal = () => {
    setIsModalOpen(true)
  }

  const handleConfirmSave = () => {
    updateRolePermissionsMutation.mutate({
      permissionIds: Array.from(selectedPermissionIds),
      strategy,
      targetUserIds: strategy === 'CUSTOM' ? Array.from(selectedUserIds) : undefined,
    })
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const handleSelectAllUsers = () => {
    setSelectedUserIds(new Set(roleUsers.map((u) => u.id)))
  }

  const handleDeselectAllUsers = () => {
    setSelectedUserIds(new Set())
  }

  if (isLoadingRole || isLoadingPerms) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100" />
      </div>
    )
  }

  // Group permissions by module
  const permissionsByModule = new Map<
    string,
    Array<{ id: string; key: string; module: string; description: string }>
  >()
  allPermissions?.forEach(
    (perm: {
      id: string
      key: string
      module: string
      description: string
    }) => {
      const mod = perm.module || 'Outros'
      if (!permissionsByModule.has(mod)) {
        permissionsByModule.set(mod, [])
      }
      permissionsByModule.get(mod)!.push(perm)
    }
  )

  const filteredUsers = roleUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/cargos/${roleId}`}
            className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Permissões do Cargo — {role?.name}
            </h1>
            <p className="text-sm text-zinc-400">
              Marque as permissões que os usuários deste cargo terão no sistema
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenSaveModal}
          disabled={updateRolePermissionsMutation.isPending}
          className="flex cursor-pointer items-center space-x-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          <RiCheckLine className="h-4 w-4" />
          <span>Salvar Permissões</span>
        </button>
      </div>

      {feedbackMessage && (
        <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/60 p-4 text-sm text-emerald-300">
          {feedbackMessage}
        </div>
      )}

      {/* Modules List */}
      <div className="w-full space-y-6">
        {Array.from(permissionsByModule.entries()).map(
          ([moduleName, perms]) => (
            <div
              key={moduleName}
              className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40"
            >
              <div className="border-b border-zinc-800 bg-zinc-950/60 p-4 text-sm font-semibold tracking-wider text-zinc-200 uppercase">
                Módulo: {moduleName}
              </div>

              <div className="divide-y divide-zinc-800/60">
                {perms.map((perm) => {
                  const isChecked = selectedPermissionIds.has(perm.id)

                  return (
                    <label
                      key={perm.id}
                      className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-zinc-800/30"
                    >
                      <div>
                        <div className="font-mono text-sm font-semibold text-zinc-200">
                          {perm.key}
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {perm.description}
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(perm.id)}
                      />
                    </label>
                  )
                })}
              </div>
            </div>
          )
        )}
      </div>

      {/* Propagation Strategy Modal (Decision 4) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-xl border border-emerald-800 bg-emerald-950 p-2 text-emerald-400">
                  <RiUserSharedLine className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-100">
                    Propagação das Alterações
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Escolha como aplicar as novas permissões do cargo{' '}
                    <strong className="text-zinc-200">{role?.name}</strong> aos usuários
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <RiCloseLine className="h-5 w-5" />
              </button>
            </div>

            {/* Strategy Options */}
            <div className="space-y-3">
              <label
                onClick={() => setStrategy('ALL')}
                className={`flex cursor-pointer items-start space-x-3.5 rounded-xl border p-4 transition-colors ${
                  strategy === 'ALL'
                    ? 'border-emerald-700 bg-emerald-950/40 text-zinc-100'
                    : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  checked={strategy === 'ALL'}
                  onChange={() => setStrategy('ALL')}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-semibold text-zinc-200">
                    Opção A — Aplicar a nova configuração a todos
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Todos os usuários deste cargo passam a herdar a nova configuração automaticamente.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setStrategy('PRESERVE_ALL')}
                className={`flex cursor-pointer items-start space-x-3.5 rounded-xl border p-4 transition-colors ${
                  strategy === 'PRESERVE_ALL'
                    ? 'border-emerald-700 bg-emerald-950/40 text-zinc-100'
                    : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  checked={strategy === 'PRESERVE_ALL'}
                  onChange={() => setStrategy('PRESERVE_ALL')}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-semibold text-zinc-200">
                    Opção B — Preservar as permissões atuais de todos
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Os usuários atuais mantêm seus direitos de acesso anteriores (criando exceções individuais). Novos usuários vinculados posteriormente utilizarão a nova configuração.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setStrategy('CUSTOM')}
                className={`flex cursor-pointer items-start space-x-3.5 rounded-xl border p-4 transition-colors ${
                  strategy === 'CUSTOM'
                    ? 'border-emerald-700 bg-emerald-950/40 text-zinc-100'
                    : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  checked={strategy === 'CUSTOM'}
                  onChange={() => setStrategy('CUSTOM')}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-semibold text-zinc-200">
                    Opção C — Escolher usuários individualmente
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Selecione especificamente quais usuários devem preservar suas permissões atuais.
                  </p>
                </div>
              </label>
            </div>

            {/* Custom User Picker (Option C) */}
            {strategy === 'CUSTOM' && (
              <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                  <div className="text-xs font-semibold text-zinc-300">
                    Usuários a Preservar ({selectedUserIds.size} de {roleUsers.length} selecionados)
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllUsers}
                      className="text-emerald-400 hover:underline"
                    >
                      Selecionar Todos
                    </button>
                    <span className="text-zinc-600">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllUsers}
                      className="text-zinc-400 hover:underline"
                    >
                      Remover Seleções
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <RiSearchLine className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar por nome ou e-mail..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-zinc-800/60 rounded-lg border border-zinc-800/60">
                  {filteredUsers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-zinc-500">
                      Nenhum usuário encontrado.
                    </div>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = selectedUserIds.has(u.id)
                      return (
                        <label
                          key={u.id}
                          className="flex cursor-pointer items-center justify-between p-2.5 transition-colors hover:bg-zinc-900"
                        >
                          <div className="flex items-center space-x-2.5">
                            <RiUser3Line className="h-4 w-4 text-zinc-500" />
                            <div>
                              <div className="text-xs font-medium text-zinc-200">
                                {u.name}
                              </div>
                              <div className="text-[11px] text-zinc-500">
                                {u.email}
                              </div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUserSelection(u.id)}
                          />
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={updateRolePermissionsMutation.isPending}
                className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-500 disabled:opacity-50"
              >
                <RiCheckLine className="h-4 w-4" />
                <span>
                  {updateRolePermissionsMutation.isPending
                    ? 'Aplicando...'
                    : 'Confirmar e Aplicar'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
