'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { use } from 'react'
import {
  RiArrowLeftLine,
  RiEditLine,
  RiGlobalLine,
  RiUserSharedLine,
} from 'react-icons/ri'

import { apiClient } from '../../../../lib/api-client'

export default function StoreDetailPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const resolvedParams = use(params)
  const storeId = resolvedParams.storeId

  const {
    data: store,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['store-detail', storeId],
    queryFn: () => apiClient(`/stores/${storeId}`),
  })

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100 mx-auto" />
      </div>
    )
  }

  if (isError || !store) {
    return (
      <div className="p-8 text-center text-rose-400">
        Loja não encontrada ou erro de carregamento.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/lojas"
            className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
              {store.name}
            </h1>
            <p className="text-sm font-mono text-zinc-400">
              verttexloja.com.br/{store.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/lojas/${storeId}/membros`}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition-colors"
          >
            <RiUserSharedLine className="h-4 w-4" />
            <span>Membros</span>
          </Link>
          <Link
            href={`/lojas/${storeId}/editar`}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-md transition-colors"
          >
            <RiEditLine className="h-4 w-4" />
            <span>Editar</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Card */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 space-y-4">
          <h2 className="text-base font-semibold text-zinc-200">
            Informações da Loja
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-zinc-500 block">Status Atual</span>
              <span
                className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  store.status === 'active'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : store.status === 'draft'
                      ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      : store.status === 'suspended'
                        ? 'bg-rose-950 text-rose-400 border-rose-800'
                        : 'bg-amber-950 text-amber-400 border-amber-800'
                }`}
              >
                {store.status === 'active'
                  ? 'Ativa'
                  : store.status === 'draft'
                    ? 'Rascunho'
                    : store.status === 'suspended'
                      ? 'Suspensa'
                      : 'Inativa'}
              </span>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block">Descrição</span>
              <p className="text-zinc-300 mt-0.5">
                {store.description || 'Sem descrição cadastrada'}
              </p>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block">
                Domínio Próprio
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <RiGlobalLine className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-300 font-mono text-xs">
                  {store.customDomain || 'Nenhum cadastrado'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Store Members Summary */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-200">
              Membros Vinculados ({store.users?.length || 0})
            </h2>
          </div>

          {store.users && store.users.length > 0 ? (
            <div className="space-y-2">
              {store.users.map(
                (su: {
                  isOwner: boolean
                  user: { id: string; name: string; email: string }
                }) => (
                  <div
                    key={su.user.id}
                    className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-between text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-200">
                        {su.user.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {su.user.email}
                      </span>
                    </div>
                    {su.isOwner && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Proprietário
                      </span>
                    )}
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Nenhum membro vinculado a esta loja.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
