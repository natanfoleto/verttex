'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  RiAddLine,
  RiArrowRightLine,
  RiDeleteBin6Line,
  RiShoppingBag3Line,
  RiStore2Line,
  RiSubtractLine,
} from 'react-icons/ri'
import { toast } from 'sonner'

import { apiClient } from '../../lib/api-client'
import { Button } from '../ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet'

export interface CartSummary {
  cartId: string
  itemCount: number
  stores: {
    store: { id: string; name: string; slug: string; logoUrl?: string }
    storeSubtotal: number
    items: {
      id: string
      variationId: string
      productName: string
      productSlug: string
      sku: string
      imageUrl?: string
      quantity: number
      unitPrice: number
      itemTotal: number
    }[]
  }[]
  subtotal: number
  discount: number
  total: number
  coupons: {
    id: string
    code: string
    type: string
    value: number
    discountAmount: number
  }[]
}

export function CartSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const { data: summary, isLoading } = useQuery<CartSummary>({
    queryKey: ['cart-summary'],
    queryFn: async () => {
      const res = await apiClient<CartSummary>('/cart')
      return res
    },
    enabled: open,
  })

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      return apiClient(`/cart/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-summary'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao atualizar quantidade')
    },
  })

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/cart/items/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      toast.success('Item removido do carrinho')
      queryClient.invalidateQueries({ queryKey: ['cart-summary'] })
    },
  })

  const hasItems = Boolean(summary && summary.itemCount > 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col border-l border-stone-200 bg-white p-0 text-stone-900 sm:max-w-md">
        <SheetHeader className="border-b border-stone-200 bg-stone-50/50 px-6 py-5">
          <SheetTitle className="flex items-center space-x-2 text-base font-bold text-stone-900">
            <RiShoppingBag3Line className="h-5 w-5 text-emerald-800" />
            <span>Seu Carrinho ({summary?.itemCount || 0})</span>
          </SheetTitle>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-20 animate-pulse rounded-md bg-stone-100" />
              <div className="h-20 animate-pulse rounded-md bg-stone-100" />
            </div>
          ) : hasItems && summary ? (
            summary.stores.map((storeGroup) => (
              <div
                key={storeGroup.store.id}
                className="space-y-4 rounded-md border border-stone-200/80 bg-white p-4 shadow-xs"
              >
                <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
                  <RiStore2Line className="h-4 w-4 text-amber-700" />
                  <span className="text-xs font-bold text-stone-900">
                    {storeGroup.store.name}
                  </span>
                </div>

                <div className="space-y-3">
                  {storeGroup.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between space-x-3 text-xs"
                    >
                      <div className="flex min-w-0 flex-1 items-center space-x-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-12 w-12 shrink-0 rounded-md border border-stone-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-400">
                            <RiShoppingBag3Line className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-stone-900">
                            {item.productName}
                          </p>
                          <p className="font-mono text-[11px] text-stone-500">
                            R$ {item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-1 rounded-sm border border-stone-200 bg-stone-50 p-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantityMutation.mutate({
                                id: item.id,
                                quantity: item.quantity - 1,
                              })
                            } else {
                              removeItemMutation.mutate(item.id)
                            }
                          }}
                          className="h-6 w-6 cursor-pointer p-0 text-stone-600 hover:text-stone-900"
                        >
                          <RiSubtractLine className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-[11px] font-bold">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateQuantityMutation.mutate({
                              id: item.id,
                              quantity: item.quantity + 1,
                            })
                          }}
                          className="h-6 w-6 cursor-pointer p-0 text-stone-600 hover:text-stone-900"
                        >
                          <RiAddLine className="h-3 w-3" />
                        </Button>
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
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-3 py-12 text-center">
              <RiShoppingBag3Line className="mx-auto h-12 w-12 text-stone-300" />
              <p className="text-sm font-bold text-stone-800">
                Seu carrinho está vazio
              </p>
              <p className="text-xs text-stone-500">
                Explore os produtos artesanais do nosso mercado regional!
              </p>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {hasItems && summary && (
          <div className="space-y-4 border-t border-stone-200 bg-stone-50/50 p-6">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-semibold">
                  R$ {summary.subtotal.toFixed(2)}
                </span>
              </div>
              {summary.discount > 0 && (
                <div className="flex justify-between font-semibold text-emerald-800">
                  <span>Descontos:</span>
                  <span>- R$ {summary.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-extrabold text-stone-900">
                <span>Total:</span>
                <span>R$ {summary.total.toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/carrinho"
              onClick={() => onOpenChange(false)}
              className="flex w-full cursor-pointer items-center justify-center space-x-2 rounded-md bg-emerald-800 py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-900"
            >
              <span>Ver Carrinho Completo</span>
              <RiArrowRightLine className="h-4 w-4" />
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
