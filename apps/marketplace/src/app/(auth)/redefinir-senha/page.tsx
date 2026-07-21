'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiLockPasswordLine } from 'react-icons/ri'
import { z } from 'zod'

import { apiClient, ApiError } from '../../../lib/api-client'

const resetSchema = z
  .object({
    token: z.string().min(1, 'O token é obrigatório'),
    newPassword: z
      .string()
      .min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

type ResetFormData = z.infer<typeof resetSchema>

export default function CustomerResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token },
  })

  const onSubmit = async (data: ResetFormData) => {
    try {
      setServerError(null)
      setIsLoading(true)
      await apiClient('/auth/customers/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: data.token,
          newPassword: data.newPassword,
        }),
      })
      router.push('/login')
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('Token inválido ou expirado.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-amber-900/40 bg-amber-950/40 p-8 shadow-2xl backdrop-blur-md">
        <div className="space-y-2 text-center">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-white">
            Redefinir Senha
          </h1>
          <p className="text-xs text-amber-300/80">
            Digite sua nova senha para reestabelecer o acesso
          </p>
        </div>

        {serverError && (
          <div className="rounded-2xl border border-rose-800/60 bg-rose-950/60 p-4 text-center text-xs text-rose-300">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('token')} />

          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-amber-200/90 uppercase">
              Nova Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-amber-500/60" />
              <input
                {...register('newPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-amber-800/60 bg-amber-950/80 py-2.5 pr-4 pl-10 text-xs text-white placeholder-amber-500/40 transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-amber-200/90 uppercase">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-amber-500/60" />
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-amber-800/60 bg-amber-950/80 py-2.5 pr-4 pl-10 text-xs text-white placeholder-amber-500/40 transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.confirmPassword.message}
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
              'Salvar Nova Senha'
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="text-xs text-amber-300/80 hover:text-white"
            >
              Voltar ao login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
