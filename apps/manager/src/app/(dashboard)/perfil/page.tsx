'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  RiCheckLine,
  RiComputerLine,
  RiLockPasswordLine,
  RiShieldLine,
  RiUser3Line,
  RiMacbookLine,
  RiSmartphoneLine,
  RiDeleteBin7Line,
  RiLogoutBoxRLine,
} from 'react-icons/ri'
import { toast } from 'sonner'
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

interface SessionItem {
  id: string
  userAgent: string | null
  ipAddress: string | null
  provider: string | null
  lastActiveAt: string | null
  createdAt: string
  expiresAt: string
  isCurrent: boolean
}

export default function ProfilePage() {
  const { user, refetchUser } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [isRevokingOthers, setIsRevokingOthers] = useState(false)

  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useQuery<SessionItem[]>({
    queryKey: ['user-sessions'],
    queryFn: async () => {
      const res = await apiClient<SessionItem[]>('/auth/users/sessions')
      return Array.isArray(res) ? res : []
    },
  })

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

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingId(sessionId)
      await apiClient(`/auth/users/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      toast.success('Sessão encerrada com sucesso!')
      refetchSessions()
    } catch {
      toast.error('Erro ao encerrar sessão.')
    } finally {
      setRevokingId(null)
    }
  }

  const handleRevokeOthers = async () => {
    try {
      setIsRevokingOthers(true)
      const res = await apiClient<{ message: string }>('/auth/users/sessions/others', {
        method: 'DELETE',
      })
      toast.success(res?.message || 'Outras sessões encerradas com sucesso!')
      refetchSessions()
    } catch {
      toast.error('Erro ao encerrar outras sessões.')
    } finally {
      setIsRevokingOthers(false)
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
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center space-x-3">
                <div className="rounded-xl border border-amber-800 bg-amber-950 p-2 text-amber-400">
                  <RiComputerLine className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-200">
                    Sessões Ativas
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Dispositivos e conexões ativas autenticadas nesta conta
                  </p>
                </div>
              </div>

              {sessions.filter((s) => !s.isCurrent).length > 0 && (
                <button
                  onClick={handleRevokeOthers}
                  disabled={isRevokingOthers}
                  className="flex cursor-pointer items-center space-x-2 rounded-xl border border-rose-800/80 bg-rose-950/60 px-4 py-2 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-900/60 hover:text-rose-200"
                >
                  <RiLogoutBoxRLine className="h-4 w-4" />
                  <span>
                    {isRevokingOthers
                      ? 'Encerrando...'
                      : 'Encerrar Outras Sessões'}
                  </span>
                </button>
              )}
            </div>

            {isLoadingSessions ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Carregando sessões ativas...
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Nenhuma sessão ativa encontrada.
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const isMobile =
                    session.userAgent?.toLowerCase().includes('mobile') ||
                    session.userAgent?.toLowerCase().includes('android') ||
                    session.userAgent?.toLowerCase().includes('iphone')

                  return (
                    <div
                      key={session.id}
                      className={`flex flex-col items-start justify-between gap-4 rounded-xl border p-4 text-xs transition-colors sm:flex-row sm:items-center ${
                        session.isCurrent
                          ? 'border-emerald-800/60 bg-emerald-950/20'
                          : 'border-zinc-800 bg-zinc-950/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div
                          className={`rounded-lg p-2.5 ${
                            session.isCurrent
                              ? 'border border-emerald-800/80 bg-emerald-950 text-emerald-400'
                              : 'border border-zinc-800 bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          {isMobile ? (
                            <RiSmartphoneLine className="h-5 w-5" />
                          ) : (
                            <RiMacbookLine className="h-5 w-5" />
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-zinc-200">
                              {session.userAgent
                                ? session.userAgent.split(' ')[0]
                                : 'Navegador Desconhecido'}
                            </span>
                            {session.isCurrent && (
                              <span className="inline-flex items-center rounded-full border border-emerald-800 bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                                Sessão Atual
                              </span>
                            )}
                          </div>

                          <p className="font-mono text-[11px] text-zinc-400">
                            IP: {session.ipAddress || 'Não registrado'} •{' '}
                            {session.provider || 'Credenciais'}
                          </p>

                          <p className="text-[11px] text-zinc-500">
                            Criada em:{' '}
                            {new Date(session.createdAt).toLocaleDateString(
                              'pt-BR',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                            {session.lastActiveAt && (
                              <span>
                                {' '}
                                • Última atividade:{' '}
                                {new Date(
                                  session.lastActiveAt
                                ).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {!session.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokingId === session.id}
                          className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-rose-400 transition-colors hover:border-rose-800/80 hover:bg-rose-950/60 hover:text-rose-300"
                        >
                          <RiDeleteBin7Line className="h-3.5 w-3.5" />
                          <span>
                            {revokingId === session.id
                              ? 'Encerrando...'
                              : 'Encerrar Sessão'}
                          </span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
