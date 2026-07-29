"use client";

import { useQuery } from "@tanstack/react-query";
import {
  RiAlertLine,
  RiHistoryLine,
  RiShoppingBag3Line,
  RiStackLine,
  RiTimeLine,
} from "react-icons/ri";

import { apiClient } from "@/lib/api-client";
import { storeQueryKeys } from "@/lib/query-keys";

interface StoreSummaryData {
  storeId: string;
  metrics: {
    totalProducts: number;
    activeProducts: number;
    totalVariations: number;
    totalOrders: number;
    pendingOrders: number;
    totalPhysicalStock: number;
    totalReservedStock: number;
    availableStock: number;
    lowStockItems: number;
    expiringLotsCount: number;
    expiredLotsCount: number;
    membersCount: number;
    reservationsCount: number;
    lotsCount: number;
  };
  recentMovements: Array<{
    id: string;
    type: string;
    quantity: number;
    reason?: string | null;
    createdAt: string;
    variation?: {
      sku: string;
      product?: { name: string };
    };
  }>;
}

export function StoreOverviewTab({ storeId }: { storeId: string }) {
  const { data, isLoading, isError } = useQuery<StoreSummaryData>({
    queryKey: storeQueryKeys.summary(storeId),
    queryFn: async () => {
      const res = await apiClient<{ data: StoreSummaryData }>(
        `/stores/${storeId}/summary`,
      );
      return (res as any)?.data || res;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800"
            />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-6 text-center text-xs text-rose-400">
        Não foi possível carregar o resumo da loja. Tente novamente mais tarde.
      </div>
    );
  }

  const { metrics, recentMovements } = data;

  return (
    <div className="space-y-6">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs transition-all hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">
              Produtos & SKUs
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-emerald-400">
              <RiShoppingBag3Line className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-zinc-100">
              {metrics.totalProducts}
            </span>
            <span className="ml-2 text-xs text-zinc-500 font-mono">
              ({metrics.totalVariations} variações)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {metrics.activeProducts} ativos no catálogo
          </p>
        </div>

        {/* Total Physical Stock */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs transition-all hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">
              Estoque Físico
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-blue-400">
              <RiStackLine className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-zinc-100">
              {metrics.totalPhysicalStock}
            </span>
            <span className="ml-2 text-xs text-zinc-400 font-medium">
              unidades
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-400 font-medium">
            {metrics.availableStock} disponíveis ({metrics.totalReservedStock}{" "}
            reservados)
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs transition-all hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">
              Alertas de Estoque
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-amber-400">
              <RiAlertLine className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl font-bold ${
                metrics.lowStockItems > 0 ? "text-amber-400" : "text-zinc-100"
              }`}
            >
              {metrics.lowStockItems}
            </span>
            <span className="ml-2 text-xs text-zinc-500">itens críticos</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            Estoque ≤ 5 unidades físicas
          </p>
        </div>

        {/* Health / Expiring Lots */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs transition-all hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">
              Lotes & Validade FEFO
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-purple-400">
              <RiTimeLine className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl font-bold ${
                metrics.expiredLotsCount > 0
                  ? "text-rose-400"
                  : metrics.expiringLotsCount > 0
                    ? "text-amber-400"
                    : "text-zinc-100"
              }`}
            >
              {metrics.expiringLotsCount}
            </span>
            <span className="ml-2 text-xs text-zinc-500">
              vencendo (30d)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {metrics.expiredLotsCount > 0 ? (
              <span className="text-rose-400 font-bold">
                ⚠️ {metrics.expiredLotsCount} lotes vencidos
              </span>
            ) : (
              `${metrics.lotsCount} lotes gerenciados`
            )}
          </p>
        </div>
      </div>

      {/* Secondary Grid: Recent Activity & Store Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Movements Feed */}
        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RiHistoryLine className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-zinc-200">
                Últimas Movimentações de Estoque
              </h3>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              Tempo Real
            </span>
          </div>

          {recentMovements && recentMovements.length > 0 ? (
            <div className="space-y-3 pt-2">
              {recentMovements.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950 p-3.5 text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg font-bold ${
                        mov.quantity > 0
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                          : "bg-rose-950 text-rose-400 border border-rose-800/60"
                      }`}
                    >
                      {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                    </span>
                    <div>
                      <p className="font-semibold text-zinc-200">
                        {mov.variation?.product?.name || "Produto"}{" "}
                        <span className="font-mono text-zinc-500 font-normal">
                          ({mov.variation?.sku})
                        </span>
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Tipo: <span className="text-zinc-300">{mov.type}</span>{" "}
                        {mov.reason && `• ${mov.reason}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {new Date(mov.createdAt).toLocaleDateString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="pt-4 text-center text-xs text-zinc-500">
              Nenhuma movimentação registrada recentemente nesta loja.
            </p>
          )}
        </div>

        {/* Quick Operations Summary */}
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="text-base font-semibold text-zinc-200">
            Resumo Operacional
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950 p-3">
              <span className="text-zinc-400">Pedidos no Período</span>
              <span className="font-bold text-zinc-100">
                {metrics.totalOrders}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950 p-3">
              <span className="text-zinc-400">Pedidos Pendentes</span>
              <span className="font-bold text-amber-400">
                {metrics.pendingOrders}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950 p-3">
              <span className="text-zinc-400">Reservas de Checkout</span>
              <span className="font-bold text-blue-400">
                {metrics.reservationsCount} ativas
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950 p-3">
              <span className="text-zinc-400">Membros da Equipe</span>
              <span className="font-bold text-emerald-400">
                {metrics.membersCount} gestores
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
