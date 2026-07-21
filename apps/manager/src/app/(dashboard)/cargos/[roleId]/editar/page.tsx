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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100 mx-auto" />
      </div>
    )
  }

  if (role?.isSystem) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-xl bg-amber-950/60 border border-amber-800 p-6 text-amber-300 text-center space-y-4">
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/cargos/${roleId}`}
          className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Editar Cargo
          </h1>
          <p className="text-sm text-zinc-400">
            Atualize o nome e a descrição do cargo customizado
          </p>
        </div>
      </div>

      {serverError && (
        <div className="rounded-xl bg-rose-950/50 border border-rose-800/80 p-4 text-sm text-rose-300">
          {serverError}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Nome do Cargo
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {errors.name && (
              <p className="text-xs text-rose-400 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Descrição (opcional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
          <Link
            href={`/cargos/${roleId}`}
            className="px-4 py-2.5 rounded-xl border border-zinc-800 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-md disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Salvação...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
