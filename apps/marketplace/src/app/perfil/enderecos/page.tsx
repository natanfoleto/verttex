'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  RiAddLine,
  RiCheckLine,
  RiDeleteBin6Line,
  RiEditLine,
  RiMapPinLine,
  RiSearchLine,
  RiStarFill,
} from 'react-icons/ri'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import { CustomerAuthGuard } from '../../../components/guards/customer-auth-guard'
import { ProfileHeader } from '../../../components/profile/profile-header'
import { apiClient, ApiError } from '../../../lib/api-client'

export interface CustomerAddress {
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

export default function CustomerAddressesPage() {
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(
    null,
  )

  // Form State
  const [label, setLabel] = useState('')
  const [recipient, setRecipient] = useState('')
  const [phone, setPhone] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isSearchingCep, setIsSearchingCep] = useState(false)

  // Query Customer Addresses
  const { data: addresses = [], isLoading } = useQuery<CustomerAddress[]>({
    queryKey: ['customer-addresses'],
    queryFn: async () => {
      const res = await apiClient<CustomerAddress[]>('/customer/addresses')
      return Array.isArray(res) ? res : []
    },
  })

  // CEP Lookup Auto-Fill Handler
  const handleCepSearch = async (cepInput: string) => {
    const cleanCep = cepInput.replace(/\D/g, '')
    setZipCode(cleanCep)

    if (cleanCep.length === 8) {
      try {
        setIsSearchingCep(true)
        const data = await apiClient<{
          street: string
          neighborhood: string
          city: string
          state: string
        }>(`/customer/cep/${cleanCep}`)

        if (data) {
          if (data.street) setStreet(data.street)
          if (data.neighborhood) setNeighborhood(data.neighborhood)
          if (data.city) setCity(data.city)
          if (data.state) setState(data.state)
          toast.success('Endereço encontrado e preenchido!')
        }
      } catch {
        toast.error('Não foi possível encontrar o CEP informado.')
      } finally {
        setIsSearchingCep(false)
      }
    }
  }

  const openModal = (address?: CustomerAddress) => {
    if (address) {
      setEditingAddress(address)
      setLabel(address.label || '')
      setRecipient(address.recipient || '')
      setPhone(address.phone || '')
      setZipCode(address.zipCode || '')
      setStreet(address.street || '')
      setNumber(address.number || '')
      setComplement(address.complement || '')
      setNeighborhood(address.neighborhood || '')
      setCity(address.city || '')
      setState(address.state || '')
      setIsDefault(address.isDefault)
    } else {
      setEditingAddress(null)
      setLabel('')
      setRecipient('')
      setPhone('')
      setZipCode('')
      setStreet('')
      setNumber('')
      setComplement('')
      setNeighborhood('')
      setCity('')
      setState('')
      setIsDefault(addresses.length === 0)
    }
    setIsModalOpen(true)
  }

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        label,
        recipient,
        phone,
        zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        isDefault,
      }

      if (editingAddress) {
        return apiClient(`/customer/addresses/${editingAddress.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      }

      return apiClient('/customer/addresses', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      toast.success(
        editingAddress
          ? 'Endereço atualizado!'
          : 'Endereço cadastrado com sucesso!',
      )
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] })
      setIsModalOpen(false)
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Erro ao salvar endereço.')
      }
    },
  })

  // Set Default Mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/customer/addresses/${id}/default`, {
        method: 'PATCH',
      })
    },
    onSuccess: () => {
      toast.success('Endereço definido como padrão de entrega!')
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] })
    },
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/customer/addresses/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      toast.success('Endereço removido com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] })
    },
  })

  const isAddressDirty = editingAddress
    ? label !== editingAddress.label ||
      recipient !== editingAddress.recipient ||
      phone !== (editingAddress.phone || '') ||
      zipCode !== editingAddress.zipCode ||
      street !== editingAddress.street ||
      number !== editingAddress.number ||
      complement !== (editingAddress.complement || '') ||
      neighborhood !== editingAddress.neighborhood ||
      city !== editingAddress.city ||
      state !== editingAddress.state ||
      isDefault !== editingAddress.isDefault
    : zipCode.trim().length > 0 &&
      street.trim().length > 0 &&
      number.trim().length > 0

  return (
    <CustomerAuthGuard>
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8 py-12 font-sans text-stone-900 antialiased">
        <ProfileHeader />

        {/* Addresses Container Box */}
        <div className="space-y-6 rounded-2xl border border-stone-200/80 bg-white p-8 shadow-xs">
          <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-4 sm:flex-row sm:items-center">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-800">
                <RiMapPinLine className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Endereços Salvos
                </h2>
                <p className="text-xs text-stone-500">
                  {addresses.length} endereço(s) cadastrado(s)
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => openModal()}
              className="cursor-pointer"
            >
              <RiAddLine className="h-4 w-4" />
              <span>Adicionar Endereço</span>
            </Button>
          </div>

          {/* Cards List / Loading */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-40 animate-pulse rounded-xl border border-stone-200 bg-stone-100 p-5" />
              <div className="h-40 animate-pulse rounded-xl border border-stone-200 bg-stone-100 p-5" />
            </div>
          ) : addresses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`flex flex-col justify-between rounded-xl border p-5 transition-all ${
                    addr.isDefault
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-sm">
                        {addr.label || 'Endereço'}
                      </span>
                      {addr.isDefault && (
                        <span className="inline-flex items-center space-x-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900">
                          <RiStarFill className="h-3 w-3 text-emerald-700" />
                          <span>Padrão</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-stone-800">
                      Destinatário: {addr.recipient}
                    </p>
                    <p className="text-xs text-stone-600">
                      {addr.street}, {addr.number}
                      {addr.complement ? ` — ${addr.complement}` : ''}
                    </p>
                    <p className="text-xs text-stone-500">
                      {addr.neighborhood} — {addr.city}/{addr.state}
                    </p>
                    <p className="text-[11px] font-mono text-stone-400">
                      CEP: {addr.zipCode.replace(/^(\d{5})(\d{3})$/, '$1-$2')}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
                    {!addr.isDefault ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(addr.id)}
                        className="text-emerald-800 hover:bg-emerald-50 p-0 h-auto font-medium cursor-pointer"
                      >
                        Tornar Padrão
                      </Button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Endereço principal
                      </span>
                    )}

                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => openModal(addr)}
                        className="h-7 w-7 text-stone-600 cursor-pointer"
                        title="Editar Endereço"
                      >
                        <RiEditLine className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (
                            confirm('Deseja realmente remover este endereço?')
                          ) {
                            deleteMutation.mutate(addr.id)
                          }
                        }}
                        className="h-7 w-7 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Remover Endereço"
                      >
                        <RiDeleteBin6Line className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center">
              <RiMapPinLine className="mx-auto h-8 w-8 text-stone-400" />
              <h3 className="mt-2 text-sm font-bold text-stone-800">
                Nenhum endereço cadastrado
              </h3>
              <p className="mt-1 text-xs text-stone-500">
                Cadastre seu primeiro endereço de entrega para agilizar suas
                compras no VERTTEX.
              </p>
              <Button
                type="button"
                onClick={() => openModal()}
                className="mt-4 cursor-pointer"
              >
                <RiAddLine className="h-4 w-4" />
                <span>Cadastrar Endereço</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Address Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Editar Endereço' : 'Novo Endereço de Entrega'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveMutation.mutate()
            }}
            className="space-y-4 pt-2"
          >
            <div>
              <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase whitespace-nowrap">
                CEP *
              </label>
              <div className="relative mt-1">
                <Input
                  type="text"
                  required
                  value={zipCode}
                  onChange={(e) => handleCepSearch(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className="text-xs pr-8"
                />
                {isSearchingCep && (
                  <RiSearchLine className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-700" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase whitespace-nowrap">
                  Identificação (ex: Casa, Sítio)
                </label>
                <Input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Minha Casa"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase whitespace-nowrap">
                  Destinatário *
                </label>
                <Input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Nome de quem recebe"
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase whitespace-nowrap">
                  Rua / Logradouro *
                </label>
                <Input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Av. Brasil"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase whitespace-nowrap">
                  Número *
                </label>
                <Input
                  type="text"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="100"
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase whitespace-nowrap">
                  Complemento
                </label>
                <Input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto 201"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase whitespace-nowrap">
                  Bairro *
                </label>
                <Input
                  type="text"
                  required
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Centro"
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase whitespace-nowrap">
                  Cidade *
                </label>
                <Input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bento Gonçalves"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase whitespace-nowrap">
                  UF *
                </label>
                <Input
                  type="text"
                  required
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="RS"
                  className="mt-1 text-xs uppercase"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isDefaultCheckbox"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(Boolean(checked))}
              />
              <label
                htmlFor="isDefaultCheckbox"
                className="text-xs font-semibold text-stone-700 cursor-pointer"
              >
                Definir como endereço padrão de entrega
              </label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={!isAddressDirty || saveMutation.isPending}
                className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RiCheckLine className="h-4 w-4" />
                <span>
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar Endereço'}
                </span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CustomerAuthGuard>
  )
}
