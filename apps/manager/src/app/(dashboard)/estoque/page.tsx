'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  RiAddLine,
  RiAlertLine,
  RiArchiveLine,
  RiCheckLine,
  RiDeleteBin6Line,
  RiErrorWarningLine,
  RiLockLine,
  RiRefreshLine,
  RiSearchLine,
  RiShieldCrossLine,
  RiStackLine,
} from 'react-icons/ri'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'

import { apiClient, ApiError } from '../../../lib/api-client'

interface Store {
  id: string
  name: string
}

interface LotItem {
  id: string
  lotNumber: string
  manufacturer?: string | null
  supplier?: string | null
  manufacturingDate?: string | null
  expirationDate?: string | null
  status: 'available' | 'quarantine' | 'blocked' | 'recalled'
  notes?: string | null
  product: { id: string; name: string; slug: string }
  variation?: { id: string; sku: string } | null
  store: { id: string; name: string }
  expirationAnalysis: {
    condition: 'valid' | 'warning' | 'insufficient' | 'expired'
    daysRemaining: number | null
    isExpired: boolean
  }
  stockSummary: {
    physicalQuantity: number
    reservedQuantity: number
    availableQuantity: number
  }
  stockItems: Array<{
    id: string
    locationId: string
    physicalQuantity: number
    reservedQuantity: number
    location: { id: string; name: string; code: string }
  }>
}

export default function StockAndLotsPage() {
  const queryClient = useQueryClient()

  // Filter States
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expirationFilter, setExpirationFilter] = useState<string>('all')

  // Modal States
  const [isReceivingOpen, setIsReceivingOpen] = useState(false)
  const [statusModalLot, setStatusModalLot] = useState<LotItem | null>(null)
  const [discardModalLot, setDiscardModalLot] = useState<LotItem | null>(null)

  // Status Change Form
  const [newStatus, setNewStatus] = useState<
    'available' | 'quarantine' | 'blocked' | 'recalled'
  >('quarantine')
  const [statusReason, setStatusReason] = useState('')

  // Discard Form
  const [discardQty, setDiscardQty] = useState('')
  const [discardReason, setDiscardReason] = useState<
    'expired' | 'damaged' | 'recalled' | 'other'
  >('expired')
  const [discardDestination, setDiscardDestination] = useState('')
  const [discardNotes, setDiscardNotes] = useState('')

  // Receiving Form State
  const [recStoreId, setRecStoreId] = useState('')
  const [recProductId, setRecProductId] = useState('')
  const [recVariationId] = useState('')
  const [recDocRef, setRecDocRef] = useState('')
  const [recLots, setRecLots] = useState([
    {
      lotNumber: '',
      manufacturer: '',
      supplier: '',
      manufacturingDate: '',
      expirationDate: '',
      quantity: '10',
      notes: '',
    },
  ])

  // Queries
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ['stores-dropdown'],
    queryFn: async () => {
      const res = await apiClient('/stores')
      return Array.isArray(res) ? res : res?.data ?? []
    },
  })

  const { data: productsRes = [] } = useQuery<any[]>({
    queryKey: ['products-dropdown', recStoreId],
    queryFn: async () => {
      if (!recStoreId) return []
      const res = await apiClient(`/products?storeId=${recStoreId}&limit=100`)
      return res?.data ?? []
    },
    enabled: Boolean(recStoreId),
  })

  const { data: lotsRes, isLoading } = useQuery<{
    data: LotItem[]
    meta: any
  }>({
    queryKey: [
      'lots-list',
      selectedStoreId,
      statusFilter,
      expirationFilter,
      search,
    ],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedStoreId) params.append('storeId', selectedStoreId)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (expirationFilter !== 'all')
        params.append('expirationCondition', expirationFilter)
      if (search) params.append('search', search)

      const res = await apiClient(`/lots?${params.toString()}`)
      return res
    },
  })

  const lotsList: LotItem[] = lotsRes?.data ?? []

  // Metrics
  const totalPhysical = lotsList.reduce(
    (acc, l) => acc + l.stockSummary.physicalQuantity,
    0,
  )
  const totalAvailable = lotsList.reduce(
    (acc, l) => acc + l.stockSummary.availableQuantity,
    0,
  )
  const warningCount = lotsList.filter(
    (l) => l.expirationAnalysis.condition === 'warning',
  ).length
  const expiredCount = lotsList.filter(
    (l) => l.expirationAnalysis.isExpired || l.status !== 'available',
  ).length

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!statusModalLot) return
      return apiClient(`/lots/${statusModalLot.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots-list'] })
      toast.success('Situação operacional do lote alterada com sucesso!')
      setStatusModalLot(null)
      setStatusReason('')
    },
    onError: (err: any) => {
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Erro ao alterar status do lote',
      )
    },
  })

  const discardMutation = useMutation({
    mutationFn: async () => {
      if (!discardModalLot) return
      const locId = discardModalLot.stockItems[0]?.locationId
      if (!locId) throw new Error('Localização não encontrada')

      return apiClient('/stock/discard', {
        method: 'POST',
        body: JSON.stringify({
          storeId: discardModalLot.store.id,
          lotId: discardModalLot.id,
          locationId: locId,
          quantity: Number(discardQty),
          reason: discardReason,
          destination: discardDestination,
          notes: discardNotes,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots-list'] })
      toast.success('Descarte formal registrado e auditado com sucesso!')
      setDiscardModalLot(null)
      setDiscardQty('')
      setDiscardDestination('')
      setDiscardNotes('')
    },
    onError: (err: any) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Erro ao processar descarte',
      )
    },
  })

  const receiveMutation = useMutation({
    mutationFn: async () => {
      const selectedProd = productsRes.find((p) => p.id === recProductId)
      const defaultVarId = selectedProd?.variations?.[0]?.id

      return apiClient('/stock/receive', {
        method: 'POST',
        body: JSON.stringify({
          storeId: recStoreId,
          variationId: recVariationId || defaultVarId,
          documentReference: recDocRef,
          lots: recLots.map((l) => ({
            lotNumber: l.lotNumber,
            manufacturer: l.manufacturer || null,
            supplier: l.supplier || null,
            manufacturingDate: l.manufacturingDate
              ? new Date(l.manufacturingDate).toISOString()
              : null,
            expirationDate: l.expirationDate
              ? new Date(l.expirationDate).toISOString()
              : null,
            quantity: Number(l.quantity),
            notes: l.notes || null,
          })),
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots-list'] })
      toast.success('Recebimento de lote(s) registrado com sucesso!')
      setIsReceivingOpen(false)
      setRecDocRef('')
      setRecLots([
        {
          lotNumber: '',
          manufacturer: '',
          supplier: '',
          manufacturingDate: '',
          expirationDate: '',
          quantity: '10',
          notes: '',
        },
      ])
    },
    onError: (err: any) => {
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Erro ao registrar recebimento',
      )
    },
  })

  const handleAddLotRow = () => {
    setRecLots((prev) => [
      ...prev,
      {
        lotNumber: '',
        manufacturer: '',
        supplier: '',
        manufacturingDate: '',
        expirationDate: '',
        quantity: '10',
        notes: '',
      },
    ])
  }

  const handleRemoveLotRow = (index: number) => {
    setRecLots((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateLotRow = (index: number, field: string, value: string) => {
    setRecLots((prev) => {
      const next = [...prev]
      next[index] = { ...next[index]!, [field]: value }
      return next
    })
  }

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
            Controle por lotes, datas de vencimento, quarentena e descarte auditado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsReceivingOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-950/40"
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
            {totalPhysical.toLocaleString('pt-BR')}{' '}
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
            {totalAvailable.toLocaleString('pt-BR')}{' '}
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
            {warningCount}{' '}
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
            {expiredCount}{' '}
            <span className="text-xs font-normal text-zinc-500">lotes</span>
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 flex-1">
          {/* 1. Busca por Texto */}
          <div className="relative flex-1 min-w-60">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              placeholder="Buscar por lote, produto, fabricante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-zinc-900/80 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 rounded-xl"
            />
          </div>

          {/* 2. Filtro de Loja */}
          <div className="w-full sm:w-44">
            <NativeSelect
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full bg-zinc-900/80 border-zinc-800 text-xs rounded-xl"
            >
              <option value="">Todas as Lojas</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          {/* 3. Filtro de Validade */}
          <div className="w-full sm:w-48">
            <NativeSelect
              value={expirationFilter}
              onChange={(e) => setExpirationFilter(e.target.value)}
              className="w-full bg-zinc-900/80 border-zinc-800 text-xs rounded-xl"
            >
              <option value="all">Validade: Todas</option>
              <option value="valid">Válidos</option>
              <option value="warning">Próximos do Vencimento</option>
              <option value="insufficient">Prazo Insuficiente</option>
              <option value="expired">Vencidos</option>
            </NativeSelect>
          </div>

          {/* 4. Filtro de Status Operacional */}
          <div className="w-full sm:w-44">
            <NativeSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-zinc-900/80 border-zinc-800 text-xs rounded-xl"
            >
              <option value="all">Status: Todos</option>
              <option value="available">Disponível</option>
              <option value="quarantine">Quarentena</option>
              <option value="blocked">Bloqueado</option>
              <option value="recalled">Recolhido (Recall)</option>
            </NativeSelect>
          </div>
        </div>

        {/* Botão de Atualizar */}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ['lots-list'] })
          }
          className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs shrink-0 self-start md:self-center"
        >
          <RiRefreshLine className="mr-1.5 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* TABLE */}
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
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  Carregando lotes...
                </td>
              </tr>
            ) : lotsList.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  Nenhum lote encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              lotsList.map((lot) => {
                const exp = lot.expirationAnalysis
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
                        {lot.variation?.sku || 'SKU Padrão'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-400">
                      <span>{lot.manufacturer || 'Não informado'}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      {lot.expirationDate ? (
                        <div>
                          <span className="block font-mono text-zinc-200">
                            {new Date(lot.expirationDate).toLocaleDateString(
                              'pt-BR',
                            )}
                          </span>
                          <span
                            className={`text-[11px] font-medium ${
                              exp.isExpired
                                ? 'text-rose-400'
                                : exp.condition === 'warning'
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
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
                      {lot.status === 'available' && (
                        <Badge className="bg-emerald-950/80 text-emerald-400 border-emerald-800/80 text-[11px]">
                          Disponível
                        </Badge>
                      )}
                      {lot.status === 'quarantine' && (
                        <Badge className="bg-amber-950/80 text-amber-400 border-amber-800/80 text-[11px]">
                          Quarentena
                        </Badge>
                      )}
                      {lot.status === 'blocked' && (
                        <Badge className="bg-rose-950/80 text-rose-400 border-rose-800/80 text-[11px]">
                          Bloqueado
                        </Badge>
                      )}
                      {lot.status === 'recalled' && (
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
                        onClick={() => {
                          setStatusModalLot(lot)
                          setNewStatus(lot.status)
                        }}
                        className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px]"
                      >
                        <RiLockLine className="mr-1 h-3.5 w-3.5" />
                        Status
                      </Button>

                      {exp.isExpired && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDiscardModalLot(lot)
                            setDiscardQty(
                              String(lot.stockSummary.physicalQuantity),
                            )
                          }}
                          className="bg-rose-950 border border-rose-800/80 hover:bg-rose-900 text-rose-200 text-[11px]"
                        >
                          <RiDeleteBin6Line className="mr-1 h-3.5 w-3.5" />
                          Descartar
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL STATUS OPERACIONAL */}
      {statusModalLot && (
        <Dialog
          open={Boolean(statusModalLot)}
          onOpenChange={() => setStatusModalLot(null)}
        >
          <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <RiShieldCrossLine className="h-5 w-5 text-amber-400" />
                Alterar Situação Operacional do Lote
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Altere a situação do lote{' '}
                <strong>{statusModalLot.lotNumber}</strong>. Toda alteração exige
                justificativa auditada.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Nova Situação Operacional
                </label>
                <NativeSelect
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-zinc-900 border-zinc-800 text-xs"
                >
                  <option value="available">
                    Disponível (Liberado para vendas)
                  </option>
                  <option value="quarantine">
                    Em Quarentena (Análise pendente)
                  </option>
                  <option value="blocked">
                    Bloqueado (Decisão administrativa)
                  </option>
                  <option value="recalled">Recolhido / Recall Sanitário</option>
                </NativeSelect>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Justificativa Obrigatória{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <Textarea
                  placeholder="Descreva o motivo da alteração de status deste lote..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStatusModalLot(null)}
                className="border-zinc-800 bg-zinc-900 text-zinc-300 text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => updateStatusMutation.mutate()}
                disabled={
                  !statusReason.trim() || updateStatusMutation.isPending
                }
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Salvar Alteração
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL DESCARTE FORMAL */}
      {discardModalLot && (
        <Dialog
          open={Boolean(discardModalLot)}
          onOpenChange={() => setDiscardModalLot(null)}
        >
          <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-400">
                <RiDeleteBin6Line className="h-5 w-5" />
                Descarte Formal por Vencimento / Dano
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Registre a baixa formal do estoque do lote{' '}
                <strong>{discardModalLot.lotNumber}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Quantidade a Descartar
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={discardQty}
                    onChange={(e) => setDiscardQty(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-xs font-mono text-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Motivo do Descarte
                  </label>
                  <NativeSelect
                    value={discardReason}
                    onChange={(e) => setDiscardReason(e.target.value as any)}
                    className="bg-zinc-900 border-zinc-800 text-xs"
                  >
                    <option value="expired">Vencimento da Validade</option>
                    <option value="damaged">
                      Avaria / Dano no Transporte
                    </option>
                    <option value="recalled">Recolhimento Sanitário</option>
                    <option value="other">Outro Motivo</option>
                  </NativeSelect>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Empresa / Destino Responsável{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <Input
                  placeholder="Ex: Incinerador Licenciado SP, Empresa de Compostagem"
                  value={discardDestination}
                  onChange={(e) => setDiscardDestination(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Observações / Evidências
                </label>
                <Textarea
                  placeholder="Número de laudo, certificado de descarte ou observações..."
                  value={discardNotes}
                  onChange={(e) => setDiscardNotes(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDiscardModalLot(null)}
                className="border-zinc-800 bg-zinc-900 text-zinc-300 text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => discardMutation.mutate()}
                disabled={
                  !discardDestination.trim() ||
                  !discardQty ||
                  discardMutation.isPending
                }
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Confirmar Descarte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL RECEBIMENTO DE LOTES */}
      {isReceivingOpen && (
        <Dialog open={isReceivingOpen} onOpenChange={setIsReceivingOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-100 rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <RiAddLine className="h-6 w-6 text-emerald-500" />
                Recebimento de Mercadorias com Lote
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Registre a entrada de estoque vinculando o fabricante, datas de
                fabricação/validade e divisão de lotes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Loja Recebedora <span className="text-rose-400">*</span>
                  </label>
                  <NativeSelect
                    value={recStoreId}
                    onChange={(e) => {
                      setRecStoreId(e.target.value)
                      setRecProductId('')
                    }}
                    className="bg-zinc-900 border-zinc-800 text-xs"
                  >
                    <option value="">Selecione a Loja</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Produto <span className="text-rose-400">*</span>
                  </label>
                  <NativeSelect
                    value={recProductId}
                    onChange={(e) => setRecProductId(e.target.value)}
                    disabled={!recStoreId}
                    className="bg-zinc-900 border-zinc-800 text-xs"
                  >
                    <option value="">Selecione o Produto</option>
                    {productsRes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Documento de Referência / NFe
                  </label>
                  <Input
                    placeholder="Ex: NF 001.492"
                    value={recDocRef}
                    onChange={(e) => setRecDocRef(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-xs font-mono text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* LOT ROWS */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-300">
                    Lotes Recebidos na Entrega
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLotRow}
                    className="border-zinc-800 bg-zinc-900 text-xs text-emerald-400 hover:bg-zinc-800"
                  >
                    <RiAddLine className="mr-1 h-3.5 w-3.5" />
                    Adicionar Outro Lote
                  </Button>
                </div>

                {recLots.map((row, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2.5">
                      <span className="text-xs font-semibold text-zinc-400">
                        Lote #{idx + 1}
                      </span>
                      {recLots.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLotRow(idx)}
                          className="h-7 w-7 p-0 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="Remover este lote do recebimento"
                        >
                          <RiDeleteBin6Line className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                          Código do Lote <span className="text-rose-400">*</span>
                        </label>
                        <Input
                          placeholder="Ex: L-2026-09A"
                          value={row.lotNumber}
                          onChange={(e) =>
                            handleUpdateLotRow(idx, 'lotNumber', e.target.value)
                          }
                          className="bg-zinc-900 border-zinc-800 text-xs font-mono text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                          Fabricante / Fornecedor
                        </label>
                        <Input
                          placeholder="Nome do Fabricante"
                          value={row.manufacturer}
                          onChange={(e) =>
                            handleUpdateLotRow(
                              idx,
                              'manufacturer',
                              e.target.value,
                            )
                          }
                          className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                          Data de Fabricação
                        </label>
                        <Input
                          type="date"
                          value={row.manufacturingDate}
                          onChange={(e) =>
                            handleUpdateLotRow(
                              idx,
                              'manufacturingDate',
                              e.target.value,
                            )
                          }
                          className="bg-zinc-900 border-zinc-800 text-xs font-mono text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                          Data de Validade
                        </label>
                        <Input
                          type="date"
                          value={row.expirationDate}
                          onChange={(e) =>
                            handleUpdateLotRow(
                              idx,
                              'expirationDate',
                              e.target.value,
                            )
                          }
                          className="bg-zinc-900 border-zinc-800 text-xs font-mono text-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                          Quantidade Recebida (Unid.){' '}
                          <span className="text-rose-400">*</span>
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) =>
                            handleUpdateLotRow(idx, 'quantity', e.target.value)
                          }
                          className="bg-zinc-900 border-zinc-800 text-xs font-mono text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                          Observações de Armazenamento
                        </label>
                        <Input
                          placeholder="Ex: Manter refrigerado entre 2°C e 8°C"
                          value={row.notes}
                          onChange={(e) =>
                            handleUpdateLotRow(idx, 'notes', e.target.value)
                          }
                          className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => setIsReceivingOpen(false)}
                className="border-zinc-800 bg-zinc-900 text-zinc-300 text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => receiveMutation.mutate()}
                disabled={
                  !recStoreId || !recProductId || receiveMutation.isPending
                }
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Confirmar Recebimento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
