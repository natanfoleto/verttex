'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiArrowLeftLine } from 'react-icons/ri'
import { z } from 'zod'

import { apiClient, ApiError } from '../../../../lib/api-client'

const createUserSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  roleId: z.string().min(1, 'Selecione um cargo'),
  phone: z.string().optional(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

export default function CreateUserPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: rolesData } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => apiClient('/roles'),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  })

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      setServerError(null)
      setIsSubmitting(true)
      await apiClient('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      router.push('/usuarios')
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('Erro ao cadastrar usuário')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/usuarios"
          className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Novo Usuário Gestor
          </h1>
          <p className="text-sm text-zinc-400">
            Cadastre um novo usuário com permissão de acesso ao painel
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
              Nome Completo
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="Ex: Ana Silva"
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
              E-mail corporativo
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="ana.silva@verttex.com.br"
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {errors.email && (
              <p className="text-xs text-rose-400 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Telefone / WhatsApp (opcional)
            </label>
            <input
              {...register('phone')}
              type="text"
              placeholder="(11) 99999-9999"
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Cargo Atribuído
            </label>
            <select
              {...register('roleId')}
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">Selecione um cargo...</option>
              {rolesData?.map(
                (role: { id: string; name: string; key: string }) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.key})
                  </option>
                ),
              )}
            </select>
            {errors.roleId && (
              <p className="text-xs text-rose-400 mt-1">
                {errors.roleId.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Senha Inicial
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {errors.password && (
              <p className="text-xs text-rose-400 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
          <Link
            href="/usuarios"
            className="px-4 py-2.5 rounded-xl border border-zinc-800 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-md disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Cadastrando...' : 'Cadastrar Usuário'}
          </button>
        </div>
      </form>
    </div>
  )
}
