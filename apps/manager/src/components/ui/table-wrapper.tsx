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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-zinc-400 mt-1">{description}</p>
          )}
        </div>
        {actionButton && <div>{actionButton}</div>}
      </div>

      {/* Control Bar (Search + Filters) */}
      {(onSearchChange || filters) && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
          {onSearchChange ? (
            <div className="relative flex-1 max-w-md">
              <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors"
              />
            </div>
          ) : (
            <div />
          )}

          {filters && <div className="flex items-center gap-2">{filters}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <div className="h-6 bg-zinc-800/60 rounded animate-pulse w-1/4" />
            <div className="space-y-3 pt-2">
              <div className="h-10 bg-zinc-800/40 rounded animate-pulse" />
              <div className="h-10 bg-zinc-800/40 rounded animate-pulse" />
              <div className="h-10 bg-zinc-800/40 rounded animate-pulse" />
            </div>
          </div>
        ) : isError ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-950/60 text-rose-400 border border-rose-800/50">
              !
            </div>
            <h3 className="text-base font-semibold text-zinc-200">
              Erro de carregamento
            </h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              {errorMessage}
            </p>
          </div>
        ) : isEmpty ? (
          <div className="p-12 text-center space-y-3">
            <h3 className="text-base font-semibold text-zinc-300">
              {emptyTitle}
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              {emptyDescription}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">{children}</div>
        )}

        {/* Pagination Controls */}
        {meta && meta.totalPages > 1 && onPageChange && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/60 text-sm text-zinc-400">
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
                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <RiArrowLeftSLine className="h-4 w-4 mr-1" />
                Anterior
              </button>
              <button
                disabled={!meta.hasNextPage}
                onClick={() => onPageChange(meta.page + 1)}
                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Próxima
                <RiArrowRightSLine className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
