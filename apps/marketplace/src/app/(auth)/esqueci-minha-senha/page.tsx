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
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12 font-sans text-stone-900">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-stone-200/80 bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-800 text-xl font-bold text-white shadow-xs">
            V
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Recuperar Senha
          </h1>
          <p className="text-xs text-stone-500">
            Informe seu e-mail para receber as instruções de redefinição.
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-6 text-center">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
              Se o e-mail informado estiver cadastrado, enviamos as instruções
              para redefinir sua senha.
            </div>
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-800 hover:underline"
            >
              <RiArrowLeftLine className="h-4 w-4" />
              <span>Voltar para o Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                E-mail Cadastrado
              </label>
              <div className="relative">
                <RiMailLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pr-4 pl-10 text-xs text-stone-900 placeholder-stone-400 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-emerald-800 px-4 py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Enviar Instruções'
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center space-x-1.5 text-xs text-stone-500 hover:text-stone-900"
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
