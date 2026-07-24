'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  RiAddLine,
  RiArchiveLine,
  RiEditLine,
  RiPriceTag3Line,
  RiSearchLine,
  RiUpload2Line,
  RiSendPlaneLine,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NativeSelect } from '@/components/ui/native-select'
import { apiClient, ApiError } from '../../../lib/api-client'
import { useAuth } from '../../../providers/auth-provider'

interface Store {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
}

interface ProductVariation {
  id: string
  sku: string
  price: string | number
  promotionalPrice?: string | number | null
  status: string
  isDefault: boolean
}

interface ProductMedia {
  id: string
  file: {
    id: string
    objectKey: string
    originalName: string
  }
  isMain: boolean
}

interface Product {
  id: string
  storeId: string
  categoryId: string
  brandId?: string | null
  name: string
  slug: string
  shortDescription?: string | null
  fullDescription?: string | null
  type: 'simple' | 'variable'
  status: 'draft' | 'active' | 'inactive' | 'archived'
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  store?: Store
  category?: Category
  brand?: Brand
  variations?: ProductVariation[]
  medias?: ProductMedia[]
}

export default function ProductsPage() {
  const { ability } = useAuth()
  const queryClient = useQueryClient()

  // Filters State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [storeFilter, setStoreFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  // Form State
  const [storeId, setStoreId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [fullDescription, setFullDescription] = useState('')
  const [type, setType] = useState<'simple' | 'variable'>('simple')
  const [price, setPrice] = useState<string>('')
  const [promotionalPrice, setPromotionalPrice] = useState<string>('')
  const [costPrice, setCostPrice] = useState<string>('')
  const [sku, setSku] = useState('')
  const [status, setStatus] = useState<'draft' | 'active' | 'inactive' | 'archived'>('draft')
  const [isPublished, setIsPublished] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null)

  // Queries
  const { data: storesRes } = useQuery({
    queryKey: ['stores-dropdown'],
    queryFn: async () => {
      const res = await apiClient('/stores')
      return Array.isArray(res) ? res : res?.data ?? []
    },
  })

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories-dropdown'],
    queryFn: async () => {
      const res = await apiClient('/categories')
      return Array.isArray(res) ? res : res?.data ?? []
    },
  })

  const { data: brandsRes } = useQuery({
    queryKey: ['brands-dropdown'],
    queryFn: async () => {
      const res = await apiClient('/brands')
      return Array.isArray(res) ? res : res?.data ?? []
    },
  })

  const { data: productsRes, isLoading } = useQuery({
    queryKey: ['products-list', search, statusFilter, storeFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (storeFilter) params.append('storeId', storeFilter)
      if (categoryFilter) params.append('categoryId', categoryFilter)
      const res = await apiClient(`/products?${params.toString()}`)
      return res
    },
  })

  const storesList: Store[] = storesRes ?? []
  const categoriesList: Category[] = categoriesRes ?? []
  const brandsList: Brand[] = brandsRes ?? []
  const productsList: Product[] = productsRes?.data ?? (Array.isArray(productsRes) ? productsRes : [])

  // Mutations
  const createMutation = useMutation({
    mutationFn: (body: any) =>
      apiClient('/products', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] })
      toast.success('Produto cadastrado com sucesso!')
      closeModal()
    },
    onError: (err: any) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao cadastrar produto')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      apiClient(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] })
      toast.success('Produto atualizado com sucesso!')
      closeModal()
    },
    onError: (err: any) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao atualizar produto')
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/products/${id}/publish`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] })
      toast.success('Produto publicado no Marketplace com sucesso!')
    },
    onError: (err: any) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao publicar produto')
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/products/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] })
      toast.success('Produto arquivado com sucesso!')
      setDeletingProduct(null)
    },
    onError: (err: any) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao arquivar produto')
    },
  })

  const openCreateModal = () => {
    setEditingProduct(null)
    setStoreId(storesList[0]?.id || '')
    setCategoryId(categoriesList[0]?.id || '')
    setBrandId('')
    setName('')
    setSlug('')
    setShortDescription('')
    setFullDescription('')
    setType('simple')
    setPrice('')
    setPromotionalPrice('')
    setCostPrice('')
    setSku('')
    setStatus('draft')
    setIsPublished(false)
    setIsFeatured(false)
    setUploadedFileId(null)
    setIsModalOpen(true)
  }

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod)
    setStoreId(prod.storeId)
    setCategoryId(prod.categoryId)
    setBrandId(prod.brandId || '')
    setName(prod.name)
    setSlug(prod.slug)
    setShortDescription(prod.shortDescription || '')
    setFullDescription(prod.fullDescription || '')
    setType(prod.type)

    const defaultVar = prod.variations?.find((v) => v.isDefault) || prod.variations?.[0]
    setPrice(defaultVar?.price ? String(defaultVar.price) : '')
    setPromotionalPrice(defaultVar?.promotionalPrice ? String(defaultVar.promotionalPrice) : '')
    setSku(defaultVar?.sku || '')
    setCostPrice('')

    setStatus(prod.status)
    setIsPublished(prod.isPublished)
    setIsFeatured(prod.isFeatured)
    setUploadedFileId(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // 1. Solilitar URL pré-assinada
      const presigned = await apiClient('/files/presigned-url', {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          purpose: 'product_image',
          storeId: storeId || undefined,
        }),
      })

      // 2. Upload direto para armazenamento
      await fetch(presigned.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      }).catch(() => null)

      // 3. Finalizar upload
      const finalized = await apiClient(`/files/${presigned.fileId}/finalize`, {
        method: 'POST',
      })

      setUploadedFileId(finalized.id)
      toast.success('Imagem enviada e aprovada com sucesso!')
    } catch (err: any) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao enviar imagem')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload: any = {
      storeId,
      categoryId,
      brandId: brandId || null,
      name,
      slug: slug || undefined,
      shortDescription: shortDescription || null,
      fullDescription: fullDescription || null,
      type,
      status,
      isPublished,
      isFeatured,
      price: price ? Number(price) : undefined,
      promotionalPrice: promotionalPrice ? Number(promotionalPrice) : null,
      costPrice: costPrice ? Number(costPrice) : null,
      sku: sku || undefined,
      mediaFileIds: uploadedFileId ? [uploadedFileId] : undefined,
      mainMediaFileId: uploadedFileId || undefined,
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, body: payload })
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
            Catálogo de Produtos
          </h1>
          <p className="text-xs text-zinc-400">
            Gerencie o cadastro unificado de produtos, variações e preços do ecossistema
          </p>
        </div>

        {ability.can('create', 'Product') && (
          <button
            type="button"
            onClick={openCreateModal}
            className="flex cursor-pointer items-center justify-center space-x-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-950/60 transition-colors hover:bg-emerald-500"
          >
            <RiAddLine className="h-4 w-4" />
            <span>Novo Produto</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-xl">
        <div className="relative w-full sm:w-64">
          <RiSearchLine className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por produto ou SKU..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pr-3 pl-9 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="w-40">
            <NativeSelect
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
            >
              <option value="">Loja: Todas</option>
              {storesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="w-40">
            <NativeSelect
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Categoria: Todas</option>
              {categoriesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="w-36">
            <NativeSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Status: Todos</option>
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="archived">Arquivado</option>
            </NativeSelect>
          </div>
        </div>
      </div>

      {/* Main Products Table */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl">
        <div className="border-b border-zinc-800/80 bg-zinc-950/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Produtos Encontrados ({productsList.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 text-xs">Carregando produtos...</div>
        ) : productsList.length > 0 ? (
          <div className="divide-y divide-zinc-800/60 overflow-x-auto">
            {productsList.map((prod) => {
              const defaultVar = prod.variations?.find((v) => v.isDefault) || prod.variations?.[0]
              const displayPrice = defaultVar?.price
                ? Number(defaultVar.price).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })
                : 'N/A'

              return (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-zinc-800/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-emerald-400">
                      <RiPriceTag3Line className="h-5 w-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-semibold text-sm text-zinc-100">{prod.name}</span>

                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                            prod.status === 'active'
                              ? 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-300'
                              : prod.status === 'draft'
                                ? 'bg-amber-950/80 border border-amber-800/80 text-amber-300'
                                : 'bg-zinc-950 border border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {prod.status === 'active'
                            ? 'Ativo'
                            : prod.status === 'draft'
                              ? 'Rascunho'
                              : 'Inativo'}
                        </span>

                        {prod.isPublished && (
                          <span className="rounded-full bg-blue-950/80 border border-blue-800/80 px-2.5 py-0.5 text-[10px] font-medium text-blue-300">
                            Publicado no Marketplace
                          </span>
                        )}

                        {defaultVar?.sku && (
                          <span className="rounded-md bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                            SKU: {defaultVar.sku}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-zinc-400">
                        {prod.store && <span>Loja: {prod.store.name}</span>}
                        {prod.category && <span>• Categoria: {prod.category.name}</span>}
                        <span>• Preço: <strong className="text-emerald-400">{displayPrice}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {ability.can('update', 'Product') && !prod.isPublished && (
                      <button
                        type="button"
                        onClick={() => publishMutation.mutate(prod.id)}
                        disabled={publishMutation.isPending}
                        className="cursor-pointer flex items-center space-x-1 rounded-lg border border-blue-900/50 bg-blue-950/30 px-2.5 py-1.5 text-xs text-blue-400 transition-colors hover:bg-blue-900/50"
                        title="Publicar no Marketplace"
                      >
                        <RiSendPlaneLine className="h-3.5 w-3.5" />
                        <span>Publicar</span>
                      </button>
                    )}

                    {ability.can('update', 'Product') && (
                      <button
                        type="button"
                        onClick={() => openEditModal(prod)}
                        className="cursor-pointer rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                        title="Editar"
                      >
                        <RiEditLine className="h-4 w-4" />
                      </button>
                    )}

                    {ability.can('delete', 'Product') && (
                      <button
                        type="button"
                        onClick={() => setDeletingProduct(prod)}
                        className="cursor-pointer rounded-lg border border-rose-900/50 p-1.5 text-rose-400 transition-colors hover:bg-rose-950"
                        title="Arquivar"
                      >
                        <RiArchiveLine className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-zinc-500">
            Nenhum produto encontrado com os filtros selecionados.
          </div>
        )}
      </div>

      {/* Form Dialog Modal (Reusando Shadcn UI) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Altere os dados, preços e mídias do produto'
                : 'Cadastre um novo produto artesanal no catálogo da loja'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Loja Parceira</label>
                <NativeSelect
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  disabled={Boolean(editingProduct)}
                >
                  {storesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Categoria</label>
                <NativeSelect
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Nome do Produto</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Queijo Canastra Meia Cura 500g"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Marca (opcional)</label>
                <NativeSelect
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                >
                  <option value="">Nenhuma Marca</option>
                  {brandsList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Preço de Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required={type === 'simple'}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="49.90"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Preço Promocional</label>
                <input
                  type="number"
                  step="0.01"
                  value={promotionalPrice}
                  onChange={(e) => setPromotionalPrice(e.target.value)}
                  placeholder="44.90"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">SKU (opcional)</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="CANASTRA-500G"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Descrição Curta</label>
              <textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={2}
                placeholder="Resumo em 1 parágrafo..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Imagem / Mídia Direct Upload */}
            <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <label className="text-xs font-semibold text-zinc-300">Imagem do Produto</label>
              <div className="flex items-center space-x-4">
                <label className="flex cursor-pointer items-center space-x-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100">
                  <RiUpload2Line className="h-4 w-4 text-emerald-400" />
                  <span>{isUploading ? 'Enviando...' : 'Selecionar Imagem'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
                {uploadedFileId && (
                  <span className="text-xs text-emerald-400 font-medium">✓ Imagem vinculada</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Status do Cadastro</label>
                <NativeSelect
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="draft">Rascunho</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </NativeSelect>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Publicado no Marketplace</label>
                <NativeSelect
                  value={isPublished ? 'true' : 'false'}
                  onChange={(e) => setIsPublished(e.target.value === 'true')}
                >
                  <option value="false">Não (Oculto)</option>
                  <option value="true">Sim (Visível)</option>
                </NativeSelect>
              </div>
            </div>

            <DialogFooter className="mt-6 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="cursor-pointer rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Arquivamento (Reusando Shadcn UI) */}
      <AlertDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar o produto &quot;{deletingProduct?.name}&quot;? Ele será desativado e despublicado do Marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingProduct) {
                  archiveMutation.mutate(deletingProduct.id)
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
