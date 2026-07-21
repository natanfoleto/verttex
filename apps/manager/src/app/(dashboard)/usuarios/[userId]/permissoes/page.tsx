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
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100" />
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
    <div className="w-full space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/usuarios/${userId}`}
          className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Exceções de Permissão — {user?.name}
          </h1>
          <p className="text-sm text-zinc-400">
            Configure permissões individuais adicionais (Allow) ou bloqueios
            específicos (Deny)
          </p>
        </div>
      </div>

      {feedbackMessage && (
        <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/60 p-4 text-sm text-emerald-300">
          {feedbackMessage}
        </div>
      )}

      <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/60 p-4">
          <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
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
                  className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-zinc-800/20 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-semibold text-zinc-200">
                        {perm.key}
                      </span>
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        {perm.module}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      {perm.description}
                    </p>
                  </div>

                  {/* State selector buttons */}
                  <div className="flex shrink-0 items-center space-x-1.5">
                    <button
                      onClick={() => handleToggleOverride(perm.id, 'allow')}
                      className={`inline-flex cursor-pointer items-center space-x-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        currentEffect === 'allow'
                          ? 'border-emerald-700 bg-emerald-950 font-semibold text-emerald-300'
                          : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <RiCheckLine className="h-3.5 w-3.5" />
                      <span>Permitir</span>
                    </button>

                    <button
                      onClick={() => handleToggleOverride(perm.id, 'deny')}
                      className={`inline-flex cursor-pointer items-center space-x-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        currentEffect === 'deny'
                          ? 'border-rose-700 bg-rose-950 font-semibold text-rose-300'
                          : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <RiCloseLine className="h-3.5 w-3.5" />
                      <span>Negar</span>
                    </button>

                    <button
                      onClick={() => handleToggleOverride(perm.id, 'inherit')}
                      className={`inline-flex cursor-pointer items-center space-x-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        !currentEffect
                          ? 'border-zinc-700 bg-zinc-800 font-semibold text-zinc-200'
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
