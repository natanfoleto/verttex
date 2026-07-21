'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  RiAddLine,
  RiEditLine,
  RiEyeLine,
  RiUserSharedLine,
} from 'react-icons/ri'

import { TableWrapper } from '../../../components/ui/table-wrapper'
import { apiClient } from '../../../lib/api-client'
import { StoreFormDialog, StoreItem } from './components/store-form-dialog'

export default function StoresListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null)

  // Load Stores List
  const { data, isLoading, isError } = useQuery({
    queryKey: ['stores-list', page, search, statusFilter],
    queryFn: () => {
      let url = `/stores?page=${page}&perPage=10&search=${encodeURIComponent(search)}`
      if (statusFilter) url += `&status=${statusFilter}`
      return apiClient(url)
    },
  })

  const openCreateModal = () => {
    setEditingStore(null)
    setIsDialogOpen(true)
  }

  const openEditModal = (store: StoreItem) => {
    setEditingStore(store)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      <TableWrapper
        title="Lojas Parceiras"
        description="Gerencie as lojas dos produtores e parceiros cadastrados na plataforma Verttex"
        actionButton={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex cursor-pointer items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-emerald-950 transition-colors hover:bg-emerald-500"
          >
            <RiAddLine className="h-4 w-4" />
            <span>Nova Loja</span>
          </button>
        }
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou slug..."
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-600 focus:outline-none"
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
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs tracking-wider text-zinc-400 uppercase">
              <th className="px-6 py-3.5 font-semibold">Nome da Loja</th>
              <th className="px-6 py-3.5 font-semibold">Slug (URL)</th>
              <th className="px-6 py-3.5 font-semibold">Membros</th>
              <th className="px-6 py-3.5 font-semibold">Status</th>
              <th className="px-6 py-3.5 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {data?.data?.map((store: StoreItem) => (
              <tr
                key={store.id}
                className="transition-colors hover:bg-zinc-800/30"
              >
                <td className="px-6 py-4 font-medium text-zinc-100">
                  {store.name}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                  verttexloja.com.br/{store.slug}
                </td>
                <td className="px-6 py-4 text-zinc-400">
                  {store._count?.users ?? 0} membros
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      store.status === 'active'
                        ? 'border-emerald-800 bg-emerald-950 text-emerald-400'
                        : store.status === 'draft'
                          ? 'border-zinc-700 bg-zinc-800 text-zinc-300'
                          : store.status === 'suspended'
                            ? 'border-rose-800 bg-rose-950 text-rose-400'
                            : 'border-amber-800 bg-amber-950 text-amber-400'
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
                <td className="space-x-2 px-6 py-4 text-right">
                  <a
                    href={`/lojas/${store.id}`}
                    className="inline-flex items-center rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                    title="Ver detalhes"
                  >
                    <RiEyeLine className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => openEditModal(store)}
                    className="inline-flex cursor-pointer items-center rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                    title="Editar"
                  >
                    <RiEditLine className="h-4 w-4" />
                  </button>
                  <a
                    href={`/lojas/${store.id}/membros`}
                    className="inline-flex items-center rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-emerald-400"
                    title="Gerenciar membros"
                  >
                    <RiUserSharedLine className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>

      {/* Store Form Dialog Component */}
      <StoreFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingStore(null)
        }}
        storeToEdit={editingStore}
      />
    </div>
  )
}
