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
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'

import { apiClient, ApiError } from '../../../../lib/api-client'

export interface LotItem {
  id: string
  lotNumber: string
  status: 'available' | 'quarantine' | 'blocked' | 'recalled'
  product: { id: string; name: string }
  store: { id: string; name: string }
}

interface StatusFormDialogProps {
  lot: LotItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StatusFormDialog({
  lot,
  open,
  onOpenChange,
}: StatusFormDialogProps) {
  const queryClient = useQueryClient()

  const [newStatus, setNewStatus] = useState<
    'available' | 'quarantine' | 'blocked' | 'recalled'
  >(lot?.status ?? 'quarantine')
  const [statusReason, setStatusReason] = useState('')

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!lot) return
      return apiClient(`/lots/${lot.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots-list'] })
      toast.success('Situação operacional do lote alterada com sucesso!')
      onOpenChange(false)
      setStatusReason('')
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Erro ao alterar status do lote',
      )
    },
  })

  if (!lot) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-lg flex flex-col overflow-hidden bg-zinc-950 p-0 text-zinc-100 sm:rounded-2xl max-h-[90vh]"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="text-xl font-bold text-zinc-100">
            Alterar Situação Operacional do Lote
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Lote:{' '}
            <span className="font-mono text-zinc-200">{lot.lotNumber}</span> —{' '}
            {lot.product.name}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateStatusMutation.mutate()
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-1 pb-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1 whitespace-nowrap">
                Nova Situação Operacional *
              </label>
              <NativeSelect
                value={newStatus}
                onChange={(e) =>
                  setNewStatus(
                    e.target.value as
                      'available' | 'quarantine' | 'blocked' | 'recalled',
                  )
                }
                className="w-full bg-zinc-900 border-zinc-800 text-xs rounded-xl cursor-pointer"
                required
              >
                <option value="available">Disponível (Comercializável)</option>
                <option value="quarantine">
                  Em Quarentena (Bloqueio Temporário)
                </option>
                <option value="blocked">
                  Bloqueado (Impeditivo Sanitário/Operacional)
                </option>
                <option value="recalled">
                  Recolhimento Sanitário (Recall)
                </option>
              </NativeSelect>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1 whitespace-nowrap">
                Justificativa da Alteração *
              </label>
              <Textarea
                placeholder="Informe o motivo da alteração de status operacional..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 rounded-xl min-h-24"
                required
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
              disabled={updateStatusMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <RiCheckLine className="mr-1.5 h-4 w-4" />
              {updateStatusMutation.isPending
                ? 'Salvando...'
                : 'Salvar Alteração'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
