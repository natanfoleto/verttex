'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verttex/ui'
import { useEffect, useState } from 'react'

import { apiClient, ApiError } from '../../../../lib/api-client'

export interface RoleItem {
  id: string
  name: string
  key: string
  description?: string
  isSystem: boolean
  isActive: boolean
}

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roleToEdit?: RoleItem | null
}

export function RoleFormDialog({
  open,
  onOpenChange,
  roleToEdit,
}: RoleFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = Boolean(roleToEdit)

  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (roleToEdit) {
      setName(roleToEdit.name)
      setKey(roleToEdit.key)
      setDescription(roleToEdit.description || '')
      setIsActive(roleToEdit.isActive)
    } else {
      setName('')
      setKey('')
      setDescription('')
      setIsActive(true)
    }
    setErrorMessage(null)
  }, [roleToEdit, open])

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null)
      if (isEditing && roleToEdit) {
        return apiClient(`/roles/${roleToEdit.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            description: description || undefined,
            isActive,
          }),
        })
      } else {
        return apiClient('/roles', {
          method: 'POST',
          body: JSON.stringify({
            name,
            key,
            description: description || undefined,
          }),
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-list'] })
      onOpenChange(false)
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Erro ao salvar cargo. Tente novamente.')
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md font-sans">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do perfil de acesso selecionado.'
              : 'Cadastre um novo perfil de acesso e permissões para o sistema.'}
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
              htmlFor="role-name"
              className="text-xs font-semibold text-zinc-300"
            >
              Nome do Cargo *
            </label>
            <input
              id="role-name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Gerente de Loja"
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {!isEditing && (
            <div>
              <label
                htmlFor="role-key"
                className="text-xs font-semibold text-zinc-300"
              >
                Identificador (Key) *
              </label>
              <input
                id="role-key"
                name="key"
                type="text"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Ex: store_manager"
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="role-description"
              className="text-xs font-semibold text-zinc-300"
            >
              Descrição
            </label>
            <textarea
              id="role-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional das responsabilidades..."
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-600 focus:outline-none"
              rows={3}
            />
          </div>

          {isEditing && (
            <div>
              <label
                htmlFor="role-status"
                className="text-xs font-semibold text-zinc-300"
              >
                Status
              </label>
              <select
                id="role-status"
                name="status"
                value={isActive ? 'active' : 'inactive'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-600 focus:outline-none"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
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
                  : 'Criar Cargo'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
