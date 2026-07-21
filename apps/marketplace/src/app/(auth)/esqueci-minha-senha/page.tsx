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

export default function CustomerForgotPasswordPage() {
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
      await apiClient('/auth/customers/forgot-password', {
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
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-amber-900/40 bg-amber-950/40 p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif">
            Recuperar Senha
          </h1>
          <p className="text-xs text-amber-300/80">
            Informe seu e-mail para receber o link de redefinição
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-6 text-center">
            <div className="rounded-2xl bg-emerald-950/60 border border-emerald-800/60 p-4 text-xs text-emerald-300">
              Se o e-mail informado estiver cadastrado, enviamos as instruções
              para redefinir sua senha.
            </div>
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 text-xs text-amber-300 hover:text-white font-medium"
            >
              <RiArrowLeftLine className="h-4 w-4" />
              <span>Voltar para o Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
                E-mail Cadastrado
              </label>
              <div className="relative">
                <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/60" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-amber-950/80 border border-amber-800/60 rounded-xl text-xs text-white placeholder-amber-500/40 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-400 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-950 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Enviar Instruções'
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center space-x-1.5 text-xs text-amber-300/80 hover:text-white"
              >
                <RiArrowLeftLine className="h-3.5 w-3.5" />
                <span>Voltar ao login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
