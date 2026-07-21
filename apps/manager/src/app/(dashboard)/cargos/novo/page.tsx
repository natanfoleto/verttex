'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiArrowLeftLine } from 'react-icons/ri'
import { z } from 'zod'

import { apiClient, ApiError } from '../../../../lib/api-client'

const createRoleSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  key: z
    .string()
    .min(2, 'A chave deve ter no mínimo 2 caracteres')
    .regex(
      /^[a-z0-9_-]+$/,
      'A chave deve conter apenas letras minúsculas, números, hífens ou underlines',
    ),
  description: z.string().optional(),
})

type CreateRoleFormData = z.infer<typeof createRoleSchema>

export default function CreateRolePage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
  })

  const onSubmit = async (data: CreateRoleFormData) => {
    try {
      setServerError(null)
      setIsSubmitting(true)
      await apiClient('/roles', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      router.push('/cargos')
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('Erro ao cadastrar cargo')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/cargos"
          className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Novo Cargo Customizado
          </h1>
          <p className="text-sm text-zinc-400">
            Cadastre um novo perfil de acesso e defina suas permissões
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
              Nome do Cargo
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="Ex: Gerente de Operações"
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
              Identificador (Key)
            </label>
            <input
              {...register('key')}
              type="text"
              placeholder="ex: gerente-operacoes"
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 font-mono text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none"
            />
            {errors.key && (
              <p className="mt-1 text-xs text-rose-400">{errors.key.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
              Descrição (opcional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Descreva a responsabilidade deste cargo..."
              className="mt-1.5 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 border-t border-zinc-800 pt-6">
          <Link
            href="/cargos"
            className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Criando...' : 'Criar Cargo'}
          </button>
        </div>
      </form>
    </div>
  )
}
