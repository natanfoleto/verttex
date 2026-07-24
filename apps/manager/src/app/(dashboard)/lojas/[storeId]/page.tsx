'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { use, useState } from 'react'
import {
  RiArrowLeftLine,
  RiEditLine,
  RiGlobalLine,
  RiInformationLine,
  RiShoppingBag3Line,
  RiUserSharedLine,
} from 'react-icons/ri'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiClient } from '../../../../lib/api-client'
import { storeQueryKeys } from '../../../../lib/query-keys'
import { ProductsTable } from '../../produtos/components/products-table'
import { StoreFormDialog } from '../components/store-form-dialog'

export default function StoreDetailPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const resolvedParams = use(params)
  const storeId = resolvedParams.storeId

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const {
    data: store,
    isLoading,
    isError,
  } = useQuery({
    queryKey: storeQueryKeys.detail(storeId),
    queryFn: () => apiClient(`/stores/${storeId}`),
  })

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100" />
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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Link
            href="/lojas"
            className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              {store.name}
            </h1>
            <p className="font-mono text-sm text-zinc-400">
              verttexloja.com.br/{store.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/lojas/${storeId}/membros`}
            className="inline-flex items-center space-x-2 rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            <RiUserSharedLine className="h-4 w-4" />
            <span>Gerenciar Membros</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="inline-flex cursor-pointer items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-colors hover:bg-emerald-500"
          >
            <RiEditLine className="h-4 w-4" />
            <span>Editar Loja</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 inline-flex bg-zinc-900/80 p-1">
          <TabsTrigger value="overview" className="flex items-center space-x-2 text-xs">
            <RiInformationLine className="h-4 w-4" />
            <span>Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center space-x-2 text-xs">
            <RiShoppingBag3Line className="h-4 w-4" />
            <span>Produtos da Loja</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            {/* Info Card */}
            <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h2 className="text-base font-semibold text-zinc-200">
                Informações da Loja
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="block text-xs text-zinc-500">Status Atual</span>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      store.status === 'active'
                        ? 'border-emerald-800 bg-emerald-950 text-emerald-400'
                        : store.status === 'draft'
                          ? 'border-zinc-700 bg-zinc-800 text-zinc-300'
                          : store.status === 'suspended'
                            ? 'border-rose-800 bg-rose-950 text-rose-400'
                            : 'border-amber-800 bg-amber-950 text-amber-400'
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
                  <span className="block text-xs text-zinc-500">Descrição</span>
                  <p className="mt-0.5 text-zinc-300">
                    {store.description || 'Sem descrição cadastrada'}
                  </p>
                </div>

                <div>
                  <span className="block text-xs text-zinc-500">
                    Domínio Próprio
                  </span>
                  <div className="mt-0.5 flex items-center space-x-2">
                    <RiGlobalLine className="h-4 w-4 text-zinc-500" />
                    <span className="font-mono text-xs text-zinc-300">
                      {store.customDomain || 'Nenhum cadastrado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Members Summary */}
            <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
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
                        className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950 p-3 text-sm"
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
                          <span className="rounded border border-emerald-800 bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase">
                            Proprietário
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Nenhum membro vinculado a esta loja.
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <ProductsTable fixedStoreId={storeId} hideTitle />
        </TabsContent>
      </Tabs>

      <StoreFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        storeToEdit={store}
      />
    </div>
  )
}
