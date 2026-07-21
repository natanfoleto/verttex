'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import {
  RiAddLine,
  RiEditLine,
  RiEyeLine,
  RiShieldUserLine,
} from 'react-icons/ri'

import { TableWrapper } from '../../../components/ui/table-wrapper'
import { apiClient } from '../../../lib/api-client'

export default function UsersListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users-list', page, search],
    queryFn: () =>
      apiClient(
        `/users?page=${page}&perPage=10&search=${encodeURIComponent(search)}`,
      ),
  })

  return (
    <TableWrapper
      title="Usuários Gestores"
      description="Gerencie os usuários administrativos com acesso ao painel de gestão"
      actionButton={
        <Link
          href="/usuarios/novo"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-md shadow-emerald-950 transition-colors"
        >
          <RiAddLine className="h-4 w-4" />
          <span>Novo Usuário</span>
        </Link>
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar por nome ou e-mail..."
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data?.data || data.data.length === 0}
      meta={data?.meta}
      onPageChange={setPage}
    >
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs text-zinc-400 uppercase tracking-wider">
            <th className="py-3.5 px-6 font-semibold">Nome</th>
            <th className="py-3.5 px-6 font-semibold">E-mail</th>
            <th className="py-3.5 px-6 font-semibold">Cargo</th>
            <th className="py-3.5 px-6 font-semibold">Status</th>
            <th className="py-3.5 px-6 font-semibold text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          {data?.data?.map(
            (user: {
              id: string
              name: string
              email: string
              status: string
              role?: { name: string }
              roleId: string
            }) => (
              <tr
                key={user.id}
                className="hover:bg-zinc-800/30 transition-colors"
              >
                <td className="py-4 px-6 font-medium text-zinc-100">
                  {user.name}
                </td>
                <td className="py-4 px-6 text-zinc-400">{user.email}</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {user.role?.name || user.roleId}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      user.status === 'active'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border-rose-800'
                    }`}
                  >
                    {user.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right space-x-2">
                  <Link
                    href={`/usuarios/${user.id}`}
                    className="inline-flex items-center p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                    title="Ver detalhes"
                  >
                    <RiEyeLine className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/usuarios/${user.id}/editar`}
                    className="inline-flex items-center p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                    title="Editar"
                  >
                    <RiEditLine className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/usuarios/${user.id}/permissoes`}
                    className="inline-flex items-center p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                    title="Permissões individuais"
                  >
                    <RiShieldUserLine className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </TableWrapper>
  )
}
