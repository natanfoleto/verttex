'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { RiAddLine, RiRefreshLine, RiStackLine } from 'react-icons/ri'

import { Button } from '@/components/ui/button'
import { TableWrapper } from '@/components/ui/table-wrapper'
import { apiClient } from '@/lib/api-client'

import { ReceivingFormDialog } from '../../estoque/components/receiving-form-dialog'

interface StockAvailabilityItem {
  variationId: string
  sku: string
  productName: string
  physicalQuantity: number
  reservedQuantity: number
  availableQuantity: number
  status: string
}

export function StoreInventoryTab({ storeId }: { storeId: string }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [isReceivingOpen, setIsReceivingOpen] = useState(false)

  const { data: stores = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['stores-dropdown'],
    queryFn: async () => {
      const res = await apiClient('/stores')
      return Array.isArray(res) ? res : ((res as any)?.data ?? [])
    },
  })

  const { data, isLoading, isError, refetch } = useQuery<
    StockAvailabilityItem[]
  >({
    queryKey: ['store-inventory', storeId, search],
    queryFn: async () => {
      const res = await apiClient<any>(
        `/stock/availability?storeId=${storeId}&search=${encodeURIComponent(search)}`,
      )
      return res?.data || res || []
    },
  })

  const allItems = (data || []).filter(
    (item) =>
      item.productName?.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase()),
  )

  const total = allItems.length
  const totalPages = Math.ceil(total / perPage) || 1
  const paginatedItems = allItems.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="space-y-6 text-zinc-100 antialiased">
      {/* Stock Table Wrapper */}
      <TableWrapper
        title="Estoque Físico e Disponível da Loja"
        description="Saldos físicos por SKU, quantidades reservadas em pedidos/checkout e saldo líquido comercial disponível."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        searchPlaceholder="Buscar por produto ou SKU..."
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && paginatedItems.length === 0}
        emptyTitle="Nenhum item de estoque encontrado"
        emptyDescription="Nenhum produto com registro de estoque para os filtros selecionados nesta loja."
        emptyIcon={<RiStackLine className="h-6 w-6 text-zinc-400" />}
        actionButton={
          <Button
            type="button"
            onClick={() => setIsReceivingOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl cursor-pointer"
          >
            <RiAddLine className="mr-1.5 h-4 w-4" />
            <span>Novo Recebimento</span>
          </Button>
        }
        filters={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="cursor-pointer text-xs h-9 border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-xl"
          >
            <RiRefreshLine className="h-3.5 w-3.5 mr-1" />
            <span>Atualizar</span>
          </Button>
        }
        meta={{
          page,
          perPage,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }}
        onPageChange={setPage}
        perPageValue={perPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage)
          setPage(1)
        }}
      >
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/60 text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-800">
            <tr>
              <th className="px-5 py-3.5">Produto / Variação</th>
              <th className="px-5 py-3.5">SKU</th>
              <th className="px-5 py-3.5 text-center font-mono">Físico</th>
              <th className="px-5 py-3.5 text-center font-mono">Reservado</th>
              <th className="px-5 py-3.5 text-center font-mono">Disponível</th>
              <th className="px-5 py-3.5 text-right">Status do Estoque</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {paginatedItems.map((item) => {
              const isLow = item.availableQuantity <= 5
              const isZero = item.availableQuantity <= 0

              return (
                <tr
                  key={item.variationId || item.sku}
                  className="hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-5 py-4 font-sans font-semibold text-zinc-100">
                    {item.productName}
                  </td>
                  <td className="px-5 py-4 text-zinc-400 font-mono">
                    {item.sku}
                  </td>
                  <td className="px-5 py-4 text-center font-bold text-zinc-100">
                    {item.physicalQuantity}
                  </td>
                  <td className="px-5 py-4 text-center text-blue-400">
                    {item.reservedQuantity}
                  </td>
                  <td
                    className={`px-5 py-4 text-center font-bold ${
                      isZero
                        ? 'text-rose-400'
                        : isLow
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    {item.availableQuantity}
                  </td>
                  <td className="px-5 py-4 text-right font-sans">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                        isZero
                          ? 'border-rose-900/60 bg-rose-950/60 text-rose-400'
                          : isLow
                            ? 'border-amber-900/60 bg-amber-950/60 text-amber-400'
                            : 'border-emerald-900/60 bg-emerald-950/60 text-emerald-400'
                      }`}
                    >
                      {isZero
                        ? 'Sem Estoque'
                        : isLow
                          ? 'Estoque Baixo'
                          : 'Normal'}
                    </span>
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
    </div>
  )
}
