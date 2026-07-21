'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import {
  RiAddLine,
  RiEditLine,
  RiEyeLine,
  RiUserSharedLine,
} from 'react-icons/ri'

import { TableWrapper } from '../../../components/ui/table-wrapper'
import { apiClient } from '../../../lib/api-client'

export default function StoresListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['stores-list', page, search, statusFilter],
    queryFn: () => {
      let url = `/stores?page=${page}&perPage=10&search=${encodeURIComponent(search)}`
      if (statusFilter) url += `&status=${statusFilter}`
      return apiClient(url)
    },
  })

  return (
    <TableWrapper
      title="Lojas Parceiras"
      description="Gerencie as lojas dos produtores e parceiros cadastrados na plataforma Verttex"
      actionButton={
        <Link
          href="/lojas/nova"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-md shadow-emerald-950 transition-colors"
        >
          <RiAddLine className="h-4 w-4" />
          <span>Nova Loja</span>
        </Link>
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar por nome ou slug..."
      filters={
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
        >
          <option value="">Todos os status</option>
          <option value="draft">Rascunho (Draft)</option>
          <option value="active">Ativa (Active)</option>
          <option value="inactive">Inativa (Inactive)</option>
          <option value="suspended">Suspensa (Suspended)</option>
        </select>
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data?.data || data.data.length === 0}
      meta={data?.meta}
      onPageChange={setPage}
    >
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs text-zinc-400 uppercase tracking-wider">
            <th className="py-3.5 px-6 font-semibold">Nome da Loja</th>
            <th className="py-3.5 px-6 font-semibold">Slug (URL)</th>
            <th className="py-3.5 px-6 font-semibold">Membros</th>
            <th className="py-3.5 px-6 font-semibold">Status</th>
            <th className="py-3.5 px-6 font-semibold text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          {data?.data?.map(
            (store: {
              id: string
              name: string
              slug: string
              status: string
              _count?: { users: number }
            }) => (
              <tr
                key={store.id}
                className="hover:bg-zinc-800/30 transition-colors"
              >
                <td className="py-4 px-6 font-medium text-zinc-100">
                  {store.name}
                </td>
                <td className="py-4 px-6 font-mono text-xs text-zinc-400">
                  verttexloja.com.br/{store.slug}
                </td>
                <td className="py-4 px-6 text-zinc-400">
                  {store._count?.users ?? 0} membros
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      store.status === 'active'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : store.status === 'draft'
                          ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          : store.status === 'suspended'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                    }`}
                  >
                    {store.status === 'active'
                      ? 'Ativa'
                      : store.status === 'draft'
                        ? 'Rascunho'
                        : store.status === 'suspended'
                          ? 'Suspensa'
                          : 'Inativa'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right space-x-2">
                  <Link
                    href={`/lojas/${store.id}`}
                    className="inline-flex items-center p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                    title="Ver detalhes"
                  >
                    <RiEyeLine className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/lojas/${store.id}/editar`}
                    className="inline-flex items-center p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                    title="Editar"
                  >
                    <RiEditLine className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/lojas/${store.id}/membros`}
                    className="inline-flex items-center p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                    title="Gerenciar membros"
                  >
                    <RiUserSharedLine className="h-4 w-4" />
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
