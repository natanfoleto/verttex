'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  RiAddLine,
  RiArchiveLine,
  RiEditLine,
  RiPriceTag3Line,
  RiSearchLine,
} from 'react-icons/ri'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'

import { apiClient, ApiError } from '../../../lib/api-client'
import { useAuth } from '../../../providers/auth-provider'

interface Brand {
  id: string
  name: string
  slug: string
  description?: string | null
  logoUrl?: string | null
  status: 'active' | 'inactive'
  isVisible: boolean
  metaTitle?: string | null
  metaDescription?: string | null
  createdAt: string
}

export default function BrandsPage() {
  const { ability } = useAuth()
  const queryClient = useQueryClient()

  // State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [isVisible, setIsVisible] = useState(true)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  // Queries
  const { data: listRes, isLoading } = useQuery({
    queryKey: ['brands-list', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const res = await apiClient(`/brands?${params.toString()}`)
      return res
    },
  })

  const listData: Brand[] =
    listRes?.data ?? (Array.isArray(listRes) ? listRes : [])

  // Mutations
  const createMutation = useMutation({
    mutationFn: (body: any) =>
      apiClient('/brands', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands-list'] })
      toast.success('Marca criada com sucesso!')
      closeModal()
    },
    onError: (err: any) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao criar marca')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      apiClient(`/brands/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands-list'] })
      toast.success('Marca atualizada com sucesso!')
      closeModal()
    },
    onError: (err: any) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Erro ao atualizar marca',
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/brands/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands-list'] })
      toast.success('Marca arquivada com sucesso!')
      setDeletingBrand(null)
    },
    onError: (err: any) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Erro ao arquivar marca',
      )
    },
  })

  const openCreateModal = () => {
    setEditingBrand(null)
    setName('')
    setSlug('')
    setDescription('')
    setLogoUrl('')
    setStatus('active')
    setIsVisible(true)
    setMetaTitle('')
    setMetaDescription('')
    setIsModalOpen(true)
  }

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand)
    setName(brand.name)
    setSlug(brand.slug)
    setDescription(brand.description || '')
    setLogoUrl(brand.logoUrl || '')
    setStatus(brand.status)
    setIsVisible(brand.isVisible)
    setMetaTitle(brand.metaTitle || '')
    setMetaDescription(brand.metaDescription || '')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingBrand(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name,
      slug: slug || undefined,
      description: description || null,
      logoUrl: logoUrl || null,
      status,
      isVisible,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
    }

    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, body: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Catálogo de Marcas
          </h1>
          <p className="text-xs text-zinc-400">
            Gerencie o cadastro reutilizável de marcas e fabricantes da
            plataforma
          </p>
        </div>

        {ability.can('create', 'Brand') && (
          <Button type="button" onClick={openCreateModal}>
            <RiAddLine className="h-4 w-4" />
            <span>Nova Marca</span>
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-xl">
        <div className="relative w-full sm:w-72">
          <RiSearchLine className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou slug..."
            className="pl-9"
          />
        </div>

        <div className="w-full sm:w-48">
          <NativeSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Status: Todos</option>
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
          </NativeSelect>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl">
        <div className="border-b border-zinc-800/80 bg-zinc-950/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Marcas Cadastradas ({listData.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            Carregando marcas...
          </div>
        ) : listData.length > 0 ? (
          <div className="divide-y divide-zinc-800/60 overflow-x-auto">
            {listData.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between p-4 transition-colors hover:bg-zinc-800/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-emerald-400">
                    <RiPriceTag3Line className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-semibold text-sm text-zinc-100">
                        {brand.name}
                      </span>
                      <span className="rounded-md bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                        /{brand.slug}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                          brand.status === 'active'
                            ? 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-300'
                            : 'bg-zinc-950 border border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {brand.status === 'active' ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    {brand.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">
                        {brand.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {ability.can('update', 'Brand') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => openEditModal(brand)}
                      className="h-8 w-8 p-1.5 text-zinc-400 hover:text-zinc-200"
                      title="Editar"
                    >
                      <RiEditLine className="h-4 w-4" />
                    </Button>
                  )}

                  {ability.can('delete', 'Brand') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setDeletingBrand(brand)}
                      className="h-8 w-8 p-1.5 border-rose-900/50 text-rose-400 hover:bg-rose-950"
                      title="Arquivar"
                    >
                      <RiArchiveLine className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-zinc-500">
            Nenhuma marca encontrada com os filtros selecionados.
          </div>
        )}
      </div>

      {/* Modal Reusável do Shadcn UI (Dialog) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? 'Editar Marca' : 'Nova Marca'}
            </DialogTitle>
            <DialogDescription>
              {editingBrand
                ? 'Altere as informações da marca cadastrada'
                : 'Cadastre uma nova marca ou fabricante no repositório global'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">
                Nome da Marca
              </label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Queijaria Serra da Canastra"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">
                Slug (opcional)
              </label>
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="queijaria-serra-da-canastra"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">
                Descrição
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="História ou descrição da marca..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Status
                </label>
                <NativeSelect
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </NativeSelect>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Visível no Marketplace
                </label>
                <NativeSelect
                  value={isVisible ? 'true' : 'false'}
                  onChange={(e) => setIsVisible(e.target.value === 'true')}
                >
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </NativeSelect>
              </div>
            </div>

            <DialogFooter className="mt-6 border-t border-zinc-800 pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingBrand ? 'Salvar Alterações' : 'Criar Marca'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Arquivamento (AlertDialog do Shadcn UI) */}
      <AlertDialog
        open={Boolean(deletingBrand)}
        onOpenChange={(open) => !open && setDeletingBrand(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Marca</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar a marca &quot;
              {deletingBrand?.name}&quot;? Ela será desativada do catálogo de
              marcas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingBrand) {
                  deleteMutation.mutate(deletingBrand.id)
                }
              }}
            >
              Sim, Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
