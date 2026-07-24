'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiLockPasswordLine } from 'react-icons/ri'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12 font-sans text-stone-900">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-stone-200/80 bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-800 text-xl font-bold text-white shadow-xs">
            V
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Redefinir Senha
          </h1>
          <p className="text-xs text-stone-500">
            Digite sua nova senha para reestabelecer o acesso.
          </p>
        </div>

        {serverError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-xs text-rose-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input type="hidden" {...register('token')} />

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

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Salvar Nova Senha'
            )}
          </Button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="text-xs text-stone-500 hover:text-stone-900"
            >
              Voltar ao login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
