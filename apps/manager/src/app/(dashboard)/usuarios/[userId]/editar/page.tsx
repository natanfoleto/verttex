'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { NativeSelect } from '@verttex/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiArrowLeftLine } from 'react-icons/ri'
import { z } from 'zod'

import { apiClient, ApiError } from '../../../../../lib/api-client'

const editUserSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Informe um e-mail válido'),
  phone: z.string().optional(),
  roleId: z.string().min(1, 'Selecione um cargo'),
  status: z.enum(['active', 'inactive', 'suspended']),
})

type EditUserFormData = z.infer<typeof editUserSchema>

export default function EditUserPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const resolvedParams = use(params)
  const userId = resolvedParams.userId
  const router = useRouter()

  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => apiClient(`/users/${userId}`),
  })

  const { data: rolesData } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => apiClient('/roles'),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  })

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        roleId: user.roleId,
        status: user.status,
      })
    }
  }, [user, reset])

  const onSubmit = async (data: EditUserFormData) => {
    try {
      setServerError(null)
      setIsSubmitting(true)
      await apiClient(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      router.push(`/usuarios/${userId}`)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('Erro ao atualizar usuário')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingUser) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/usuarios/${userId}`}
          className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Editar Usuário Gestor
          </h1>
          <p className="text-sm text-zinc-400">
            Atualize as informações cadastrais e permissões de acesso
          </p>
        </div>
      </div>

      {serverError && (
        <div className="rounded-xl border border-rose-800/80 bg-rose-950/50 p-4 text-sm text-rose-300">
          {serverError}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
              Nome Completo
            </label>
            <input
              {...register('name')}
              type="text"
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 transition-colors focus:border-emerald-500 focus:outline-none"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
              E-mail corporativo
            </label>
            <input
              {...register('email')}
              type="email"
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 transition-colors focus:border-emerald-500 focus:outline-none"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
              Telefone / WhatsApp (opcional)
            </label>
            <input
              {...register('phone')}
              type="text"
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 transition-colors focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
              Cargo Atribuído
            </label>
            <NativeSelect {...register('roleId')} wrapperClassName="mt-1.5">
              <option value="">Selecione um cargo...</option>
              {rolesData?.map(
                (role: { id: string; name: string; key: string }) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.key})
                  </option>
                ),
              )}
            </NativeSelect>
            {errors.roleId && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.roleId.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
              Status da Conta
            </label>
            <NativeSelect {...register('status')} wrapperClassName="mt-1.5">
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="suspended">Suspenso</option>
            </NativeSelect>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 border-t border-zinc-800 pt-6">
          <Link
            href={`/usuarios/${userId}`}
            className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
