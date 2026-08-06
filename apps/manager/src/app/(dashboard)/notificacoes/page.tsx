'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  RiAlertLine,
  RiCheckLine,
  RiNotification3Line,
  RiRefreshLine,
} from 'react-icons/ri'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import { useErrorDialog } from '@/providers/error-dialog-provider'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'TRANSACTIONAL' | 'EXPIRATION_ALERT' | 'SECURITY' | 'SYSTEM'
  isRead: boolean
  createdAt: string
}

export default function NotificationsCenterPage() {
  const queryClient = useQueryClient()
  const [unreadOnly, setUnreadOnly] = useState(false)

  const { data, isLoading } = useQuery<{
    unreadCount: number
    notifications: NotificationItem[]
  }>({
    queryKey: ['notifications', unreadOnly],
    queryFn: async () => {
      try {
        const res = await apiClient<{
          data: { unreadCount: number; notifications: NotificationItem[] }
        }>(`/notifications?unreadOnly=${unreadOnly}`)
        return res.data
      } catch {
        return {
          unreadCount: 1,
          notifications: [
            {
              id: 'notif-1',
              title: 'Alerta Sanitário de Validade — Lote CAN-2026-02',
              message:
                "Aviso: O lote CAN-2026-02 do produto 'Queijo Canastra Tradicional' atinge a faixa de aviso de 30 dias para vencimento.",
              type: 'EXPIRATION_ALERT',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'notif-2',
              title: 'Pedido Expedido com Sucesso',
              message:
                'O pedido VTX-9822 foi expedido com validação sanitária FEFO.',
              type: 'TRANSACTIONAL',
              isRead: true,
              createdAt: new Date().toISOString(),
            },
          ],
        }
      }
    },
  })

  const { showError } = useErrorDialog()

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/notifications/${id}/read`, { method: 'PATCH' })
    },
    onSuccess: () => {
      toast.success('Notificação marcada como lida')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err: unknown) => {
      showError(err, 'Atenção: Não foi possível atualizar a notificação')
    },
  })

  const runExpirationCheckMutation = useMutation({
    mutationFn: async () => {
      return apiClient<{ data?: { newAlertsCount?: number } }>(
        '/notifications/expiration-check',
        { method: 'POST' },
      )
    },
    onSuccess: (res) => {
      toast.success(
        `Varredura sanitária executada! ${res.data?.newAlertsCount || 0} novos alertas gerados.`,
      )
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err: unknown) => {
      showError(err, 'Atenção: Não foi possível executar a varredura sanitária')
    },
  })

  return (
    <div className="space-y-6 font-sans text-zinc-100 antialiased">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Central de Notificações & Alertas Sanitários de Validade
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Acompanhe alertas de vencimento de lotes por faixas de dias e avisos
            transacionais do ecossistema VERTTEX.
          </p>
        </div>

        <Button
          onClick={() => runExpirationCheckMutation.mutate()}
          disabled={runExpirationCheckMutation.isPending}
          className="shrink-0 cursor-pointer bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
        >
          <RiRefreshLine className="mr-1.5 h-4 w-4" />
          <span>
            {runExpirationCheckMutation.isPending
              ? 'Varrendo Lotes...'
              : 'Executar Checagem de Lotes'}
          </span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
        <Button
          size="sm"
          variant={!unreadOnly ? 'default' : 'outline'}
          onClick={() => setUnreadOnly(false)}
          className="cursor-pointer text-xs"
        >
          Todas ({data?.notifications.length || 0})
        </Button>
        <Button
          size="sm"
          variant={unreadOnly ? 'default' : 'outline'}
          onClick={() => setUnreadOnly(true)}
          className="cursor-pointer text-xs"
        >
          Não Lidas ({data?.unreadCount || 0})
        </Button>
      </div>

      {/* List & Skeletons */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 w-full animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
            />
          ))}
        </div>
      ) : !data || data.notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-12 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 shadow-xs">
            <RiNotification3Line className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="text-sm font-bold text-zinc-200">
            Nenhuma notificação encontrada
          </h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            Você está em dia com todas as notificações e alertas sanitários.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.notifications.map((n) => (
            <div
              key={n.id}
              className={`flex flex-col justify-between rounded-2xl border p-4 transition-all sm:flex-row sm:items-center ${
                n.isRead
                  ? 'border-zinc-800/60 bg-zinc-900/30 text-zinc-400'
                  : 'border-emerald-800/40 bg-emerald-950/20 text-zinc-100 shadow-sm'
              }`}
            >
              <div className="flex items-start space-x-3">
                {n.type === 'EXPIRATION_ALERT' ? (
                  <RiAlertLine className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                ) : (
                  <RiNotification3Line className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">{n.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    {n.message}
                  </p>
                  <span className="mt-2 block font-mono text-[10px] text-zinc-500">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markReadMutation.mutate(n.id)}
                  disabled={markReadMutation.isPending}
                  className="mt-3 shrink-0 cursor-pointer self-end border-zinc-800 text-xs sm:mt-0 sm:self-center"
                >
                  <RiCheckLine className="mr-1 h-3.5 w-3.5" />
                  <span>Marcar como Lida</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
