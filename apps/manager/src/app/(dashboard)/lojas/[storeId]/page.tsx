'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { use, useState } from 'react'
import {
  RiArrowLeftLine,
  RiEditLine,
  RiFileList3Line,
  RiFileTextLine,
  RiGlobalLine,
  RiHistoryLine,
  RiInformationLine,
  RiShieldKeyholeLine,
  RiShoppingBag3Line,
  RiStackLine,
  RiStore2Line,
  RiTimeLine,
  RiUserSharedLine,
} from 'react-icons/ri'

import { Button } from '@/components/ui/button'
import { StoreLogoUpload } from '@/components/ui/store-logo-upload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { apiClient } from '../../../../lib/api-client'
import { invalidateStores, storeQueryKeys } from '../../../../lib/query-keys'
import { ProductsTable } from '../../produtos/components/products-table'
import { StoreAuditTab } from '../components/store-audit-tab'
import { StoreFormDialog, StoreItem } from '../components/store-form-dialog'
import { StoreInventoryTab } from '../components/store-inventory-tab'
import { StoreLotsTab } from '../components/store-lots-tab'
import { StoreMovementsTab } from '../components/store-movements-tab'
import { StoreOrdersTab } from '../components/store-orders-tab'
import { StoreOverviewTab } from '../components/store-overview-tab'
import { StoreTeamTab } from '../components/store-team-tab'

export default function StoreDetailPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const resolvedParams = use(params)
  const storeId = resolvedParams.storeId
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const activeTab = searchParams.get('tab') || 'overview'

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newTab)
    router.replace(`/lojas/${storeId}?${params.toString()}`, { scroll: false })
  }

  const {
    data: store,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: storeQueryKeys.detail(storeId),
    queryFn: () => apiClient<StoreItem>(`/stores/${storeId}`),
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
            className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Link>
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xs">
              {store.logoUrl ? (
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <RiStore2Line className="h-6 w-6 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                  {store.name}
                </h1>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${store.status === 'active'
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
              <p className="font-mono text-xs text-zinc-400">
                verttexloja.com.br/{store.slug}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/lojas/${storeId}/membros`}
            className="inline-flex items-center space-x-2 rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 cursor-pointer"
          >
            <RiUserSharedLine className="h-4 w-4" />
            <span>Gerenciar Membros</span>
          </Link>
          <Button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="cursor-pointer"
          >
            <RiEditLine className="h-4 w-4" />
            <span>Editar Loja</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="w-full overflow-x-auto pb-2">
          <TabsList className="mb-4 flex w-full min-w-190 h-10 items-center justify-between rounded-xl bg-zinc-900/80 p-1 text-zinc-400 gap-1">
            <TabsTrigger
              value="overview"
              className="flex-1 flex items-center justify-center space-x-1.5 text-xs cursor-pointer px-3 py-1.5"
            >
              <RiInformationLine className="h-4 w-4 shrink-0" />
              <span>Visão Geral</span>
            </TabsTrigger>

            <TabsTrigger
              value="details"
              className="flex-1 flex items-center justify-center space-x-1.5 text-xs cursor-pointer px-3 py-1.5"
            >
              <RiFileTextLine className="h-4 w-4 shrink-0" />
              <span>Dados</span>
            </TabsTrigger>

            <TabsTrigger
              value="products"
              className="flex-1 flex items-center justify-center space-x-1.5 text-xs cursor-pointer px-3 py-1.5"
            >
              <RiShoppingBag3Line className="h-4 w-4 shrink-0" />
              <span>Produtos</span>
            </TabsTrigger>

            <TabsTrigger
              value="orders"
              className="flex-1 flex items-center justify-center space-x-1.5 text-xs cursor-pointer px-3 py-1.5"
            >
              <RiFileList3Line className="h-4 w-4 shrink-0" />
              <span>Pedidos</span>
            </TabsTrigger>

            <TabsTrigger
              value="inventory"
              className="flex-1 flex items-center justify-center space-x-1.5 text-xs cursor-pointer px-3 py-1.5"
            >
              <RiStackLine className="h-4 w-4 shrink-0" />
              <span>Estoque</span>
            </TabsTrigger>

            <TabsTrigger
              value="lots"
              className="flex-1 flex items-center justify-center space-x-1.5 text-xs cursor-pointer px-3 py-1.5"
            >
              <RiTimeLine className="h-4 w-4 shrink-0" />
              <span>Lotes & Validades</span>
            </TabsTrigger>

            <TabsTrigger
              value="movements"
              className="flex-1 flex items-center justify-center space-x-1.5 text-xs cursor-pointer px-3 py-1.5"
            >
              <RiHistoryLine className="h-4 w-4 shrink-0" />
              <span>Movimentações</span>
            </TabsTrigger>

            <TabsTrigger
              value="team"
              className="flex-1 flex items-center justify-center space-x-1.5 text-xs cursor-pointer px-3 py-1.5"
            >
              <RiUserSharedLine className="h-4 w-4 shrink-0" />
              <span>Equipe</span>
            </TabsTrigger>

            <TabsTrigger
              value="audit"
              className="flex-1 flex items-center justify-center space-x-1.5 text-xs cursor-pointer px-3 py-1.5"
            >
              <RiShieldKeyholeLine className="h-4 w-4 shrink-0" />
              <span>Auditoria</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Visão Geral */}
        <TabsContent value="overview">
          <StoreOverviewTab storeId={storeId} />
        </TabsContent>

        {/* Tab 2: Dados */}
        <TabsContent value="details">
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            {/* Info Card */}
            <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h2 className="text-base font-semibold text-zinc-200">
                Informações Cadastrais
              </h2>

              <div className="space-y-3 text-sm">
                <StoreLogoUpload
                  storeId={storeId}
                  storeName={store.name}
                  currentLogoUrl={store.logoUrl}
                  onLogoChange={() => {
                    refetch()
                    invalidateStores(queryClient)
                  }}
                />
                <div>
                  <span className="block text-xs text-zinc-500">
                    Status Atual
                  </span>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${store.status === 'active'
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
        </TabsContent>

        {/* Tab 3: Produtos */}
        <TabsContent value="products">
          <ProductsTable fixedStoreId={storeId} hideTitle />
        </TabsContent>

        {/* Tab 4: Pedidos */}
        <TabsContent value="orders">
          <StoreOrdersTab storeId={storeId} />
        </TabsContent>

        {/* Tab 5: Estoque */}
        <TabsContent value="inventory">
          <StoreInventoryTab storeId={storeId} />
        </TabsContent>

        {/* Tab 6: Lotes e Validades */}
        <TabsContent value="lots">
          <StoreLotsTab storeId={storeId} />
        </TabsContent>

        {/* Tab 7: Movimentações */}
        <TabsContent value="movements">
          <StoreMovementsTab storeId={storeId} />
        </TabsContent>

        {/* Tab 8: Equipe */}
        <TabsContent value="team">
          <StoreTeamTab storeId={storeId} />
        </TabsContent>

        {/* Tab 9: Auditoria */}
        <TabsContent value="audit">
          <StoreAuditTab storeId={storeId} />
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
