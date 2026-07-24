'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

import { apiClient, ApiError } from '../../../../lib/api-client'
import { invalidateUsers } from '../../../../lib/query-keys'

export interface UserItem {
  id: string
  name: string
  email: string
  status: string
  role?: { name: string }
  roleId: string
}

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userToEdit?: UserItem | null
}

export function UserFormDialog({
  open,
  onOpenChange,
  userToEdit,
}: UserFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = Boolean(userToEdit)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [status, setStatus] = useState('active')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch Available Roles
  const { data: rolesData } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => apiClient('/roles?perPage=100'),
  })

  const roles = Array.isArray(rolesData?.data)
    ? rolesData.data
    : Array.isArray(rolesData)
      ? rolesData
      : []

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name)
      setEmail(userToEdit.email)
      setPassword('')
      setRoleId(userToEdit.roleId)
      setStatus(userToEdit.status)
    } else {
      setName('')
      setEmail('')
      setPassword('')
      setStatus('active')
      if (roles && roles.length > 0) {
        setRoleId(roles[0].id)
      } else {
        setRoleId('')
      }
    }
    setErrorMessage(null)
  }, [userToEdit, open, roles])

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null)
      if (isEditing && userToEdit) {
        return apiClient(`/users/${userToEdit.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            email,
            roleId,
            status,
          }),
        })
      } else {
        return apiClient('/users', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            password,
            roleId,
          }),
        })
      }
    },
    onSuccess: async () => {
      await invalidateUsers(queryClient, userToEdit?.id)
      onOpenChange(false)
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Erro ao salvar usuário. Tente novamente.')
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md font-sans">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Usuário' : 'Novo Usuário Gestor'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do usuário administrativo.'
              : 'Cadastre um novo usuário administrativo com acesso ao painel de gestão.'}
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
              htmlFor="user-name"
              className="text-xs font-semibold text-zinc-300"
            >
              Nome Completo *
            </label>
            <Input
              id="user-name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carlos Silva"
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="user-email"
              className="text-xs font-semibold text-zinc-300"
            >
              E-mail *
            </label>
            <Input
              id="user-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carlos@exemplo.com.br"
              className="mt-1"
            />
          </div>

          {!isEditing && (
            <div>
              <label
                htmlFor="user-password"
                className="text-xs font-semibold text-zinc-300"
              >
                Senha Inicial *
              </label>
              <Input
                id="user-password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="user-roleId"
              className="text-xs font-semibold text-zinc-300"
            >
              Cargo / Perfil de Acesso *
            </label>
            <NativeSelect
              id="user-roleId"
              name="roleId"
              required
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              wrapperClassName="mt-1"
            >
              <option value="" disabled>
                Selecione um cargo...
              </option>
              {roles?.map((r: { id: string; name: string }) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          {isEditing && (
            <div>
              <label
                htmlFor="user-status"
                className="text-xs font-semibold text-zinc-300"
              >
                Status
              </label>
              <NativeSelect
                id="user-status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
                  : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
