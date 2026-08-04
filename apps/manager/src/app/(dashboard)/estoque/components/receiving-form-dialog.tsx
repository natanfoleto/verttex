'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { RiAddLine, RiCheckLine, RiDeleteBin6Line } from 'react-icons/ri'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { useErrorDialog } from '@/providers/error-dialog-provider'

import { apiClient } from '../../../../lib/api-client'

interface Store {
  id: string
  name: string
}

interface ProductItem {
  id: string
  name: string
  variations?: Array<{ id: string; sku: string }>
}

interface ReceivingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stores: Store[]
  defaultStoreId?: string
}

export function ReceivingFormDialog({
  open,
  onOpenChange,
  stores,
  defaultStoreId,
}: ReceivingFormDialogProps) {
  const queryClient = useQueryClient()

  const [recStoreId, setRecStoreId] = useState(defaultStoreId || '')
  const [recProductId, setRecProductId] = useState('')
  const [recDocRef, setRecDocRef] = useState('')
  const [recLots, setRecLots] = useState([
    {
      lotNumber: '',
      manufacturer: '',
      supplier: '',
      manufacturingDate: '',
      expirationDate: '',
      quantity: '10',
      notes: '',
    },
  ])

  const { data: productsRes = [] } = useQuery<ProductItem[]>({
    queryKey: ['products-dropdown', recStoreId],
    queryFn: async () => {
      if (!recStoreId) return []
      const res = await apiClient(`/products?storeId=${recStoreId}&limit=100`)
      return res?.data ?? []
    },
    enabled: Boolean(recStoreId),
  })

  const { showError } = useErrorDialog()

  const receiveMutation = useMutation({
    mutationFn: async () => {
      const selectedProd = productsRes.find((p) => p.id === recProductId)
      const defaultVarId = selectedProd?.variations?.[0]?.id

      return apiClient('/stock/receive', {
        method: 'POST',
        body: JSON.stringify({
          storeId: recStoreId,
          variationId: defaultVarId,
          documentReference: recDocRef,
          lots: recLots.map((l) => ({
            lotNumber: l.lotNumber,
            manufacturer: l.manufacturer || null,
            supplier: l.supplier || null,
            manufacturingDate: l.manufacturingDate
              ? new Date(l.manufacturingDate).toISOString()
              : null,
            expirationDate: l.expirationDate
              ? new Date(l.expirationDate).toISOString()
              : null,
            quantity: Number(l.quantity) || 0,
            notes: l.notes || null,
          })),
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots-list'] })
      toast.success('Recebimento de lote(s) registrado com sucesso!')
      onOpenChange(false)
      resetForm()
    },
    onError: (err: unknown) => {
      showError(err, 'Atenção: Não foi possível registrar o recebimento')
    },
  })

  const resetForm = () => {
    setRecDocRef('')
    setRecLots([
      {
        lotNumber: '',
        manufacturer: '',
        supplier: '',
        manufacturingDate: '',
        expirationDate: '',
        quantity: '10',
        notes: '',
      },
    ])
  }

  const handleAddLotRow = () => {
    setRecLots((prev) => [
      ...prev,
      {
        lotNumber: '',
        manufacturer: '',
        supplier: '',
        manufacturingDate: '',
        expirationDate: '',
        quantity: '10',
        notes: '',
      },
    ])
  }

  const handleRemoveLotRow = (index: number) => {
    setRecLots((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateLotRow = (index: number, field: string, value: string) => {
    setRecLots((prev) => {
      const next = [...prev]
      next[index] = { ...next[index]!, [field]: value }
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-3xl flex flex-col overflow-hidden bg-zinc-950 p-0 text-zinc-100 sm:rounded-2xl max-h-[90vh]"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="text-xl font-bold text-zinc-100">
            Novo Recebimento de Lotes
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Registre a entrada de novos lotes e mercadorias por documento de
            origem / Nota Fiscal.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            receiveMutation.mutate()
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-1 pb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1 whitespace-nowrap">
                  Loja Destino *
                </label>
                <NativeSelect
                  value={recStoreId}
                  onChange={(e) => {
                    setRecStoreId(e.target.value)
                    setRecProductId('')
                  }}
                  className="w-full bg-zinc-900 border-zinc-800 text-xs rounded-xl cursor-pointer"
                  required
                >
                  <option value="">Selecione uma loja...</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1 whitespace-nowrap">
                  Produto *
                </label>
                <NativeSelect
                  value={recProductId}
                  onChange={(e) => setRecProductId(e.target.value)}
                  disabled={!recStoreId}
                  className="w-full bg-zinc-900 border-zinc-800 text-xs rounded-xl cursor-pointer"
                  required
                >
                  <option value="">Selecione um produto...</option>
                  {productsRes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1 whitespace-nowrap">
                  Doc. / NFe Referência
                </label>
                <Input
                  placeholder="Ex: NFe 12345"
                  value={recDocRef}
                  onChange={(e) => setRecDocRef(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 rounded-xl"
                />
              </div>
            </div>

            {/* DIVIDER & LOT ROWS */}
            <div className="border-t border-zinc-800/80 pt-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Lotes do Recebimento ({recLots.length})
                </h4>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddLotRow}
                  className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 text-xs rounded-xl cursor-pointer"
                >
                  <RiAddLine className="mr-1 h-3.5 w-3.5" />
                  Adicionar Lote
                </Button>
              </div>

              <div className="space-y-4">
                {recLots.map((lot, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3.5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400">
                        Lote #{idx + 1}
                      </span>
                      {recLots.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLotRow(idx)}
                          className="h-6 w-6 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                        >
                          <RiDeleteBin6Line className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5 whitespace-nowrap">
                          Cód. Impresso Lote *
                        </label>
                        <Input
                          placeholder="Ex: LOTE-2026-08A"
                          value={lot.lotNumber}
                          onChange={(e) =>
                            handleUpdateLotRow(idx, 'lotNumber', e.target.value)
                          }
                          className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-lg"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5 whitespace-nowrap">
                          Data de Fabricação
                        </label>
                        <Input
                          type="date"
                          value={lot.manufacturingDate}
                          onChange={(e) =>
                            handleUpdateLotRow(
                              idx,
                              'manufacturingDate',
                              e.target.value,
                            )
                          }
                          className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5 whitespace-nowrap">
                          Data de Validade *
                        </label>
                        <Input
                          type="date"
                          value={lot.expirationDate}
                          onChange={(e) =>
                            handleUpdateLotRow(
                              idx,
                              'expirationDate',
                              e.target.value,
                            )
                          }
                          className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-lg cursor-pointer"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5 whitespace-nowrap">
                          Quantidade *
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={lot.quantity}
                          onChange={(e) =>
                            handleUpdateLotRow(idx, 'quantity', e.target.value)
                          }
                          className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-lg"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5 whitespace-nowrap">
                          Fabricante
                        </label>
                        <Input
                          placeholder="Ex: Laticínio Sereno"
                          value={lot.manufacturer}
                          onChange={(e) =>
                            handleUpdateLotRow(
                              idx,
                              'manufacturer',
                              e.target.value,
                            )
                          }
                          className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5 whitespace-nowrap">
                          Fornecedor
                        </label>
                        <Input
                          placeholder="Ex: Distribuidora Regional"
                          value={lot.supplier}
                          onChange={(e) =>
                            handleUpdateLotRow(idx, 'supplier', e.target.value)
                          }
                          className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-zinc-950 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs rounded-xl cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={receiveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <RiCheckLine className="mr-1.5 h-4 w-4" />
              {receiveMutation.isPending
                ? 'Registrando...'
                : 'Confirmar Recebimento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
