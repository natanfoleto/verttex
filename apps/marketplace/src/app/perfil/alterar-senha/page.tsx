'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiArrowLeftLine, RiLockPasswordLine } from 'react-icons/ri'
import { z } from 'zod'

import { CustomerAuthGuard } from '../../../components/guards/customer-auth-guard'
import { apiClient, ApiError } from '../../../lib/api-client'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'A senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export default function CustomerChangePasswordPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setErrorMessage(null)
      setSuccessMessage(null)
      setIsLoading(true)
      await apiClient('/auth/customers/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })
      setSuccessMessage('Sua senha foi alterada com sucesso!')
      reset()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Erro ao alterar senha. Verifique a senha atual.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CustomerAuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6 antialiased font-sans">
        <div className="flex items-center space-x-4">
          <Link
            href="/perfil"
            className="p-2 rounded-xl border border-amber-900/60 text-amber-300 hover:text-white hover:bg-amber-900/40 transition-colors"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white font-serif tracking-tight">
              Alterar Senha
            </h1>
            <p className="text-xs text-amber-300/80">
              Atualize sua senha de acesso à conta Verttex
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="rounded-2xl bg-emerald-950/60 border border-emerald-800/60 p-4 text-xs text-emerald-300">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl bg-rose-950/60 border border-rose-800/60 p-4 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-amber-950/40 p-6 rounded-3xl border border-amber-900/40 space-y-4 backdrop-blur-md"
        >
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
              Senha Atual
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/60" />
              <input
                {...register('currentPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-amber-950/80 border border-amber-800/60 rounded-xl text-xs text-white placeholder-amber-500/40 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-rose-400 mt-1">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
              Nova Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/60" />
              <input
                {...register('newPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-amber-950/80 border border-amber-800/60 rounded-xl text-xs text-white placeholder-amber-500/40 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            {errors.newPassword && (
              <p className="text-xs text-rose-400 mt-1">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/60" />
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-amber-950/80 border border-amber-800/60 rounded-xl text-xs text-white placeholder-amber-500/40 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-rose-400 mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-950 disabled:opacity-50 transition-colors flex items-center justify-center mt-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Atualizar Senha'
            )}
          </button>
        </form>
      </div>
    </CustomerAuthGuard>
  )
}
