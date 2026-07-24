'use client'

import { ReactNode, useEffect, useState } from 'react'
import {
  RiArrowLeftDoubleLine,
  RiArrowLeftSLine,
  RiArrowRightDoubleLine,
  RiArrowRightSLine,
  RiSearchLine,
} from 'react-icons/ri'

import { DataTableSkeleton } from '../skeletons/data-table-skeleton'
import { NativeSelect } from './native-select'

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
  perPageValue?: number
  onPerPageChange?: (perPage: number) => void
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
  perPageValue,
  onPerPageChange,
  children,
  isEmpty,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription = 'Não existem itens correspondentes aos critérios informados.',
}: TableWrapperProps) {
  const [pageInput, setPageInput] = useState(String(meta?.page || 1))

  useEffect(() => {
    if (meta?.page) {
      setPageInput(String(meta.page))
    }
  }, [meta?.page])

  const handlePageSubmit = () => {
    const parsed = parseInt(pageInput, 10)
    if (!isNaN(parsed) && meta) {
      const validPage = Math.max(1, Math.min(meta.totalPages, parsed))
      setPageInput(String(validPage))
      if (validPage !== meta.page) {
        onPageChange?.(validPage)
      }
    } else if (meta) {
      setPageInput(String(meta.page))
    }
  }

  const currentPerPage = perPageValue || meta?.perPage || 10

  return (
    <div className="space-y-6 font-sans">
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
          <DataTableSkeleton columns={5} rows={6} />
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
        {meta && onPageChange && (
          <div className="flex flex-col gap-4 border-t border-zinc-800/80 bg-zinc-900/60 px-6 py-3.5 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Records summary */}
            <div>
              Mostrando{' '}
              <span className="font-semibold text-zinc-200">
                {meta.total > 0 ? (meta.page - 1) * meta.perPage + 1 : 0}
              </span>{' '}
              –{' '}
              <span className="font-semibold text-zinc-200">
                {Math.min(meta.page * meta.perPage, meta.total)}
              </span>{' '}
              de{' '}
              <span className="font-semibold text-zinc-200">{meta.total}</span>{' '}
              registros
            </div>

            {/* Right: perPage Select | Divider | Page navigation, input & First/Last buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* perPage Select */}
              {onPerPageChange && (
                <>
                  <NativeSelect
                    value={currentPerPage}
                    onChange={(e) => onPerPageChange(Number(e.target.value))}
                    wrapperClassName="w-20"
                    className="h-8 py-0 px-2 text-xs font-medium"
                    title="Registros por página"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </NativeSelect>
                  <div className="h-5 w-px bg-zinc-800" />
                </>
              )}

              {/* Navigation Controls Tightly Grouped */}
              <div className="flex items-center gap-1">
                {/* First Page button */}
                <button
                  type="button"
                  title="Primeira página"
                  disabled={meta.page <= 1}
                  onClick={() => onPageChange(1)}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RiArrowLeftDoubleLine className="h-4.5 w-4.5" />
                </button>

                {/* Previous Page button */}
                <button
                  type="button"
                  title="Página anterior"
                  disabled={!meta.hasPreviousPage}
                  onClick={() => onPageChange(meta.page - 1)}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RiArrowLeftSLine className="h-4.5 w-4.5" />
                </button>

                {/* Page Direct Input & Total Pages Readonly Input */}
                <div className="flex items-center space-x-1.5 px-1.5">
                  <span>Página</span>
                  <input
                    type="number"
                    min={1}
                    max={meta.totalPages || 1}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                    }}
                    onBlur={handlePageSubmit}
                    className="h-8 w-10 rounded-lg border border-zinc-800 bg-zinc-950 px-1 text-center font-semibold text-zinc-100 transition-colors focus:border-emerald-600 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    title="Ir para página"
                  />
                  <span>de</span>
                  <input
                    type="text"
                    readOnly
                    value={meta.totalPages || 1}
                    tabIndex={-1}
                    className="h-8 w-10 cursor-default rounded-lg border border-zinc-800 bg-zinc-950 px-1 text-center font-semibold text-zinc-100 focus:outline-none select-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    title="Total de páginas"
                  />
                </div>

                {/* Next Page button */}
                <button
                  type="button"
                  title="Próxima página"
                  disabled={!meta.hasNextPage}
                  onClick={() => onPageChange(meta.page + 1)}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RiArrowRightSLine className="h-4.5 w-4.5" />
                </button>

                {/* Last Page button */}
                <button
                  type="button"
                  title="Última página"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => onPageChange(meta.totalPages)}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RiArrowRightDoubleLine className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
