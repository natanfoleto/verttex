'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiLockLine,
  RiRefreshLine,
  RiStackLine,
} from 'react-icons/ri'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { TableWrapper } from '@/components/ui/table-wrapper'
import { apiClient } from '@/lib/api-client'

import type { LotWithStockItem } from '../../estoque/components/discard-form-dialog'
import { DiscardFormDialog } from '../../estoque/components/discard-form-dialog'
import { ReceivingFormDialog } from '../../estoque/components/receiving-form-dialog'
import type { LotItem } from '../../estoque/components/status-form-dialog'
import { StatusFormDialog } from '../../estoque/components/status-form-dialog'

interface ExtendedLotItem extends LotItem {
  id: string
  lotNumber: string
  manufacturer?: string | null
  supplier?: string | null
  manufacturingDate?: string | null
  expirationDate?: string | null
  status: 'available' | 'quarantine' | 'blocked' | 'recalled'
  notes?: string | null
  product: { id: string; name: string; slug: string }
  variation?: { id: string; sku: string } | null
  store: { id: string; name: string }
  expirationAnalysis: {
    condition: 'valid' | 'warning' | 'insufficient' | 'expired'
    daysRemaining: number | null
    isExpired: boolean
  }
  stockSummary: {
    physicalQuantity: number
    reservedQuantity: number
    availableQuantity: number
  }
  stockItems: Array<{
    id: string
    locationId: string
    physicalQuantity: number
    reservedQuantity: number
    location: { id: string; name: string; code: string }
  }>
}

export function StoreLotsTab({ storeId }: { storeId: string }) {
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expirationFilter, setExpirationFilter] = useState<string>('all')

  // Modals
  const [isReceivingOpen, setIsReceivingOpen] = useState(false)
  const [statusModalLot, setStatusModalLot] = useState<LotItem | null>(null)
  const [discardModalLot, setDiscardModalLot] =
    useState<LotWithStockItem | null>(null)

  const { data: stores = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['stores-dropdown'],
    queryFn: async () => {
      const res = await apiClient('/stores')
      return Array.isArray(res)
        ? res
        : ((res as { data?: Array<{ id: string; name: string }> })?.data ?? [])
    },
  })

  const {
    data: lotsRes,
    isLoading,
    isError,
  } = useQuery<{
    data: ExtendedLotItem[]
    meta: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
  }>({
    queryKey: [
      'lots-list-store',
      storeId,
      page,
      limit,
      statusFilter,
      expirationFilter,
      search,
    ],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', String(limit))
      params.append('storeId', storeId)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (expirationFilter !== 'all')
        params.append('expirationCondition', expirationFilter)
      if (search) params.append('search', search)

      const res = await apiClient<{
        data: ExtendedLotItem[]
        meta: {
          page: number
          limit: number
          total: number
          totalPages: number
          hasNextPage: boolean
          hasPreviousPage: boolean
        }
      }>(`/lots?${params.toString()}`)
      return res
    },
  })

  const lotsList: ExtendedLotItem[] = lotsRes?.data ?? []

  return (
    <div className="space-y-6 text-zinc-100 antialiased">
      <TableWrapper
        title="Lotes de Produtos & Controle FEFO"
        description="Gestão sanitária por lote, datas de validade, quarentena e descarte de produtos."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        searchPlaceholder="Buscar por lote, produto, fabricante..."
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && lotsList.length === 0}
        emptyTitle="Nenhum lote encontrado"
        emptyDescription="Nenhum lote encontrado para esta loja."
        emptyIcon={<RiStackLine className="h-6 w-6 text-zinc-400" />}
        actionButton={
          <Button
            type="button"
            onClick={() => setIsReceivingOpen(true)}
            className="cursor-pointer rounded-xl bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-500"
          >
            <RiAddLine className="mr-1.5 h-4 w-4" />
            <span>Novo Recebimento de Lotes</span>
          </Button>
        }
        meta={
          lotsRes?.meta
            ? {
                page: lotsRes.meta.page,
                perPage: lotsRes.meta.limit,
                total: lotsRes.meta.total,
                totalPages: lotsRes.meta.totalPages,
                hasNextPage: lotsRes.meta.page < lotsRes.meta.totalPages,
                hasPreviousPage: lotsRes.meta.page > 1,
              }
            : undefined
        }
        onPageChange={setPage}
        perPageValue={limit}
        onPerPageChange={(newLimit) => {
          setLimit(newLimit)
          setPage(1)
        }}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              value={expirationFilter}
              onChange={(e) => {
                setExpirationFilter(e.target.value)
                setPage(1)
              }}
              wrapperClassName="w-48"
            >
              <option value="all">Validade: Todas</option>
              <option value="valid">Válidos</option>
              <option value="warning">Próximos do Vencimento</option>
              <option value="insufficient">Prazo Insuficiente</option>
              <option value="expired">Vencidos</option>
            </NativeSelect>

            <NativeSelect
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              wrapperClassName="w-44"
            >
              <option value="all">Status: Todos</option>
              <option value="available">Disponível</option>
              <option value="quarantine">Quarentena</option>
              <option value="blocked">Bloqueado</option>
              <option value="recalled">Recolhido (Recall)</option>
            </NativeSelect>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ['lots-list-store'] })
              }
              className="cursor-pointer rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              <RiRefreshLine className="mr-1.5 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        }
      >
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-800 bg-zinc-950/60 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            <tr>
              <th className="px-4 py-3.5">Código do Lote</th>
              <th className="px-4 py-3.5">Produto / SKU</th>
              <th className="px-4 py-3.5">Fabricante / Fornecedor</th>
              <th className="px-4 py-3.5">Validade</th>
              <th className="px-4 py-3.5">Status Operacional</th>
              <th className="px-4 py-3.5">Saldo Físico / FEFO</th>
              <th className="px-4 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
            {lotsList.map((lot) => {
              const exp = lot.expirationAnalysis
              return (
                <tr
                  key={lot.id}
                  className="transition-colors hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-3.5 font-mono font-bold text-zinc-100">
                    {lot.lotNumber}
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="block font-semibold text-zinc-100">
                      {lot.product?.name}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500">
                      {lot.variation?.sku || 'SKU Padrão'}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-zinc-400">
                    <span>{lot.manufacturer || 'Não informado'}</span>
                  </td>

                  <td className="px-4 py-3.5">
                    {lot.expirationDate ? (
                      <div>
                        <span className="block font-mono text-zinc-200">
                          {new Date(lot.expirationDate).toLocaleDateString(
                            'pt-BR',
                          )}
                        </span>
                        <span
                          className={`text-[11px] font-medium ${
                            exp.isExpired
                              ? 'text-rose-400'
                              : exp.condition === 'warning'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                          }`}
                        >
                          {exp.isExpired
                            ? `Vencido há ${Math.abs(exp.daysRemaining || 0)} dias`
                            : `${exp.daysRemaining} dias restantes`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-500">Sem validade</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    {lot.status === 'available' && (
                      <Badge className="border-emerald-800/80 bg-emerald-950/80 text-[11px] text-emerald-400">
                        Disponível
                      </Badge>
                    )}
                    {lot.status === 'quarantine' && (
                      <Badge className="border-amber-800/80 bg-amber-950/80 text-[11px] text-amber-400">
                        Quarentena
                      </Badge>
                    )}
                    {lot.status === 'blocked' && (
                      <Badge className="border-rose-800/80 bg-rose-950/80 text-[11px] text-rose-400">
                        Bloqueado
                      </Badge>
                    )}
                    {lot.status === 'recalled' && (
                      <Badge className="border-purple-800/80 bg-purple-950/80 text-[11px] text-purple-400">
                        Recolhido (Recall)
                      </Badge>
                    )}
                  </td>

                  <td className="px-4 py-3.5 font-mono">
                    <span className="block font-semibold text-zinc-100">
                      Físico: {lot.stockSummary?.physicalQuantity || 0}
                    </span>
                    <span className="text-[11px] text-emerald-400">
                      Disponível: {lot.stockSummary?.availableQuantity || 0}
                    </span>
                  </td>

                  <td className="space-x-2 px-4 py-3.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatusModalLot(lot)}
                      className="cursor-pointer border-zinc-800 bg-zinc-900 text-[11px] text-zinc-300 hover:bg-zinc-800"
                    >
                      <RiLockLine className="mr-1 h-3.5 w-3.5" />
                      <span>Status</span>
                    </Button>

                    {exp?.isExpired &&
                      (lot.stockSummary?.physicalQuantity || 0) > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDiscardModalLot(lot)}
                          className="cursor-pointer border border-rose-800/80 bg-rose-950 text-[11px] text-rose-200 hover:bg-rose-900"
                        >
                          <RiDeleteBin6Line className="mr-1 h-3.5 w-3.5" />
                          <span>Descartar</span>
                        </Button>
                      )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableWrapper>

      {/* Standalone Modals */}
      <ReceivingFormDialog
        open={isReceivingOpen}
        onOpenChange={setIsReceivingOpen}
        stores={stores}
        defaultStoreId={storeId}
      />

      <StatusFormDialog
        lot={statusModalLot}
        open={Boolean(statusModalLot)}
        onOpenChange={(open) => {
          if (!open) setStatusModalLot(null)
        }}
      />

      <DiscardFormDialog
        lot={discardModalLot}
        open={Boolean(discardModalLot)}
        onOpenChange={(open) => {
          if (!open) setDiscardModalLot(null)
        }}
      />
    </div>
  )
}
