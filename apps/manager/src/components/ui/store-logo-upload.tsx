"use client";

import { useRef, useState } from "react";
import {
  RiCameraLine,
  RiDeleteBinLine,
  RiImageAddLine,
  RiLoader4Line,
  RiStore2Line,
} from "react-icons/ri";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

interface StoreLogoUploadProps {
  storeId?: string;
  storeName: string;
  currentLogoUrl?: string | null;
  onLogoChange?: (newUrl: string | null) => void;
  disabled?: boolean;
}

export function StoreLogoUpload({
  storeId,
  storeName,
  currentLogoUrl,
  onLogoChange,
  disabled = false,
}: StoreLogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayUrl = previewUrl || logoUrl;
  const initials = storeName
    ? storeName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "VT";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5 MB.");
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato não suportado. Utilize JPEG, PNG ou WebP.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    if (storeId) {
      // Direct Upload to backend API via apiClient (handles cookies & auto-refresh)
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const data = await apiClient<{ logoUrl: string }>(
          `/stores/${storeId}/logo`,
          {
            method: "POST",
            body: formData,
          },
        );

        const newUrl = data.logoUrl;
        setLogoUrl(newUrl);
        setPreviewUrl(null);
        onLogoChange?.(newUrl);
        toast.success("Foto da loja atualizada com sucesso!");
      } catch (err: any) {
        toast.error(err.message || "Falha ao enviar a foto da loja");
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    } else {
      // Mode before store creation: keep previewUrl and pass notification
      onLogoChange?.(localPreview);
    }
  };

  const handleRemove = async () => {
    if (!storeId) {
      setPreviewUrl(null);
      setLogoUrl(null);
      onLogoChange?.(null);
      setIsDeleteDialogOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      await apiClient(`/stores/${storeId}/logo`, {
        method: "DELETE",
      });

      setLogoUrl(null);
      setPreviewUrl(null);
      onLogoChange?.(null);
      toast.success("Foto da loja removida com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Falha ao remover a foto");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/40">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading || isDeleting}
      />

      {/* Avatar Container */}
      <div className="relative group flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-zinc-800 bg-zinc-900 shadow-md">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={`Foto de ${storeName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-400">
            <RiStore2Line className="h-8 w-8 text-emerald-400 mb-1" />
            <span className="text-xs font-mono font-bold text-zinc-300">
              {initials}
            </span>
          </div>
        )}

        {/* Loading Overlay */}
        {(isUploading || isDeleting) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-xs">
            <RiLoader4Line className="h-7 w-7 animate-spin text-emerald-400" />
          </div>
        )}
      </div>

      {/* Info & Action Buttons */}
      <div className="flex flex-1 flex-col justify-center space-y-2 text-center sm:text-left">
        <div>
          <h4 className="text-sm font-semibold text-zinc-200">
            Foto de Perfil da Loja
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Formatos aceitos: JPEG, PNG ou WebP (máx. 5 MB).
          </p>
        </div>

        <div className="flex items-center justify-center sm:justify-start space-x-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading || isDeleting}
            className="cursor-pointer text-xs h-8 px-3 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
          >
            {displayUrl ? (
              <>
                <RiCameraLine className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                <span>Trocar Foto</span>
              </>
            ) : (
              <>
                <RiImageAddLine className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                <span>Adicionar Foto</span>
              </>
            )}
          </Button>

          {displayUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={disabled || isUploading || isDeleting}
              className="cursor-pointer text-xs h-8 px-3 border-rose-900/40 bg-rose-950/20 text-rose-400 hover:bg-rose-950/60 hover:text-rose-300"
            >
              <RiDeleteBinLine className="h-3.5 w-3.5 mr-1" />
              <span>Remover</span>
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Removal */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-zinc-950 text-zinc-100 border-zinc-800 sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Remover foto de perfil da loja?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-400">
              A foto da loja {storeName} será excluída do Cloudflare R2 e a
              loja passará a exibir o placeholder padrão com as iniciais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
            >
              {isDeleting ? "Removendo..." : "Confirmar Remoção"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
