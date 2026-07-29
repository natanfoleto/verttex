"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { RiRefreshLine, RiShieldKeyholeLine } from "react-icons/ri";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { apiClient } from "@/lib/api-client";

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export function StoreAuditTab({ storeId }: { storeId: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [actionFilter, setActionFilter] = useState("ALL");

  const { data: res, isLoading, isError } = useQuery<{
    data: AuditLogItem[];
    meta: { page: number; perPage: number; total: number; totalPages: number };
  }>({
    queryKey: ["store-audit-tab", storeId, search, page, limit, actionFilter],
    queryFn: async () => {
      let url = `/audit?entity=Store&entityId=${storeId}&page=${page}&perPage=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (actionFilter !== "ALL")
        url += `&action=${encodeURIComponent(actionFilter)}`;

      const response = await apiClient<any>(url);
      return {
        data: response?.data?.logs || response?.data || [],
        meta: response?.meta || {
          page,
          perPage: limit,
          total: response?.data?.logs?.length || 0,
          totalPages: 1,
        },
      };
    },
  });

  const auditLogsList = res?.data || [];

  return (
    <div className="space-y-6 text-zinc-100 antialiased">
      <TableWrapper
        title="Auditoria de Eventos e Alterações da Loja"
        description="Histórico imutável de ações administrativas, edições e eventos de segurança nesta loja."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Buscar por ação ou usuário..."
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && auditLogsList.length === 0}
        emptyTitle="Nenhum log de auditoria encontrado"
        emptyDescription="Nenhuma alteração ou evento registrado para os filtros selecionados."
        emptyIcon={<RiShieldKeyholeLine className="h-6 w-6 text-zinc-400" />}
        filters={
          <div className="flex items-center gap-2">
            <NativeSelect
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              wrapperClassName="w-48"
            >
              <option value="ALL">Todas as Ações</option>
              <option value="CREATE">Criação (CREATE)</option>
              <option value="UPDATE">Edição (UPDATE)</option>
              <option value="DELETE">Exclusão (DELETE)</option>
            </NativeSelect>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["store-audit-tab"],
                })
              }
              className="cursor-pointer text-xs h-9 border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-xl"
            >
              <RiRefreshLine className="h-3.5 w-3.5 mr-1" />
              <span>Atualizar</span>
            </Button>
          </div>
        }
        meta={res?.meta}
        onPageChange={setPage}
        perPageValue={limit}
        onPerPageChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      >
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/60 text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-800">
            <tr>
              <th className="px-5 py-3.5">Data & Hora</th>
              <th className="px-5 py-3.5">Tipo de Ação</th>
              <th className="px-5 py-3.5">Recurso Afetado</th>
              <th className="px-5 py-3.5 text-right">Usuário Autor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {auditLogsList.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-5 py-4 text-zinc-400">
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                </td>
                <td className="px-5 py-4 font-sans">
                  <span className="inline-flex items-center rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-200">
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-zinc-300">
                  {log.entity} ({log.entityId})
                </td>
                <td className="px-5 py-4 text-right font-sans text-zinc-200 font-medium">
                  {log.user?.name || "Sistema / API"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  );
}
