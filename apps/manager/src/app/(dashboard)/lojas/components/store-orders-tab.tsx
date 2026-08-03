'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  RiCheckLine,
  RiRefreshLine,
  RiShoppingBag3Line,
  RiTruckLine,
} from 'react-icons/ri'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { TableWrapper } from '@/components/ui/table-wrapper'
import { apiClient, ApiError } from '@/lib/api-client'

import { OrderDispatchDialog } from '../../pedidos/components/order-dispatch-dialog'

interface OrderItem {
  id: string
  orderId: string
  orderCode: string
  customerName: string
  totalAmount: number
  subtotal: number
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  paymentStatus: string
  trackingCode?: string
  createdAt: string
}

export function StoreOrdersTab({ storeId }: { storeId: string }) {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [dispatchOrderId, setDispatchOrderId] = useState<string | null>(null)
  const [dispatchOrderCode, setDispatchOrderCode] = useState<string>('')

  const {
    data: ordersRes,
    isLoading,
    isError,
  } = useQuery<{
    data: OrderItem[]
    meta: { page: number; perPage: number; total: number; totalPages: number }
  }>({
    queryKey: [
      'store-orders-tab',
      storeId,
      search,
      statusFilter,
      page,
      perPage,
    ],
    queryFn: async () => {
      let url = `/orders?storeId=${storeId}&page=${page}&limit=${perPage}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      if (statusFilter && statusFilter !== 'ALL')
        url += `&status=${statusFilter}`

      const res = await apiClient<any>(url)
      if (res && res.meta) {
        return {
          data: res.data || [],
          meta: res.meta,
        }
      }
      const dataArr = Array.isArray(res) ? res : (res?.data ?? [])
      return {
        data: dataArr,
        meta: {
          page,
          perPage,
          total: dataArr.length,
          totalPages: Math.ceil(dataArr.length / perPage) || 1,
        },
      }
    },
  })

  const ordersList = ordersRes?.data || []

  const deliverMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/orders/${id}/deliver`, { method: 'POST' })
    },
    onSuccess: () => {
      toast.success('Pedido marcado como Entregue!')
      queryClient.invalidateQueries({ queryKey: ['store-orders-tab'] })
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) toast.error(err.message)
      else toast.error('Erro ao confirmar entrega')
    },
  })

  const statusBadges: Record<string, { label: string; bg: string }> = {
    PENDING: {
      label: 'Pendente',
      bg: 'bg-amber-950/60 text-amber-400 border-amber-800/40',
    },
    PAID: {
      label: 'Pago (Aguardando Expedição)',
      bg: 'bg-blue-950/60 text-blue-400 border-blue-800/40',
    },
    SHIPPED: {
      label: 'Em Trânsito',
      bg: 'bg-purple-950/60 text-purple-400 border-purple-800/40',
    },
    DELIVERED: {
      label: 'Entregue',
      bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
    },
    CANCELLED: {
      label: 'Cancelado',
      bg: 'bg-rose-950/60 text-rose-400 border-rose-800/40',
    },
  }

  return (
    <div className="space-y-6 font-sans text-zinc-100 antialiased">
      <TableWrapper
        title="Gestão de Pedidos da Loja"
        description="Acompanhe pedidos recebidos por esta loja parceira, execute a expedição sanitária FEFO e gerencie entregas."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        searchPlaceholder="Buscar por código ou cliente..."
        filters={
          <div className="flex items-center gap-2">
            <NativeSelect
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              wrapperClassName="w-56"
            >
              <option value="ALL">Todos os Status</option>
              <option value="PAID">Aguardando Expedição (Pago)</option>
              <option value="SHIPPED">Em Trânsito (Expedido)</option>
              <option value="DELIVERED">Entregues</option>
              <option value="CANCELLED">Cancelados</option>
            </NativeSelect>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ['store-orders-tab'],
                })
              }
              className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs cursor-pointer"
            >
              <RiRefreshLine className="mr-1.5 h-4 w-4" />
              <span>Atualizar</span>
            </Button>
          </div>
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && ordersList.length === 0}
        emptyTitle="Nenhum pedido encontrado"
        emptyDescription="Nenhum pedido cadastrado ou correspondente aos filtros informados para esta loja."
        emptyIcon={<RiShoppingBag3Line className="h-6 w-6 text-zinc-400" />}
        meta={ordersRes?.meta}
        onPageChange={setPage}
        perPageValue={perPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage)
          setPage(1)
        }}
      >
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5 font-bold">Código</th>
              <th className="px-5 py-3.5 font-bold">Cliente</th>
              <th className="px-5 py-3.5 font-bold font-mono text-right">
                Subtotal Loja
              </th>
              <th className="px-5 py-3.5 font-bold text-center">Status</th>
              <th className="px-5 py-3.5 font-bold">Rastreamento</th>
              <th className="px-5 py-3.5 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {ordersList.map((o) => (
              <tr key={o.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                  {o.orderCode || (o as any).code}
                </td>
                <td className="px-5 py-4 font-medium text-zinc-200">
                  {o.customerName || (o as any).customer?.name || 'Cliente'}
                </td>
                <td className="px-5 py-4 font-bold text-zinc-100 font-mono text-right">
                  R$ {Number(o.subtotal || o.totalAmount || 0).toFixed(2)}
                </td>
                <td className="px-5 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      statusBadges[o.status]?.bg || 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {statusBadges[o.status]?.label || o.status}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-zinc-400">
                  {o.trackingCode || '—'}
                </td>
                <td className="px-5 py-4 text-right space-x-2">
                  {o.status === 'PAID' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setDispatchOrderId(o.id)
                        setDispatchOrderCode(o.orderCode || (o as any).code)
                      }}
                      className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      <RiTruckLine className="h-3.5 w-3.5 mr-1" />
                      <span>Expedir (FEFO)</span>
                    </Button>
                  )}
                  {o.status === 'SHIPPED' && (
                    <Button
                      size="sm"
                      onClick={() => deliverMutation.mutate(o.id)}
                      disabled={deliverMutation.isPending}
                      className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                    >
                      <RiCheckLine className="h-3.5 w-3.5 mr-1" />
                      <span>Confirmar Entrega</span>
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>

      {/* Dispatch Dialog */}
      <OrderDispatchDialog
        open={Boolean(dispatchOrderId)}
        onOpenChange={(open) => {
          if (!open) setDispatchOrderId(null)
        }}
        orderId={dispatchOrderId}
        orderCode={dispatchOrderCode}
      />
    </div>
  )
}
