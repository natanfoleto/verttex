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

const editStoreSchema = z.object({
  name: z.string().min(2, 'O nome da loja deve ter no mínimo 2 caracteres'),
  slug: z
    .string()
    .min(2, 'O slug deve ter no mínimo 2 caracteres')
    .regex(
      /^[a-z0-9-]+$/,
      'O slug deve conter apenas letras minúsculas, números e hífens',
    ),
  description: z.string().optional(),
  customDomain: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive', 'suspended']),
})

type EditStoreFormData = z.infer<typeof editStoreSchema>

export default function EditStorePage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const resolvedParams = use(params)
  const storeId = resolvedParams.storeId
  const router = useRouter()

  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: store, isLoading } = useQuery({
    queryKey: ['store-detail', storeId],
    queryFn: () => apiClient(`/stores/${storeId}`),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditStoreFormData>({
    resolver: zodResolver(editStoreSchema),
  })

  useEffect(() => {
    if (store) {
      reset({
        name: store.name,
        slug: store.slug,
        description: store.description || '',
        customDomain: store.customDomain || '',
        status: store.status,
      })
    }
  }, [store, reset])

  const onSubmit = async (data: EditStoreFormData) => {
    try {
      setServerError(null)
      setIsSubmitting(true)
      await apiClient(`/stores/${storeId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      router.push(`/lojas/${storeId}`)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('Erro ao atualizar loja')
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/lojas/${storeId}`}
          className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Editar Loja
          </h1>
          <p className="text-sm text-zinc-400">
            Atualize as informações cadastrais e o status da loja
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
              Nome da Loja
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
              Slug (Endereço URL público)
            </label>
            <div className="flex items-center mt-1.5 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden focus-within:border-emerald-500 transition-colors">
              <span className="px-3 text-xs text-zinc-500 border-r border-zinc-800 bg-zinc-900/50 select-none">
                verttexloja.com.br/
              </span>
              <input
                {...register('slug')}
                type="text"
                className="w-full px-3 py-2.5 bg-transparent text-sm text-zinc-100 focus:outline-none"
              />
            </div>
            {errors.slug && (
              <p className="text-xs text-rose-400 mt-1">
                {errors.slug.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Descrição
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Domínio Próprio
            </label>
            <input
              {...register('customDomain')}
              type="text"
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Status da Loja
            </label>
            <select
              {...register('status')}
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="draft">Rascunho (Draft)</option>
              <option value="active">Ativa (Active)</option>
              <option value="inactive">Inativa (Inactive)</option>
              <option value="suspended">
                Suspensa (Suspended - Apenas Admin)
              </option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
          <Link
            href={`/lojas/${storeId}`}
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
