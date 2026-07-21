'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { use, useState } from 'react'
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiCloseLine,
  RiRefreshLine,
} from 'react-icons/ri'

import { apiClient } from '../../../../../lib/api-client'

export default function UserPermissionsPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const resolvedParams = use(params)
  const userId = resolvedParams.userId
  const queryClient = useQueryClient()
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

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
      overrides: Array<{ permissionId: string; effect: 'allow' | 'deny' }>,
    ) =>
      apiClient(`/users/${userId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ overrides }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', userId] })
      setFeedbackMessage('Permissões individuais atualizadas com sucesso!')
      setTimeout(() => setFeedbackMessage(null), 3000)
    },
  })

  if (isLoadingUser || isLoadingPerms) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100 mx-auto" />
      </div>
    )
  }

  // Current overrides map
  const currentOverridesMap = new Map<string, 'allow' | 'deny'>()
  user?.permissions?.forEach(
    (up: { permissionId: string; effect: 'allow' | 'deny' }) => {
      currentOverridesMap.set(up.permissionId, up.effect)
    },
  )

  const handleToggleOverride = (
    permissionId: string,
    effect: 'allow' | 'deny' | 'inherit',
  ) => {
    const newOverrides: Array<{
      permissionId: string
      effect: 'allow' | 'deny'
    }> = []

    allPermissions?.forEach(
      (perm: {
        id: string
        key: string
        module: string
        description: string
      }) => {
        let currentEffect = currentOverridesMap.get(perm.id)
        if (perm.id === permissionId) {
          if (effect === 'inherit') return
          currentEffect = effect
        }
        if (currentEffect) {
          newOverrides.push({ permissionId: perm.id, effect: currentEffect })
        }
      },
    )

    updatePermissionsMutation.mutate(newOverrides)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/usuarios/${userId}`}
          className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Exceções de Permissão — {user?.name}
          </h1>
          <p className="text-sm text-zinc-400">
            Configure permissões individuais adicionais (Allow) ou bloqueios
            específicos (Deny)
          </p>
        </div>
      </div>

      {feedbackMessage && (
        <div className="rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-4 text-sm text-emerald-300">
          {feedbackMessage}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Permissões do Sistema
          </span>
          <span className="text-xs text-zinc-500">
            Cargo padrão:{' '}
            <strong className="text-zinc-300">{user?.role?.name}</strong>
          </span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {allPermissions?.map(
            (perm: {
              id: string
              key: string
              module: string
              description: string
            }) => {
              const currentEffect = currentOverridesMap.get(perm.id)

              return (
                <div
                  key={perm.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/20 transition-colors"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-semibold text-zinc-200">
                        {perm.key}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {perm.module}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      {perm.description}
                    </p>
                  </div>

                  {/* State selector buttons */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleOverride(perm.id, 'allow')}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        currentEffect === 'allow'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700 font-semibold'
                          : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <RiCheckLine className="h-3.5 w-3.5" />
                      <span>Permitir</span>
                    </button>

                    <button
                      onClick={() => handleToggleOverride(perm.id, 'deny')}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        currentEffect === 'deny'
                          ? 'bg-rose-950 text-rose-300 border-rose-700 font-semibold'
                          : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <RiCloseLine className="h-3.5 w-3.5" />
                      <span>Negar</span>
                    </button>

                    <button
                      onClick={() => handleToggleOverride(perm.id, 'inherit')}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        !currentEffect
                          ? 'bg-zinc-800 text-zinc-200 border-zinc-700 font-semibold'
                          : 'border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                      }`}
                      title="Herdar permissão do cargo"
                    >
                      <RiRefreshLine className="h-3.5 w-3.5" />
                      <span>Herdar</span>
                    </button>
                  </div>
                </div>
              )
            },
          )}
        </div>
      </div>
    </div>
  )
}
