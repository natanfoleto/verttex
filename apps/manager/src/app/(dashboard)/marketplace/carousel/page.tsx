'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiDeleteBin6Line,
  RiEditLine,
  RiEyeLine,
  RiEyeOffLine,
  RiImageAddLine,
  RiImageLine,
  RiLoader4Line,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { apiClient } from '@/lib/api-client'

// =============================================================
// TIPOS
// =============================================================

export interface CarouselBanner {
  id: string
  fileId?: string | null
  imageUrl?: string | null
  title: string
  subtitle?: string | null
  linkUrl?: string | null
  ctaText?: string | null
  position: number
  isActive: boolean
  createdBy?: string | null
  updatedBy?: string | null
  createdAt: string
  updatedAt: string
}

interface CreateBannerState {
  title: string
  subtitle: string
  linkUrl: string
  ctaText: string
  isActive: boolean
}

interface EditBannerState {
  title: string
  subtitle: string
  linkUrl: string
  ctaText: string
  isActive: boolean
  fileId?: string | null
  imageUrl?: string | null
}

const EMPTY_CREATE_FORM: CreateBannerState = {
  title: '',
  subtitle: '',
  linkUrl: '',
  ctaText: '',
  isActive: true,
}

export default function CarouselPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados dos Modais
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] =
    useState<CreateBannerState>(EMPTY_CREATE_FORM)

  const [editingBanner, setEditingBanner] = useState<CarouselBanner | null>(
    null,
  )
  const [editForm, setEditForm] = useState<EditBannerState>({
    title: '',
    subtitle: '',
    linkUrl: '',
    ctaText: '',
    isActive: true,
  })

  // Upload no Modal de Edição
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // ----- React Query -----

  const {
    data: bannersRes,
    isLoading,
    isError,
  } = useQuery<{
    success: boolean
    data: CarouselBanner[]
  }>({
    queryKey: ['carousel-banners'],
    queryFn: async () => {
      const res = await apiClient<
        CarouselBanner[] | { data: CarouselBanner[] }
      >('/carousel')
      const list = Array.isArray(res) ? res : ((res as any)?.data ?? [])
      return { success: true, data: list }
    },
  })

  const banners = bannersRes?.data ?? []

  const createMutation = useMutation({
    mutationFn: (payload: {
      title: string
      subtitle?: string
      linkUrl?: string
      ctaText?: string
      isActive: boolean
    }) =>
      apiClient<CarouselBanner>('/carousel', { method: 'POST', body: payload }),
    onSuccess: (newBanner) => {
      queryClient.invalidateQueries({ queryKey: ['carousel-banners'] })
      toast.success(
        'Banner criado com sucesso! Adicione uma imagem para ativá-lo no carrossel.',
      )
      setIsCreateOpen(false)
      setCreateForm(EMPTY_CREATE_FORM)
      if (newBanner?.id) {
        openEdit(newBanner)
      }
    },
    onError: () => toast.error('Não foi possível criar o banner.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<EditBannerState>
    }) => apiClient(`/carousel/${id}`, { method: 'PATCH', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel-banners'] })
      toast.success('Banner atualizado com sucesso!')
      handleCloseEditModal()
    },
    onError: () => toast.error('Não foi possível atualizar o banner.'),
  })

  const deleteImageMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/carousel/${id}/image`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel-banners'] })
      toast.success('Imagem do banner removida.')
      if (editingBanner) {
        setEditingBanner({ ...editingBanner, fileId: null, imageUrl: null })
        setEditForm((prev) => ({ ...prev, fileId: null, imageUrl: null }))
      }
      setLocalPreviewUrl(null)
      setSelectedFile(null)
    },
    onError: () => toast.error('Não foi possível remover a imagem.'),
  })

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/carousel/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel-banners'] })
      toast.success('Banner excluído com sucesso.')
    },
    onError: () => toast.error('Não foi possível excluir o banner.'),
  })

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; position: number }[]) =>
      apiClient('/carousel/reorder', { method: 'POST', body: { items } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['carousel-banners'] }),
    onError: () => toast.error('Não foi possível reordenar os banners.'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient(`/carousel/${id}`, { method: 'PATCH', body: { isActive } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['carousel-banners'] }),
    onError: () => toast.error('Não foi possível alterar o status do banner.'),
  })

  // ----- Handlers -----

  function openCreate() {
    setCreateForm(EMPTY_CREATE_FORM)
    setIsCreateOpen(true)
  }

  function openEdit(banner: CarouselBanner) {
    setEditingBanner(banner)
    setEditForm({
      title: banner.title,
      subtitle: banner.subtitle ?? '',
      linkUrl: banner.linkUrl ?? '',
      ctaText: banner.ctaText ?? '',
      isActive: banner.isActive,
      fileId: banner.fileId,
      imageUrl: banner.imageUrl,
    })
    setLocalPreviewUrl(null)
    setSelectedFile(null)
  }

  function handleCloseEditModal() {
    if (localPreviewUrl?.startsWith('blob:'))
      URL.revokeObjectURL(localPreviewUrl)
    setLocalPreviewUrl(null)
    setSelectedFile(null)
    setEditingBanner(null)
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use JPG, PNG, WebP ou GIF.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem não pode ultrapassar 5 MB.')
      return
    }

    setSelectedFile(file)
    const preview = URL.createObjectURL(file)
    setLocalPreviewUrl(preview)
  }

  async function uploadSelectedFile(): Promise<{
    fileId: string
    publicUrl: string
  } | null> {
    if (!selectedFile) return null

    setIsUploading(true)
    try {
      let fileId: string | null = null
      let publicUrl: string | null = null

      // 1. Tenta upload via URL Pré-Assinada
      try {
        const presignedRes = await apiClient<{
          success: boolean
          data: { uploadUrl: string; publicUrl: string; fileId: string }
        }>('/files/presigned-url', {
          method: 'POST',
          body: {
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
            size: selectedFile.size,
            purpose: 'marketplace_banner',
          },
        })

        const presigned = presignedRes.data || presignedRes
        if (presigned?.uploadUrl) {
          const putRes = await fetch(presigned.uploadUrl, {
            method: 'PUT',
            body: selectedFile,
            headers: { 'Content-Type': selectedFile.type },
          })

          if (putRes.ok) {
            const finalizedRes = await apiClient<{
              success: boolean
              data: { id: string; publicUrl: string }
            }>(`/files/${presigned.fileId}/finalize`, { method: 'POST' })

            const finalized = finalizedRes.data || finalizedRes
            fileId = finalized.id || presigned.fileId
            publicUrl = finalized.publicUrl || presigned.publicUrl
          }
        }
      } catch {
        // Fallback para multipart upload
      }

      // 2. Fallback: Upload Multipart direto via API (/files/upload em uploads/marketplace/banners)
      if (!publicUrl) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('purpose', 'marketplace_banner')

        const uploadRes = await apiClient<{
          success: boolean
          data: { id: string; publicUrl: string }
        }>('/files/upload', {
          method: 'POST',
          body: formData,
        })

        const uploadedFile = uploadRes.data || uploadRes
        fileId = uploadedFile.id
        publicUrl = uploadedFile.publicUrl
      }

      if (!publicUrl || !fileId) {
        throw new Error('Não foi possível realizar o upload da imagem.')
      }

      return { fileId, publicUrl }
    } catch (err: any) {
      console.error('Erro no upload do banner:', err)
      toast.error(err?.message || 'Falha ao enviar a imagem. Tente novamente.')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.title.trim()) {
      toast.error('O título do banner é obrigatório.')
      return
    }

    createMutation.mutate({
      title: createForm.title.trim(),
      subtitle: createForm.subtitle.trim() || undefined,
      linkUrl: createForm.linkUrl.trim() || undefined,
      ctaText: createForm.ctaText.trim() || undefined,
      isActive: createForm.isActive,
    })
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingBanner || !editForm.title.trim()) {
      toast.error('O título do banner é obrigatório.')
      return
    }

    let fileId = editForm.fileId
    let imageUrl = editForm.imageUrl

    if (selectedFile) {
      const uploadResult = await uploadSelectedFile()
      if (!uploadResult) return
      fileId = uploadResult.fileId
      imageUrl = uploadResult.publicUrl
    }

    updateMutation.mutate({
      id: editingBanner.id,
      payload: {
        title: editForm.title.trim(),
        subtitle: editForm.subtitle.trim() || undefined,
        linkUrl: editForm.linkUrl.trim() || undefined,
        ctaText: editForm.ctaText.trim() || undefined,
        isActive: editForm.isActive,
        fileId: fileId || undefined,
        imageUrl: imageUrl || undefined,
      },
    })
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    const reordered = [...banners]
    const prev = reordered[index - 1]
    const curr = reordered[index]
    if (prev && curr) {
      reordered[index - 1] = curr
      reordered[index] = prev
      const items = reordered.map((b, i) => ({ id: b.id, position: i }))
      reorderMutation.mutate(items)
    }
  }

  function handleMoveDown(index: number) {
    if (index >= banners.length - 1) return
    const reordered = [...banners]
    const curr = reordered[index]
    const next = reordered[index + 1]
    if (curr && next) {
      reordered[index] = next
      reordered[index + 1] = curr
      const items = reordered.map((b, i) => ({ id: b.id, position: i }))
      reorderMutation.mutate(items)
    }
  }

  const isSavingEdit = updateMutation.isPending || isUploading

  // =============================================================
  // RENDER
  // =============================================================

  const isCreateDirty = createForm.title.trim().length > 0

  const isEditDirty = Boolean(
    editingBanner &&
    (editForm.title !== editingBanner.title ||
      editForm.subtitle !== (editingBanner.subtitle || '') ||
      editForm.linkUrl !== (editingBanner.linkUrl || '') ||
      editForm.ctaText !== (editingBanner.ctaText || '') ||
      editForm.isActive !== editingBanner.isActive ||
      selectedFile !== null),
  )

  return (
    <div className="space-y-6 font-sans text-zinc-100 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Carrossel do Site
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Gerencie os banners exibidos no carrossel principal do marketplace.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
        >
          <RiAddLine className="h-4 w-4" />
          <span>Novo Banner</span>
        </Button>
      </div>

      {/* Lista de Banners empilhados verticalmente (Soltos na página para edição fluida) */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 rounded-xl bg-zinc-900 border border-zinc-800" />
          <div className="h-32 rounded-xl bg-zinc-900 border border-zinc-800" />
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-red-400 rounded-xl bg-zinc-900 border border-zinc-800">
          Erro ao carregar banners do carrossel. Tente novamente.
        </div>
      ) : banners.length === 0 ? (
        <div className="p-12 text-center text-zinc-400 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <RiImageLine className="h-8 w-8 text-zinc-500 mx-auto" />
          <p className="font-semibold text-zinc-200">
            Nenhum banner cadastrado
          </p>
          <p className="text-xs text-zinc-400">
            Clique em "Novo Banner" para cadastrar o primeiro.
          </p>
        </div>
      ) : (
        <TooltipProvider>
          <div className="space-y-4">
            {banners.map((banner, index) => {
              const hasImage = Boolean(banner.imageUrl)
              return (
                <div
                  key={banner.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-zinc-700 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                >
                  {/* Informações Principais do Banner */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
                    {/* Posição e Botões de Reordenação Rápida do lado esquerdo (Soltos sem quadrado nem borda) */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono font-bold text-zinc-400 pr-1">
                        #{banner.position + 1}
                      </span>

                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleMoveUp(index)}
                              disabled={
                                index === 0 || reorderMutation.isPending
                              }
                              className="cursor-pointer h-8 w-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
                            >
                              <RiArrowUpLine className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Mover para cima</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleMoveDown(index)}
                              disabled={
                                index === banners.length - 1 ||
                                reorderMutation.isPending
                              }
                              className="cursor-pointer h-8 w-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
                            >
                              <RiArrowDownLine className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Mover para baixo</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Thumbnail / Preview com Altura Ampliada (h-28 w-52) */}
                    <div className="relative h-28 w-52 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-700/80 shadow-md shrink-0 flex items-center justify-center group">
                      {hasImage ? (
                        <img
                          src={banner.imageUrl!}
                          alt={banner.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-center p-2 space-y-1">
                          <RiImageLine className="h-7 w-7 text-zinc-600 mx-auto" />
                          <span className="text-[11px] text-zinc-500 font-medium block">
                            Sem Imagem
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Detalhes de Texto */}
                    <div className="space-y-3 min-w-0 flex-1">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-zinc-100 truncate">
                            {banner.title}
                          </h3>
                        </div>

                        {banner.subtitle && (
                          <p className="text-xs text-zinc-400 truncate">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-zinc-500 flex-wrap">
                        {banner.linkUrl && (
                          <span className="truncate max-w-64">
                            <strong className="text-zinc-400">Link:</strong>{' '}
                            {banner.linkUrl}
                          </span>
                        )}
                        {banner.ctaText && (
                          <span>
                            <strong className="text-zinc-400">Botão:</strong>{' '}
                            {banner.ctaText}
                          </span>
                        )}
                        <span>
                          <strong className="text-zinc-400">Atualizado:</strong>{' '}
                          {new Date(banner.updatedAt).toLocaleDateString(
                            'pt-BR',
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação na Direita com Ícones e Tooltips */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    {/* Ativar/Desativar */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            toggleActiveMutation.mutate({
                              id: banner.id,
                              isActive: !banner.isActive,
                            })
                          }
                          className={`cursor-pointer h-8 w-8 border-zinc-700 ${banner.isActive
                            ? 'text-emerald-400 hover:bg-emerald-950/40'
                            : 'text-zinc-500 hover:bg-zinc-800'
                            }`}
                        >
                          {banner.isActive ? (
                            <RiEyeLine className="h-4 w-4" />
                          ) : (
                            <RiEyeOffLine className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {banner.isActive ? 'Desativar banner' : 'Ativar banner'}
                      </TooltipContent>
                    </Tooltip>

                    {/* Editar */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openEdit(banner)}
                          className="cursor-pointer h-8 w-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                          <RiEditLine className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar banner e imagem</TooltipContent>
                    </Tooltip>

                    {/* Remover */}
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              className="cursor-pointer h-8 w-8 border-zinc-700 text-zinc-400 hover:text-red-400 hover:bg-red-950/30"
                            >
                              <RiDeleteBin6Line className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Remover banner</TooltipContent>
                      </Tooltip>

                      <AlertDialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-zinc-100">
                            Remover Banner
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-zinc-400">
                            Tem certeza que deseja remover o banner{' '}
                            <strong className="text-zinc-200">
                              {banner.title}
                            </strong>
                            ? Esta ação excluirá a imagem do Cloudflare R2 e não
                            poderá ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="cursor-pointer border-zinc-700 text-zinc-300">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteBannerMutation.mutate(banner.id)
                            }
                            className="cursor-pointer bg-red-600 hover:bg-red-500 text-white"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )
            })}
          </div>
        </TooltipProvider>
      )}

      {/* Modal de Criação */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl w-full border-zinc-800 bg-zinc-900 text-zinc-100">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="text-zinc-100">
                Cadastrar Novo Banner
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Preencha as informações do banner. A imagem poderá ser
                adicionada na etapa de edição logo a seguir.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Título Oficial *
                  </label>
                  <Input
                    required
                    placeholder="Produtos da Estação"
                    value={createForm.title}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, title: e.target.value })
                    }
                    className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Subtítulo
                  </label>
                  <Input
                    placeholder="Descubra os melhores produtos coloniais"
                    value={createForm.subtitle}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, subtitle: e.target.value })
                    }
                    className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="cursor-pointer border-zinc-700 text-zinc-300 hover:text-zinc-100"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isCreateDirty || createMutation.isPending}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending && (
                  <RiLoader4Line className="h-4 w-4 animate-spin" />
                )}
                <span>Criar Banner</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição com Layout Clean e Espaçoso */}
      <Dialog
        open={!!editingBanner}
        onOpenChange={(open) => !open && handleCloseEditModal()}
      >
        <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden border-zinc-800 bg-zinc-900 text-zinc-100">
          <form onSubmit={handleEditSubmit} className="overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">
                Editar Banner: {editingBanner?.title}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Altere as informações do banner ou atualize a imagem vinculada.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4 overflow-hidden">
              {/* Título & Subtítulo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Título Oficial *
                  </label>
                  <Input
                    required
                    placeholder="Ex: Produtos da Estação / Feira Colonial"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Subtítulo
                  </label>
                  <Input
                    placeholder="Ex: Descubra os melhores produtos coloniais e artesanais com até 20% de desconto"
                    value={editForm.subtitle}
                    onChange={(e) =>
                      setEditForm({ ...editForm, subtitle: e.target.value })
                    }
                    className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                  />
                </div>
              </div>

              {/* Área da Imagem com Card Clean e Espaçoso */}
              <div className="space-y-2 overflow-hidden">
                <label className="text-xs font-semibold text-zinc-300">
                  Imagem do Banner
                </label>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-2 overflow-hidden">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Container da Imagem Clicável com Efeito Hover */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative w-full h-44 rounded-lg overflow-hidden border border-zinc-700/60 bg-zinc-900 flex items-center justify-center shadow-inner cursor-pointer"
                  >
                    {localPreviewUrl || editForm.imageUrl ? (
                      <>
                        <img
                          src={localPreviewUrl ?? editForm.imageUrl!}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay no Hover: Clique para trocar a imagem */}
                        <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center space-y-1.5 cursor-pointer z-10">
                          <RiImageAddLine className="h-6 w-6 text-white" />
                          <span className="text-xs font-semibold text-white">
                            Clique para trocar a imagem
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center space-y-2 flex flex-col items-center justify-center w-full h-full group-hover:bg-zinc-800/40 transition-colors">
                        <RiImageAddLine className="h-8 w-8 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                        <p className="text-xs text-zinc-300 font-semibold group-hover:text-white transition-colors">
                          Clique para selecionar uma imagem
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Formatos aceitos: JPG, PNG, WebP ou GIF (máx. 5 MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Rodapé: Nome do arquivo como texto simples à esquerda | Botão de remover estilo link à direita */}
                  <div className="flex items-center justify-between gap-4 w-full pt-1">
                    <span
                      className="text-xs font-mono text-zinc-300 truncate min-w-0 flex-1"
                      title={
                        selectedFile
                          ? selectedFile.name
                          : editForm.imageUrl
                            ? editForm.imageUrl.split('/').pop()
                            : ''
                      }
                    >
                      {selectedFile
                        ? selectedFile.name
                        : editForm.imageUrl
                          ? editForm.imageUrl.split('/').pop()
                          : ''}
                    </span>

                    {(editForm.imageUrl || editForm.fileId || selectedFile) && (
                      <Button
                        variant="link"
                        className="p-0 h-0"
                        onClick={() => {
                          if (selectedFile) {
                            setSelectedFile(null)
                            setLocalPreviewUrl(null)
                          } else if (editingBanner) {
                            deleteImageMutation.mutate(editingBanner.id)
                          }
                        }}
                        disabled={deleteImageMutation.isPending}
                      >
                        Remover Imagem
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-500 font-normal leading-relaxed">
                  Formatos aceitos: JPG, PNG, WebP ou GIF (máx. 5 MB).
                </p>
              </div>

              {/* Link URL & Botão CTA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Link ao Clicar (URL)
                  </label>
                  <Input
                    placeholder="Ex: /produtos ou https://verttex.com.br/ofertas"
                    value={editForm.linkUrl}
                    onChange={(e) =>
                      setEditForm({ ...editForm, linkUrl: e.target.value })
                    }
                    className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Texto do Botão CTA (Opcional)
                  </label>
                  <Input
                    placeholder="Ex: Explorar Catálogo"
                    value={editForm.ctaText}
                    onChange={(e) =>
                      setEditForm({ ...editForm, ctaText: e.target.value })
                    }
                    className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                  />
                </div>
              </div>

              {/* Status Ativo */}
              <div className="flex items-center space-x-3 pt-1">
                <Checkbox
                  id="edit-banner-active"
                  checked={editForm.isActive}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, isActive: !!checked })
                  }
                  className="cursor-pointer border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <label
                  htmlFor="edit-banner-active"
                  className="text-sm text-zinc-300 cursor-pointer font-normal"
                >
                  Banner ativo no carrossel
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditModal}
                className="cursor-pointer border-zinc-700 text-zinc-300 hover:text-zinc-100"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isEditDirty || isSavingEdit}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingEdit && (
                  <RiLoader4Line className="h-4 w-4 animate-spin" />
                )}
                <span>Salvar Alterações</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
