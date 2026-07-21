'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { use } from 'react'
import { RiArrowLeftLine, RiEditLine, RiShieldLine } from 'react-icons/ri'

import { apiClient } from '../../../../lib/api-client'

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
    queryKey: ['role-detail', roleId],
    queryFn: () => apiClient(`/roles/${roleId}`),
  })

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100 mx-auto" />
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/cargos"
            className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
                {role.name}
              </h1>
              <span className="font-mono text-xs text-zinc-400 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                {role.key}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              {role.description || 'Sem descrição informada'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/cargos/${roleId}/permissoes`}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition-colors"
          >
            <RiShieldLine className="h-4 w-4" />
            <span>Configurar Permissões</span>
          </Link>
          {!role.isSystem && (
            <Link
              href={`/cargos/${roleId}/editar`}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-md transition-colors"
            >
              <RiEditLine className="h-4 w-4" />
              <span>Editar</span>
            </Link>
          )}
        </div>
      </div>

      {/* Permissions assigned */}
      <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 space-y-4">
        <h2 className="text-base font-semibold text-zinc-200">
          Permissões Concedidas ({role.rolePermissions?.length || 0})
        </h2>

        {role.rolePermissions && role.rolePermissions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-semibold text-emerald-400">
                      {rp.permission.key}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {rp.permission.description}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 px-2 py-0.5 rounded bg-zinc-900">
                    {rp.permission.module}
                  </span>
                </div>
              ),
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
