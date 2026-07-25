"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { RiCheckLine } from "react-icons/ri";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

import { apiClient, ApiError } from "../../../../lib/api-client";
import { invalidateStores } from "../../../../lib/query-keys";
import { sanitizeSlug } from "../../../../lib/slug";

export interface StoreItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  _count?: { users: number };
}

interface StoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeToEdit?: StoreItem | null;
}

export function StoreFormDialog({
  open,
  onOpenChange,
  storeToEdit,
}: StoreFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(storeToEdit);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugUserModified, setIsSlugUserModified] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMessage(null);
      if (storeToEdit) {
        setName(storeToEdit.name);
        setSlug(storeToEdit.slug);
        setIsSlugUserModified(true);
        setDescription(storeToEdit.description || "");
        setStatus(storeToEdit.status);
      } else {
        setName("");
        setSlug("");
        setIsSlugUserModified(false);
        setDescription("");
        setStatus("draft");
      }
    }
  }, [open, storeToEdit]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isSlugUserModified && !isEditing) {
      setSlug(sanitizeSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setIsSlugUserModified(true);
    setSlug(sanitizeSlug(value));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      if (isEditing && storeToEdit) {
        return apiClient(`/stores/${storeToEdit.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name,
            description: description || null,
            status,
          }),
        });
      }

      return apiClient("/stores", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
        }),
      });
    },
    onSuccess: () => {
      invalidateStores(queryClient);
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Erro ao salvar loja. Tente novamente.");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg flex flex-col overflow-hidden bg-zinc-950 p-0 text-zinc-100 sm:rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="text-xl font-bold text-zinc-100">
            {isEditing ? "Editar Loja Parceira" : "Nova Loja Parceira"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            {isEditing
              ? "Atualize as informações cadastrais e o status da loja."
              : "Cadastre uma nova loja de produtor ou parceiro na plataforma Verttex."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-3 pb-6 space-y-4">
            {errorMessage && (
              <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3 text-xs text-rose-300">
                {errorMessage}
              </div>
            )}

            <div>
              <label
                htmlFor="store-name"
                className="text-xs font-semibold text-zinc-300 block mb-1 whitespace-nowrap"
              >
                Nome da Loja <span className="text-rose-400">*</span>
              </label>
              <Input
                id="store-name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Queijaria Alvorada"
              />
            </div>

            {!isEditing && (
              <div>
                <label
                  htmlFor="store-slug"
                  className="text-xs font-semibold text-zinc-300 block mb-1 whitespace-nowrap"
                >
                  Slug Único (URL) <span className="text-rose-400">*</span>
                </label>
                <Input
                  id="store-slug"
                  name="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="ex: queijaria-alvorada"
                  className="font-mono"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="store-description"
                className="text-xs font-semibold text-zinc-300 block mb-1 whitespace-nowrap"
              >
                Descrição da Loja
              </label>
              <Textarea
                id="store-description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição sobre a produção artesanal..."
                rows={3}
              />
            </div>

            {isEditing && (
              <div>
                <label
                  htmlFor="store-status"
                  className="text-xs font-semibold text-zinc-300 block mb-1 whitespace-nowrap"
                >
                  Status
                </label>
                <NativeSelect
                  id="store-status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="draft">Rascunho (Draft)</option>
                  <option value="active">Ativa (Active)</option>
                  <option value="inactive">Inativa (Inactive)</option>
                  <option value="suspended">Suspensa (Suspended)</option>
                </NativeSelect>
              </div>
            )}
          </div>

          <DialogFooter className="bg-zinc-950 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <RiCheckLine className="h-4 w-4" />
              <span>
                {mutation.isPending
                  ? "Salvando..."
                  : isEditing
                    ? "Salvar Alterações"
                    : "Criar Loja"}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
