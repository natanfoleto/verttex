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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-amber-900/40 bg-amber-950/40 p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif">
            Criar Conta de Cliente
          </h1>
          <p className="text-xs text-amber-300/80">
            Cadastre-se para comprar diretamente de produtores da região
          </p>
        </div>

        {serverError && (
          <div className="rounded-2xl bg-rose-950/60 border border-rose-800/60 p-4 text-xs text-rose-300 text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
              Nome Completo
            </label>
            <div className="relative">
              <RiUser3Line className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/60" />
              <input
                {...register('name')}
                type="text"
                placeholder="Ex: Maria Souza"
                className="w-full pl-10 pr-4 py-2.5 bg-amber-950/80 border border-amber-800/60 rounded-xl text-xs text-white placeholder-amber-500/40 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
            {errors.name && (
              <p className="text-xs text-rose-400 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
              Seu E-mail
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

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
              Telefone / WhatsApp (opcional)
            </label>
            <div className="relative">
              <RiPhoneLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/60" />
              <input
                {...register('phone')}
                type="text"
                placeholder="(11) 99999-9999"
                className="w-full pl-10 pr-4 py-2.5 bg-amber-950/80 border border-amber-800/60 rounded-xl text-xs text-white placeholder-amber-500/40 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
              Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/60" />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-amber-950/80 border border-amber-800/60 rounded-xl text-xs text-white placeholder-amber-500/40 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-400 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
              Confirmar Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/60" />
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-amber-950/80 border border-amber-800/60 rounded-xl text-xs text-white placeholder-amber-500/40 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
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
              'Criar Minha Conta'
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-amber-300/70">
          Já possui conta na Verttex?{' '}
          <Link
            href="/login"
            className="text-amber-400 font-semibold hover:underline"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  )
}
