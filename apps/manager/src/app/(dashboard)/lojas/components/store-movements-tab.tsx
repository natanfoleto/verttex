'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { RiHistoryLine, RiRefreshLine } from 'react-icons/ri'

import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { TableWrapper } from '@/components/ui/table-wrapper'
import { apiClient } from '@/lib/api-client'

interface StockMovementItem {
  id: string
  type: string
  quantity: number
  reason?: string | null
  referenceId?: string | null
  createdAt: string
  variation?: {
    sku: string
    product?: { name: string }
  }
  user?: {
    name: string
    email: string
  }
}

export function StoreMovementsTab({ storeId }: { storeId: string }) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [typeFilter, setTypeFilter] = useState('ALL')

  const {
    data: res,
    isLoading,
    isError,
  } = useQuery<{
    data: StockMovementItem[]
    meta: { page: number; perPage: number; total: number; totalPages: number }
  }>({
    queryKey: ['store-movements-tab', storeId, search, page, limit, typeFilter],
    queryFn: async () => {
      let url = `/stock/movements?storeId=${storeId}&page=${page}&perPage=${limit}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      if (typeFilter !== 'ALL') url += `&type=${encodeURIComponent(typeFilter)}`

      const response = await apiClient<{
        data: StockMovementItem[]
        meta: {
          page: number
          perPage: number
          total: number
          totalPages: number
        }
      }>(url)
      return {
        data: response?.data || [],
        meta: response?.meta || {
          page,
          perPage: limit,
          total: response?.data?.length || 0,
          totalPages: 1,
        },
      }
    },
  })

  const movementsList = res?.data || []

  return (
    <div className="space-y-6 text-zinc-100 antialiased">
      <TableWrapper
        title="Histórico de Movimentações Físicas de Estoque"
        description="Auditoria detalhada de entradas, recebimentos, saídas por vendas FEFO, descartes e transferências."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        searchPlaceholder="Buscar por tipo, produto, SKU ou motivo..."
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && movementsList.length === 0}
        emptyTitle="Nenhuma movimentação encontrada"
        emptyDescription="Nenhuma movimentação física registrada para os filtros selecionados nesta loja."
        emptyIcon={<RiHistoryLine className="h-6 w-6 text-zinc-400" />}
        filters={
          <div className="flex items-center gap-2">
            <NativeSelect
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              wrapperClassName="w-52"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="INVENTORY_RECEIVING">Recebimento</option>
              <option value="FEFO_SALES_OUT">Venda (Saída FEFO)</option>
              <option value="INVENTORY_ADJUSTMENT">Ajuste de Inventário</option>
              <option value="EXPIRATION_DISCARD">Descarte por Validade</option>
              <option value="DAMAGE_DISCARD">Descarte por Dano</option>
              <option value="TRANSFER">Transferência Interna</option>
            </NativeSelect>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ['store-movements-tab'],
                })
              }
              className="cursor-pointer text-xs h-9 border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-xl"
            >
              <RiRefreshLine className="h-3.5 w-3.5 mr-1" />
              <span>Atualizar</span>
            </Button>
          </div>
        }
        meta={res?.meta}
        onPageChange={setPage}
        perPageValue={limit}
        onPerPageChange={(newLimit) => {
          setLimit(newLimit)
          setPage(1)
        }}
      >
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/60 text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-800">
            <tr>
              <th className="px-5 py-3.5">Data & Hora</th>
              <th className="px-5 py-3.5">Tipo de Operação</th>
              <th className="px-5 py-3.5">Produto / SKU</th>
              <th className="px-5 py-3.5 text-center">Quantidade</th>
              <th className="px-5 py-3.5">Motivo / Obs.</th>
              <th className="px-5 py-3.5 text-right">Usuário Responsável</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {movementsList.map((mov) => (
              <tr
                key={mov.id}
                className="hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-5 py-4 text-zinc-400">
                  {new Date(mov.createdAt).toLocaleString('pt-BR')}
                </td>
                <td className="px-5 py-4 font-sans">
                  <span className="inline-flex items-center rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-200 uppercase">
                    {mov.type}
                  </span>
                </td>
                <td className="px-5 py-4 font-sans text-zinc-200">
                  <span className="block font-semibold">
                    {mov.variation?.product?.name || 'Produto'}
                  </span>
                  {mov.variation?.sku && (
                    <span className="font-mono text-[11px] text-zinc-500">
                      {mov.variation.sku}
                    </span>
                  )}
                </td>
                <td
                  className={`px-5 py-4 text-center font-bold font-mono text-sm ${
                    mov.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                </td>
                <td className="px-5 py-4 font-sans text-zinc-400 max-w-xs truncate">
                  {mov.reason || mov.referenceId || 'Sem observações'}
                </td>
                <td className="px-5 py-4 text-right font-sans text-zinc-300">
                  {mov.user?.name || 'Sistema / API'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  )
}
