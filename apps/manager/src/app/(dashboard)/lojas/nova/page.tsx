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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/lojas"
          className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Nova Loja Parceira
          </h1>
          <p className="text-sm text-zinc-400">
            Cadastre uma nova loja de produtor parceiro na plataforma Verttex
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
              onChange={(e) => {
                register('name').onChange(e)
                handleNameChange(e)
              }}
              placeholder="Ex: Queijaria Artesanal da Serra"
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
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
                placeholder="queijaria-artesanal"
                className="w-full px-3 py-2.5 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
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
              Descrição do Produtor / Loja
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Conte brevemente a história e os produtos oferecidos por esta loja..."
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Domínio Próprio (Opcional - Fase Futura)
            </label>
            <input
              {...register('customDomain')}
              type="text"
              placeholder="ex: www.queijariadaserra.com.br"
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
          <Link
            href="/lojas"
            className="px-4 py-2.5 rounded-xl border border-zinc-800 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-md disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Criando...' : 'Criar Loja'}
          </button>
        </div>
      </form>
    </div>
  )
}
