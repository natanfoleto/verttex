'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiArrowLeftLine } from 'react-icons/ri'
import { z } from 'zod'

import { apiClient, ApiError } from '../../../../../lib/api-client'

const editRoleSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
})

type EditRoleFormData = z.infer<typeof editRoleSchema>

export default function EditRolePage({
  params,
}: {
  params: Promise<{ roleId: string }>
}) {
  const resolvedParams = use(params)
  const roleId = resolvedParams.roleId
  const router = useRouter()

  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: role, isLoading } = useQuery({
    queryKey: ['role-detail', roleId],
    queryFn: () => apiClient(`/roles/${roleId}`),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditRoleFormData>({
    resolver: zodResolver(editRoleSchema),
  })

  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description || '',
      })
    }
  }, [role, reset])

  const onSubmit = async (data: EditRoleFormData) => {
    try {
      setServerError(null)
      setIsSubmitting(true)
      await apiClient(`/roles/${roleId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      router.push(`/cargos/${roleId}`)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('Erro ao atualizar cargo')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100" />
      </div>
    )
  }

  if (role?.isSystem) {
    return (
      <div className="w-full space-y-6">
        <div className="space-y-4 rounded-xl border border-amber-800 bg-amber-950/60 p-6 text-center text-amber-300">
          <p>
            Cargos do sistema (sistema padrão) não podem ter seus metadados
            editados.
          </p>
          <Link
            href={`/cargos/${roleId}`}
            className="inline-flex items-center text-sm font-semibold hover:underline"
          >
            Voltar aos detalhes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/cargos/${roleId}`}
          className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Editar Cargo
          </h1>
          <p className="text-sm text-zinc-400">
            Atualize o nome e a descrição do cargo customizado
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
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
              Nome do Cargo
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
              Descrição (opcional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 transition-colors focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 border-t border-zinc-800 pt-6">
          <Link
            href={`/cargos/${roleId}`}
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
