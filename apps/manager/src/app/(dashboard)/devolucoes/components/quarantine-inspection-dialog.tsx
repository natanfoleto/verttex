'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { RiShieldCheckLine, RiCheckLine } from 'react-icons/ri'
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
import { apiClient, ApiError } from '@/lib/api-client'

interface QuarantineInspectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  returnId: string | null
}

export function QuarantineInspectionDialog({
  open,
  onOpenChange,
  returnId,
}: QuarantineInspectionDialogProps) {
  const queryClient = useQueryClient()
  const [outcome, setOutcome] = useState<
    'QUARANTINE_RELEASE' | 'DAMAGE_DISCARD' | 'EXPIRATION_DISCARD'
  >('QUARANTINE_RELEASE')
  const [inspectionReport, setInspectionReport] = useState('')

  const inspectionMutation = useMutation({
    mutationFn: async () => {
      if (!returnId) return
      return apiClient(`/returns/${returnId}/quarantine-release`, {
        method: 'POST',
        body: JSON.stringify({
          outcome,
          inspectionReport: inspectionReport.trim(),
        }),
      })
    },
    onSuccess: () => {
      toast.success('Laudo de inspeção sanitária registrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['manager-returns'] })
      onOpenChange(false)
      setInspectionReport('')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) toast.error(err.message)
      else toast.error('Erro ao registrar laudo de quarentena')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full flex flex-col overflow-hidden bg-zinc-950 p-0 text-zinc-100 sm:rounded-2xl max-w-xl max-h-[90vh]">
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="text-xl font-bold text-zinc-100 flex items-center space-x-2">
            <RiShieldCheckLine className="h-5 w-5 text-amber-400" />
            <span>Laudo Técnico de Inspeção Sanitária em Quarentena</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Registe o parecer técnico para determinar o destino de segurança
            sanitária do produto devolvido.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            inspectionMutation.mutate()
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-1 pb-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200">
                Parecer / Destino Sanitário
              </label>
              <NativeSelect
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as any)}
                className="bg-zinc-900 border-zinc-800 text-xs cursor-pointer"
              >
                <option value="QUARANTINE_RELEASE">
                  Aprovado — Liberação Sanitária (Retorno ao Estoque Comercial)
                </option>
                <option value="DAMAGE_DISCARD">
                  Reprovado — Descarte por Avaria de Embalagem / Transporte
                </option>
                <option value="EXPIRATION_DISCARD">
                  Reprovado — Descarte por Expiração de Validade Sanitária
                </option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200">
                Parecer Técnico / Justificativa Sanitária
              </label>
              <Textarea
                value={inspectionReport}
                onChange={(e) => setInspectionReport(e.target.value)}
                placeholder="Descreva as condições de integridade da embalagem, lacre e validade do lote..."
                required
                className="bg-zinc-900 border-zinc-800 text-xs min-h-25"
              />
            </div>
          </div>

          <DialogFooter className="bg-zinc-950 px-6 py-4 border-t border-zinc-800/60 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer border-zinc-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                inspectionMutation.isPending || !inspectionReport.trim()
              }
              className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-xs font-bold"
            >
              <RiCheckLine className="h-4 w-4 mr-1.5" />
              <span>
                {inspectionMutation.isPending
                  ? 'Registrando Laudo...'
                  : 'Emitir Laudo'}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
