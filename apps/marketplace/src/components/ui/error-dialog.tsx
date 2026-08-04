'use client'

import React from 'react'
import { RiAlertLine } from 'react-icons/ri'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
      <DialogContent className="sm:max-w-lg rounded-2xl border-none shadow-2xl bg-white p-6 font-sans">
        <DialogHeader className="space-y-3">
          <div className="flex items-center space-x-3 text-rose-600">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
              <RiAlertLine className="h-5 w-5 text-rose-600" />
            </div>
            <DialogTitle className="text-base font-bold text-stone-900 tracking-tight">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-stone-500 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 max-h-60 overflow-y-auto rounded-xl bg-stone-50 p-4 border border-stone-100 space-y-2.5">
          {hasFieldErrors ? (
            Object.entries(fieldErrors).map(([field, messages]) => {
              const formattedLabel = formatFieldLabel(field)
              const messageList = Array.isArray(messages)
                ? messages
                : [messages]

              return (
                <div key={field} className="text-xs space-y-1">
                  <span className="font-semibold text-stone-800 block">
                    {formattedLabel}:
                  </span>
                  {messageList.map((msg, i) => (
                    <div
                      key={i}
                      className="flex items-start space-x-2 text-rose-600 font-medium pl-2"
                    >
                      <span className="shrink-0 text-rose-500">•</span>
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              )
            })
          ) : (
            <div className="text-xs font-medium text-rose-600 flex items-start space-x-2">
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
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-lg shadow-xs cursor-pointer"
          >
            Entendi, vou corrigir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
