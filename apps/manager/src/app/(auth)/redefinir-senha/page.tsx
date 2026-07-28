"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { RiLockPasswordLine } from "react-icons/ri";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { apiClient, ApiError } from "../../../lib/api-client";

const resetSchema = z
  .object({
    token: z.string().min(1, "O token é obrigatório"),
    newPassword: z
      .string()
      .min(6, "A nova senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetFormData) => {
    try {
      setServerError(null);
      setIsLoading(true);
      await apiClient("/auth/users/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: data.token,
          newPassword: data.newPassword,
        }),
      });
      router.push("/login");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Token inválido ou expirado.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 font-sans text-zinc-100 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),rgba(9,9,11,0))]" />

      <div className="relative w-full max-w-md space-y-8 rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-linear-to-br from-emerald-500 to-emerald-700 text-2xl font-black text-white shadow-lg shadow-emerald-950/60 ring-4 ring-emerald-950/50">
            V
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Redefinir Senha
            </h1>
            <p className="text-xs text-zinc-400">
              Digite sua nova senha para redefinir o acesso
            </p>
          </div>
        </div>

        {serverError && (
          <div className="flex items-center space-x-2.5 rounded-2xl border border-rose-800/60 bg-rose-950/40 p-4 text-xs font-medium text-rose-300 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input type="hidden" {...register("token")} />

          <div className="space-y-1.5">
            <label
              htmlFor="newPassword"
              className="block text-[11px] font-semibold tracking-wider text-zinc-300 uppercase"
            >
              Nova Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                {...register("newPassword")}
                id="newPassword"
                type="password"
                placeholder="••••••••"
                className="pl-10 h-11 rounded-2xl"
              />
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs font-medium text-rose-400">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="block text-[11px] font-semibold tracking-wider text-zinc-300 uppercase"
            >
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                {...register("confirmPassword")}
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="pl-10 h-11 rounded-2xl"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs font-medium text-rose-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-2xl text-sm"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span>Salvar Nova Senha</span>
            )}
          </Button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Voltar ao login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
