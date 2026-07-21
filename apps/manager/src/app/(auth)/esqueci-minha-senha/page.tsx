'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiArrowLeftLine, RiMailLine } from 'react-icons/ri'
import { z } from 'zod'

import { apiClient } from '../../../lib/api-client'

const forgotSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
})

type ForgotFormData = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotFormData) => {
    try {
      setIsLoading(true)
      await apiClient('/auth/users/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      setIsSubmitted(true)
    } catch {
      setIsSubmitted(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 font-sans text-zinc-100 antialiased">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl backdrop-blur-sm">
        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
            Recuperar Senha
          </h2>
          <p className="text-sm text-zinc-400">
            Informe seu e-mail cadastrado para receber as instruções
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-6 text-center">
            <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/50 p-4 text-sm text-emerald-300">
              Se o e-mail informado estiver cadastrado em nosso sistema,
              enviamos as instruções para redefinição de senha.
            </div>
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 text-sm font-medium text-zinc-300 hover:text-white"
            >
              <RiArrowLeftLine className="h-4 w-4" />
              <span>Voltar para o Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                E-mail corporativo
              </label>
              <div className="relative">
                <RiMailLine className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu.email@verttex.com.br"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pr-4 pl-11 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Enviar Instruções'
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 text-xs text-zinc-400 hover:text-zinc-200"
              >
                <RiArrowLeftLine className="h-4 w-4" />
                <span>Voltar ao login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
