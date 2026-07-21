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
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 font-sans text-stone-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-800 text-xl font-bold text-white shadow-xs">
            V
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Criar Conta de Cliente
          </h1>
          <p className="text-xs text-stone-500">
            Cadastre-se para comprar diretamente de produtores artesanais da
            nossa região.
          </p>
        </div>

        {serverError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-xs text-rose-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
              Nome Completo
            </label>
            <div className="relative">
              <RiUser3Line className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                {...register('name')}
                type="text"
                placeholder="Ex: Maria Souza"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pr-4 pl-10 text-xs text-stone-900 placeholder-stone-400 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
              Seu E-mail
            </label>
            <div className="relative">
              <RiMailLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                {...register('email')}
                type="email"
                placeholder="seu.email@exemplo.com"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pr-4 pl-10 text-xs text-stone-900 placeholder-stone-400 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
              Telefone / WhatsApp (opcional)
            </label>
            <div className="relative">
              <RiPhoneLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                {...register('phone')}
                type="text"
                placeholder="(54) 99999-9999"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pr-4 pl-10 text-xs text-stone-900 placeholder-stone-400 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
              Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pr-4 pl-10 text-xs text-stone-900 placeholder-stone-400 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
              Confirmar Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pr-4 pl-10 text-xs text-stone-900 placeholder-stone-400 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-lg bg-emerald-800 px-4 py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Criar Minha Conta'
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-stone-500">
          Já possui conta na Verttex?{' '}
          <Link
            href="/login"
            className="font-bold text-emerald-800 hover:underline"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  )
}
