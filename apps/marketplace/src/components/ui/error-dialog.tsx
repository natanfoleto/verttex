'use client'

import { RiAlertLine } from 'react-icons/ri'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApiError } from '@/lib/api-client'

export interface ErrorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  error?: ApiError | Error | null
  title?: string
  description?: string
}

const FIELD_LABELS: Record<string, string> = {
  price: 'Preço',
  sku: 'SKU',
  stock: 'Estoque',
  name: 'Nome',
  description: 'Descrição',
  categoryId: 'Categoria',
  categoryIds: 'Categorias',
  storeId: 'Loja',
  brandId: 'Marca',
  type: 'Tipo',
  images: 'Imagens',
}

function formatFieldLabel(fieldKey: string): string {
  if (fieldKey.includes('variations.')) {
    return fieldKey.replace(/variations\.(\d+)\.(\w+)/, (_, idx, prop) => {
      const propLabel = FIELD_LABELS[prop] || prop
      return `Variação #${Number(idx) + 1} (${propLabel})`
    })
  }
  return FIELD_LABELS[fieldKey] || fieldKey
}

export function ErrorDialog({
  open,
  onOpenChange,
  error,
  title = 'Atenção: Existem pendências a serem corrigidas',
  description = 'Não foi possível concluir a solicitação. Verifique os detalhes e corrija os pontos indicados abaixo para prosseguir.',
}: ErrorDialogProps) {
  if (!error) return null

  const isApiError = error instanceof ApiError
  const fieldErrors = isApiError ? error.fieldErrors : undefined

  const hasFieldErrors =
    fieldErrors &&
    typeof fieldErrors === 'object' &&
    Object.keys(fieldErrors).length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 font-sans text-zinc-100 shadow-2xl sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <div className="flex items-center space-x-3 text-rose-500">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-500">
              <RiAlertLine className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold tracking-tight text-zinc-100">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-relaxed text-zinc-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 max-h-60 space-y-2.5 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
          {hasFieldErrors ? (
            Object.entries(fieldErrors).map(([field, messages]) => {
              const formattedLabel = formatFieldLabel(field)
              const messageList = Array.isArray(messages)
                ? messages
                : [messages]

              return (
                <div key={field} className="space-y-1 text-xs">
                  <span className="block font-semibold text-zinc-200">
                    {formattedLabel}:
                  </span>
                  {messageList.map((msg, i) => (
                    <div
                      key={i}
                      className="flex items-start space-x-2 pl-2 font-medium text-rose-500"
                    >
                      <span className="shrink-0 text-rose-500">•</span>
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              )
            })
          ) : (
            <div className="flex items-start space-x-2 text-xs font-medium text-rose-500">
              <span className="shrink-0 text-rose-500">•</span>
              <span>
                {error.message || 'Ocorreu um erro ao processar a requisição.'}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 sm:justify-end">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 w-full cursor-pointer rounded-lg bg-emerald-600 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 sm:w-auto"
          >
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
