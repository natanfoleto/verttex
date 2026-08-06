'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { RiUserSharedLine, RiUserStarLine } from 'react-icons/ri'

import { Button } from '@/components/ui/button'
import { TableWrapper } from '@/components/ui/table-wrapper'
import { apiClient } from '@/lib/api-client'

interface StoreMemberItem {
  id: string
  isOwner: boolean
  user: {
    id: string
    name: string
    email: string
    phone?: string | null
    status: string
    role?: { name: string }
  }
}

export function StoreTeamTab({ storeId }: { storeId: string }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const {
    data: members = [],
    isLoading,
    isError,
  } = useQuery<StoreMemberItem[]>({
    queryKey: ['store-members-tab', storeId],
    queryFn: async () => {
      const res = await apiClient<
        StoreMemberItem[] | { data: StoreMemberItem[] }
      >(`/stores/${storeId}/users`)
      return Array.isArray(res) ? res : res?.data || []
    },
  })

  const filteredMembers = members.filter(
    (m) =>
      m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.user?.email?.toLowerCase().includes(search.toLowerCase()),
  )

  const total = filteredMembers.length
  const totalPages = Math.ceil(total / perPage) || 1
  const paginatedMembers = filteredMembers.slice(
    (page - 1) * perPage,
    page * perPage,
  )

  return (
    <div className="space-y-6 text-zinc-100 antialiased">
      <TableWrapper
        title="Membros e Equipe Gestora da Loja"
        description="Relação de usuários do sistema com permissão de acesso e vínculo operacional a esta loja."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        searchPlaceholder="Buscar por nome ou e-mail..."
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && paginatedMembers.length === 0}
        emptyTitle="Nenhum membro encontrado"
        emptyDescription="Nenhum membro ou gestor vinculado a esta loja."
        emptyIcon={<RiUserSharedLine className="h-6 w-6 text-zinc-400" />}
        actionButton={
          <Link href={`/lojas/${storeId}/membros`}>
            <Button
              type="button"
              className="cursor-pointer rounded-xl bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-500"
            >
              <RiUserSharedLine className="mr-1.5 h-4 w-4" />
              <span>Gerenciar Membros & Permissões</span>
            </Button>
          </Link>
        }
        meta={{
          page,
          perPage,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }}
        onPageChange={setPage}
        perPageValue={perPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage)
          setPage(1)
        }}
      >
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-800 bg-zinc-950/60 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            <tr>
              <th className="px-5 py-3.5">Nome do Gestor</th>
              <th className="px-5 py-3.5">E-mail</th>
              <th className="px-5 py-3.5">Cargo / Função</th>
              <th className="px-5 py-3.5 text-center">Status</th>
              <th className="px-5 py-3.5 text-right">Propriedade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {paginatedMembers.map((item) => (
              <tr
                key={item.id}
                className="transition-colors hover:bg-zinc-800/30"
              >
                <td className="px-5 py-4 font-sans font-semibold text-zinc-100">
                  {item.user?.name}
                </td>
                <td className="px-5 py-4 font-mono text-zinc-400">
                  {item.user?.email}
                </td>
                <td className="px-5 py-4 font-sans text-zinc-300">
                  {item.user?.role?.name || 'Gestor de Loja'}
                </td>
                <td className="px-5 py-4 text-center font-sans">
                  <span className="inline-flex items-center rounded-full border border-emerald-900/60 bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                    {item.user?.status || 'Ativo'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-sans">
                  {item.isOwner ? (
                    <span className="inline-flex items-center rounded border border-amber-900/60 bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase">
                      <RiUserStarLine className="mr-1 h-3 w-3" />
                      Proprietário
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">Membro</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  )
}
