'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { RiCheckLine } from 'react-icons/ri'

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
  description?: string | null
  isSystem?: boolean
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
      const finalKey = key || sanitizeSlug(name).replace(/-/g, '_')

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
      <DialogContent className="w-full max-w-lg flex flex-col overflow-hidden bg-zinc-950 p-0 text-zinc-100 sm:rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="text-xl font-bold text-zinc-100">
            {isEditing ? 'Editar Cargo' : 'Novo Cargo'}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            {isEditing
              ? 'Atualize as informações do perfil de acesso selecionado.'
              : 'Cadastre um novo perfil de acesso e permissões para o sistema.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-3 pb-6 space-y-4">
            {errorMessage && (
              <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3 text-xs text-rose-300">
                {errorMessage}
              </div>
            )}

            <div>
              <label
                htmlFor="role-name"
                className="text-xs font-semibold text-zinc-300 block mb-1 whitespace-nowrap"
              >
                Nome do Cargo <span className="text-rose-400">*</span>
              </label>
              <Input
                id="role-name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Gerente de Loja"
              />
            </div>

            {!isEditing && (
              <div>
                <label
                  htmlFor="role-key"
                  className="text-xs font-semibold text-zinc-300 block mb-1 whitespace-nowrap"
                >
                  Identificador (Key) <span className="text-rose-400">*</span>
                </label>
                <Input
                  id="role-key"
                  name="key"
                  type="text"
                  required
                  value={key}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder="Ex: store_manager"
                  className="font-mono"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="role-description"
                className="text-xs font-semibold text-zinc-300 block mb-1 whitespace-nowrap"
              >
                Descrição
              </label>
              <Textarea
                id="role-description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição opcional das responsabilidades..."
                rows={3}
              />
            </div>

            {isEditing && (
              <div>
                <label
                  htmlFor="role-status"
                  className="text-xs font-semibold text-zinc-300 block mb-1 whitespace-nowrap"
                >
                  Status
                </label>
                <NativeSelect
                  id="role-status"
                  name="status"
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'active')}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </NativeSelect>
              </div>
            )}
          </div>

          <DialogFooter className="bg-zinc-950 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <RiCheckLine className="h-4 w-4" />
              <span>
                {mutation.isPending
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar Alterações'
                    : 'Criar Cargo'}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
