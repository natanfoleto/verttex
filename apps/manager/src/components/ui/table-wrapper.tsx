'use client'

import { ReactNode } from 'react'
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiSearchLine,
} from 'react-icons/ri'

interface MetaData {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface TableWrapperProps {
  title: string
  description?: string
  actionButton?: ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: ReactNode
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  meta?: MetaData
  onPageChange?: (page: number) => void
  children: ReactNode
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

export function TableWrapper({
  title,
  description,
  actionButton,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  isLoading,
  isError,
  errorMessage = 'Ocorreu um erro ao carregar os dados.',
  meta,
  onPageChange,
  children,
  isEmpty,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription = 'Não existem itens correspondentes aos critérios informados.',
}: TableWrapperProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-zinc-400">{description}</p>
          )}
        </div>
        {actionButton && <div>{actionButton}</div>}
      </div>

      {/* Control Bar (Search + Filters) */}
      {(onSearchChange || filters) && (
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center">
          {onSearchChange ? (
            <div className="relative max-w-md flex-1">
              <RiSearchLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pr-4 pl-10 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 focus:outline-none"
              />
            </div>
          ) : (
            <div />
          )}

          {filters && <div className="flex items-center gap-2">{filters}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 shadow-sm">
        {isLoading ? (
          <div className="space-y-4 p-8">
            <div className="h-6 w-1/4 animate-pulse rounded bg-zinc-800/60" />
            <div className="space-y-3 pt-2">
              <div className="h-10 animate-pulse rounded bg-zinc-800/40" />
              <div className="h-10 animate-pulse rounded bg-zinc-800/40" />
              <div className="h-10 animate-pulse rounded bg-zinc-800/40" />
            </div>
          </div>
        ) : isError ? (
          <div className="space-y-3 p-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-rose-800/50 bg-rose-950/60 text-rose-400">
              !
            </div>
            <h3 className="text-base font-semibold text-zinc-200">
              Erro de carregamento
            </h3>
            <p className="mx-auto max-w-sm text-sm text-zinc-400">
              {errorMessage}
            </p>
          </div>
        ) : isEmpty ? (
          <div className="space-y-3 p-12 text-center">
            <h3 className="text-base font-semibold text-zinc-300">
              {emptyTitle}
            </h3>
            <p className="mx-auto max-w-sm text-sm text-zinc-500">
              {emptyDescription}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">{children}</div>
        )}

        {/* Pagination Controls */}
        {meta && meta.totalPages > 1 && onPageChange && (
          <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/60 px-6 py-4 text-sm text-zinc-400">
            <div>
              Mostrando página{' '}
              <span className="font-semibold text-zinc-200">{meta.page}</span>{' '}
              de{' '}
              <span className="font-semibold text-zinc-200">
                {meta.totalPages}
              </span>{' '}
              ({meta.total} registros)
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={!meta.hasPreviousPage}
                onClick={() => onPageChange(meta.page - 1)}
                className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RiArrowLeftSLine className="mr-1 h-4 w-4" />
                Anterior
              </button>
              <button
                disabled={!meta.hasNextPage}
                onClick={() => onPageChange(meta.page + 1)}
                className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
                <RiArrowRightSLine className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
