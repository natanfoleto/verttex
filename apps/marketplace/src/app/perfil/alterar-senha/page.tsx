'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiArrowLeftLine, RiLockPasswordLine } from 'react-icons/ri'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-12 font-sans text-stone-900 antialiased">
        <div className="flex items-center space-x-4">
          <Link
            href="/perfil"
            className="rounded-lg border border-stone-200 p-2.5 text-stone-600 transition-colors hover:bg-stone-100"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
              Alterar Senha
            </h1>
            <p className="text-xs text-stone-500">
              Atualize sua senha de acesso à conta Verttex.
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm"
        >
          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
              Senha Atual
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                {...register('currentPassword')}
                type="password"
                placeholder="••••••••"
                className="pl-10"
              />
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
              Nova Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                {...register('newPassword')}
                type="password"
                placeholder="••••••••"
                className="pl-10"
              />
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="pl-10"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="mt-2 w-full">
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Atualizar Senha'
            )}
          </Button>
        </form>
      </div>
    </CustomerAuthGuard>
  )
}
