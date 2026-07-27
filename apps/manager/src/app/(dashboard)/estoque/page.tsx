"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  RiAddLine,
  RiAlertLine,
  RiArchiveLine,
  RiCheckLine,
  RiDeleteBin6Line,
  RiErrorWarningLine,
  RiLockLine,
  RiRefreshLine,
  RiStackLine,
} from "react-icons/ri";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { TableWrapper } from "@/components/ui/table-wrapper";

import { apiClient } from "../../../lib/api-client";
import { DiscardFormDialog } from "./components/discard-form-dialog";
import { ReceivingFormDialog } from "./components/receiving-form-dialog";
import { StatusFormDialog } from "./components/status-form-dialog";
import type { LotWithStockItem } from "./components/discard-form-dialog";
import type { LotItem } from "./components/status-form-dialog";

interface Store {
  id: string;
  name: string;
}

interface ExtendedLotItem extends LotItem {
  id: string;
  lotNumber: string;
  manufacturer?: string | null;
  supplier?: string | null;
  manufacturingDate?: string | null;
  expirationDate?: string | null;
  status: "available" | "quarantine" | "blocked" | "recalled";
  notes?: string | null;
  product: { id: string; name: string; slug: string };
  variation?: { id: string; sku: string } | null;
  store: { id: string; name: string };
  expirationAnalysis: {
    condition: "valid" | "warning" | "insufficient" | "expired";
    daysRemaining: number | null;
    isExpired: boolean;
  };
  stockSummary: {
    physicalQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
  };
  stockItems: Array<{
    id: string;
    locationId: string;
    physicalQuantity: number;
    reservedQuantity: number;
    location: { id: string; name: string; code: string };
  }>;
}

export default function StockAndLotsPage() {
  const queryClient = useQueryClient();

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expirationFilter, setExpirationFilter] = useState<string>("all");

  // Modal States
  const [isReceivingOpen, setIsReceivingOpen] = useState(false);
  const [statusModalLot, setStatusModalLot] = useState<LotItem | null>(null);
  const [discardModalLot, setDiscardModalLot] =
    useState<LotWithStockItem | null>(null);

  // Queries
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ["stores-dropdown"],
    queryFn: async () => {
      const res = await apiClient("/stores");
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
  });

  const { data: lotsRes, isLoading } = useQuery<{
    data: ExtendedLotItem[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>({
    queryKey: [
      "lots-list",
      page,
      limit,
      selectedStoreId,
      statusFilter,
      expirationFilter,
      search,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (selectedStoreId) params.append("storeId", selectedStoreId);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (expirationFilter !== "all")
        params.append("expirationCondition", expirationFilter);
      if (search) params.append("search", search);

      const res = await apiClient(`/lots?${params.toString()}`);
      return res;
    },
  });

  const lotsList: ExtendedLotItem[] = lotsRes?.data ?? [];

  // Metrics
  const totalPhysical = lotsList.reduce(
    (acc, l) => acc + l.stockSummary.physicalQuantity,
    0,
  );
  const totalAvailable = lotsList.reduce(
    (acc, l) => acc + l.stockSummary.availableQuantity,
    0,
  );
  const warningCount = lotsList.filter(
    (l) => l.expirationAnalysis.condition === "warning",
  ).length;
  const expiredCount = lotsList.filter(
    (l) => l.expirationAnalysis.isExpired || l.status !== "available",
  ).length;

  return (
    <div className="space-y-6 p-8 text-zinc-100">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <RiStackLine className="h-7 w-7 text-emerald-500" />
            <span>Gestão de Lotes, Validade & Estoque</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Controle por lotes, datas de vencimento, quarentena e descarte
            auditado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsReceivingOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            <RiAddLine className="mr-1.5 h-4 w-4" />
            Novo Recebimento de Lotes
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">
              Estoque Físico Total
            </span>
            <RiArchiveLine className="h-5 w-5 text-zinc-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-100 mt-2 font-mono">
            {totalPhysical.toLocaleString("pt-BR")}{" "}
            <span className="text-xs font-normal text-zinc-500">unid.</span>
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">
              Disponível Comercial (FEFO)
            </span>
            <RiCheckLine className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            {totalAvailable.toLocaleString("pt-BR")}{" "}
            <span className="text-xs font-normal text-zinc-500">unid.</span>
          </p>
        </div>

        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">
              Próximos do Vencimento
            </span>
            <RiAlertLine className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2 font-mono">
            {warningCount}{" "}
            <span className="text-xs font-normal text-zinc-500">lotes</span>
          </p>
        </div>

        <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400">
              Vencidos / Bloqueados
            </span>
            <RiErrorWarningLine className="h-5 w-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2 font-mono">
            {expiredCount}{" "}
            <span className="text-xs font-normal text-zinc-500">lotes</span>
          </p>
        </div>
      </div>

      {/* TABLE WRAPPER WITH FILTERING AND PAGINATION */}
      <TableWrapper
        title="Lotes de Produtos"
        description="Lista consolidada de lotes recebidos, saldos e condição de validade."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Buscar por lote, produto, fabricante..."
        isLoading={isLoading}
        isEmpty={!isLoading && lotsList.length === 0}
        emptyTitle="Nenhum lote encontrado"
        emptyDescription="Nenhum lote encontrado para os filtros selecionados."
        meta={
          lotsRes?.meta
            ? {
                page: lotsRes.meta.page,
                perPage: lotsRes.meta.limit,
                total: lotsRes.meta.total,
                totalPages: lotsRes.meta.totalPages,
                hasNextPage: lotsRes.meta.page < lotsRes.meta.totalPages,
                hasPreviousPage: lotsRes.meta.page > 1,
              }
            : undefined
        }
        onPageChange={setPage}
        perPageValue={limit}
        onPerPageChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        filters={
          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro de Loja */}
            <div className="w-full sm:w-44">
              <NativeSelect
                value={selectedStoreId}
                onChange={(e) => {
                  setSelectedStoreId(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-zinc-900/80 border-zinc-800 text-xs rounded-xl cursor-pointer"
              >
                <option value="">Todas as Lojas</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            {/* Filtro de Validade */}
            <div className="w-full sm:w-48">
              <NativeSelect
                value={expirationFilter}
                onChange={(e) => {
                  setExpirationFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-zinc-900/80 border-zinc-800 text-xs rounded-xl cursor-pointer"
              >
                <option value="all">Validade: Todas</option>
                <option value="valid">Válidos</option>
                <option value="warning">Próximos do Vencimento</option>
                <option value="insufficient">Prazo Insuficiente</option>
                <option value="expired">Vencidos</option>
              </NativeSelect>
            </div>

            {/* Filtro de Status Operacional */}
            <div className="w-full sm:w-44">
              <NativeSelect
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-zinc-900/80 border-zinc-800 text-xs rounded-xl cursor-pointer"
              >
                <option value="all">Status: Todos</option>
                <option value="available">Disponível</option>
                <option value="quarantine">Quarentena</option>
                <option value="blocked">Bloqueado</option>
                <option value="recalled">Recolhido (Recall)</option>
              </NativeSelect>
            </div>

            {/* Botão Atualizar */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["lots-list"] })
              }
              className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs cursor-pointer"
            >
              <RiRefreshLine className="mr-1.5 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        }
      >
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400 font-semibold border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Código do Lote</th>
                <th className="px-4 py-3">Produto / SKU</th>
                <th className="px-4 py-3">Fabricante / Fornecedor</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3">Status Operacional</th>
                <th className="px-4 py-3">Saldo Físico / FEFO</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
              {lotsList.map((lot) => {
                const exp = lot.expirationAnalysis;
                return (
                  <tr
                    key={lot.id}
                    className="hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-zinc-100">
                      {lot.lotNumber}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="block font-semibold text-zinc-100">
                        {lot.product.name}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {lot.variation?.sku || "SKU Padrão"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-400">
                      <span>{lot.manufacturer || "Não informado"}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      {lot.expirationDate ? (
                        <div>
                          <span className="block font-mono text-zinc-200">
                            {new Date(lot.expirationDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                          <span
                            className={`text-[11px] font-medium ${
                              exp.isExpired
                                ? "text-rose-400"
                                : exp.condition === "warning"
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                            }`}
                          >
                            {exp.isExpired
                              ? `Vencido há ${Math.abs(exp.daysRemaining || 0)} dias`
                              : `${exp.daysRemaining} dias restantes`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-500">Sem validade</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {lot.status === "available" && (
                        <Badge className="bg-emerald-950/80 text-emerald-400 border-emerald-800/80 text-[11px]">
                          Disponível
                        </Badge>
                      )}
                      {lot.status === "quarantine" && (
                        <Badge className="bg-amber-950/80 text-amber-400 border-amber-800/80 text-[11px]">
                          Quarentena
                        </Badge>
                      )}
                      {lot.status === "blocked" && (
                        <Badge className="bg-rose-950/80 text-rose-400 border-rose-800/80 text-[11px]">
                          Bloqueado
                        </Badge>
                      )}
                      {lot.status === "recalled" && (
                        <Badge className="bg-purple-950/80 text-purple-400 border-purple-800/80 text-[11px]">
                          Recolhido (Recall)
                        </Badge>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono">
                      <span className="block font-semibold text-zinc-100">
                        Físico: {lot.stockSummary.physicalQuantity}
                      </span>
                      <span className="text-[11px] text-emerald-400">
                        Disponível: {lot.stockSummary.availableQuantity}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatusModalLot(lot)}
                        className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] cursor-pointer"
                      >
                        <RiLockLine className="mr-1 h-3.5 w-3.5" />
                        Status
                      </Button>

                      {exp.isExpired && lot.stockSummary.physicalQuantity > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDiscardModalLot(lot)}
                          className="bg-rose-950 border border-rose-800/80 hover:bg-rose-900 text-rose-200 text-[11px] cursor-pointer"
                        >
                          <RiDeleteBin6Line className="mr-1 h-3.5 w-3.5" />
                          Descartar
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TableWrapper>

      {/* STANDALONE FORM DIALOGS */}
      <ReceivingFormDialog
        open={isReceivingOpen}
        onOpenChange={setIsReceivingOpen}
        stores={stores}
      />

      <StatusFormDialog
        lot={statusModalLot}
        open={Boolean(statusModalLot)}
        onOpenChange={(open) => {
          if (!open) setStatusModalLot(null);
        }}
      />

      <DiscardFormDialog
        lot={discardModalLot}
        open={Boolean(discardModalLot)}
        onOpenChange={(open) => {
          if (!open) setDiscardModalLot(null);
        }}
      />
    </div>
  );
}
