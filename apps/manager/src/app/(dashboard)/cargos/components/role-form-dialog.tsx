'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

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
import { invalidateRoles } from '../../../../lib/query-keys'
import { sanitizeSlug } from '../../../../lib/slug'

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
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (roleToEdit) {
      setName(roleToEdit.name)
      setKey(roleToEdit.key)
      setDescription(roleToEdit.description || '')
      setIsActive(roleToEdit.isActive)
      setIsKeyManuallyEdited(true)
    } else {
      setName('')
      setKey('')
      setDescription('')
      setIsActive(true)
      setIsKeyManuallyEdited(false)
    }
    setErrorMessage(null)
  }, [roleToEdit, open])

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null)
      const finalKey = sanitizeSlug(key || name).replace(/-/g, '_')

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
            key: finalKey,
            description: description || undefined,
          }),
        })
      }
    },
    onSuccess: async () => {
      await invalidateRoles(queryClient, roleToEdit?.id)
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

  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEditing && !isKeyManuallyEdited) {
      setKey(sanitizeSlug(val).replace(/-/g, '_'))
    }
  }

  const handleKeyChange = (val: string) => {
    setIsKeyManuallyEdited(true)
    setKey(sanitizeSlug(val).replace(/-/g, '_'))
  }

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
            <Input
              id="role-name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Gerente de Loja"
              className="mt-1"
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
              <Input
                id="role-key"
                name="key"
                type="text"
                required
                value={key}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="Ex: store_manager"
                className="mt-1 font-mono"
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
            <Textarea
              id="role-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional das responsabilidades..."
              className="mt-1"
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
              <NativeSelect
                id="role-status"
                name="status"
                value={isActive ? 'active' : 'inactive'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                wrapperClassName="mt-1"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </NativeSelect>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar Alterações'
                  : 'Criar Cargo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
