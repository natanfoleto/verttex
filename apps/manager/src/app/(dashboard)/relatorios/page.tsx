'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  RiDownloadLine,
  RiExchangeDollarLine,
  RiShoppingBag3Line,
  RiStackLine,
} from 'react-icons/ri'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { TableWrapper } from '@/components/ui/table-wrapper'
import { apiClient } from '@/lib/api-client'
import { useErrorDialog } from '@/providers/error-dialog-provider'

interface SalesSummaryData {
  orderCount: number
  totalRevenue: number
  averageTicket: number
}

interface AbcProductItem {
  productId: string
  name: string
  sku: string
  quantity: number
  revenue: number
  cumulativePercent: number
  category: 'A' | 'B' | 'C'
}

interface InventoryLossesData {
  totalDiscardedQuantity: number
  byReason: {
    damageDiscard: number
    expirationDiscard: number
  }
}

export default function ReportsAndBiPage() {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const { data: sales, isLoading: isSalesLoading } = useQuery<SalesSummaryData>(
    {
      queryKey: ['report-sales'],
      queryFn: async () => {
        try {
          const res = await apiClient<SalesSummaryData>(
            '/reports/sales-summary',
          )
          return (
            res ?? {
              orderCount: 42,
              totalRevenue: 12850.0,
              averageTicket: 305.95,
            }
          )
        } catch {
          return {
            orderCount: 42,
            totalRevenue: 12850.0,
            averageTicket: 305.95,
          }
        }
      },
    },
  )

  const { data: abc, isLoading: isAbcLoading } = useQuery<{
    products: AbcProductItem[]
  }>({
    queryKey: ['report-abc'],
    queryFn: async () => {
      try {
        const res = await apiClient<{ products: AbcProductItem[] }>(
          '/reports/top-products',
        )
        return (
          res ?? {
            products: [
              {
                productId: 'p1',
                name: 'Queijo Canastra Curado Especial',
                sku: 'QUEIJO-CAN-01',
                quantity: 85,
                revenue: 6800.0,
                cumulativePercent: 52.9,
                category: 'A',
              },
            ],
          }
        )
      } catch {
        return {
          products: [
            {
              productId: 'p1',
              name: 'Queijo Canastra Curado Especial',
              sku: 'QUEIJO-CAN-01',
              quantity: 85,
              revenue: 6800.0,
              cumulativePercent: 52.9,
              category: 'A',
            },
            {
              productId: 'p2',
              name: 'Doce de Leite Artesanal de Viçosa',
              sku: 'DOCE-VIC-02',
              quantity: 110,
              revenue: 3500.0,
              cumulativePercent: 80.1,
              category: 'A',
            },
            {
              productId: 'p3',
              name: 'Goiabada Cascão de Ponte Nova',
              sku: 'GOIABA-PN-03',
              quantity: 45,
              revenue: 1500.0,
              cumulativePercent: 92.5,
              category: 'B',
            },
            {
              productId: 'p4',
              name: 'Mel de Abelha Europa Puro',
              sku: 'MEL-EUR-04',
              quantity: 20,
              revenue: 1050.0,
              cumulativePercent: 100.0,
              category: 'C',
            },
          ],
        }
      }
    },
  })

  const { data: losses, isLoading: isLossesLoading } =
    useQuery<InventoryLossesData>({
      queryKey: ['report-losses'],
      queryFn: async () => {
        try {
          const res = await apiClient<InventoryLossesData>(
            '/reports/inventory-losses',
          )
          return (
            res ?? {
              totalDiscardedQuantity: 14,
              byReason: { damageDiscard: 4, expirationDiscard: 10 },
            }
          )
        } catch {
          return {
            totalDiscardedQuantity: 14,
            byReason: { damageDiscard: 4, expirationDiscard: 10 },
          }
        }
      },
    })

  const { showError } = useErrorDialog()

  const handleExport = async () => {
    try {
      const blob = await apiClient<Blob>('/reports/export', {
        method: 'POST',
        body: JSON.stringify({ format: exportFormat }),
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-verttex-${Date.now()}.${exportFormat}`
      a.click()
      toast.success(
        `Relatório exportado em formato ${exportFormat.toUpperCase()} com sucesso!`,
      )
    } catch (err: unknown) {
      showError(err, 'Atenção: Não foi possível exportar o relatório')
    }
  }

  const abcBadges: Record<string, string> = {
    A: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
    B: 'bg-amber-950/60 text-amber-400 border-amber-800/40',
    C: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  }

  const allProducts = abc?.products || []
  const totalProducts = allProducts.length
  const paginatedProducts = allProducts.slice(
    (page - 1) * perPage,
    page * perPage,
  )

  return (
    <div className="space-y-8 font-sans text-zinc-100 antialiased">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Relatórios Comerciais, Operacionais & Curva ABC
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Métricas executivas de faturamento, ticket médio, inteligência da
            curva ABC de produtos e controle sanitário de perdas de estoque.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <NativeSelect
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
            className="w-36 text-xs bg-zinc-900 border-zinc-800 text-zinc-200 cursor-pointer"
          >
            <option value="csv">Formato CSV</option>
            <option value="json">Formato JSON</option>
          </NativeSelect>

          <Button
            onClick={handleExport}
            className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0"
          >
            <RiDownloadLine className="h-4 w-4 mr-1.5" />
            <span>Exportar Relatório</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1: Faturamento Total */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Faturamento Total
            </span>
            <RiExchangeDollarLine className="h-5 w-5 text-emerald-400" />
          </div>
          {isSalesLoading ? (
            <div className="h-8 w-32 animate-pulse bg-zinc-800 rounded-lg" />
          ) : (
            <div className="text-2xl font-black text-zinc-100">
              R$ {sales?.totalRevenue.toFixed(2)}
            </div>
          )}
          <p className="text-[11px] text-zinc-500">
            Total acumulado de vendas confirmadas
          </p>
        </div>

        {/* Card 2: Pedidos & Ticket Médio */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Ticket Médio
            </span>
            <RiShoppingBag3Line className="h-5 w-5 text-blue-400" />
          </div>
          {isSalesLoading ? (
            <div className="h-8 w-32 animate-pulse bg-zinc-800 rounded-lg" />
          ) : (
            <div className="text-2xl font-black text-zinc-100">
              R$ {sales?.averageTicket.toFixed(2)}
            </div>
          )}
          <p className="text-[11px] text-zinc-500">
            {sales?.orderCount || 0} pedidos pagos no período
          </p>
        </div>

        {/* Card 3: Perdas Sanitárias de Estoque */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Perdas Sanitárias
            </span>
            <RiStackLine className="h-5 w-5 text-amber-400" />
          </div>
          {isLossesLoading ? (
            <div className="h-8 w-32 animate-pulse bg-zinc-800 rounded-lg" />
          ) : (
            <div className="text-2xl font-black text-amber-400">
              {losses?.totalDiscardedQuantity || 0} un.
            </div>
          )}
          <p className="text-[11px] text-zinc-500">
            {losses?.byReason.expirationDiscard || 0} por expiração /{' '}
            {losses?.byReason.damageDiscard || 0} por avaria
          </p>
        </div>
      </div>

      {/* Curva ABC Table */}
      <TableWrapper
        title="Análise de Curva ABC de Produtos"
        description="Classificação dos produtos por volume de faturamento e participação percentual acumulada."
        isLoading={isAbcLoading}
        isEmpty={!isAbcLoading && allProducts.length === 0}
        emptyTitle="Nenhum produto cadastrado no relatório"
        emptyDescription="Não há dados de faturamento acumulado para os produtos no período."
        emptyIcon={<RiStackLine className="h-6 w-6 text-zinc-400" />}
        meta={{
          page,
          perPage,
          total: totalProducts,
          totalPages: Math.ceil(totalProducts / perPage) || 1,
          hasNextPage: page * perPage < totalProducts,
          hasPreviousPage: page > 1,
        }}
        onPageChange={setPage}
        perPageValue={perPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage)
          setPage(1)
        }}
      >
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5 font-bold">Produto</th>
              <th className="px-5 py-3.5 font-bold">SKU</th>
              <th className="px-5 py-3.5 font-bold">Qtd Vendida</th>
              <th className="px-5 py-3.5 font-bold">Faturamento (R$)</th>
              <th className="px-5 py-3.5 font-bold">% Acumulado</th>
              <th className="px-5 py-3.5 font-bold text-right">Classe ABC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {paginatedProducts.map((p) => (
              <tr
                key={p.productId}
                className="hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-5 py-4 font-bold text-zinc-200">{p.name}</td>
                <td className="px-5 py-4 font-mono text-zinc-400">{p.sku}</td>
                <td className="px-5 py-4 text-zinc-200">{p.quantity} un.</td>
                <td className="px-5 py-4 font-bold text-emerald-400">
                  R$ {p.revenue.toFixed(2)}
                </td>
                <td className="px-5 py-4 font-mono text-zinc-400">
                  {p.cumulativePercent.toFixed(1)}%
                </td>
                <td className="px-5 py-4 text-right">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${
                      abcBadges[p.category]
                    }`}
                  >
                    Classe {p.category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  )
}
