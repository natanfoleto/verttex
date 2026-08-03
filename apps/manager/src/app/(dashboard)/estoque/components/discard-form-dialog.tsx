'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { RiCheckLine } from 'react-icons/ri'
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
import { Textarea } from '@/components/ui/textarea'

import { apiClient, ApiError } from '../../../../lib/api-client'
import type { LotItem } from './status-form-dialog'

export interface LotWithStockItem extends LotItem {
  stockItems: Array<{
    id: string
    locationId: string
    physicalQuantity: number
    reservedQuantity: number
  }>
}

interface DiscardFormDialogProps {
  lot: LotWithStockItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DiscardFormDialog({
  lot,
  open,
  onOpenChange,
}: DiscardFormDialogProps) {
  const queryClient = useQueryClient()

  const [discardQty, setDiscardQty] = useState('')
  const [discardReason, setDiscardReason] = useState<
    'expired' | 'damaged' | 'recalled' | 'other'
  >('expired')
  const [discardDestination, setDiscardDestination] = useState('')
  const [discardNotes, setDiscardNotes] = useState('')

  const discardMutation = useMutation({
    mutationFn: async () => {
      if (!lot) return
      const locId = lot.stockItems[0]?.locationId
      if (!locId) throw new Error('Localização não encontrada')

      return apiClient('/stock/discard', {
        method: 'POST',
        body: JSON.stringify({
          storeId: lot.store.id,
          lotId: lot.id,
          locationId: locId,
          quantity: Number(discardQty),
          reason: discardReason,
          destination: discardDestination,
          notes: discardNotes,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots-list'] })
      toast.success('Descarte formal registrado e auditado com sucesso!')
      onOpenChange(false)
      setDiscardQty('')
      setDiscardDestination('')
      setDiscardNotes('')
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Erro ao processar descarte',
      )
    },
  })

  if (!lot) return null

  const availablePhysical = lot.stockItems[0]?.physicalQuantity ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-lg flex flex-col overflow-hidden bg-zinc-950 p-0 text-zinc-100 sm:rounded-2xl max-h-[90vh]"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="text-xl font-bold text-zinc-100">
            Descarte Formal Auditado de Lote
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Lote:{' '}
            <span className="font-mono text-zinc-200">{lot.lotNumber}</span> —
            Saldo Físico:{' '}
            <span className="font-semibold text-amber-400">
              {availablePhysical} unid.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            discardMutation.mutate()
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-1 pb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1 whitespace-nowrap">
                  Quantidade para Descarte *
                </label>
                <Input
                  type="number"
                  min="1"
                  max={availablePhysical}
                  placeholder={`Max: ${availablePhysical}`}
                  value={discardQty}
                  onChange={(e) => setDiscardQty(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1 whitespace-nowrap">
                  Motivo Formal *
                </label>
                <NativeSelect
                  value={discardReason}
                  onChange={(e) =>
                    setDiscardReason(
                      e.target.value as
                        'expired' | 'damaged' | 'recalled' | 'other',
                    )
                  }
                  className="w-full bg-zinc-900 border-zinc-800 text-xs rounded-xl cursor-pointer"
                  required
                >
                  <option value="expired">Vencimento de Validade</option>
                  <option value="damaged">Dano / Avaria Física</option>
                  <option value="recalled">
                    Recolhimento Sanitário (Recall)
                  </option>
                  <option value="other">Outro Motivo</option>
                </NativeSelect>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1 whitespace-nowrap">
                Destino do Descarte *
              </label>
              <Input
                placeholder="Ex: Incineração Sanitária, Devolução ao Fornecedor, Lixo Orgânico"
                value={discardDestination}
                onChange={(e) => setDiscardDestination(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1 whitespace-nowrap">
                Observações Adicionais / Laudo
              </label>
              <Textarea
                placeholder="Observações complementares para ata de auditoria..."
                value={discardNotes}
                onChange={(e) => setDiscardNotes(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 rounded-xl min-h-20"
              />
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
              disabled={discardMutation.isPending}
              className="bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded-xl cursor-pointer shadow-lg shadow-rose-950/40"
            >
              <RiCheckLine className="mr-1.5 h-4 w-4" />
              {discardMutation.isPending
                ? 'Processando...'
                : 'Confirmar Descarte Auditado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
