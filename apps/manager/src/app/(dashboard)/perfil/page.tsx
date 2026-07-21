'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiCheckLine, RiLockPasswordLine, RiUser3Line } from 'react-icons/ri'
import { z } from 'zod'

import { apiClient, ApiError } from '../../../lib/api-client'
import { useAuth } from '../../../providers/auth-provider'

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

export default function ProfilePage() {
  const { user, refetchUser } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      setIsUpdatingProfile(true)
      await apiClient(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      })
      refetchUser()
      setProfileSuccess('Nome atualizado com sucesso!')
      setTimeout(() => setProfileSuccess(null), 3000)
    } catch {
      setProfileSuccess('Erro ao atualizar nome.')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const onChangePassword = async (data: ChangePasswordFormData) => {
    try {
      setPasswordError(null)
      setPasswordSuccess(null)
      await apiClient('/auth/users/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })
      setPasswordSuccess('Senha alterada com sucesso!')
      reset()
      setTimeout(() => setPasswordSuccess(null), 3000)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setPasswordError(err.message)
      } else {
        setPasswordError('Erro ao alterar senha. Verifique a senha atual.')
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Meu Perfil Gestor
        </h1>
        <p className="text-sm text-zinc-400">
          Gerencie suas informações pessoais e credenciais de segurança
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
              <RiUser3Line className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-zinc-200">
              Informações Pessoais
            </h2>
          </div>

          {profileSuccess && (
            <div className="rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-3 text-xs text-emerald-300">
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                E-mail (Não alterável)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950/60 border border-zinc-800/60 rounded-xl text-sm text-zinc-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Cargo
              </label>
              <input
                type="text"
                disabled
                value={user?.role?.name || ''}
                className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950/60 border border-zinc-800/60 rounded-xl text-sm text-zinc-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Nome Exibido
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <RiCheckLine className="h-4 w-4" />
              <span>
                {isUpdatingProfile ? 'Atualizando...' : 'Salvar Nome'}
              </span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-950 text-purple-400 border border-purple-800">
              <RiLockPasswordLine className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-zinc-200">
              Alterar Senha
            </h2>
          </div>

          {passwordSuccess && (
            <div className="rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-3 text-xs text-emerald-300">
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="rounded-xl bg-rose-950/60 border border-rose-800/80 p-3 text-xs text-rose-300">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Senha Atual
              </label>
              <input
                {...register('currentPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-purple-500 transition-colors"
              />
              {passwordErrors.currentPassword && (
                <p className="text-xs text-rose-400 mt-1">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Nova Senha
              </label>
              <input
                {...register('newPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-purple-500 transition-colors"
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-rose-400 mt-1">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Confirmar Nova Senha
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full mt-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-purple-500 transition-colors"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-rose-400 mt-1">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <RiLockPasswordLine className="h-4 w-4" />
              <span>Atualizar Senha</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
