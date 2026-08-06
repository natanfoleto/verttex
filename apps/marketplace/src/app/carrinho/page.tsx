'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import {
  RiAddLine,
  RiArrowRightLine,
  RiCoupon3Line,
  RiDeleteBin6Line,
  RiShoppingBag3Line,
  RiStore2Line,
  RiSubtractLine,
  RiTicketLine,
} from 'react-icons/ri'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { CartSummary } from '../../components/cart/cart-sheet'
import { MarketplacePageLoader } from '../../components/ui/marketplace-page-loader'
import { apiClient, ApiError } from '../../lib/api-client'

export default function CartPage() {
  const queryClient = useQueryClient()
  const [couponCode, setCouponCode] = useState('')

  const { data: summary, isLoading } = useQuery<CartSummary>({
    queryKey: ['cart-summary'],
    queryFn: async () => {
      const res = await apiClient<CartSummary>('/customer/cart')
      return res
    },
  })

  const updateQuantityMutation = useMutation({
    mutationFn: async ({
      itemId,
      quantity,
    }: {
      itemId: string
      quantity: number
    }) => {
      await apiClient(`/customer/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-summary'] })
    },
    onError: (err: ApiError) => {
      toast.error(err.message || 'Erro ao atualizar quantidade.')
    },
  })

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiClient(`/customer/cart/items/${itemId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      toast.success('Item removido do carrinho.')
      queryClient.invalidateQueries({ queryKey: ['cart-summary'] })
    },
    onError: (err: ApiError) => {
      toast.error(err.message || 'Erro ao remover item.')
    },
  })

  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      await apiClient('/customer/cart/coupons', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
    },
    onSuccess: () => {
      toast.success('Cupom aplicado com sucesso!')
      setCouponCode('')
      queryClient.invalidateQueries({ queryKey: ['cart-summary'] })
    },
    onError: (err: ApiError) => {
      toast.error(err.message || 'Cupom inválido ou expirado.')
    },
  })

  const removeCouponMutation = useMutation({
    mutationFn: async () => {
      await apiClient('/customer/cart/coupons', {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      toast.success('Cupom removido')
      queryClient.invalidateQueries({ queryKey: ['cart-summary'] })
    },
  })

  if (isLoading) {
    return <MarketplacePageLoader label="Carregando carrinho..." />
  }

  const hasItems = summary && summary.stores.length > 0

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 font-sans text-stone-900 antialiased sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
          Meu Carrinho de Compras
        </h1>
        <p className="mt-1 text-xs text-stone-500">
          Revise seus produtos artesanais agrupados por produtor antes do
          checkout.
        </p>
      </div>

      {hasItems ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Multi-Store Grouped Items */}
          <div className="space-y-6 lg:col-span-8">
            {summary.stores.map((storeGroup) => (
              <div
                key={storeGroup.store.id}
                className="space-y-4 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs"
              >
                {/* Store Producer Header */}
                <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-800">
                      <RiStore2Line className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-stone-900">
                        {storeGroup.store.name}
                      </h2>
                      <p className="text-[11px] text-stone-500">
                        Produtor Local / Artesão
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-stone-600">
                    Subtotal Lojista: R$ {storeGroup.storeSubtotal.toFixed(2)}
                  </span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-stone-100">
                  {storeGroup.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 flex-1 items-center space-x-4">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-16 w-16 shrink-0 rounded-xl border border-stone-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-400">
                            <RiShoppingBag3Line className="h-8 w-8" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/produtos`}
                            className="block truncate text-sm font-bold text-stone-900 hover:text-emerald-800"
                          >
                            {item.productName}
                          </Link>
                          <p className="mt-0.5 font-mono text-[11px] text-stone-400">
                            SKU: {item.sku}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-stone-700">
                            R$ {item.unitPrice.toFixed(2)} / un
                          </p>
                        </div>
                      </div>

                      {/* Quantity Controls & Item Total */}
                      <div className="flex items-center justify-between space-x-6 sm:justify-end">
                        <div className="flex items-center space-x-1 rounded-lg border border-stone-200 bg-stone-50 p-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateQuantityMutation.mutate({
                                  itemId: item.id,
                                  quantity: item.quantity - 1,
                                })
                              } else {
                                removeItemMutation.mutate(item.id)
                              }
                            }}
                            className="h-6 w-6 cursor-pointer p-0 text-stone-600 hover:text-stone-900"
                          >
                            <RiSubtractLine className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-8 text-center text-xs font-bold">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              updateQuantityMutation.mutate({
                                itemId: item.id,
                                quantity: item.quantity + 1,
                              })
                            }}
                            className="h-6 w-6 cursor-pointer p-0 text-stone-600 hover:text-stone-900"
                          >
                            <RiAddLine className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="min-w-20 text-right">
                          <span className="text-xs font-bold text-stone-900 sm:text-sm">
                            R$ {item.itemTotal.toFixed(2)}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemMutation.mutate(item.id)}
                          className="h-7 w-7 cursor-pointer p-0 text-stone-400 hover:text-rose-600"
                          title="Remover Item"
                        >
                          <RiDeleteBin6Line className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Order Summary & Coupon Form */}
          <div className="space-y-6 lg:col-span-4">
            <div className="space-y-6 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
              <h2 className="border-b border-stone-200 pb-3 text-base font-bold text-stone-900">
                Resumo da Compra
              </h2>

              {/* Coupon Form */}
              <div className="space-y-3">
                <label className="flex items-center space-x-1.5 text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                  <RiCoupon3Line className="h-4 w-4 text-emerald-700" />
                  <span>Cupom de Desconto</span>
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    placeholder="EX: VERTTEX10"
                    className="text-xs uppercase"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (couponCode.trim()) {
                        applyCouponMutation.mutate(couponCode)
                      }
                    }}
                    disabled={
                      applyCouponMutation.isPending || !couponCode.trim()
                    }
                    className="cursor-pointer"
                  >
                    Aplicar
                  </Button>
                </div>

                {/* Applied Coupons List */}
                {summary.coupons.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {summary.coupons.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-900"
                      >
                        <div className="flex items-center space-x-1.5">
                          <RiTicketLine className="h-3.5 w-3.5 text-emerald-700" />
                          <span className="font-bold">{c.code}</span>
                          <span className="text-[10px] text-emerald-700">
                            (-R$ {c.discountAmount.toFixed(2)})
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCouponMutation.mutate()}
                          className="h-5 w-5 cursor-pointer p-0 text-emerald-700 hover:text-rose-600"
                        >
                          <RiDeleteBin6Line className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 border-t border-stone-200 pt-4 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    R$ {summary.subtotal.toFixed(2)}
                  </span>
                </div>

                {summary.discount > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-800">
                    <span>Desconto Aplicado:</span>
                    <span>- R$ {summary.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[11px] text-stone-500">
                  <span>Frete:</span>
                  <span>Calculado no Checkout</span>
                </div>

                <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-extrabold text-stone-900">
                  <span>Total Estimado:</span>
                  <span>R$ {summary.total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/perfil/enderecos"
                className="flex w-full cursor-pointer items-center justify-center space-x-2 rounded-xl bg-emerald-800 py-3.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-900"
              >
                <span>Prosseguir para o Checkout</span>
                <RiArrowRightLine className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <RiShoppingBag3Line className="mx-auto h-12 w-12 text-stone-300" />
          <h2 className="text-base font-bold text-stone-800">
            Seu carrinho de compras está vazio
          </h2>
          <p className="mx-auto max-w-sm text-xs text-stone-500">
            Você ainda não adicionou nenhum item. Explore o catálogo de produtos
            artesanais e apoie os produtores locais!
          </p>
          <Link
            href="/produtos"
            className="inline-flex cursor-pointer items-center space-x-2 rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-900"
          >
            <span>Ver Produtos</span>
            <RiArrowRightLine className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
