'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiArrowLeftLine } from 'react-icons/ri'
import { z } from 'zod'

import { apiClient, ApiError } from '../../../../lib/api-client'

const createStoreSchema = z.object({
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
})

type CreateStoreFormData = z.infer<typeof createStoreSchema>

export default function CreateStorePage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema),
  })

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const generatedSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    setValue('slug', generatedSlug)
  }

  const onSubmit = async (data: CreateStoreFormData) => {
    try {
      setServerError(null)
      setIsSubmitting(true)
      await apiClient('/stores', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      router.push('/lojas')
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('Erro ao cadastrar loja')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/lojas"
          className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Nova Loja Parceira
          </h1>
          <p className="text-sm text-zinc-400">
            Cadastre uma nova loja de produtor parceiro na plataforma Verttex
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
              onChange={(e) => {
                register('name').onChange(e)
                handleNameChange(e)
              }}
              placeholder="Ex: Queijaria Artesanal da Serra"
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none"
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
                placeholder="queijaria-artesanal"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
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
              Descrição do Produtor / Loja
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Conte brevemente a história e os produtos oferecidos por esta loja..."
              className="mt-1.5 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
              Domínio Próprio (Opcional - Fase Futura)
            </label>
            <input
              {...register('customDomain')}
              type="text"
              placeholder="ex: www.queijariadaserra.com.br"
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 border-t border-zinc-800 pt-6">
          <Link
            href="/lojas"
            className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Criando...' : 'Criar Loja'}
          </button>
        </div>
      </form>
    </div>
  )
}
