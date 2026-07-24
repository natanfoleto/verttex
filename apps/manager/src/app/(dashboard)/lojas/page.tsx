'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RiAddLine, RiEditLine, RiUserSharedLine } from 'react-icons/ri'

import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'

import { TableWrapper } from '../../../components/ui/table-wrapper'
import { apiClient } from '../../../lib/api-client'
import { storeQueryKeys } from '../../../lib/query-keys'
import { StoreFormDialog, StoreItem } from './components/store-form-dialog'

export default function StoresListPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: storeQueryKeys.list({
      page,
      perPage,
      search,
      status: statusFilter,
    }),
    queryFn: () => {
      let url = `/stores?page=${page}&perPage=${perPage}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`
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

  const hasActiveFilters = Boolean(search || statusFilter)

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      <TableWrapper
        title="Lojas Parceiras"
        description="Gerencie as lojas dos produtores e parceiros cadastrados na plataforma Verttex"
        actionButton={
          <Button type="button" onClick={openCreateModal}>
            <RiAddLine className="h-4 w-4" />
            <span>Nova Loja</span>
          </Button>
        }
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou slug..."
        filters={
          <NativeSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            wrapperClassName="w-48"
          >
            <option value="">Todos os status</option>
            <option value="draft">Rascunho (Draft)</option>
            <option value="active">Ativa (Active)</option>
            <option value="inactive">Inativa (Inactive)</option>
            <option value="suspended">Suspensa (Suspended)</option>
          </NativeSelect>
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data?.data || data.data.length === 0}
        emptyTitle={
          hasActiveFilters
            ? 'Nenhuma loja encontrada para os filtros selecionados'
            : 'Nenhuma loja cadastrada'
        }
        emptyDescription={
          hasActiveFilters
            ? 'Tente remover a busca ou trocar o filtro de status.'
            : 'Clique em "Nova Loja" para cadastrar o primeira parceiro.'
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
                onClick={() => router.push(`/lojas/${store.id}`)}
                className="cursor-pointer transition-colors hover:bg-zinc-800/40"
              >
                <td className="px-6 py-4 font-medium text-zinc-100">
                  {store.name}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                  <a
                    href={`https://verttexloja.com.br/${store.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir loja em nova aba"
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer hover:text-emerald-400 hover:underline"
                  >
                    verttexloja.com.br/{store.slug}
                  </a>
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
                <td
                  className="space-x-2 px-6 py-4 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => openEditModal(store)}
                    className="h-8 w-8 p-1.5 text-zinc-400 hover:text-zinc-100"
                    title="Editar"
                  >
                    <RiEditLine className="h-4 w-4" />
                  </Button>
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
