'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  RiAddLine,
  RiArchiveLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiDraftLine,
  RiEditLine,
  RiGlobalLine,
  RiImageLine,
  RiLockLine,
  RiSendPlaneLine,
  RiShoppingBag3Line,
  RiStarLine,
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { TableWrapper } from '@/components/ui/table-wrapper'
import { apiClient } from '@/lib/api-client'
import { useErrorDialog } from '@/providers/error-dialog-provider'

import {
  brandQueryKeys,
  categoryQueryKeys,
  storeQueryKeys,
} from '../../../../lib/query-keys'
import { useAuth } from '../../../../providers/auth-provider'
import {
  Brand,
  Category,
  ProductFormDialog,
  ProductToEdit,
  Store,
} from './product-form-dialog'

interface ProductsTableProps {
  fixedStoreId?: string
  hideTitle?: boolean
}

export function ProductsTable({
  fixedStoreId,
  hideTitle = false,
}: ProductsTableProps) {
  const queryClient = useQueryClient()
  const { ability } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [storeFilter, setStoreFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [brandFilter, setBrandFilter] = useState<string>('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductToEdit | null>(
    null,
  )
  const [deletingProduct, setDeletingProduct] = useState<ProductToEdit | null>(
    null,
  )

  // Queries
  const { data: storesRes } = useQuery({
    queryKey: storeQueryKeys.dropdown(),
    queryFn: async () => {
      const res = await apiClient<{ data?: Store[] } | Store[]>('/stores')
      return Array.isArray(res) ? res : (res?.data ?? [])
    },
    enabled: !fixedStoreId,
    staleTime: 0, // Always fetch fresh so newly created stores appear immediately
  })

  const { data: categoriesRes } = useQuery({
    queryKey: categoryQueryKeys.dropdown(),
    queryFn: async () => {
      const res = await apiClient<{ data?: Category[] } | Category[]>(
        '/categories',
      )
      return Array.isArray(res) ? res : (res?.data ?? [])
    },
    staleTime: 0, // Always fetch fresh so newly created categories appear immediately
  })

  const { data: brandsRes } = useQuery({
    queryKey: brandQueryKeys.dropdown(),
    queryFn: async () => {
      const res = await apiClient<{ data?: Brand[] } | Brand[]>('/brands')
      return Array.isArray(res) ? res : (res?.data ?? [])
    },
    staleTime: 0, // Always fetch fresh so newly created brands appear immediately
  })

  const effectiveStoreId = fixedStoreId || storeFilter

  const { data: productsRes, isLoading } = useQuery({
    queryKey: [
      'products-list',
      search,
      statusFilter,
      effectiveStoreId,
      categoryFilter,
      brandFilter,
      page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', '10')
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (effectiveStoreId) params.append('storeId', effectiveStoreId)
      if (categoryFilter) params.append('categoryId', categoryFilter)
      if (brandFilter) params.append('brandId', brandFilter)

      const res = await apiClient<{
        data: ProductToEdit[]
        meta: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
      }>(`/products?${params.toString()}`)
      return res
    },
  })

  const storesList = storesRes ?? []
  const categoriesList = categoriesRes ?? []
  const brandsList = brandsRes ?? []
  const productsList: ProductToEdit[] = productsRes?.data ?? []
  const meta = productsRes?.meta ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  }

  const { showError } = useErrorDialog()

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
    onError: (err: unknown) => {
      showError(err, 'Atenção: Não foi possível publicar o produto')
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
    onError: (err: unknown) => {
      showError(err, 'Atenção: Não foi possível arquivar o produto')
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
    if (mainMedia?.file) {
      const fileObj = mainMedia.file as {
        publicUrl?: string
        objectKey?: string
      }
      if (fileObj.publicUrl) return fileObj.publicUrl
      if (fileObj.objectKey) {
        return `https://pub-8c380f0027ec4da2864242b9f076f3fd.r2.dev/${fileObj.objectKey}`
      }
    }
    return null
  }

  return (
    <div className="w-full space-y-4">
      <TableWrapper
        title={hideTitle ? '' : 'Gestão de Produtos'}
        description={
          hideTitle
            ? undefined
            : 'Cadastre produtos simples ou variáveis, gerencie variações, preços e mídias do catálogo.'
        }
        actionButton={
          ability.can('create', 'Product') ? (
            <Button type="button" onClick={openCreateModal}>
              <RiAddLine className="h-4 w-4" />
              <span>Novo Produto</span>
            </Button>
          ) : undefined
        }
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        searchPlaceholder="Buscar por nome, slug ou SKU..."
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              wrapperClassName="w-36"
            >
              <option value="all">Todos os Status</option>
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="archived">Arquivado</option>
            </NativeSelect>

            {!fixedStoreId && (
              <NativeSelect
                value={storeFilter}
                onChange={(e) => {
                  setStoreFilter(e.target.value)
                  setPage(1)
                }}
                wrapperClassName="w-40"
              >
                <option value="">Todas as Lojas</option>
                {storesList.map((st: { id: string; name: string }) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </NativeSelect>
            )}

            <NativeSelect
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
              wrapperClassName="w-40"
            >
              <option value="">Todas as Categorias</option>
              {categoriesList.map((cat: { id: string; name: string }) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value)
                setPage(1)
              }}
              wrapperClassName="w-40"
            >
              <option value="">Todas as Marcas</option>
              {brandsList.map((br: { id: string; name: string }) => (
                <option key={br.id} value={br.id}>
                  {br.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        }
        isLoading={isLoading}
        isEmpty={!isLoading && productsList.length === 0}
        emptyTitle="Nenhum produto encontrado"
        emptyDescription="Nenhum produto corresponde aos filtros selecionados."
        emptyIcon={<RiShoppingBag3Line className="h-6 w-6 text-zinc-400" />}
        meta={{
          page: meta.page,
          perPage: 10,
          total: meta.total || 0,
          totalPages: meta.totalPages || 1,
          hasNextPage: meta.page < meta.totalPages,
          hasPreviousPage: meta.page > 1,
        }}
        onPageChange={setPage}
      >
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
            {productsList.map((prod: ProductToEdit) => {
              const imgUrl = getMainImage(prod)
              const defaultVar =
                prod.variations?.find(
                  (v: { isDefault?: boolean }) => v.isDefault,
                ) || prod.variations?.[0]

              return (
                <tr
                  key={prod.id}
                  className="transition-colors hover:bg-zinc-900/60"
                >
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
                      <span className="text-zinc-200">
                        {prod.category?.name || '—'}
                      </span>
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
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          prod.status === 'active'
                            ? 'border-emerald-800 bg-emerald-950/80 text-emerald-400'
                            : prod.status === 'draft'
                              ? 'border-zinc-700 bg-zinc-800/80 text-zinc-300'
                              : prod.status === 'archived'
                                ? 'border-rose-900/60 bg-rose-950/80 text-rose-400'
                                : 'border-amber-800 bg-amber-950/80 text-amber-400'
                        }`}
                      >
                        {prod.status === 'active' && (
                          <RiCheckLine className="h-3 w-3" />
                        )}
                        {prod.status === 'draft' && (
                          <RiDraftLine className="h-3 w-3" />
                        )}
                        {prod.status === 'archived' && (
                          <RiArchiveLine className="h-3 w-3" />
                        )}
                        {prod.status === 'inactive' && (
                          <RiCloseCircleLine className="h-3 w-3" />
                        )}
                        <span>
                          {prod.status === 'active'
                            ? 'Ativo'
                            : prod.status === 'draft'
                              ? 'Rascunho'
                              : prod.status === 'archived'
                                ? 'Arquivado'
                                : 'Inativo'}
                        </span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          prod.isPublished
                            ? 'border-sky-800/80 bg-sky-950/80 text-sky-400'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        {prod.isPublished ? (
                          <>
                            <RiGlobalLine className="h-3 w-3 text-sky-400" />
                            <span>Publicado</span>
                          </>
                        ) : (
                          <>
                            <RiLockLine className="h-3 w-3 text-zinc-400" />
                            <span>Privado</span>
                          </>
                        )}
                      </span>

                      {prod.isFeatured && (
                        <Badge className="inline-flex items-center gap-1 border-amber-800/80 bg-amber-950/80 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                          <RiStarLine className="h-3 w-3 text-amber-400" />
                          <span>Destaque</span>
                        </Badge>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {ability.can('update', 'Product') &&
                        !prod.isPublished && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            title="Publicar no Marketplace"
                            onClick={() => publishMutation.mutate(prod.id)}
                            disabled={publishMutation.isPending}
                            className="h-8 w-8 border-emerald-900 bg-emerald-950/60 p-1.5 text-emerald-400 hover:bg-emerald-900 hover:text-emerald-200"
                          >
                            <RiSendPlaneLine className="h-4 w-4" />
                          </Button>
                        )}

                      {ability.can('update', 'Product') && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          title="Editar Produto"
                          onClick={() => openEditModal(prod)}
                          className="h-8 w-8 p-1.5 text-zinc-300"
                        >
                          <RiEditLine className="h-4 w-4" />
                        </Button>
                      )}

                      {ability.can('delete', 'Product') &&
                        prod.status !== 'archived' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            title="Arquivar Produto"
                            onClick={() => setDeletingProduct(prod)}
                            className="h-8 w-8 p-1.5 border-rose-900/40 bg-rose-950/20 text-rose-400 hover:bg-rose-950/60 hover:border-rose-800/80 hover:text-rose-300 transition-colors"
                          >
                            <RiArchiveLine className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableWrapper>

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
              <strong className="text-zinc-200">{deletingProduct?.name}</strong>
              ? Ele será despublicado do marketplace e removido da listagem
              ativa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingProduct && archiveMutation.mutate(deletingProduct.id)
              }
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
