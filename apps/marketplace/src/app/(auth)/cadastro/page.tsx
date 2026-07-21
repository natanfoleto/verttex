'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  RiLockPasswordLine,
  RiMailLine,
  RiPhoneLine,
  RiUser3Line,
} from 'react-icons/ri'
import { z } from 'zod'

import { apiClient, ApiError } from '../../../lib/api-client'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Informe seu nome completo'),
    email: z.string().email('Informe um e-mail válido'),
    phone: z.string().optional(),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null)
      setIsLoading(true)
      await apiClient('/auth/customers/register', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          password: data.password,
        }),
      })
      router.push('/login')
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('Erro ao realizar cadastro. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-amber-900/40 bg-amber-950/40 p-8 shadow-2xl backdrop-blur-md">
        <div className="space-y-2 text-center">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-white">
            Criar Conta de Cliente
          </h1>
          <p className="text-xs text-amber-300/80">
            Cadastre-se para comprar diretamente de produtores da região
          </p>
        </div>

        {serverError && (
          <div className="rounded-2xl border border-rose-800/60 bg-rose-950/60 p-4 text-center text-xs text-rose-300">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-amber-200/90 uppercase">
              Nome Completo
            </label>
            <div className="relative">
              <RiUser3Line className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-amber-500/60" />
              <input
                {...register('name')}
                type="text"
                placeholder="Ex: Maria Souza"
                className="w-full rounded-xl border border-amber-800/60 bg-amber-950/80 py-2.5 pr-4 pl-10 text-xs text-white placeholder-amber-500/40 transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-amber-200/90 uppercase">
              Seu E-mail
            </label>
            <div className="relative">
              <RiMailLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-amber-500/60" />
              <input
                {...register('email')}
                type="email"
                placeholder="seu.email@exemplo.com"
                className="w-full rounded-xl border border-amber-800/60 bg-amber-950/80 py-2.5 pr-4 pl-10 text-xs text-white placeholder-amber-500/40 transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-amber-200/90 uppercase">
              Telefone / WhatsApp (opcional)
            </label>
            <div className="relative">
              <RiPhoneLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-amber-500/60" />
              <input
                {...register('phone')}
                type="text"
                placeholder="(11) 99999-9999"
                className="w-full rounded-xl border border-amber-800/60 bg-amber-950/80 py-2.5 pr-4 pl-10 text-xs text-white placeholder-amber-500/40 transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-amber-200/90 uppercase">
              Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-amber-500/60" />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-amber-800/60 bg-amber-950/80 py-2.5 pr-4 pl-10 text-xs text-white placeholder-amber-500/40 transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-amber-200/90 uppercase">
              Confirmar Senha
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
              'Criar Minha Conta'
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-amber-300/70">
          Já possui conta na Verttex?{' '}
          <Link
            href="/login"
            className="font-semibold text-amber-400 hover:underline"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  )
}
