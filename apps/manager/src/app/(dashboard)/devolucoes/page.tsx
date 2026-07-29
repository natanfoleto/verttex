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
import { TableWrapper } from "@/components/ui/table-wrapper";

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
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data: returnsRes, isLoading } = useQuery<{
    data: ReturnItem[];
    meta: { page: number; perPage: number; total: number; totalPages: number };
  }>({
    queryKey: ["manager-returns", page, perPage],
    queryFn: async () => {
      try {
        const res = await apiClient<any>(`/returns?page=${page}&limit=${perPage}`);
        if (res && res.meta) {
          return {
            data: res.data || [],
            meta: res.meta,
          };
        }
        const dataArr = Array.isArray(res) ? res : res?.data ?? [];
        return {
          data: dataArr,
          meta: {
            page,
            perPage,
            total: dataArr.length,
            totalPages: Math.ceil(dataArr.length / perPage) || 1,
          },
        };
      } catch {
        return {
          data: [],
          meta: { page: 1, perPage: 10, total: 0, totalPages: 1 },
        };
      }
    },
  });

  const returnsList = returnsRes?.data || [];

  const quarantineEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/returns/${id}/quarantine`, { method: "POST" });
    },
    onSuccess: () => {
      toast.success("Item colocado em Quarentena Sanitária!");
      queryClient.invalidateQueries({ queryKey: ["manager-returns"] });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Erro ao dar entrada em quarentena");
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/returns/${id}/refund`, { method: "POST" });
    },
    onSuccess: () => {
      toast.success("Reembolso ao comprador processado com sucesso!");
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
      <TableWrapper
        title="Gestão de Trocas, Devoluções & Quarentena Sanitária"
        description="Processe solicitações de devolução de compradores com controle compulsório de quarentena sanitária e emissão de laudos."
        isLoading={isLoading}
        isEmpty={!isLoading && returnsList.length === 0}
        emptyTitle="Nenhuma devolução pendente"
        emptyDescription="Não há solicitações de devolução em aberto no momento."
        emptyIcon={<RiRefreshLine className="h-6 w-6 text-zinc-400" />}
        meta={returnsRes?.meta}
        onPageChange={setPage}
        perPageValue={perPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage);
          setPage(1);
        }}
      >
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
            {returnsList.map((r) => (
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
      </TableWrapper>

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
