'use client'

import { useRef, useState } from 'react'
import {
  RiCameraLine,
  RiDeleteBinLine,
  RiLoader4Line,
  RiStore2Line,
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
import { apiClient } from '@/lib/api-client'
import { useErrorDialog } from '@/providers/error-dialog-provider'

import { Input } from './input'

interface StoreLogoUploadProps {
  storeId?: string
  storeName: string
  currentLogoUrl?: string | null
  onLogoChange?: (newUrl: string | null) => void
  disabled?: boolean
}

export function StoreLogoUpload({
  storeId,
  storeName,
  currentLogoUrl,
  onLogoChange,
  disabled = false,
}: StoreLogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const displayUrl = previewUrl || logoUrl
  const initials = storeName
    ? storeName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'VT'

  const { showError } = useErrorDialog()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('O arquivo deve ter no máximo 5 MB.')
      return
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      showError('Formato não suportado. Utilize JPEG, PNG ou WebP.')
      return
    }

    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    if (storeId) {
      // Direct Upload to backend API via apiClient (handles cookies & auto-refresh)
      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const data = await apiClient<{ logoUrl: string }>(
          `/stores/${storeId}/logo`,
          {
            method: 'POST',
            body: formData,
          },
        )

        const newUrl = data.logoUrl
        setLogoUrl(newUrl)
        setPreviewUrl(null)
        onLogoChange?.(newUrl)
        toast.success('Foto da loja atualizada com sucesso!')
      } catch (err: unknown) {
        showError(err, 'Atenção: Não foi possível enviar a foto da loja')
        setPreviewUrl(null)
      } finally {
        setIsUploading(false)
      }
    } else {
      // Mode before store creation: keep previewUrl and pass notification
      onLogoChange?.(localPreview)
    }
  }

  const handleRemove = async () => {
    if (!storeId) {
      setPreviewUrl(null)
      setLogoUrl(null)
      onLogoChange?.(null)
      setIsDeleteDialogOpen(false)
      return
    }

    setIsDeleting(true)
    try {
      await apiClient(`/stores/${storeId}/logo`, {
        method: 'DELETE',
      })

      setLogoUrl(null)
      setPreviewUrl(null)
      onLogoChange?.(null)
      toast.success('Foto da loja removida com sucesso!')
    } catch (err: unknown) {
      showError(err, 'Atenção: Não foi possível remover a foto da loja')
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-1.5">
      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading || isDeleting}
      />

      {/* Label styled like Status Atual */}
      <span className="block text-xs text-zinc-500">
        Foto de Perfil da Loja
      </span>

      {/* Avatar Container with Hover Overlay & Direct Click */}
      <div className="flex items-center space-x-4 pt-0.5">
        <div
          onClick={() => {
            if (!disabled && !isUploading && !isDeleting) {
              fileInputRef.current?.click()
            }
          }}
          className="group relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xs transition-all hover:border-emerald-500/60 hover:shadow-md"
          title="Clique para alterar a foto da loja"
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={`Foto de ${storeName}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-500 transition-colors group-hover:text-emerald-400">
              <RiStore2Line className="mb-0.5 h-7 w-7" />
              <span className="font-mono text-[11px] font-bold text-zinc-400">
                {initials}
              </span>
            </div>
          )}

          {/* Hover Edit Overlay */}
          {!isUploading && !isDeleting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 text-white opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100">
              <RiCameraLine className="mb-0.5 h-5 w-5 text-emerald-400" />
              <span className="text-[10px] font-medium text-zinc-200">
                Alterar
              </span>
            </div>
          )}

          {/* Loading Overlay */}
          {(isUploading || isDeleting) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/75 backdrop-blur-xs">
              <RiLoader4Line className="h-6 w-6 animate-spin text-emerald-400" />
            </div>
          )}
        </div>

        {/* Action Button: Only Remove option if photo exists */}
        {displayUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={disabled || isUploading || isDeleting}
            className="h-8 cursor-pointer border border-rose-900/30 px-2.5 text-xs text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
          >
            <RiDeleteBinLine className="mr-1 h-3.5 w-3.5" />
            <span>Remover foto</span>
          </Button>
        )}
      </div>

      {/* Confirmation Modal for Removal */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Remover foto de perfil da loja?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-400">
              A foto da loja {storeName} será excluída do Cloudflare R2 e a loja
              passará a exibir o placeholder padrão com as iniciais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="cursor-pointer border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isDeleting}
              className="cursor-pointer bg-rose-600 font-semibold text-white hover:bg-rose-700"
            >
              {isDeleting ? 'Removendo...' : 'Confirmar Remoção'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
