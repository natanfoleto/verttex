"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { RiArrowLeftLine, RiMailLine } from "react-icons/ri";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { apiClient } from "../../../lib/api-client";

const forgotSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    try {
      setIsLoading(true);
      await apiClient("/auth/users/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
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
              Recuperar Senha
            </h1>
            <p className="text-xs text-zinc-400">
              Informe seu e-mail cadastrado para receber as instruções
            </p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="space-y-6 text-center">
            <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-4 text-xs font-medium text-emerald-300 backdrop-blur-sm">
              Se o e-mail informado estiver cadastrado em nosso sistema,
              enviamos as instruções de redefinição de senha.
            </div>
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300 hover:underline"
            >
              <RiArrowLeftLine className="h-4 w-4" />
              <span>Voltar para o Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold tracking-wider text-zinc-300 uppercase"
              >
                E-mail
              </label>
              <div className="relative">
                <RiMailLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="seu.email@verttexloja.com.br"
                  className="pl-10 h-11 rounded-2xl"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs font-medium text-rose-400">
                  {errors.email.message}
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
                <span>Enviar Instruções</span>
              )}
            </Button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
              >
                <RiArrowLeftLine className="h-4 w-4" />
                <span>Voltar ao login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
