'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  RiArrowRightLine,
  RiCheckDoubleLine,
  RiShieldLine,
  RiStoreLine,
  RiUserLine,
} from 'react-icons/ri'

import { apiClient } from '../../lib/api-client'
import { useAuth } from '../../providers/auth-provider'

export default function DashboardPage() {
  const { user, ability } = useAuth()

  const { data: usersData } = useQuery({
    queryKey: ['dashboard-users-count'],
    queryFn: () => apiClient('/users?perPage=1'),
    enabled: ability.can('read', 'User'),
  })

  const { data: rolesData } = useQuery({
    queryKey: ['dashboard-roles-count'],
    queryFn: () => apiClient('/roles'),
    enabled: ability.can('read', 'Role'),
  })

  const { data: storesData } = useQuery({
    queryKey: ['dashboard-stores-count'],
    queryFn: () => apiClient('/stores?perPage=1'),
    enabled: ability.can('read', 'Store'),
  })

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-linear-to-r from-zinc-900 via-zinc-900/80 to-zinc-950 p-8 shadow-sm">
        <div className="absolute top-0 right-0 h-48 w-48 translate-x-8 -translate-y-8 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="relative max-w-2xl space-y-2">
          <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
            Painel Central de Controle
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
            Bem-vindo(a), {user?.name || 'Gestor'}!
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400">
            Sua conta possui perfil de acesso{' '}
            <strong className="text-zinc-200">{user?.role?.name}</strong>.
            Utilize os atalhos e módulos abaixo para gerenciar a infraestrutura
            do ecossistema Verttex.
          </p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Users Card */}
        {ability.can('read', 'User') && (
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-colors hover:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                Usuários Gestores
              </span>
              <div className="rounded-xl bg-zinc-800 p-2 text-zinc-300">
                <RiUserLine className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-zinc-100">
              {usersData?.meta?.total ?? '--'}
            </div>
            <Link
              href="/usuarios"
              className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-400 hover:underline"
            >
              <span>Gerenciar usuários</span>
              <RiArrowRightLine className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Roles Card */}
        {ability.can('read', 'Role') && (
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-colors hover:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                Cargos do Sistema
              </span>
              <div className="rounded-xl bg-zinc-800 p-2 text-zinc-300">
                <RiShieldLine className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-zinc-100">
              {rolesData?.length ?? '--'}
            </div>
            <Link
              href="/cargos"
              className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-400 hover:underline"
            >
              <span>Ver cargos e permissões</span>
              <RiArrowRightLine className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Stores Card */}
        {ability.can('read', 'Store') && (
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-colors hover:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                Lojas Parceiras
              </span>
              <div className="rounded-xl bg-zinc-800 p-2 text-zinc-300">
                <RiStoreLine className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-zinc-100">
              {storesData?.meta?.total ?? '--'}
            </div>
            <Link
              href="/lojas"
              className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-400 hover:underline"
            >
              <span>Gerenciar lojas</span>
              <RiArrowRightLine className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* System Status Notice */}
      <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-sm">
        <div className="flex items-center space-x-3 text-zinc-300">
          <RiCheckDoubleLine className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>
            Infraestrutura Fastify API e Prisma ORM operando normalmente.
          </span>
        </div>
        <span className="font-mono text-xs text-zinc-500">Verttex v1.0.0</span>
      </div>
    </div>
  )
}
