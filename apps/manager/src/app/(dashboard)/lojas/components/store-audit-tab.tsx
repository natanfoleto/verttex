'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiFileList3Line,
  RiRefreshLine,
  RiShieldCheckLine,
  RiShieldKeyholeLine,
} from 'react-icons/ri'

import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { TableWrapper } from '@/components/ui/table-wrapper'
import type { AuditLogEntry } from '@/lib/api/audit'
import { apiClient } from '@/lib/api-client'

// ─── Entity Labels ─────────────────────────────────────────────────────────────

const entityLabels: Record<string, string> = {
  User: 'Usuário',
  Store: 'Loja',
  Role: 'Cargo',
  Permission: 'Permissão',
  Product: 'Produto',
  Order: 'Pedido',
  Category: 'Categoria',
  SystemSettings: 'Config. Sistema',
  MarketplaceSettings: 'Config. Marketplace',
}

function getEntityLabel(entity: string): string {
  return entityLabels[entity] ?? entity
}

// ─── Action Badge ──────────────────────────────────────────────────────────────

const actionBadgeConfig: Record<string, { label: string; className: string }> =
  {
    CREATE: {
      label: 'Criar',
      className: 'border-emerald-800 bg-emerald-950 text-emerald-400',
    },
    UPDATE: {
      label: 'Atualizar',
      className: 'border-blue-800 bg-blue-950 text-blue-400',
    },
    DELETE: {
      label: 'Excluir',
      className: 'border-rose-800 bg-rose-950 text-rose-400',
    },
    LOGIN: {
      label: 'Login',
      className: 'border-violet-800 bg-violet-950 text-violet-400',
    },
    LOGOUT: {
      label: 'Logout',
      className: 'border-zinc-700 bg-zinc-800 text-zinc-300',
    },
    LOGIN_FAILED: {
      label: 'Login Falhou',
      className: 'border-orange-800 bg-orange-950 text-orange-400',
    },
    STATUS_CHANGE: {
      label: 'Status',
      className: 'border-amber-800 bg-amber-950 text-amber-400',
    },
    PERMISSION_CHANGE: {
      label: 'Permissão',
      className: 'border-purple-800 bg-purple-950 text-purple-400',
    },
    MEMBER_ADD: {
      label: 'Membro +',
      className: 'border-emerald-800 bg-emerald-950 text-emerald-400',
    },
    MEMBER_REMOVE: {
      label: 'Membro -',
      className: 'border-rose-800 bg-rose-950 text-rose-400',
    },
    SYSTEM_ACTION: {
      label: 'Sistema',
      className: 'border-indigo-800 bg-indigo-950 text-indigo-400',
    },
  }

function ActionBadge({ action }: { action: string }) {
  const config = actionBadgeConfig[action.toUpperCase()] ?? {
    label: action,
    className: 'border-zinc-700 bg-zinc-800 text-zinc-400',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  )
}

// ─── Sensitive Keys Masking ────────────────────────────────────────────────────

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'refreshtokenhash',
  'tokenhash',
  'secret',
  'apikey',
  'authorization',
])

function maskValue(key: string, value: unknown): string {
  if (SENSITIVE_KEYS.has(key.toLowerCase())) return '"[PROTEGIDO]"'
  return JSON.stringify(value)
}

// ─── JSON Diff Viewer ──────────────────────────────────────────────────────────

type DiffLine = { text: string; type: 'added' | 'removed' | 'unchanged' }

function buildDiffLines(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
): DiffLine[] {
  const allKeys = Array.from(
    new Set([...Object.keys(oldObj), ...Object.keys(newObj)]),
  )
  const lines: DiffLine[] = [{ text: '{', type: 'unchanged' }]

  for (const key of allKeys) {
    const hasOld = key in oldObj
    const hasNew = key in newObj
    const valOld = oldObj[key]
    const valNew = newObj[key]

    if (hasOld && hasNew) {
      if (JSON.stringify(valOld) !== JSON.stringify(valNew)) {
        lines.push({
          text: `  - "${key}": ${maskValue(key, valOld)},`,
          type: 'removed',
        })
        lines.push({
          text: `  + "${key}": ${maskValue(key, valNew)},`,
          type: 'added',
        })
      } else {
        lines.push({
          text: `    "${key}": ${maskValue(key, valOld)},`,
          type: 'unchanged',
        })
      }
    } else if (hasNew) {
      lines.push({
        text: `  + "${key}": ${maskValue(key, valNew)},`,
        type: 'added',
      })
    } else if (hasOld) {
      lines.push({
        text: `  - "${key}": ${maskValue(key, valOld)},`,
        type: 'removed',
      })
    }
  }

  lines.push({ text: '}', type: 'unchanged' })
  return lines
}

function JsonDiffViewer({
  oldVal,
  newVal,
}: {
  oldVal: Record<string, unknown> | null
  newVal: Record<string, unknown> | null
}) {
  if (!oldVal && !newVal) {
    return (
      <span className="text-zinc-500 italic">
        Sem alterações de dados registradas.
      </span>
    )
  }

  const oldObj =
    oldVal && typeof oldVal === 'object' && !Array.isArray(oldVal) ? oldVal : {}
  const newObj =
    newVal && typeof newVal === 'object' && !Array.isArray(newVal) ? newVal : {}

  const isOldArray = Array.isArray(oldVal)
  const isNewArray = Array.isArray(newVal)
  if (isOldArray || isNewArray) {
    return (
      <pre className="whitespace-pre-wrap text-zinc-300 text-xs">
        {oldVal !== null && (
          <div className="text-rose-400">
            - {JSON.stringify(oldVal, null, 2)}
          </div>
        )}
        {newVal !== null && (
          <div className="text-emerald-400">
            + {JSON.stringify(newVal, null, 2)}
          </div>
        )}
      </pre>
    )
  }

  const diffLines = buildDiffLines(oldObj, newObj)
  return (
    <pre className="space-y-0.5 whitespace-pre">
      {diffLines.map((line, idx) => (
        <div
          key={idx}
          className={
            line.type === 'added'
              ? 'rounded bg-emerald-950/30 px-1 py-0.5 font-bold leading-normal text-emerald-400'
              : line.type === 'removed'
                ? 'rounded bg-rose-950/30 px-1 py-0.5 leading-normal text-rose-400 line-through opacity-70'
                : 'px-1 py-0.5 leading-normal text-zinc-500'
          }
        >
          {line.text}
        </div>
      ))}
    </pre>
  )
}

// ─── Expanded Row ──────────────────────────────────────────────────────────────

function ExpandedRow({ log }: { log: AuditLogEntry }) {
  return (
    <tr>
      <td
        colSpan={5}
        className="border-b border-zinc-800 bg-zinc-900/60 px-6 pb-6"
      >
        <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3">
          {/* Diff */}
          <div className="space-y-2 md:col-span-2">
            <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-zinc-400 uppercase">
              <RiFileList3Line className="h-3.5 w-3.5 text-emerald-400" />
              Alterações no Payload (Git Diff)
            </h4>
            <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs shadow-inner">
              <JsonDiffViewer oldVal={log.oldValues} newVal={log.newValues} />
            </div>
          </div>

          {/* Network Info */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-zinc-400 uppercase">
              <RiShieldCheckLine className="h-3.5 w-3.5 text-emerald-400" />
              Informações de Rede
            </h4>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs shadow-inner">
              <dl className="space-y-2">
                <div>
                  <dt className="font-semibold text-zinc-500">IP Address</dt>
                  <dd className="text-zinc-300">{log.ipAddress ?? '—'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-zinc-500">User-Agent</dt>
                  <dd className="break-all text-[10px] text-zinc-300">
                    {log.userAgent ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-zinc-500">ID do Log</dt>
                  <dd className="break-all text-[10px] text-zinc-300">
                    {log.id}
                  </dd>
                </div>
                {log.entityId && (
                  <div>
                    <dt className="font-semibold text-zinc-500">
                      ID do Recurso
                    </dt>
                    <dd className="break-all text-[10px] text-zinc-300">
                      {log.entityId}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function StoreAuditTab({ storeId }: { storeId: string }) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [actionFilter, setActionFilter] = useState('ALL')
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  const {
    data: res,
    isLoading,
    isError,
  } = useQuery<{
    data: AuditLogEntry[]
    meta: { page: number; perPage: number; total: number; totalPages: number }
  }>({
    queryKey: ['store-audit-tab', storeId, search, page, limit, actionFilter],
    queryFn: async () => {
      let url = `/audit?entity=Store&entityId=${storeId}&page=${page}&perPage=${limit}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      if (actionFilter !== 'ALL')
        url += `&action=${encodeURIComponent(actionFilter)}`

      const response = await apiClient<any>(url)
      return {
        data: response?.data?.logs || response?.data || [],
        meta: response?.meta || {
          page,
          perPage: limit,
          total: response?.data?.logs?.length || 0,
          totalPages: 1,
        },
      }
    },
  })

  const auditLogsList: AuditLogEntry[] = res?.data || []

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

  const toggleRow = (id: string) =>
    setExpandedRowId((prev) => (prev === id ? null : id))

  return (
    <div className="space-y-6 text-zinc-100 antialiased">
      <TableWrapper
        title="Auditoria de Eventos e Alterações da Loja"
        description="Histórico imutável de ações administrativas, edições e eventos de segurança nesta loja."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
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
                setActionFilter(e.target.value)
                setPage(1)
              }}
              wrapperClassName="w-48"
            >
              <option value="ALL">Todas as Ações</option>
              <option value="CREATE">Criação (CREATE)</option>
              <option value="UPDATE">Edição (UPDATE)</option>
              <option value="DELETE">Exclusão (DELETE)</option>
              <option value="MEMBER_ADD">Membro Adicionado</option>
              <option value="MEMBER_REMOVE">Membro Removido</option>
              <option value="STATUS_CHANGE">Mudança de Status</option>
            </NativeSelect>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ['store-audit-tab'],
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
          setLimit(newLimit)
          setPage(1)
        }}
      >
        <table className="w-full border-collapse text-left text-sm table-fixed">
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '29%' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs tracking-wider text-zinc-400 uppercase">
              <th className="px-5 py-3.5 font-semibold">Data &amp; Hora</th>
              <th className="px-5 py-3.5 font-semibold">Autor</th>
              <th className="px-5 py-3.5 font-semibold">Ação</th>
              <th className="px-5 py-3.5 font-semibold">Entidade</th>
              <th className="px-5 py-3.5 font-semibold">ID do Recurso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {auditLogsList.map((log) => {
              const isExpanded = expandedRowId === log.id
              const authorName = log.user?.name ?? 'Sistema'
              const authorEmail = log.user?.email ?? null

              return (
                <Fragment key={log.id}>
                  <tr
                    onClick={() => toggleRow(log.id)}
                    className={`cursor-pointer select-none transition-colors hover:bg-zinc-800/30 ${
                      isExpanded ? 'bg-zinc-800/20' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="px-5 py-4 font-mono text-xs text-zinc-400">
                      {formatDateTime(log.createdAt)}
                    </td>

                    {/* Author */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-xs font-semibold text-emerald-300">
                          {authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-none text-zinc-100">
                            {authorName}
                          </p>
                          {authorEmail && (
                            <p className="text-[10px] text-zinc-500">
                              {authorEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="px-5 py-4">
                      <ActionBadge action={log.action} />
                    </td>

                    {/* Entity */}
                    <td className="px-5 py-4 text-xs font-semibold text-zinc-300">
                      {getEntityLabel(log.entity)}
                    </td>

                    {/* Entity ID + Expand Arrow */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-zinc-500">
                          {log.entityId
                            ? `${log.entityId.substring(0, 12)}…`
                            : '—'}
                        </span>
                        {isExpanded ? (
                          <RiArrowUpSLine className="h-4 w-4 shrink-0 text-zinc-500" />
                        ) : (
                          <RiArrowDownSLine className="h-4 w-4 shrink-0 text-zinc-500" />
                        )}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && <ExpandedRow log={log} />}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  )
}
