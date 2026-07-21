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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100 mx-auto" />
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/cargos/${roleId}`}
            className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
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
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md disabled:opacity-50 transition-colors flex items-center space-x-2"
        >
          <RiCheckLine className="h-4 w-4" />
          <span>
            {updateRolePermissionsMutation.isPending
              ? 'Salvação...'
              : 'Salvar Permissões'}
          </span>
        </button>
      </div>

      {feedbackMessage && (
        <div className="rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-4 text-sm text-emerald-300">
          {feedbackMessage}
        </div>
      )}

      {/* Modules List */}
      <div className="space-y-6">
        {Array.from(permissionsByModule.entries()).map(
          ([moduleName, perms]) => (
            <div
              key={moduleName}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 font-semibold text-sm text-zinc-200 uppercase tracking-wider">
                Módulo: {moduleName}
              </div>

              <div className="divide-y divide-zinc-800/60">
                {perms.map((perm) => {
                  const isChecked = selectedPermissionIds.has(perm.id)

                  return (
                    <label
                      key={perm.id}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-colors"
                    >
                      <div>
                        <div className="font-mono text-sm font-semibold text-zinc-200">
                          {perm.key}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {perm.description}
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(perm.id)}
                        className="h-5 w-5 rounded border-zinc-700 bg-zinc-950 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-zinc-900 transition-colors cursor-pointer"
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
