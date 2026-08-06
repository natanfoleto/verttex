'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  RiAddLine,
  RiArrowLeftLine,
  RiBankCardLine,
  RiBarcodeLine,
  RiCheckLine,
  RiMapPinLine,
  RiQrCodeLine,
  RiShieldCheckLine,
  RiShoppingBag3Line,
  RiTruckLine,
} from 'react-icons/ri'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { apiClient, ApiError } from '../../lib/api-client'

interface CustomerAddress {
  id: string
  label?: string
  recipient: string
  phone?: string
  zipCode: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  isDefault: boolean
}

interface CartItem {
  id: string
  quantity: number
  variation: {
    id: string
    sku: string
    price: number
    promotionalPrice?: number
    medias?: { url: string; isMain: boolean }[]
    product: {
      id: string
      name: string
      medias: { url: string; isMain: boolean }[]
    }
    values: { optionValue: { value: string; option: { name: string } } }[]
  }
}

interface CartResponse {
  id: string
  items: CartItem[]
  subtotal: number
  total: number
  store?: {
    id: string
    name: string
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  )
  const [paymentMethod, setPaymentMethod] = useState<
    'pix' | 'credit_card' | 'boleto'
  >('pix')
  const [notes, setNotes] = useState('')
  const [showAddAddressModal, setShowAddAddressModal] = useState(false)

  // New Address Form State
  const [newRecipient, setNewRecipient] = useState('')
  const [newZipCode, setNewZipCode] = useState('')
  const [newStreet, setNewStreet] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [newNeighborhood, setNewNeighborhood] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newState, setNewState] = useState('')
  const [newLabel, setNewLabel] = useState('Casa')

  // Fetch Cart Items
  const { data: cart, isLoading: isLoadingCart } = useQuery<CartResponse>({
    queryKey: ['cart-summary'],
    queryFn: async () => apiClient<CartResponse>('/cart'),
  })

  // Fetch Customer Addresses
  const { data: addresses, isLoading: isLoadingAddresses } = useQuery<
    CustomerAddress[]
  >({
    queryKey: ['customer-addresses'],
    queryFn: async () => apiClient<CustomerAddress[]>('/customer/addresses'),
    select: (data) => {
      if (data && data.length > 0 && !selectedAddressId) {
        const defaultAddr = data.find((a) => a.isDefault) || data[0]
        if (defaultAddr) setSelectedAddressId(defaultAddr.id)
      }
      return data
    },
  })

  // Add Address Mutation
  const addAddressMutation = useMutation({
    mutationFn: async () => {
      return apiClient<CustomerAddress>('/customer/addresses', {
        method: 'POST',
        body: JSON.stringify({
          recipient: newRecipient,
          zipCode: newZipCode.replace(/\D/g, ''),
          street: newStreet,
          number: newNumber,
          neighborhood: newNeighborhood,
          city: newCity,
          state: newState.toUpperCase(),
          label: newLabel,
          isDefault: true,
        }),
      })
    },
    onSuccess: (newAddr) => {
      toast.success('Endereço cadastrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] })
      setSelectedAddressId(newAddr.id)
      setShowAddAddressModal(false)
    },
    onError: (err: ApiError | Error) => {
      toast.error(err.message || 'Falha ao cadastrar endereço')
    },
  })

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAddressId) {
        throw new Error('Selecione um endereço de entrega')
      }
      return apiClient<{ id: string; code: string }>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          customerAddressId: selectedAddressId,
          paymentMethod,
          notes: notes || undefined,
        }),
      })
    },
    onSuccess: (order) => {
      toast.success(`Pedido #${order.code} realizado com sucesso!`)
      queryClient.invalidateQueries({ queryKey: ['cart-summary'] })
      router.push(`/pedidos/${order.code}`)
    },
    onError: (err: ApiError | Error) => {
      toast.error(err.message || 'Ocorreu um erro ao processar o checkout')
    },
  })

  const isLoading = isLoadingCart || isLoadingAddresses

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 font-sans antialiased">
        <div className="h-6 w-48 animate-pulse rounded-md bg-stone-200" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
              <div className="h-5 w-40 animate-pulse rounded bg-stone-200" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
                <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
              </div>
            </div>
            <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
              <div className="h-5 w-40 animate-pulse rounded bg-stone-200" />
              <div className="h-16 animate-pulse rounded-2xl bg-stone-100" />
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs lg:col-span-4">
            <div className="h-6 w-32 animate-pulse rounded bg-stone-200" />
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
              <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
            </div>
            <div className="h-12 w-full animate-pulse rounded-xl bg-stone-200 pt-4" />
          </div>
        </div>
      </div>
    )
  }

  const items = cart?.items || []
  const subtotal =
    cart?.subtotal ||
    items.reduce(
      (acc, i) =>
        acc + (i.variation.promotionalPrice || i.variation.price) * i.quantity,
      0,
    )

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center font-sans antialiased">
        <RiShoppingBag3Line className="mx-auto h-16 w-16 text-stone-300" />
        <h1 className="mt-4 text-2xl font-bold text-stone-900">
          Seu carrinho está vazio
        </h1>
        <p className="mt-2 text-xs text-stone-500">
          Adicione produtos artesanais para prosseguir com o checkout.
        </p>
        <Link
          href="/produtos"
          className="mt-6 inline-flex cursor-pointer items-center space-x-2 rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-900"
        >
          <RiArrowLeftLine className="h-4 w-4" />
          <span>Explorar Catálogo</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 font-sans text-stone-900 antialiased sm:px-6 lg:px-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <Link
          href="/produtos"
          className="flex items-center space-x-2 text-xs font-bold text-stone-500 transition-colors hover:text-emerald-800"
        >
          <RiArrowLeftLine className="h-4 w-4" />
          <span>Voltar às compras</span>
        </Link>
        <h1 className="text-xl font-extrabold text-stone-900">
          Finalizar Pedido
        </h1>
        <div className="flex items-center space-x-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <RiShieldCheckLine className="h-4 w-4" />
          <span>Checkout Seguro SSL</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main Form Area (Span 8) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Step 1: Address Selection */}
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center space-x-2 text-base font-bold text-stone-900">
                <RiMapPinLine className="h-5 w-5 text-emerald-800" />
                <span>1. Endereço de Entrega</span>
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddAddressModal(true)}
                className="cursor-pointer text-xs font-semibold"
              >
                <RiAddLine className="mr-1 h-4 w-4 text-emerald-700" />
                Novo Endereço
              </Button>
            </div>

            {!addresses || addresses.length === 0 ? (
              <div className="space-y-3 rounded-2xl border border-dashed bg-stone-50 p-6 text-center text-xs text-stone-500">
                <p>Nenhum endereço cadastrado para entrega.</p>
                <Button
                  type="button"
                  onClick={() => setShowAddAddressModal(true)}
                  className="cursor-pointer bg-emerald-800 text-xs text-white hover:bg-emerald-900"
                >
                  Cadastrar Primeiro Endereço
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`relative cursor-pointer space-y-2 rounded-2xl border p-4 transition-all ${
                        isSelected
                          ? 'border-emerald-800 bg-emerald-50/50 ring-2 ring-emerald-800/20'
                          : 'border-stone-200 bg-white hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                          {addr.label || 'Endereço'}
                          {addr.isDefault && (
                            <span className="rounded-md bg-stone-200 px-1.5 py-0.5 text-[10px] font-normal text-stone-700">
                              Padrão
                            </span>
                          )}
                        </span>
                        {isSelected && (
                          <RiCheckLine className="h-5 w-5 font-bold text-emerald-800" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-stone-800">
                        {addr.recipient}
                      </p>
                      <p className="text-xs text-stone-600">
                        {addr.street}, {addr.number}{' '}
                        {addr.complement && `- ${addr.complement}`}
                      </p>
                      <p className="text-xs text-stone-500">
                        {addr.neighborhood} — {addr.city}/{addr.state} (CEP:{' '}
                        {addr.zipCode})
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Step 2: Payment Method */}
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
            <h2 className="flex items-center space-x-2 text-base font-bold text-stone-900">
              <RiBankCardLine className="h-5 w-5 text-emerald-800" />
              <span>2. Método de Pagamento</span>
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentMethod('pix')}
                className={`flex h-auto cursor-pointer flex-col items-stretch justify-between space-y-3 rounded-2xl border p-4 text-left whitespace-normal transition-all ${
                  paymentMethod === 'pix'
                    ? 'border-emerald-800 bg-emerald-50/50 ring-2 ring-emerald-800/20'
                    : 'border-stone-200 bg-white hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <RiQrCodeLine className="h-6 w-6 text-emerald-800" />
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wider text-emerald-800 uppercase">
                    Instantâneo
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">PIX</p>
                  <p className="text-[11px] text-stone-500">
                    Aprovação imediata com QR Code
                  </p>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentMethod('credit_card')}
                className={`flex h-auto cursor-pointer flex-col items-stretch justify-between space-y-3 rounded-2xl border p-4 text-left whitespace-normal transition-all ${
                  paymentMethod === 'credit_card'
                    ? 'border-emerald-800 bg-emerald-50/50 ring-2 ring-emerald-800/20'
                    : 'border-stone-200 bg-white hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <RiBankCardLine className="h-6 w-6 text-stone-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">
                    Cartão de Crédito
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Em até 3x sem juros
                  </p>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentMethod('boleto')}
                className={`flex h-auto cursor-pointer flex-col items-stretch justify-between space-y-3 rounded-2xl border p-4 text-left whitespace-normal transition-all ${
                  paymentMethod === 'boleto'
                    ? 'border-emerald-800 bg-emerald-50/50 ring-2 ring-emerald-800/20'
                    : 'border-stone-200 bg-white hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <RiBarcodeLine className="h-6 w-6 text-stone-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">
                    Boleto Bancário
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Vencimento em 2 dias úteis
                  </p>
                </div>
              </Button>
            </div>
          </div>

          {/* Step 3: Order Notes */}
          <div className="space-y-3 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-bold tracking-wider text-stone-900 uppercase">
              Observações do Pedido (Opcional)
            </h3>
            <Textarea
              rows={2}
              placeholder="Ex: Entregar após as 14h ou deixar na portaria do prédio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs"
            />
          </div>
        </div>

        {/* Sidebar Order Summary (Span 4) */}
        <div className="space-y-6 lg:col-span-4">
          <div className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
            <h2 className="border-b border-stone-100 pb-3 text-base font-bold text-stone-900">
              Resumo da Compra
            </h2>

            {/* List of Products */}
            <div className="max-h-72 space-y-3 divide-y divide-stone-100 overflow-y-auto pr-1">
              {items.map((item) => {
                const imgUrl =
                  item.variation.medias?.find((m) => m.isMain)?.url ||
                  item.variation.product.medias?.find((m) => m.isMain)?.url ||
                  item.variation.product.medias?.[0]?.url
                const unitPrice =
                  item.variation.promotionalPrice || item.variation.price

                return (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 pt-3 first:pt-0"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <RiShoppingBag3Line className="m-auto mt-3 h-6 w-6 text-stone-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-stone-900">
                        {item.variation.product.name}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Qtd: {item.quantity} × R$ {unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-stone-900">
                      R$ {(unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-stone-100 pt-4 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal ({items.length} itens)</span>
                <span className="font-semibold text-stone-900">
                  R$ {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Frete Regional</span>
                <span className="text-[11px] font-bold text-emerald-800 uppercase">
                  Grátis
                </span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-3 text-sm font-extrabold text-stone-900">
                <span>Total a pagar</span>
                <span className="text-lg text-emerald-900">
                  R$ {subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Final CTA Button */}
            <Button
              type="button"
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending || !selectedAddressId}
              className="h-12 w-full cursor-pointer rounded-xl bg-emerald-800 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-900"
            >
              {checkoutMutation.isPending
                ? 'Processando Pedido...'
                : 'Finalizar Pedido'}
            </Button>

            <div className="flex items-center justify-center space-x-2 pt-2 text-[11px] text-stone-500">
              <RiTruckLine className="h-4 w-4 text-emerald-700" />
              <span>Garantia de Entrega VERTTEX Direct</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Novo Endereço */}
      {showAddAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">
              Cadastrar Novo Endereço
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                addAddressMutation.mutate()
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="mb-1 block font-semibold text-stone-700">
                  Nome do Destinatário *
                </label>
                <Input
                  required
                  placeholder="Ex: Maria da Silva"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-stone-700">
                    CEP *
                  </label>
                  <Input
                    required
                    placeholder="37925-000"
                    value={newZipCode}
                    onChange={(e) => setNewZipCode(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-stone-700">
                    Identificador
                  </label>
                  <Input
                    placeholder="Ex: Casa, Trabalho"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block font-semibold text-stone-700">
                    Rua / Logradouro *
                  </label>
                  <Input
                    required
                    placeholder="Rua da Canastra"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-stone-700">
                    Número *
                  </label>
                  <Input
                    required
                    placeholder="100"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-stone-700">
                    Bairro *
                  </label>
                  <Input
                    required
                    placeholder="Centro"
                    value={newNeighborhood}
                    onChange={(e) => setNewNeighborhood(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-stone-700">
                    Cidade *
                  </label>
                  <Input
                    required
                    placeholder="São Roque"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-stone-700">
                    UF *
                  </label>
                  <Input
                    required
                    maxLength={2}
                    placeholder="MG"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full text-xs uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddAddressModal(false)}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={addAddressMutation.isPending}
                  className="cursor-pointer bg-emerald-800 text-white hover:bg-emerald-900"
                >
                  {addAddressMutation.isPending
                    ? 'Salvando...'
                    : 'Salvar Endereço'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
