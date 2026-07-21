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
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/lojas/${storeId}`}
          className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Editar Loja
          </h1>
          <p className="text-sm text-zinc-400">
            Atualize as informações cadastrais e o status da loja
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
              Nome da Loja
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
              Slug (Endereço URL público)
            </label>
            <div className="mt-1.5 flex items-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 transition-colors focus-within:border-emerald-500">
              <span className="border-r border-zinc-800 bg-zinc-900/50 px-3 text-xs text-zinc-500 select-none">
                verttexloja.com.br/
              </span>
              <input
                {...register('slug')}
                type="text"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-100 focus:outline-none"
              />
            </div>
            {errors.slug && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.slug.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
              Descrição
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 transition-colors focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
              Domínio Próprio
            </label>
            <input
              {...register('customDomain')}
              type="text"
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 transition-colors focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
              Status da Loja
            </label>
            <NativeSelect {...register('status')} wrapperClassName="mt-1.5">
              <option value="draft">Rascunho (Draft)</option>
              <option value="active">Ativa (Active)</option>
              <option value="inactive">Inativa (Inactive)</option>
              <option value="suspended">
                Suspensa (Suspended - Apenas Admin)
              </option>
            </NativeSelect>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 border-t border-zinc-800 pt-6">
          <Link
            href={`/lojas/${storeId}`}
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
