'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RiAddLine, RiEditLine, RiShieldUserLine } from 'react-icons/ri'

import { TableWrapper } from '../../../components/ui/table-wrapper'
import { apiClient } from '../../../lib/api-client'
import { userQueryKeys } from '../../../lib/query-keys'
import { UserFormDialog, UserItem } from './components/user-form-dialog'

export default function UsersListPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: userQueryKeys.list({ page, perPage, search }),
    queryFn: () =>
      apiClient(
        `/users?page=${page}&perPage=${perPage}&search=${encodeURIComponent(search)}`
      ),
  })

  const openCreateModal = () => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  const openEditModal = (user: UserItem) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  const hasActiveFilters = Boolean(search)

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      <TableWrapper
        title="Usuários Gestores"
        description="Gerencie os usuários administrativos com acesso ao painel de gestão"
        actionButton={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex cursor-pointer items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-emerald-950 transition-colors hover:bg-emerald-500"
          >
            <RiAddLine className="h-4 w-4" />
            <span>Novo Usuário</span>
          </button>
        }
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou e-mail..."
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data?.data || data.data.length === 0}
        emptyTitle={
          hasActiveFilters
            ? 'Nenhum usuário encontrado para a busca'
            : 'Nenhum usuário cadastrado'
        }
        emptyDescription={
          hasActiveFilters
            ? 'Tente buscar com outro nome ou endereço de e-mail.'
            : 'Clique em "Novo Usuário" para cadastrar o primeiro gestor.'
        }
        meta={data?.meta}
        onPageChange={setPage}
        perPageValue={perPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage)
          setPage(1)
        }}
      >
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs tracking-wider text-zinc-400 uppercase">
              <th className="px-6 py-3.5 font-semibold">Nome</th>
              <th className="px-6 py-3.5 font-semibold">E-mail</th>
              <th className="px-6 py-3.5 font-semibold">Cargo</th>
              <th className="px-6 py-3.5 font-semibold">Status</th>
              <th className="px-6 py-3.5 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {data?.data?.map((user: UserItem) => (
              <tr
                key={user.id}
                onClick={() => router.push(`/usuarios/${user.id}`)}
                className="cursor-pointer transition-colors hover:bg-zinc-800/40"
              >
                <td className="px-6 py-4 font-medium text-zinc-100">
                  {user.name}
                </td>
                <td className="px-6 py-4 text-zinc-400">{user.email}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                    {user.role?.name || user.roleId}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      user.status === 'active'
                        ? 'border-emerald-800 bg-emerald-950 text-emerald-400'
                        : 'border-rose-800 bg-rose-950 text-rose-400'
                    }`}
                  >
                    {user.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td
                  className="space-x-2 px-6 py-4 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => openEditModal(user)}
                    className="inline-flex cursor-pointer items-center rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                    title="Editar"
                  >
                    <RiEditLine className="h-4 w-4" />
                  </button>
                  <a
                    href={`/usuarios/${user.id}/permissoes`}
                    className="inline-flex items-center rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-emerald-400"
                    title="Permissões individuais"
                  >
                    <RiShieldUserLine className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>

      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingUser(null)
        }}
        userToEdit={editingUser}
      />
    </div>
  )
}
