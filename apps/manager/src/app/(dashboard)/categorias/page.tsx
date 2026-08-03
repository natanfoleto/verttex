'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  RiAddLine,
  RiArchiveLine,
  RiCheckLine,
  RiEditLine,
  RiFolder3Line,
  RiFolderLine,
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
import { sanitizeSlug } from '@/lib/slug'

import { apiClient, ApiError } from '../../../lib/api-client'
import {
  categoryQueryKeys,
  invalidateCategories,
} from '../../../lib/query-keys'
import { useAuth } from '../../../providers/auth-provider'

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  iconUrl?: string | null
  parentId?: string | null
  position: number
  status: 'active' | 'inactive'
  isVisible: boolean
  metaTitle?: string | null
  metaDescription?: string | null
  createdAt: string
  parent?: { id: string; name: string } | null
  children?: Category[]
}

export default function CategoriesPage() {
  const { ability } = useAuth()
  const queryClient = useQueryClient()

  // State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  )

  // Form State
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isSlugUserModified, setIsSlugUserModified] = useState(false)
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<string>('')
  const [position, setPosition] = useState<number>(0)
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [isVisible, setIsVisible] = useState(true)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  const handleNameChange = (val: string) => {
    setName(val)
    if (!isSlugUserModified) {
      setSlug(sanitizeSlug(val))
    }
  }

  const handleSlugChange = (val: string) => {
    setIsSlugUserModified(true)
    setSlug(sanitizeSlug(val))
  }

  // Queries
  const { data: treeData, isLoading: isLoadingTree } = useQuery({
    queryKey: categoryQueryKeys.tree(),
    queryFn: async () => {
      const res = await apiClient('/categories/tree')
      return Array.isArray(res) ? res : (res?.data ?? [])
    },
  })

  const { data: listRes, isLoading: isLoadingList } = useQuery({
    queryKey: categoryQueryKeys.list({ search, status: statusFilter }),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const res = await apiClient(`/categories?${params.toString()}`)
      return res
    },
  })

  const listData: Category[] =
    listRes?.data ?? (Array.isArray(listRes) ? listRes : [])

  // Mutations
  const createMutation = useMutation({
    mutationFn: (body: any) =>
      apiClient('/categories', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await invalidateCategories(queryClient)
      toast.success('Categoria criada com sucesso!')
      closeModal()
    },
    onError: (err: any) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Erro ao criar categoria',
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      apiClient(`/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await invalidateCategories(queryClient)
      toast.success('Categoria atualizada com sucesso!')
      closeModal()
    },
    onError: (err: any) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Erro ao atualizar categoria',
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/categories/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await invalidateCategories(queryClient)
      toast.success('Categoria arquivada com sucesso!')
      setDeletingCategory(null)
    },
    onError: (err: any) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Erro ao arquivar categoria',
      )
    },
  })

  const openCreateModal = (parent?: Category) => {
    setEditingCategory(null)
    setName('')
    setSlug('')
    setIsSlugUserModified(false)
    setDescription('')
    setParentId(parent ? parent.id : '')
    setPosition(0)
    setStatus('active')
    setIsVisible(true)
    setMetaTitle('')
    setMetaDescription('')
    setIsModalOpen(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setIsSlugUserModified(Boolean(cat.slug))
    setDescription(cat.description || '')
    setParentId(cat.parentId || '')
    setPosition(cat.position)
    setStatus(cat.status)
    setIsVisible(cat.isVisible)
    setMetaTitle(cat.metaTitle || '')
    setMetaDescription(cat.metaDescription || '')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalSlug = slug ? sanitizeSlug(slug) : sanitizeSlug(name)
    const payload = {
      name,
      slug: finalSlug || undefined,
      description: description || null,
      parentId: parentId || null,
      position: Number(position),
      status,
      isVisible,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, body: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isFormDirty = editingCategory
    ? name !== editingCategory.name ||
      slug !== editingCategory.slug ||
      description !== (editingCategory.description || '') ||
      parentId !== (editingCategory.parentId || '') ||
      Number(position) !== editingCategory.position ||
      status !== editingCategory.status ||
      isVisible !== editingCategory.isVisible ||
      metaTitle !== (editingCategory.metaTitle || '') ||
      metaDescription !== (editingCategory.metaDescription || '')
    : name.trim().length > 0

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Taxonomia de Categorias
          </h1>
          <p className="text-xs text-zinc-400">
            Gerencie a árvore global de categorias do Marketplace
          </p>
        </div>

        {ability.can('create', 'Category') && (
          <Button type="button" onClick={() => openCreateModal()}>
            <RiAddLine className="h-4 w-4" />
            <span>Nova Categoria</span>
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

      {/* Main Content: Categories Tree & List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Hierarchical Tree Preview */}
        <div className="lg:col-span-1 space-y-4 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-xl">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
            <RiFolder3Line className="h-4 w-4 text-emerald-400" />
            <span>Árvore de Navegação</span>
          </div>

          {isLoadingTree ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              Carregando árvore...
            </div>
          ) : treeData && treeData.length > 0 ? (
            <div className="space-y-2 text-xs">
              {treeData.map((node: Category) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  onEdit={openEditModal}
                  onAddSub={openCreateModal}
                  ability={ability}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-zinc-500">
              Nenhuma categoria cadastrada na árvore.
            </div>
          )}
        </div>

        {/* Categories Flat Table */}
        <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl">
          <div className="border-b border-zinc-800/80 bg-zinc-950/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Listagem Completa ({listData.length})
            </h3>
          </div>

          {isLoadingList ? (
            <div className="p-12 text-center text-zinc-500 text-xs">
              Carregando listagem...
            </div>
          ) : listData.length > 0 ? (
            <div className="divide-y divide-zinc-800/60 overflow-x-auto">
              {listData.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-zinc-800/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-semibold text-sm text-zinc-100">
                        {cat.name}
                      </span>
                      <span className="rounded-md bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                        /{cat.slug}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                          cat.status === 'active'
                            ? 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-300'
                            : 'bg-zinc-950 border border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {cat.status === 'active' ? 'Ativa' : 'Inativa'}
                      </span>
                      {cat.parent && (
                        <span className="rounded-md bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 text-[10px] text-emerald-300">
                          Pai: {cat.parent.name}
                        </span>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {ability.can('update', 'Category') && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => openEditModal(cat)}
                        className="h-8 w-8 p-1.5 text-zinc-400 hover:text-zinc-200"
                        title="Editar"
                      >
                        <RiEditLine className="h-4 w-4" />
                      </Button>
                    )}

                    {ability.can('delete', 'Category') && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setDeletingCategory(cat)}
                        className="h-8 w-8 p-1.5 border-rose-900/40 bg-rose-950/20 text-rose-400 hover:bg-rose-950/60 hover:border-rose-800/80 hover:text-rose-300 transition-colors"
                        title="Arquivar Categoria"
                      >
                        <RiArchiveLine className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 shadow-xs">
                <RiFolder3Line className="h-6 w-6 text-zinc-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200">
                Nenhuma categoria encontrada
              </h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-500">
                Nenhuma categoria atende aos filtros selecionados.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Reusável do Shadcn UI (Dialog) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full max-w-xl flex flex-col overflow-hidden bg-zinc-950 p-0 text-zinc-100 sm:rounded-2xl">
          <DialogHeader className="px-6 pt-5 pb-2">
            <DialogTitle className="text-xl font-bold text-zinc-100">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              {editingCategory
                ? 'Altere as informações da categoria global'
                : 'Cadastre uma nova categoria na árvore de navegação'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-3 pb-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 whitespace-nowrap">
                  Nome da Categoria
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Queijos Artesanais"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 whitespace-nowrap">
                    Slug (gerado automaticamente)
                  </label>
                  <Input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="queijos-artesanais"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 whitespace-nowrap">
                    Categoria Pai
                  </label>
                  <NativeSelect
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                  >
                    <option value="">Nenhuma (Categoria Raiz)</option>
                    {listData
                      ?.filter((c) => c.id !== editingCategory?.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </NativeSelect>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 whitespace-nowrap">
                  Descrição
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Descrição da categoria..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 whitespace-nowrap">
                    Posição
                  </label>
                  <Input
                    type="number"
                    value={position}
                    onChange={(e) => setPosition(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 whitespace-nowrap">
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
                  <label className="text-xs font-semibold text-zinc-300 whitespace-nowrap">
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
            </div>

            <DialogFooter className="bg-zinc-950 px-6 py-4">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !isFormDirty ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                <RiCheckLine className="h-4 w-4" />
                <span>
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Salvando...'
                    : editingCategory
                      ? 'Salvar Alterações'
                      : 'Criar Categoria'}
                </span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Arquivamento (AlertDialog do Shadcn UI) */}
      <AlertDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar a categoria &quot;
              {deletingCategory?.name}&quot;? Ela será desativada e ocultada da
              árvore de navegação do Marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCategory) {
                  deleteMutation.mutate(deletingCategory.id)
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

function TreeNode({
  node,
  onEdit,
  onAddSub,
  ability,
}: {
  node: Category
  onEdit: (cat: Category) => void
  onAddSub: (cat: Category) => void
  ability: any
}) {
  return (
    <div className="space-y-1 pl-3 border-l border-zinc-800/80">
      <div className="flex items-center justify-between rounded-lg p-1.5 hover:bg-zinc-800/40">
        <div className="flex items-center space-x-2">
          <RiFolderLine className="h-4 w-4 text-emerald-400" />
          <span className="font-medium text-zinc-200">{node.name}</span>
        </div>

        <div className="flex items-center space-x-1">
          {ability.can('create', 'Category') && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onAddSub(node)}
              className="text-zinc-400 hover:text-emerald-400 text-xs px-2 h-7 font-medium"
              title="Adicionar subcategoria"
            >
              + Sub
            </Button>
          )}
          {ability.can('update', 'Category') && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(node)}
              className="text-zinc-400 hover:text-zinc-200 text-xs px-2 h-7 font-medium"
              title="Editar"
            >
              Editar
            </Button>
          )}
        </div>
      </div>

      {node.children && node.children.length > 0 && (
        <div className="space-y-1">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onEdit={onEdit}
              onAddSub={onAddSub}
              ability={ability}
            />
          ))}
        </div>
      )}
    </div>
  )
}
