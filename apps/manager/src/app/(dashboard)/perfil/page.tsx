'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  RiCheckLine,
  RiComputerLine,
  RiLockPasswordLine,
  RiShieldLine,
  RiStoreLine,
  RiUser3Line,
} from 'react-icons/ri'
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
    <div className="w-full space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center space-x-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-700/60 bg-emerald-950 text-2xl font-bold text-emerald-300 shadow-md">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              {user?.name || 'Gestor Verttex'}
            </h1>
            <p className="font-mono text-xs text-zinc-400">
              {user?.email} • Perfil{' '}
              <strong className="text-emerald-400 capitalize">
                {user?.role?.name}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation for Profile Sections */}
      <Tabs defaultValue="geral" className="w-full space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto border-zinc-800 sm:w-auto">
          <TabsTrigger value="geral" className="space-x-2">
            <RiUser3Line className="h-4 w-4" />
            <span>Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="space-x-2">
            <RiLockPasswordLine className="h-4 w-4" />
            <span>Segurança & Senha</span>
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="space-x-2">
            <RiShieldLine className="h-4 w-4" />
            <span>Cargo & Permissões</span>
          </TabsTrigger>
          <TabsTrigger value="sessoes" className="space-x-2">
            <RiComputerLine className="h-4 w-4" />
            <span>Sessões</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Visão Geral / Dados Pessoais */}
        <TabsContent value="geral" className="space-y-6">
          <div className="w-full space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl border border-emerald-800 bg-emerald-950 p-2 text-emerald-400">
                <RiUser3Line className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-200">
                  Dados Pessoais
                </h2>
                <p className="text-xs text-zinc-400">
                  Identificação da sua conta de acesso ao ecossistema Verttex
                </p>
              </div>
            </div>

            {profileSuccess && (
              <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/60 p-3 text-xs text-emerald-300">
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateName} className="max-w-2xl space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-zinc-800/60 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    Cargo de Sistema
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.role?.name || ''}
                    className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-zinc-800/60 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 transition-colors focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex cursor-pointer items-center justify-center space-x-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-emerald-500"
                >
                  <RiCheckLine className="h-4 w-4" />
                  <span>
                    {isUpdatingProfile ? 'Atualizando...' : 'Salvar Alterações'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Tab 2: Segurança (Alterar Senha) */}
        <TabsContent value="seguranca" className="space-y-6">
          <div
            id="senha"
            className="w-full space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
          >
            <div className="flex items-center space-x-3">
              <div className="rounded-xl border border-purple-800 bg-purple-950 p-2 text-purple-400">
                <RiLockPasswordLine className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-200">
                  Segurança & Credenciais
                </h2>
                <p className="text-xs text-zinc-400">
                  Atualize sua senha de acesso periodicamente para manter sua
                  conta protegida
                </p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="max-w-2xl rounded-xl border border-emerald-800/80 bg-emerald-950/60 p-3 text-xs text-emerald-300">
                {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="max-w-2xl rounded-xl border border-rose-800/80 bg-rose-950/60 p-3 text-xs text-rose-300">
                {passwordError}
              </div>
            )}

            <form
              onSubmit={handleSubmit(onChangePassword)}
              className="max-w-2xl space-y-4"
            >
              <div>
                <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                  Senha Atual
                </label>
                <input
                  {...register('currentPassword')}
                  type="password"
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 transition-colors focus:border-purple-500 focus:outline-none"
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-xs text-rose-400">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                    Nova Senha
                  </label>
                  <input
                    {...register('newPassword')}
                    type="password"
                    placeholder="••••••••"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 transition-colors focus:border-purple-500 focus:outline-none"
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-xs text-rose-400">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                    Confirmar Nova Senha
                  </label>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    placeholder="••••••••"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 transition-colors focus:border-purple-500 focus:outline-none"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-rose-400">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex cursor-pointer items-center justify-center space-x-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-purple-500"
                >
                  <RiLockPasswordLine className="h-4 w-4" />
                  <span>Atualizar Senha</span>
                </button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Tab 3: Cargo e Permissões */}
        <TabsContent value="permissoes" className="space-y-6">
          <div className="w-full space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl border border-blue-800 bg-blue-950 p-2 text-blue-400">
                <RiShieldLine className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-200">
                  Cargo & Direitos de Acesso
                </h2>
                <p className="text-xs text-zinc-400">
                  Resumo das permissões concedidas pelo seu cargo (
                  {user?.role?.name})
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                Permissões Ativas
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {user?.role?.key === 'admin' ? (
                  <div className="col-span-full flex items-center space-x-2 rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-3 text-xs font-medium text-emerald-300">
                    <RiCheckLine className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>Acesso Total de Administrador (manage.all)</span>
                  </div>
                ) : user?.permissions && user.permissions.length > 0 ? (
                  user.permissions.map((p, idx) => (
                    <div
                      key={p.key || idx}
                      className="flex items-center space-x-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300"
                    >
                      <RiCheckLine className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{p.key}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">
                    Permissões padrão de {user?.role?.name} aplicadas.
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Sessões */}
        <TabsContent value="sessoes" className="space-y-6">
          <div className="w-full space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl border border-amber-800 bg-amber-950 p-2 text-amber-400">
                <RiComputerLine className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-200">
                  Sessões Ativas
                </h2>
                <p className="text-xs text-zinc-400">
                  Dispositivos e conexões ativas conectadas a esta conta
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300">
              <div className="flex items-center space-x-3">
                <RiStoreLine className="h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold text-zinc-100">
                    Sessão Atual do Navegador
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Fastify JWT Session (Expira em 7 dias)
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full border border-emerald-800 bg-emerald-950 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                Ativo Agora
              </span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
