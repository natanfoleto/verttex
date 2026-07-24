'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  RiAddLine,
  RiArchiveLine,
  RiEditLine,
  RiImageLine,
  RiSearchLine,
  RiSendPlaneLine,
  RiStarFill,
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
import { NativeSelect } from '@/components/ui/native-select'
import { apiClient, ApiError } from '../../../../lib/api-client'
import { useAuth } from '../../../../providers/auth-provider'
import { ProductFormDialog, ProductToEdit } from './product-form-dialog'

interface ProductsTableProps {
  fixedStoreId?: string
  hideTitle?: boolean
}

export function ProductsTable({ fixedStoreId, hideTitle = false }: ProductsTableProps) {
  const { ability } = useAuth()
  const queryClient = useQueryClient()

  // Filters State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [storeFilter, setStoreFilter] = useState<string>(fixedStoreId || '')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [brandFilter, setBrandFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductToEdit | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<ProductToEdit | null>(null)

  // Queries
  const { data: storesRes } = useQuery({
    queryKey: ['stores-dropdown'],
    queryFn: async () => {
      const res = await apiClient('/stores')
      return Array.isArray(res) ? res : res?.data ?? []
    },
    enabled: !fixedStoreId,
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

  const effectiveStoreId = fixedStoreId || storeFilter

  const { data: productsRes, isLoading } = useQuery({
    queryKey: ['products-list', search, statusFilter, effectiveStoreId, categoryFilter, brandFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', '10')
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (effectiveStoreId) params.append('storeId', effectiveStoreId)
      if (categoryFilter) params.append('categoryId', categoryFilter)
      if (brandFilter) params.append('brandId', brandFilter)

      const res = await apiClient(`/products?${params.toString()}`)
      return res
    },
  })

  const storesList = storesRes ?? []
  const categoriesList = categoriesRes ?? []
  const brandsList = brandsRes ?? []
  const productsList: ProductToEdit[] = productsRes?.data ?? (Array.isArray(productsRes) ? productsRes : [])
  const meta = productsRes?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 }

  // Mutations
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
    setIsModalOpen(true)
  }

  const openEditModal = (product: ProductToEdit) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const formatPrice = (prod: ProductToEdit) => {
    if (prod.variations && prod.variations.length > 0) {
      const prices = prod.variations
        .map((v) => Number(v.price))
        .filter((p) => !isNaN(p) && p > 0)
      if (prices.length > 0) {
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)
        if (minPrice === maxPrice) {
          return `R$ ${minPrice.toFixed(2)}`
        }
        return `R$ ${minPrice.toFixed(2)} - R$ ${maxPrice.toFixed(2)}`
      }
    }
    return 'R$ 0,00'
  }

  const getMainImage = (prod: ProductToEdit) => {
    const mainMedia = prod.medias?.find((m) => m.isMain) || prod.medias?.[0]
    if (mainMedia?.file?.objectKey) {
      return `https://pub-verttex.r2.dev/${mainMedia.file.objectKey}`
    }
    return null
  }

  return (
    <div className="w-full space-y-4">
      {/* Top Header */}
      {!hideTitle && (
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Gestão de Produtos
            </h1>
            <p className="text-xs text-zinc-400">
              Cadastre produtos simples ou variáveis, gerencie variações, preços e mídias do catálogo.
            </p>
          </div>

          {ability.can('create', 'Product') && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex cursor-pointer items-center justify-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-colors hover:bg-emerald-500"
            >
              <RiAddLine className="h-4 w-4" />
              <span>Novo Produto</span>
            </button>
          )}
        </div>
      )}

      {/* Header action button for store-embedded view */}
      {hideTitle && ability.can('create', 'Product') && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Produtos da Loja</h2>
            <p className="text-xs text-zinc-400">
              Produtos cadastrados e vinculados a esta loja.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex cursor-pointer items-center space-x-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md transition-colors hover:bg-emerald-500"
          >
            <RiAddLine className="h-4 w-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="relative sm:col-span-2">
          <RiSearchLine className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome, slug ou SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <NativeSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">Todos os Status</option>
            <option value="draft">Rascunho</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="archived">Arquivado</option>
          </NativeSelect>
          <div>
          <NativeSelect
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todas as Marcas</option>
            {brandsList.map((br: any) => (
              <option key={br.id} value={br.id}>
                {br.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

        {!fixedStoreId && (
          <div>
            <NativeSelect
              value={storeFilter}
              onChange={(e) => {
                setStoreFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Todas as Lojas</option>
              {storesList.map((st: any) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}

        <div>
          <NativeSelect
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todas as Categorias</option>
            {categoriesList.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800/80 bg-zinc-950 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Produto</th>
                {!fixedStoreId && <th className="px-4 py-3">Loja</th>}
                <th className="px-4 py-3">Categoria / Marca</th>
                <th className="px-4 py-3">Preço / SKU</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={fixedStoreId ? 5 : 6}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
                  </td>
                </tr>
              ) : productsList.length === 0 ? (
                <tr>
                  <td
                    colSpan={fixedStoreId ? 5 : 6}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                productsList.map((prod: any) => {
                  const imgUrl = getMainImage(prod)
                  const defaultVar = prod.variations?.find((v: any) => v.isDefault) || prod.variations?.[0]

                  return (
                    <tr key={prod.id} className="transition-colors hover:bg-zinc-900/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center">
                            {imgUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={imgUrl}
                                alt={prod.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <RiImageLine className="h-5 w-5 text-zinc-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5 font-semibold text-zinc-100">
                              <span>{prod.name}</span>
                              {prod.isFeatured && (
                                <RiStarFill className="h-3.5 w-3.5 text-amber-400" title="Destaque" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-zinc-500 font-mono">
                              <span>{prod.slug}</span>
                              <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400">
                                {prod.type === 'simple' ? 'Simples' : 'Variável'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {!fixedStoreId && (
                        <td className="px-4 py-3">
                          <span className="font-medium text-zinc-300">
                            {prod.store?.name || '—'}
                          </span>
                        </td>
                      )}

                      <td className="px-4 py-3">
                        <div className="flex flex-col text-xs">
                          <span className="text-zinc-200">{prod.category?.name || '—'}</span>
                          <span className="text-[11px] text-zinc-500">
                            {prod.brand?.name || 'Sem Marca'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col text-xs font-mono">
                          <span className="font-semibold text-emerald-400">
                            {formatPrice(prod)}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            SKU: {defaultVar?.sku || '—'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col space-y-1 items-start">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              prod.status === 'active'
                                ? 'border-emerald-800 bg-emerald-950 text-emerald-400'
                                : prod.status === 'draft'
                                  ? 'border-zinc-700 bg-zinc-800 text-zinc-300'
                                  : prod.status === 'archived'
                                    ? 'border-rose-900/60 bg-rose-950 text-rose-400'
                                    : 'border-amber-800 bg-amber-950 text-amber-400'
                            }`}
                          >
                            {prod.status === 'active'
                              ? 'Ativo'
                              : prod.status === 'draft'
                                ? 'Rascunho'
                                : prod.status === 'archived'
                                  ? 'Arquivado'
                                  : 'Inativo'}
                          </span>

                          <span
                            className={`text-[10px] font-medium ${
                              prod.isPublished ? 'text-emerald-400' : 'text-zinc-500'
                            }`}
                          >
                            {prod.isPublished ? '🌐 Publicado' : '🔒 Privado'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {ability.can('update', 'Product') && !prod.isPublished && (
                            <button
                              type="button"
                              title="Publicar no Marketplace"
                              onClick={() => publishMutation.mutate(prod.id)}
                              disabled={publishMutation.isPending}
                              className="rounded-lg border border-emerald-900 bg-emerald-950/60 p-1.5 text-emerald-400 transition-colors hover:bg-emerald-900 hover:text-emerald-200"
                            >
                              <RiSendPlaneLine className="h-4 w-4" />
                            </button>
                          )}

                          {ability.can('update', 'Product') && (
                            <button
                              type="button"
                              title="Editar Produto"
                              onClick={() => openEditModal(prod)}
                              className="rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                            >
                              <RiEditLine className="h-4 w-4" />
                            </button>
                          )}

                          {ability.can('delete', 'Product') && prod.status !== 'archived' && (
                            <button
                              type="button"
                              title="Arquivar Produto"
                              onClick={() => setDeletingProduct(prod)}
                              className="rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-rose-400"
                            >
                              <RiArchiveLine className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-950 px-4 py-3 text-xs text-zinc-400">
            <span>
              Página {meta.page} de {meta.totalPages} ({meta.total} produtos)
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <ProductFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        productToEdit={editingProduct}
        defaultStoreId={fixedStoreId}
      />

      {/* Confirm Archive Alert */}
      <AlertDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Arquivar Produto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza de que deseja arquivar o produto{' '}
              <strong className="text-zinc-200">{deletingProduct?.name}</strong>? Ele será despublicado do marketplace e removido da listagem ativa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProduct && archiveMutation.mutate(deletingProduct.id)}
              className="cursor-pointer bg-rose-600 text-white hover:bg-rose-500"
            >
              Sim, Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
