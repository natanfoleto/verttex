'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { RiArrowLeftLine, RiCheckLine } from 'react-icons/ri'

import { apiClient } from '../../../../../lib/api-client'

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

  const { data: role, isLoading: isLoadingRole } = useQuery({
    queryKey: ['role-detail', roleId],
    queryFn: () => apiClient(`/roles/${roleId}`),
  })

  const { data: allPermissions, isLoading: isLoadingPerms } = useQuery({
    queryKey: ['all-permissions'],
    queryFn: () => apiClient('/permissions'),
  })

  useEffect(() => {
    if (role?.rolePermissions) {
      const initialSet = new Set<string>(
        role.rolePermissions.map(
          (rp: { permissionId: string }) => rp.permissionId,
        ),
      )
      setSelectedPermissionIds(initialSet)
    }
  }, [role])

  const updateRolePermissionsMutation = useMutation({
    mutationFn: (permissionIds: string[]) =>
      apiClient(`/roles/${roleId}/permissions`, {
        method: 'POST',
        body: JSON.stringify({ permissionIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-detail', roleId] })
      setFeedbackMessage('Permissões do cargo atualizadas com sucesso!')
      setTimeout(() => setFeedbackMessage(null), 3000)
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

  const handleSave = () => {
    updateRolePermissionsMutation.mutate(Array.from(selectedPermissionIds))
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
    },
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
              Marque as permissões que todos os usuários deste cargo terão no
              sistema
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={updateRolePermissionsMutation.isPending}
          className="flex cursor-pointer items-center space-x-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          <RiCheckLine className="h-4 w-4" />
          <span>
            {updateRolePermissionsMutation.isPending
              ? 'Salvando...'
              : 'Salvar Permissões'}
          </span>
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
                        className="h-5 w-5 cursor-pointer rounded border-zinc-700 bg-zinc-950 text-emerald-600 transition-colors focus:ring-emerald-500 focus:ring-offset-zinc-900"
                      />
                    </label>
                  )
                })}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )
}
