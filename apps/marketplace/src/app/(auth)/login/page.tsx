'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiLockPasswordLine, RiMailLine } from 'react-icons/ri'
import { z } from 'zod'

import { apiClient, ApiError } from '../../../lib/api-client'

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(1, 'A senha é obrigatória'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function CustomerLoginPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null)
      setIsLoading(true)
      await apiClient('/auth/customers/login', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      window.location.href = '/'
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('Falha ao autenticar. Verifique e-mail e senha.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12 font-sans text-stone-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-800 text-xl font-bold text-white shadow-xs">
            V
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Acessar Minha Conta
          </h1>
          <p className="text-xs text-stone-500">
            Entre com seus dados para acompanhar seus pedidos e produtos
            favoritos.
          </p>
        </div>

        {serverError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-xs text-rose-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
              E-mail
            </label>
            <div className="relative">
              <RiMailLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                {...register('email')}
                type="email"
                placeholder="seu.email@exemplo.com"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pr-4 pl-10 text-xs text-stone-900 placeholder-stone-400 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                Senha
              </label>
              <Link
                href="/esqueci-minha-senha"
                className="text-xs font-semibold text-emerald-800 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pr-4 pl-10 text-xs text-stone-900 placeholder-stone-400 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-lg bg-emerald-800 px-4 py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Entrar no Marketplace'
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-stone-500">
          Ainda não possui conta?{' '}
          <Link
            href="/cadastro"
            className="font-bold text-emerald-800 hover:underline"
          >
            Cadastrar-se agora
          </Link>
        </div>
      </div>
    </div>
  )
}
