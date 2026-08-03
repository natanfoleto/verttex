'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  RiArrowRightLine,
  RiCheckDoubleLine,
  RiCloseCircleLine,
  RiShoppingBag3Line,
  RiStore2Line,
  RiTimeLine,
  RiTruckLine,
} from 'react-icons/ri'

import { apiClient } from '../../lib/api-client'

interface OrderItemSummary {
  id: string
  productName: string
  variationName: string
  quantity: number
  price: number
  subtotal: number
  imageUrl?: string
}

interface OrderSummary {
  id: string
  code: string
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  store: {
    id: string
    name: string
    logoUrl?: string
  }
  items: OrderItemSummary[]
}

interface OrdersResponse {
  items: OrderSummary[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function CustomerOrdersPage() {
  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['customer-orders'],
    queryFn: async () => apiClient<OrdersResponse>('/orders'),
  })

  const getStatusBadge = (status: OrderSummary['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <RiTimeLine className="h-3.5 w-3.5" /> Aguardando Pagamento
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <RiCheckDoubleLine className="h-3.5 w-3.5" /> Confirmado
          </span>
        )
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <RiTruckLine className="h-3.5 w-3.5" /> Em Transporte
          </span>
        )
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <RiCheckDoubleLine className="h-3.5 w-3.5" /> Entregue
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <RiCloseCircleLine className="h-3.5 w-3.5" /> Cancelado
          </span>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6 font-sans antialiased">
        <div className="h-8 w-48 bg-stone-200 rounded animate-pulse" />
        <div className="space-y-4">
          <div className="h-40 bg-white rounded-3xl border border-stone-200 p-6 animate-pulse" />
          <div className="h-40 bg-white rounded-3xl border border-stone-200 p-6 animate-pulse" />
        </div>
      </div>
    )
  }

  const orders = data?.items || []

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 font-sans text-stone-900 antialiased space-y-8">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
          Meus Pedidos
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Acompanhe o status e a entrega dos seus produtos regionais.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center border border-dashed rounded-3xl bg-white p-8 space-y-4">
          <RiShoppingBag3Line className="mx-auto h-16 w-16 text-stone-300" />
          <h2 className="text-lg font-bold text-stone-900">
            Você ainda não fez nenhum pedido
          </h2>
          <p className="text-xs text-stone-500">
            Explore nosso mercado artesanal e faça sua primeira compra.
          </p>
          <Link
            href="/produtos"
            className="inline-flex items-center space-x-2 rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 cursor-pointer"
          >
            <span>Ir para o Catálogo</span>
            <RiArrowRightLine className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const dateFormatted = new Date(order.createdAt).toLocaleDateString(
              'pt-BR',
              {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              },
            )

            return (
              <div
                key={order.id}
                className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs hover:border-stone-300 transition-all space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-extrabold text-stone-900">
                      #{order.code}
                    </span>
                    <span className="text-stone-300">|</span>
                    <span className="text-xs text-stone-500">
                      {dateFormatted}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <RiStore2Line className="h-5 w-5 text-emerald-800" />
                    <span className="text-xs font-bold text-stone-800">
                      {order.store.name}
                    </span>
                    <span className="text-xs text-stone-400">
                      ({order.items.length} item/itens)
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-[11px] text-stone-500 uppercase font-semibold">
                        Total
                      </p>
                      <p className="text-base font-extrabold text-stone-900">
                        R$ {Number(order.totalAmount).toFixed(2)}
                      </p>
                    </div>

                    <Link
                      href={`/pedidos/${order.code}`}
                      className="inline-flex items-center space-x-1.5 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 transition-all cursor-pointer"
                    >
                      <span>Ver Detalhes</span>
                      <RiArrowRightLine className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
