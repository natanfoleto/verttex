'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { use } from 'react'
import {
  RiArrowLeftLine,
  RiEditLine,
  RiShieldUserLine,
  RiStoreLine,
} from 'react-icons/ri'

import { apiClient } from '../../../../lib/api-client'

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const resolvedParams = use(params)
  const userId = resolvedParams.userId

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => apiClient(`/users/${userId}`),
  })

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100 mx-auto" />
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="p-8 text-center text-rose-400">
        Usuário não encontrado ou erro de carregamento.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/usuarios"
            className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
              {user.name}
            </h1>
            <p className="text-sm text-zinc-400">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/usuarios/${userId}/permissoes`}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition-colors"
          >
            <RiShieldUserLine className="h-4 w-4" />
            <span>Permissões</span>
          </Link>
          <Link
            href={`/usuarios/${userId}/editar`}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-md transition-colors"
          >
            <RiEditLine className="h-4 w-4" />
            <span>Editar</span>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Card */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 space-y-4">
          <h2 className="text-base font-semibold text-zinc-200">
            Informações Gerais
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-zinc-500 block">Status</span>
              <span
                className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  user.status === 'active'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border-rose-800'
                }`}
              >
                {user.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block">Cargo</span>
              <span className="font-medium text-zinc-200">
                {user.role?.name} ({user.role?.key})
              </span>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block">Telefone</span>
              <span className="text-zinc-300">
                {user.phone || 'Não informado'}
              </span>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block">Cadastrado em</span>
              <span className="text-zinc-400">
                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Stores Card */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-200">
              Lojas Vinculadas
            </h2>
            <RiStoreLine className="h-5 w-5 text-zinc-500" />
          </div>

          {user.stores && user.stores.length > 0 ? (
            <div className="space-y-2">
              {user.stores.map(
                (su: { store: { id: string; name: string; slug: string } }) => (
                  <div
                    key={su.store.id}
                    className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-between"
                  >
                    <span className="font-medium text-sm text-zinc-200">
                      {su.store.name}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      /{su.store.slug}
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Nenhuma loja vinculada a este usuário.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
