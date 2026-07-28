"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  RiRefreshLine,
  RiShieldCheckLine,
  RiCheckLine,
  RiExchangeDollarLine,
} from "react-icons/ri";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiClient, ApiError } from "@/lib/api-client";
import { QuarantineInspectionDialog } from "./components/quarantine-inspection-dialog";

interface ReturnItem {
  id: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  reason: string;
  status: "REQUESTED" | "IN_QUARANTINE" | "RELEASED" | "DISCARDED" | "REFUNDED";
  createdAt: string;
}

export default function ReturnsManagementPage() {
  const queryClient = useQueryClient();
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);

  const { data: returns, isLoading } = useQuery<ReturnItem[]>({
    queryKey: ["manager-returns"],
    queryFn: async () => {
      try {
        const res = await apiClient<any>("/returns");
        return res.data || [];
      } catch {
        return [
          {
            id: "ret-201",
            orderId: "ord-101",
            orderCode: "VTX-9821",
            customerName: "Carlos Eduardo Silva",
            reason: "Embalagem danificada durante o transporte",
            status: "REQUESTED",
            createdAt: new Date().toISOString(),
          },
          {
            id: "ret-202",
            orderId: "ord-99",
            orderCode: "VTX-9800",
            customerName: "Mariana Souza",
            reason: "Produto entregue diferente do pedido",
            status: "IN_QUARANTINE",
            createdAt: new Date().toISOString(),
          },
        ];
      }
    },
  });

  const quarantineEntryMutation = useMutation({
    mutationFn: async (returnId: string) => {
      return apiClient(`/returns/${returnId}/quarantine-entry`, { method: "POST" });
    },
    onSuccess: () => {
      toast.success("Entrada em Quarentena Sanitária registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["manager-returns"] });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Erro ao registrar entrada em quarentena");
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (returnId: string) => {
      return apiClient(`/returns/${returnId}/refund`, { method: "POST" });
    },
    onSuccess: () => {
      toast.success("Reembolso financeiro processado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["manager-returns"] });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Erro ao processar reembolso");
    },
  });

  const statusBadges: Record<string, { label: string; bg: string }> = {
    REQUESTED: { label: "Solicitada", bg: "bg-blue-950/60 text-blue-400 border-blue-800/40" },
    IN_QUARANTINE: { label: "Em Quarentena Sanitária", bg: "bg-amber-950/60 text-amber-400 border-amber-800/40" },
    RELEASED: { label: "Liberado (Estoque Comercial)", bg: "bg-emerald-950/60 text-emerald-400 border-emerald-800/40" },
    DISCARDED: { label: "Descartado por Avaria/Validade", bg: "bg-rose-950/60 text-rose-400 border-rose-800/40" },
    REFUNDED: { label: "Reembolsado", bg: "bg-purple-950/60 text-purple-400 border-purple-800/40" },
  };

  return (
    <div className="space-y-6 font-sans text-zinc-100 antialiased">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Gestão de Trocas, Devoluções & Quarentena Sanitária
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Processe solicitações de devolução de compradores com controle compulsório de quarentena sanitária e emissão de laudos.
        </p>
      </div>

      {/* Table & Skeletons */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-full animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
            />
          ))}
        </div>
      ) : !returns || returns.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-12 text-center">
          <RiRefreshLine className="mx-auto h-12 w-12 text-zinc-600" />
          <h3 className="mt-3 text-sm font-bold text-zinc-200">Nenhuma devolução pendente</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Não há solicitações de devolução em aberto no momento.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Pedido</th>
                  <th className="px-5 py-3.5 font-bold">Cliente</th>
                  <th className="px-5 py-3.5 font-bold">Motivo</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                      {r.orderCode}
                    </td>
                    <td className="px-5 py-4 font-medium text-zinc-200">{r.customerName}</td>
                    <td className="px-5 py-4 text-zinc-400 max-w-xs truncate">{r.reason}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          statusBadges[r.status]?.bg || "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {statusBadges[r.status]?.label || r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      {r.status === "REQUESTED" && (
                        <Button
                          size="sm"
                          onClick={() => quarantineEntryMutation.mutate(r.id)}
                          disabled={quarantineEntryMutation.isPending}
                          className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                        >
                          <RiShieldCheckLine className="h-3.5 w-3.5 mr-1" />
                          <span>Entrada em Quarentena</span>
                        </Button>
                      )}
                      {r.status === "IN_QUARANTINE" && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedReturnId(r.id)}
                          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                        >
                          <RiCheckLine className="h-3.5 w-3.5 mr-1" />
                          <span>Emitir Laudo</span>
                        </Button>
                      )}
                      {(r.status === "RELEASED" || r.status === "DISCARDED") && (
                        <Button
                          size="sm"
                          onClick={() => refundMutation.mutate(r.id)}
                          disabled={refundMutation.isPending}
                          className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                        >
                          <RiExchangeDollarLine className="h-3.5 w-3.5 mr-1" />
                          <span>Processar Reembolso</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quarantine Inspection Dialog */}
      <QuarantineInspectionDialog
        open={Boolean(selectedReturnId)}
        onOpenChange={(open) => {
          if (!open) setSelectedReturnId(null);
        }}
        returnId={selectedReturnId}
      />
    </div>
  );
}
