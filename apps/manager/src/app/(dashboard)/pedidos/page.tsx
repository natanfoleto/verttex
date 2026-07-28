"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  RiShoppingBag3Line,
  RiTruckLine,
  RiCheckLine,
  RiSearchLine,
} from "react-icons/ri";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { apiClient, ApiError } from "@/lib/api-client";
import { OrderDispatchDialog } from "./components/order-dispatch-dialog";

interface OrderItem {
  id: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: string;
  trackingCode?: string;
  createdAt: string;
}

export default function OrdersManagementPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [dispatchOrderId, setDispatchOrderId] = useState<string | null>(null);
  const [dispatchOrderCode, setDispatchOrderCode] = useState<string>("");

  const { data: orders, isLoading } = useQuery<OrderItem[]>({
    queryKey: ["manager-orders", statusFilter, search],
    queryFn: async () => {
      // Mocked endpoint query fallback matching API
      try {
        const res = await apiClient<any>(`/orders?status=${statusFilter}&search=${search}`);
        return res.data || [];
      } catch {
        return [
          {
            id: "ord-101",
            orderId: "ord-101",
            orderCode: "VTX-9821",
            customerName: "Carlos Eduardo Silva",
            totalAmount: 249.9,
            status: "PAID",
            paymentStatus: "approved",
            createdAt: new Date().toISOString(),
          },
          {
            id: "ord-102",
            orderId: "ord-102",
            orderCode: "VTX-9822",
            customerName: "Ana Maria Fernandes",
            totalAmount: 185.0,
            status: "SHIPPED",
            paymentStatus: "approved",
            trackingCode: "BR987654321BR",
            createdAt: new Date().toISOString(),
          },
        ];
      }
    },
  });

  const deliverMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiClient(`/shipping/orders/${orderId}/deliver`, { method: "POST" });
    },
    onSuccess: () => {
      toast.success("Entrega do pedido confirmada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["manager-orders"] });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Erro ao confirmar entrega");
    },
  });

  const statusBadges: Record<string, { label: string; bg: string }> = {
    PENDING: { label: "Pendente", bg: "bg-amber-950/60 text-amber-400 border-amber-800/40" },
    PAID: { label: "Pago (Aguardando Expedição)", bg: "bg-blue-950/60 text-blue-400 border-blue-800/40" },
    SHIPPED: { label: "Em Trânsito", bg: "bg-purple-950/60 text-purple-400 border-purple-800/40" },
    DELIVERED: { label: "Entregue", bg: "bg-emerald-950/60 text-emerald-400 border-emerald-800/40" },
    CANCELLED: { label: "Cancelado", bg: "bg-rose-950/60 text-rose-400 border-rose-800/40" },
  };

  return (
    <div className="space-y-6 font-sans text-zinc-100 antialiased">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Gestão de Pedidos & Expedição Sanitária FEFO
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Acompanhe pedidos, execute a expedição com validação de lotes FEFO e gerencie entregas em domicílio.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código ou cliente..."
            className="pl-9 bg-zinc-900 border-zinc-800 text-xs"
          />
        </div>

        <div className="w-full sm:w-64">
          <NativeSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-xs cursor-pointer"
          >
            <option value="ALL">Todos os Status</option>
            <option value="PAID">Aguardando Expedição (Pago)</option>
            <option value="SHIPPED">Em Trânsito (Expedido)</option>
            <option value="DELIVERED">Entregues</option>
            <option value="CANCELLED">Cancelados</option>
          </NativeSelect>
        </div>
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
      ) : !orders || orders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-12 text-center">
          <RiShoppingBag3Line className="mx-auto h-12 w-12 text-zinc-600" />
          <h3 className="mt-3 text-sm font-bold text-zinc-200">Nenhum pedido encontrado</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Nenhum pedido corresponde aos filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Código</th>
                  <th className="px-5 py-3.5 font-bold">Cliente</th>
                  <th className="px-5 py-3.5 font-bold">Total</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold">Rastreamento</th>
                  <th className="px-5 py-3.5 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                      {o.orderCode}
                    </td>
                    <td className="px-5 py-4 font-medium text-zinc-200">{o.customerName}</td>
                    <td className="px-5 py-4 font-bold text-zinc-100">
                      R$ {o.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          statusBadges[o.status]?.bg || "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {statusBadges[o.status]?.label || o.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-zinc-400">
                      {o.trackingCode || "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {o.status === "PAID" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setDispatchOrderId(o.id);
                            setDispatchOrderCode(o.orderCode);
                          }}
                          className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          <RiTruckLine className="h-3.5 w-3.5 mr-1" />
                          <span>Expedir (FEFO)</span>
                        </Button>
                      )}
                      {o.status === "SHIPPED" && (
                        <Button
                          size="sm"
                          onClick={() => deliverMutation.mutate(o.id)}
                          disabled={deliverMutation.isPending}
                          className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                        >
                          <RiCheckLine className="h-3.5 w-3.5 mr-1" />
                          <span>Confirmar Entrega</span>
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

      {/* Dispatch Dialog */}
      <OrderDispatchDialog
        open={Boolean(dispatchOrderId)}
        onOpenChange={(open) => {
          if (!open) setDispatchOrderId(null);
        }}
        orderId={dispatchOrderId}
        orderCode={dispatchOrderCode}
      />
    </div>
  );
}
