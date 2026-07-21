'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NativeSelect } from '@/components/ui/native-select'
import { useEffect, useState } from 'react'

import { apiClient, ApiError } from '../../../../lib/api-client'
import { storeQueryKeys } from '../../../../lib/query-keys'
import { sanitizeSlug } from '../../../../lib/slug'

export interface StoreItem {
  id: string
  name: string
  slug: string
  description?: string
  status: string
  _count?: { users: number }
}

interface StoreFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeToEdit?: StoreItem | null
}

export function StoreFormDialog({
  open,
  onOpenChange,
  storeToEdit,
}: StoreFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = Boolean(storeToEdit)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('active')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (storeToEdit) {
      setName(storeToEdit.name)
      setSlug(storeToEdit.slug)
      setDescription(storeToEdit.description || '')
      setStatus(storeToEdit.status)
      setIsSlugManuallyEdited(true)
    } else {
      setName('')
      setSlug('')
      setDescription('')
      setStatus('active')
      setIsSlugManuallyEdited(false)
    }
    setErrorMessage(null)
  }, [storeToEdit, open])

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null)
      const finalSlug = sanitizeSlug(slug || name)

      if (isEditing && storeToEdit) {
        return apiClient(`/stores/${storeToEdit.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            description: description || undefined,
            status,
          }),
        })
      } else {
        return apiClient('/stores', {
          method: 'POST',
          body: JSON.stringify({
            name,
            slug: finalSlug,
            description: description || undefined,
          }),
        })
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: storeQueryKeys.all })
      onOpenChange(false)
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Erro ao salvar loja. Tente novamente.')
      }
    },
  })

  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEditing && !isSlugManuallyEdited) {
      setSlug(sanitizeSlug(val))
    }
  }

  const handleSlugChange = (val: string) => {
    setIsSlugManuallyEdited(true)
    setSlug(sanitizeSlug(val))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md font-sans">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Loja Parceira' : 'Nova Loja Parceira'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações cadastrais e o status da loja.'
              : 'Cadastre uma nova loja de produtor ou parceiro na plataforma Verttex.'}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="store-name"
              className="text-xs font-semibold text-zinc-300"
            >
              Nome da Loja *
            </label>
            <input
              id="store-name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Queijaria Alvorada"
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {!isEditing && (
            <div>
              <label
                htmlFor="store-slug"
                className="text-xs font-semibold text-zinc-300"
              >
                Slug (URL) *
              </label>
              <input
                id="store-slug"
                name="slug"
                type="text"
                required
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="ex: queijaria-alvorada"
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="store-description"
              className="text-xs font-semibold text-zinc-300"
            >
              Descrição da Loja
            </label>
            <textarea
              id="store-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição sobre a produção artesanal..."
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-600 focus:outline-none"
              rows={3}
            />
          </div>

          {isEditing && (
            <div>
              <label
                htmlFor="store-status"
                className="text-xs font-semibold text-zinc-300"
              >
                Status
              </label>
              <NativeSelect
                id="store-status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                wrapperClassName="mt-1"
              >
                <option value="draft">Rascunho (Draft)</option>
                <option value="active">Ativa (Active)</option>
                <option value="inactive">Inativa (Inactive)</option>
                <option value="suspended">Suspensa (Suspended)</option>
              </NativeSelect>
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer rounded-xl border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {mutation.isPending
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar Alterações'
                  : 'Criar Loja'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
