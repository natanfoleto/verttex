'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { RiCloseLine, RiSearchLine } from 'react-icons/ri'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { MarketplacePageLoader } from '@/components/ui/marketplace-page-loader'
import { StoreCard, StoreCardProps } from '@/components/ui/store-card'
import { apiClient } from '@/lib/api-client'

export function StoresListingView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 12

  const { data: storesRes, isLoading } = useQuery<{
    data: any[]
    meta: {
      page: number
      perPage: number
      total: number
      totalPages: number
    }
  }>({
    queryKey: ['public-stores', page, perPage, searchQuery],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('perPage', String(perPage))
      if (searchQuery) params.append('search', searchQuery)

      const res = await apiClient(`/public/catalog/stores?${params.toString()}`)
      return res
    },
  })

  const storesList = storesRes?.data ?? []
  const meta = storesRes?.meta
  const totalPages = meta?.totalPages || 1

  const mappedStores: StoreCardProps[] = storesList.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description || undefined,
    productsCount: s.productsCount || 0,
    isVerified: true,
    coverUrl: s.coverUrl || undefined,
    logoUrl: s.logoUrl || undefined,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 font-sans antialiased">
      {/* Header Banner */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Lojas e Produtores Parceiros
        </h1>
        <p className="mt-2 text-xs text-stone-500">
          Conheça os agricultores, cooperativas e artesãos locais que vendem no
          Verttex.
        </p>
      </div>

      {/* Top Search & Results Counter */}
      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xl">
          <RiSearchLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar produtor por nome ou descrição..."
            className="pl-10 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setPage(1)
              }}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer rounded-full p-0.5"
            >
              <RiCloseLine className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="shrink-0 text-xs font-medium text-stone-500">
          Mostrando{' '}
          <strong className="font-bold text-stone-900">
            {mappedStores.length}
          </strong>{' '}
          de{' '}
          <strong className="font-bold text-stone-900">
            {meta?.total || 0}
          </strong>{' '}
          produtores
        </div>
      </div>

      {/* Stores Grid Area / Loader */}
      {isLoading ? (
        <MarketplacePageLoader label="Carregando produtores parceiros..." />
      ) : mappedStores.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mappedStores.map((store) => (
              <StoreCard key={store.id} {...store} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-200 pt-6 text-xs text-stone-600">
              <span>
                Página <strong>{page}</strong> de <strong>{totalPages}</strong>
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="cursor-pointer"
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="cursor-pointer"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="Nenhum produtor encontrado"
          description="Tente ajustar os termos da sua busca para encontrar o produtor desejado."
          actionLabel="Limpar Busca"
          onActionClick={() => {
            setSearchQuery('')
            setPage(1)
          }}
        />
      )}
    </div>
  )
}
