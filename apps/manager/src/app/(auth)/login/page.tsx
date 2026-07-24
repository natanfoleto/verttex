'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  RiEyeLine,
  RiEyeOffLine,
  RiLockPasswordLine,
  RiMailLine,
  RiShieldCheckLine,
} from 'react-icons/ri'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { apiClient, ApiError } from '../../../lib/api-client'

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(1, 'A senha é obrigatória'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 font-sans text-zinc-100 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),rgba(9,9,11,0))]" />

      <div className="relative w-full max-w-md space-y-8 rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-linear-to-br from-emerald-500 to-emerald-700 text-2xl font-black text-white shadow-lg shadow-emerald-950/60 ring-4 ring-emerald-950/50">
            V
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Painel de Gestão
            </h1>
            <p className="text-xs text-zinc-400">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="flex items-center space-x-2.5 rounded-2xl border border-rose-800/60 bg-rose-950/40 p-4 text-xs font-medium text-rose-300 backdrop-blur-sm animate-in fade-in slide-in-from-top-1">
            <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* E-mail Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-[11px] font-semibold tracking-wider text-zinc-300 uppercase"
            >
              E-mail
            </label>
            <div className="relative">
              <RiMailLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-emerald-400" />
              <Input
                {...register('email')}
                id="email"
                name="email"
                type="email"
                placeholder="seu.email@verttexloja.com.br"
                className="pl-10 h-11 rounded-2xl"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs font-medium text-rose-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-[11px] font-semibold tracking-wider text-zinc-300 uppercase"
              >
                Senha de acesso
              </label>
              <Link
                href="/esqueci-minha-senha"
                className="text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors" />
              <Input
                {...register('password')}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-11 h-11 rounded-2xl"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? (
                  <RiEyeOffLine className="h-4 w-4" />
                ) : (
                  <RiEyeLine className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs font-medium text-rose-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-2xl text-sm"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span>Entrar no Sistema</span>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-center space-x-2 border-t border-zinc-800/60 pt-6 text-xs text-zinc-500">
          <RiShieldCheckLine className="h-4 w-4 text-emerald-500/80" />
          <span>Ambiente Seguro • Verttex</span>
        </div>
      </div>
    </div>
  )
}
