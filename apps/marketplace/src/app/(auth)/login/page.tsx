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
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-amber-900/40 bg-amber-950/40 p-8 shadow-2xl backdrop-blur-md">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-xl font-bold text-white shadow-md shadow-amber-950">
            V
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-white">
            Acessar Minha Conta
          </h1>
          <p className="text-xs text-amber-300/80">
            Entre com seus dados para acompanhar pedidos e gerenciar seu perfil
          </p>
        </div>

        {serverError && (
          <div className="rounded-2xl border border-rose-800/60 bg-rose-950/60 p-4 text-center text-xs text-rose-300">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-amber-200/90 uppercase">
              E-mail
            </label>
            <div className="relative">
              <RiMailLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-amber-500/60" />
              <input
                {...register('email')}
                type="email"
                placeholder="seu.email@exemplo.com"
                className="w-full rounded-xl border border-amber-800/60 bg-amber-950/80 py-2.5 pr-4 pl-10 text-xs text-white placeholder-amber-500/40 transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold tracking-wider text-amber-200/90 uppercase">
                Senha
              </label>
              <Link
                href="/esqueci-minha-senha"
                className="text-xs font-medium text-amber-400 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-amber-500/60" />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-amber-800/60 bg-amber-950/80 py-2.5 pr-4 pl-10 text-xs text-white placeholder-amber-500/40 transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-3 text-xs font-semibold text-white shadow-md shadow-amber-950 transition-colors hover:bg-amber-500 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Entrar no Marketplace'
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-amber-300/70">
          Ainda não possui conta?{' '}
          <Link
            href="/cadastro"
            className="font-semibold text-amber-400 hover:underline"
          >
            Cadastrar-se agora
          </Link>
        </div>
      </div>
    </div>
  )
}
