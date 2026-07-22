'use client'

import { useQuery } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiFileList3Line,
  RiShieldCheckLine,
} from 'react-icons/ri'

import { NativeSelect } from '@/components/ui/native-select'
import { TableWrapper } from '../../../components/ui/table-wrapper'
import { listAuditLogs } from '../../../lib/api/audit'
import type { AuditLogEntry } from '../../../lib/api/audit'
import { auditQueryKeys } from '../../../lib/query-keys'

// ─── Entity Labels ────────────────────────────────────────────────────────────

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

// ─── Action Badge ─────────────────────────────────────────────────────────────

const actionBadgeConfig: Record<
  string,
  { label: string; className: string }
> = {
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
  PASSWORD_RESET: {
    label: 'Reset Senha',
    className: 'border-zinc-700 bg-zinc-800 text-zinc-300',
  },
  PASSWORD_CHANGE: {
    label: 'Alt. Senha',
    className: 'border-zinc-700 bg-zinc-800 text-zinc-300',
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

// ─── Sensitive Keys Masking ───────────────────────────────────────────────────

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

// ─── JSON Diff Viewer ─────────────────────────────────────────────────────────

type DiffLine = {
  text: string
  type: 'added' | 'removed' | 'unchanged'
}

function buildDiffLines(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>
): DiffLine[] {
  const allKeys = Array.from(
    new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
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

  // If one of them is an array, show raw JSON
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

// ─── Expanded Row ─────────────────────────────────────────────────────────────

function ExpandedRow({ log }: { log: AuditLogEntry }) {
  return (
    <tr>
      <td
        colSpan={6}
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
                  <dd className="text-zinc-300">
                    {log.ipAddress ?? '—'}
                  </dd>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  const filters = {
    page,
    perPage,
    search: search || undefined,
    userId: userIdFilter || undefined,
    action: actionFilter || undefined,
    entity: entityFilter || undefined,
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: auditQueryKeys.list(filters),
    queryFn: () => listAuditLogs(filters),
  })

  const logs = data?.data?.logs ?? []
  const filterOptions = data?.data?.filters
  const hasActiveFilters = Boolean(
    search || userIdFilter || actionFilter || entityFilter
  )

  const clearFilters = () => {
    setSearch('')
    setUserIdFilter('')
    setActionFilter('')
    setEntityFilter('')
    setPage(1)
  }

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

  const toggleRow = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      <TableWrapper
        title="Logs de Auditoria"
        description="Rastreamento completo de ações de usuários e do sistema — criações, atualizações, exclusões e eventos de segurança."
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        searchPlaceholder="Buscar por ação, entidade, IP ou usuário..."
        filters={
          <div className="flex flex-wrap items-center gap-2">
            {/* Author */}
            <NativeSelect
              value={userIdFilter}
              onChange={(e) => {
                setUserIdFilter(e.target.value)
                setPage(1)
              }}
              wrapperClassName="w-44"
            >
              <option value="">Todos os autores</option>
              {filterOptions?.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </NativeSelect>

            {/* Action */}
            <NativeSelect
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setPage(1)
              }}
              wrapperClassName="w-40"
            >
              <option value="">Todas as ações</option>
              {filterOptions?.actions.map((a) => (
                <option key={a} value={a}>
                  {actionBadgeConfig[a]?.label ?? a}
                </option>
              ))}
            </NativeSelect>

            {/* Entity */}
            <NativeSelect
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value)
                setPage(1)
              }}
              wrapperClassName="w-40"
            >
              <option value="">Todas as entidades</option>
              {filterOptions?.entities.map((e) => (
                <option key={e} value={e}>
                  {getEntityLabel(e)}
                </option>
              ))}
            </NativeSelect>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="cursor-pointer rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              >
                Limpar
              </button>
            )}
          </div>
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={logs.length === 0}
        emptyTitle={
          hasActiveFilters
            ? 'Nenhum log encontrado para os filtros selecionados'
            : 'Nenhum log de auditoria registrado'
        }
        emptyDescription={
          hasActiveFilters
            ? 'Tente remover os filtros para ver todos os registros.'
            : 'Os logs aparecerão aqui à medida que os usuários realizarem ações no sistema.'
        }
        meta={data?.meta}
        onPageChange={setPage}
        perPageValue={perPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage)
          setPage(1)
        }}
      >
        <table className="w-full border-collapse text-left text-sm table-fixed">
          <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '23%' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs tracking-wider text-zinc-400 uppercase">
              <th className="px-6 py-3.5 font-semibold">Data / Hora</th>
              <th className="px-6 py-3.5 font-semibold">Autor</th>
              <th className="px-6 py-3.5 font-semibold">Cargo</th>
              <th className="px-6 py-3.5 font-semibold">Ação</th>
              <th className="px-6 py-3.5 font-semibold">Entidade</th>
              <th className="px-6 py-3.5 font-semibold">ID do Recurso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {logs.map((log) => {
              const isExpanded = expandedRowId === log.id
              const authorName = log.user?.name ?? 'Sistema'
              const authorEmail = log.user?.email ?? null
              const roleLabel = log.user?.role?.name ?? 'Sistema'

              return (
                <Fragment key={log.id}>
                  <tr
                    onClick={() => toggleRow(log.id)}
                    className={`cursor-pointer select-none transition-colors hover:bg-zinc-800/30 ${
                      isExpanded ? 'bg-zinc-800/20' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                      {formatDateTime(log.createdAt)}
                    </td>

                    {/* Author */}
                    <td className="px-6 py-4">
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

                    {/* Role */}
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {roleLabel}
                    </td>

                    {/* Action badge */}
                    <td className="px-6 py-4">
                      <ActionBadge action={log.action} />
                    </td>

                    {/* Entity */}
                    <td className="px-6 py-4 text-xs font-semibold text-zinc-300">
                      {getEntityLabel(log.entity)}
                    </td>

                    {/* Entity ID */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-zinc-500">
                          {log.entityId
                            ? `${log.entityId.substring(0, 10)}…`
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
