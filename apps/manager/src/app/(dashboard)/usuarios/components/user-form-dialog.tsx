"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

import { apiClient, ApiError } from "../../../../lib/api-client";
import { roleQueryKeys, invalidateUsers } from "../../../../lib/query-keys";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  status: string;
  role?: {
    id: string;
    name: string;
  } | null;
  roleId: string;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: UserItem | null;
}

export function UserFormDialog({
  open,
  onOpenChange,
  userToEdit,
}: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(userToEdit);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState("active");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: roles } = useQuery({
    queryKey: roleQueryKeys.dropdown(),
    queryFn: async () => {
      const res = await apiClient("/roles");
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    enabled: open,
    staleTime: 0, // Always refetch when opened so new roles appear immediately
  });

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setPassword("");
      setRoleId(userToEdit.role?.id || "");
      setStatus(userToEdit.status);
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRoleId(roles && roles.length > 0 ? roles[0].id : "");
      setStatus("active");
    }
    setErrorMessage(null);
  }, [userToEdit, open, roles]);

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      if (isEditing && userToEdit) {
        return apiClient(`/users/${userToEdit.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name,
            email,
            roleId,
            status,
          }),
        });
      } else {
        return apiClient("/users", {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password,
            roleId,
          }),
        });
      }
    },
    onSuccess: async () => {
      await invalidateUsers(queryClient, userToEdit?.id);
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Erro ao salvar usuário. Tente novamente.");
      }
    },
  });

  const isDirty = isEditing && userToEdit
    ? name !== userToEdit.name ||
      email !== userToEdit.email ||
      roleId !== (userToEdit.role?.id || "") ||
      status !== userToEdit.status
    : name.trim().length > 0 && email.trim().length > 0 && password.trim().length >= 6;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg flex flex-col overflow-hidden bg-zinc-950 p-0 text-zinc-100 sm:rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="text-xl font-bold text-zinc-100">
            {isEditing ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            {isEditing
              ? "Atualize os dados e o perfil de acesso do usuário."
              : "Cadastre um novo usuário para acesso à plataforma."}
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
                htmlFor="user-name"
                className="text-xs font-semibold text-zinc-300 block mb-1 whitespace-nowrap"
              >
                Nome Completo <span className="text-rose-400">*</span>
              </label>
              <Input
                id="user-name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João da Silva"
              />
            </div>

            <div>
              <label
                htmlFor="user-email"
                className="text-xs font-semibold text-zinc-300 block mb-1 whitespace-nowrap"
              >
                E-mail <span className="text-rose-400">*</span>
              </label>
              <Input
                id="user-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@exemplo.com"
              />
            </div>

            {!isEditing && (
              <div>
                <label
                  htmlFor="user-password"
                  className="text-xs font-semibold text-zinc-300 block mb-1 whitespace-nowrap"
                >
                  Senha Inicial <span className="text-rose-400">*</span>
                </label>
                <Input
                  id="user-password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="user-role"
                className="text-xs font-semibold text-zinc-300 block mb-1 whitespace-nowrap"
              >
                Perfil / Cargo <span className="text-rose-400">*</span>
              </label>
              <NativeSelect
                id="user-role"
                name="roleId"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                {roles && roles.length > 0 ? (
                  roles.map((r: { id: string; name: string }) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))
                ) : (
                  <option value="">Carregando cargos...</option>
                )}
              </NativeSelect>
            </div>

            {isEditing && (
              <div>
                <label
                  htmlFor="user-status"
                  className="text-xs font-semibold text-zinc-300 block mb-1 whitespace-nowrap"
                >
                  Status
                </label>
                <NativeSelect
                  id="user-status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
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
            <Button type="submit" disabled={!isDirty || mutation.isPending}>
              <RiCheckLine className="h-4 w-4 mr-2" />
              <span>
                {mutation.isPending
                  ? "Salvando..."
                  : isEditing
                    ? "Salvar Alterações"
                    : "Criar Usuário"}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
