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

export default function ResetPasswordPage() {
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
      await apiClient('/auth/users/reset-password', {
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 font-sans text-zinc-100 antialiased">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl backdrop-blur-sm">
        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
            Redefinir Senha
          </h2>
          <p className="text-sm text-zinc-400">
            Digite sua nova senha para redefinir o acesso
          </p>
        </div>

        {serverError && (
          <div className="rounded-xl border border-rose-800/80 bg-rose-950/50 p-4 text-center text-sm text-rose-300">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input type="hidden" {...register('token')} />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
              Nova Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <Input
                {...register('newPassword')}
                type="password"
                placeholder="••••••••"
                className="pl-11 h-11"
              />
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <Input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="pl-11 h-11"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-11">
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Salvar Nova Senha'
            )}
          </Button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Voltar ao login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
