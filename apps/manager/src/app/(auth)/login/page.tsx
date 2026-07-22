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

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@verttexloja.com.br',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null)
      setIsLoading(true)
      await apiClient('/auth/users/login', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      window.location.href = '/'
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('Falha na autenticação. Verifique suas credenciais.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 font-sans text-zinc-100 antialiased">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl backdrop-blur-sm">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold text-white shadow-md shadow-emerald-950">
            V
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
            Acessar Painel Verttex
          </h2>
          <p className="text-sm text-zinc-400">
            Informe suas credenciais de gestor para entrar
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="rounded-xl border border-rose-800/80 bg-rose-950/50 p-4 text-center text-sm text-rose-300">
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1.5">
            <div>
              <label
                htmlFor="email"
                className="text-xs font-semibold tracking-wider text-zinc-300 uppercase"
              >
                E-mail corporativo
              </label>
            </div>
            <div className="relative">
              <RiMailLine className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                {...register('email')}
                id="email"
                name="email"
                type="email"
                placeholder="seu.email@verttexloja.com.br"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pr-4 pl-11 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-semibold tracking-wider text-zinc-300 uppercase"
              >
                Senha de acesso
              </label>
              <Link
                href="/esqueci-minha-senha"
                className="text-xs font-medium text-emerald-400 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                {...register('password')}
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pr-4 pl-11 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
            className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-950/60 transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
