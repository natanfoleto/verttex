'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { use } from 'react'
import { RiArrowLeftLine, RiEditLine, RiShieldLine } from 'react-icons/ri'

import { apiClient } from '../../../../lib/api-client'
import { roleQueryKeys } from '../../../../lib/query-keys'

export default function RoleDetailPage({
  params,
}: {
  params: Promise<{ roleId: string }>
}) {
  const resolvedParams = use(params)
  const roleId = resolvedParams.roleId

  const {
    data: role,
    isLoading,
    isError,
  } = useQuery({
    queryKey: roleQueryKeys.detail(roleId),
    queryFn: () => apiClient(`/roles/${roleId}`),
  })

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100" />
      </div>
    )
  }

  if (isError || !role) {
    return (
      <div className="p-8 text-center text-rose-400">
        Cargo não encontrado ou erro de carregamento.
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/cargos"
            className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                {role.name}
              </h1>
              <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">
                {role.key}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              {role.description || 'Sem descrição informada'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/cargos/${roleId}/permissoes`}
            className="inline-flex items-center space-x-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            <RiShieldLine className="h-4 w-4" />
            <span>Configurar Permissões</span>
          </Link>
          {!role.isSystem && (
            <Link
              href={`/cargos/${roleId}/editar`}
              className="inline-flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-emerald-500"
            >
              <RiEditLine className="h-4 w-4" />
              <span>Editar</span>
            </Link>
          )}
        </div>
      </div>

      {/* Permissions assigned */}
      <div className="w-full space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-base font-semibold text-zinc-200">
          Permissões Concedidas ({role.rolePermissions?.length || 0})
        </h2>

        {role.rolePermissions && role.rolePermissions.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {role.rolePermissions.map(
              (rp: {
                permission: {
                  id: string
                  key: string
                  description: string
                  module: string
                }
              }) => (
                <div
                  key={rp.permission.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950 p-3"
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-semibold text-emerald-400">
                      {rp.permission.key}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {rp.permission.description}
                    </span>
                  </div>
                  <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 uppercase">
                    {rp.permission.module}
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Nenhuma permissão associada a este cargo no momento.
          </p>
        )}
      </div>
    </div>
  )
}
