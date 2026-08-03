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
    onError: (err: any) => {
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
      <SheetContent className="flex flex-col w-full sm:max-w-md bg-white p-0 text-stone-900 border-l border-stone-200">
        <SheetHeader className="px-6 py-5 border-b border-stone-200 bg-stone-50/50">
          <SheetTitle className="flex items-center space-x-2 text-base font-bold text-stone-900">
            <RiShoppingBag3Line className="h-5 w-5 text-emerald-800" />
            <span>Seu Carrinho ({summary?.itemCount || 0})</span>
          </SheetTitle>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-20 animate-pulse rounded-md bg-stone-100" />
              <div className="h-20 animate-pulse rounded-md bg-stone-100" />
            </div>
          ) : hasItems && summary ? (
            summary.stores.map((storeGroup) => (
              <div
                key={storeGroup.store.id}
                className="rounded-md border border-stone-200/80 bg-white p-4 space-y-4 shadow-xs"
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
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-12 w-12 rounded-md object-cover border border-stone-200 shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                            <RiShoppingBag3Line className="h-6 w-6" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-900 truncate">
                            {item.productName}
                          </p>
                          <p className="text-[11px] text-stone-500 font-mono">
                            R$ {item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-1 border border-stone-200 rounded-sm p-0.5 bg-stone-50">
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
                          className="h-6 w-6 p-0 text-stone-600 hover:text-stone-900 cursor-pointer"
                        >
                          <RiSubtractLine className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center font-bold text-[11px]">
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
                          className="h-6 w-6 p-0 text-stone-600 hover:text-stone-900 cursor-pointer"
                        >
                          <RiAddLine className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItemMutation.mutate(item.id)}
                        className="h-7 w-7 text-stone-400 hover:text-rose-600 p-0 cursor-pointer"
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
            <div className="py-12 text-center space-y-3">
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
          <div className="p-6 border-t border-stone-200 bg-stone-50/50 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-semibold">
                  R$ {summary.subtotal.toFixed(2)}
                </span>
              </div>
              {summary.discount > 0 && (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Descontos:</span>
                  <span>- R$ {summary.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t border-stone-200">
                <span>Total:</span>
                <span>R$ {summary.total.toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/carrinho"
              onClick={() => onOpenChange(false)}
              className="w-full flex items-center justify-center space-x-2 rounded-md bg-emerald-800 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-900 cursor-pointer shadow-xs"
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
