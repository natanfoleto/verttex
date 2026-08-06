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
import { useErrorDialog } from '@/providers/error-dialog-provider'

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
      const list = Array.isArray(res)
        ? res
        : ((res as { data?: CarouselBanner[] })?.data ?? [])
      return { success: true, data: list }
    },
  })

  const banners = bannersRes?.data ?? []
  const { showError } = useErrorDialog()

  const createMutation = useMutation({
    mutationFn: (payload: {
      title: string
      subtitle?: string | null
      targetUrl?: string | null
      badgeText?: string | null
      primaryButtonText?: string | null
      primaryButtonUrl?: string | null
      secondaryButtonText?: string | null
      secondaryButtonUrl?: string | null
      backgroundColor?: string | null
      textColor?: string | null
      startDate?: string | null
      endDate?: string | null
    }) =>
      apiClient<CarouselBanner>('/carousel', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
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
    onError: (err: unknown) => {
      showError(err, 'Atenção: Não foi possível criar o banner')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<EditBannerState>
    }) =>
      apiClient(`/carousel/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel-banners'] })
      toast.success('Banner atualizado com sucesso!')
      handleCloseEditModal()
    },
    onError: (err: unknown) => {
      showError(err, 'Atenção: Não foi possível atualizar o banner')
    },
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
    onError: (err: unknown) => {
      showError(err, 'Atenção: Não foi possível remover a imagem')
    },
  })

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/carousel/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel-banners'] })
      toast.success('Banner excluído com sucesso.')
    },
    onError: (err: unknown) => {
      showError(err, 'Atenção: Não foi possível excluir o banner')
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; position: number }[]) =>
      apiClient('/carousel/reorder', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['carousel-banners'] }),
    onError: (err: unknown) => {
      showError(err, 'Atenção: Não foi possível reordenar os banners')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient(`/carousel/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['carousel-banners'] }),
    onError: (err: unknown) => {
      showError(err, 'Atenção: Não foi possível alterar o status do banner')
    },
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
          body: JSON.stringify({
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
            size: selectedFile.size,
            purpose: 'marketplace_banner',
          }),
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
    } catch (err: unknown) {
      console.error('Erro no upload do banner:', err)
      const msg =
        err instanceof Error
          ? err.message
          : 'Falha ao enviar a imagem. Tente novamente.'
      toast.error(msg)
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
      targetUrl: createForm.linkUrl.trim() || undefined,
      primaryButtonText: createForm.ctaText.trim() || undefined,
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
    <div className="w-full space-y-6 font-sans text-zinc-100">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Carrossel do Site
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gerencie os banners exibidos no carrossel principal do marketplace.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="cursor-pointer gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
        >
          <RiAddLine className="h-4 w-4" />
          <span>Novo Banner</span>
        </Button>
      </div>

      {/* Lista de Banners empilhados verticalmente (Soltos na página para edição fluida) */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-xl border border-zinc-800 bg-zinc-900" />
          <div className="h-32 rounded-xl border border-zinc-800 bg-zinc-900" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-red-400">
          Erro ao carregar banners do carrossel. Tente novamente.
        </div>
      ) : banners.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-12 text-center text-zinc-400">
          <RiImageLine className="mx-auto h-8 w-8 text-zinc-500" />
          <p className="font-semibold text-zinc-200">
            Nenhum banner cadastrado
          </p>
          <p className="text-xs text-zinc-400">
            Clique em &quot;Novo Banner&quot; para cadastrar o primeiro.
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
                  className="flex flex-col items-start justify-between gap-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-700 md:flex-row md:items-center"
                >
                  {/* Informações Principais do Banner */}
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center">
                    {/* Posição e Botões de Reordenação Rápida do lado esquerdo (Soltos sem quadrado nem borda) */}
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="pr-1 font-mono text-xs font-bold text-zinc-400">
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
                              className="h-8 w-8 cursor-pointer border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
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
                              className="h-8 w-8 cursor-pointer border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
                            >
                              <RiArrowDownLine className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Mover para baixo</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Thumbnail / Preview com Altura Ampliada (h-28 w-52) */}
                    <div className="group relative flex h-28 w-52 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950 shadow-md">
                      {hasImage ? (
                        <img
                          src={banner.imageUrl!}
                          alt={banner.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="space-y-1 p-2 text-center">
                          <RiImageLine className="mx-auto h-7 w-7 text-zinc-600" />
                          <span className="block text-[11px] font-medium text-zinc-500">
                            Sem Imagem
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Detalhes de Texto */}
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-zinc-100">
                            {banner.title}
                          </h3>
                        </div>

                        {banner.subtitle && (
                          <p className="truncate text-xs text-zinc-400">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
                        {banner.linkUrl && (
                          <span className="max-w-64 truncate">
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
                  <div className="flex shrink-0 items-center gap-1.5 self-end md:self-center">
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
                          className={`h-8 w-8 cursor-pointer border-zinc-700 ${
                            banner.isActive
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
                          className="h-8 w-8 cursor-pointer border-zinc-700 text-zinc-300 hover:bg-zinc-800"
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
                              className="h-8 w-8 cursor-pointer border-zinc-700 text-zinc-400 hover:bg-red-950/30 hover:text-red-400"
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
                            className="cursor-pointer bg-red-600 text-white hover:bg-red-500"
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
        <DialogContent className="w-full border-zinc-800 bg-zinc-900 text-zinc-100 sm:max-w-2xl">
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
                    className="mt-1 border-zinc-700 bg-zinc-800/60 text-zinc-100"
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
                    className="mt-1 border-zinc-700 bg-zinc-800/60 text-zinc-100"
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
                className="cursor-pointer gap-2 bg-emerald-600 text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
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
        <DialogContent className="max-h-[90vh] w-full overflow-x-hidden overflow-y-auto border-zinc-800 bg-zinc-900 text-zinc-100 sm:max-w-2xl">
          <form onSubmit={handleEditSubmit} className="overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">
                Editar Banner: {editingBanner?.title}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Altere as informações do banner ou atualize a imagem vinculada.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 overflow-hidden py-4">
              {/* Título & Subtítulo */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    className="mt-1 border-zinc-700 bg-zinc-800/60 text-zinc-100"
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
                    className="mt-1 border-zinc-700 bg-zinc-800/60 text-zinc-100"
                  />
                </div>
              </div>

              {/* Área da Imagem com Card Clean e Espaçoso */}
              <div className="space-y-2 overflow-hidden">
                <label className="text-xs font-semibold text-zinc-300">
                  Imagem do Banner
                </label>

                <div className="space-y-2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
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
                    className="group relative flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-zinc-700/60 bg-zinc-900 shadow-inner"
                  >
                    {localPreviewUrl || editForm.imageUrl ? (
                      <>
                        <img
                          src={localPreviewUrl ?? editForm.imageUrl!}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        {/* Overlay no Hover: Clique para trocar a imagem */}
                        <div className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center space-y-1.5 bg-black/65 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <RiImageAddLine className="h-6 w-6 text-white" />
                          <span className="text-xs font-semibold text-white">
                            Clique para trocar a imagem
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center space-y-2 p-8 text-center transition-colors group-hover:bg-zinc-800/40">
                        <RiImageAddLine className="h-8 w-8 text-zinc-400 transition-colors group-hover:text-emerald-400" />
                        <p className="text-xs font-semibold text-zinc-300 transition-colors group-hover:text-white">
                          Clique para selecionar uma imagem
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Formatos aceitos: JPG, PNG, WebP ou GIF (máx. 5 MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Rodapé: Nome do arquivo como texto simples à esquerda | Botão de remover estilo link à direita */}
                  <div className="flex w-full items-center justify-between gap-4 pt-1">
                    <span
                      className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300"
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
                        className="h-0 p-0"
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

                <p className="text-xs leading-relaxed font-normal text-zinc-500">
                  Formatos aceitos: JPG, PNG, WebP ou GIF (máx. 5 MB).
                </p>
              </div>

              {/* Link URL & Botão CTA */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    className="mt-1 border-zinc-700 bg-zinc-800/60 text-zinc-100"
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
                    className="mt-1 border-zinc-700 bg-zinc-800/60 text-zinc-100"
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
                  className="cursor-pointer border-zinc-600 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                />
                <label
                  htmlFor="edit-banner-active"
                  className="cursor-pointer text-sm font-normal text-zinc-300"
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
                className="cursor-pointer gap-2 bg-emerald-600 text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
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
