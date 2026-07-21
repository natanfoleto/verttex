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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/cargos"
          className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Novo Cargo Customizado
          </h1>
          <p className="text-sm text-zinc-400">
            Cadastre um novo perfil de acesso e defina suas permissões
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
              placeholder="Ex: Gerente de Operações"
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
              Identificador (Key)
            </label>
            <input
              {...register('key')}
              type="text"
              placeholder="ex: gerente-operacoes"
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {errors.key && (
              <p className="text-xs text-rose-400 mt-1">{errors.key.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Descrição (opcional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Descreva a responsabilidade deste cargo..."
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
          <Link
            href="/cargos"
            className="px-4 py-2.5 rounded-xl border border-zinc-800 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-md disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Criando...' : 'Criar Cargo'}
          </button>
        </div>
      </form>
    </div>
  )
}
