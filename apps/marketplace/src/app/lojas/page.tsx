'use client'

import Link from 'next/link'
import { useState } from 'react'
import { RiSearchLine, RiStore2Line } from 'react-icons/ri'

import { EmptyState } from '../../components/ui/empty-state'
import { StoreCard, StoreCardProps } from '../../components/ui/store-card'

const STORES_DATA: StoreCardProps[] = [
  {
    id: 's1',
    name: 'Queijaria Alvorada',
    slug: 'queijaria-alvorada',
    description:
      'Tradição familiar na produção de queijos artesanais de leite cru com maturação especial na Serra Gaúcha.',
    city: 'Farroupilha',
    state: 'RS',
    productsCount: 14,
    isVerified: true,
    coverUrl:
      'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 's2',
    name: 'Vinícola Família Rossi',
    slug: 'vinicola-familia-rossi',
    description:
      'Vinhos coloniais de pequena escala produzidos artesanalmente nos vales da serra gaúcha.',
    city: 'Bento Gonçalves',
    state: 'RS',
    productsCount: 22,
    isVerified: true,
    coverUrl:
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 's3',
    name: 'Apiário Vale Verde',
    slug: 'apiario-vale-verde',
    description:
      'Mel de florada nativa e produtos apícolas 100% puros e sem aditivos Químicos.',
    city: 'Gramado',
    state: 'RS',
    productsCount: 9,
    isVerified: true,
    coverUrl:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 's4',
    name: 'Embutidos Tradição',
    slug: 'embutidos-tradicao',
    description:
      'Salames, lombos e embutidos suínos curados e defumados em lenha de macieira.',
    city: 'Caxias do Sul',
    state: 'RS',
    productsCount: 12,
    isVerified: true,
    coverUrl:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  },
]

export default function StoresListingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 6

  const filteredStores = STORES_DATA.filter(
    (store) =>
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (store.city &&
        store.city.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalPages = Math.ceil(filteredStores.length / perPage) || 1
  const paginatedStores = filteredStores.slice(
    (page - 1) * perPage,
    page * perPage
  )

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 pb-28 font-sans text-stone-900 lg:pb-36 sm:px-6 lg:px-8">
      {/* Breadcrumb & Title */}
      <div className="space-y-3 border-b border-stone-200/80 pb-6">
        <div className="flex items-center space-x-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-emerald-800">
            Início
          </Link>
          <span>/</span>
          <span className="font-semibold text-stone-800">Produtores</span>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Produtores & Lojas Parceiras
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Conheça as histórias, métodos de produção e origens de nossos
              parceiros regionais.
            </p>
          </div>

          <div className="relative w-full max-w-xs">
            <RiSearchLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Buscar por nome ou cidade..."
              className="h-10 w-full rounded-lg border border-stone-200 bg-white pr-4 pl-10 text-xs text-stone-900 shadow-xs focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      {paginatedStores.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedStores.map((store) => (
              <StoreCard key={store.id} {...store} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-200 pt-6 text-xs text-stone-600">
              <span>
                Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({filteredStores.length} lojas)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="cursor-pointer rounded-lg border border-stone-200 bg-white px-3.5 py-2 font-medium transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="cursor-pointer rounded-lg border border-stone-200 bg-white px-3.5 py-2 font-medium transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={RiStore2Line}
          title="Nenhum produtor encontrado"
          description="Não encontramos produtores correspondentes à sua pesquisa. Tente buscar com outros termos."
          actionLabel="Limpar Pesquisa"
          onActionClick={() => {
            setSearchQuery('')
            setPage(1)
          }}
        />
      )}
    </div>
  )
}
