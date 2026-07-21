'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { RiAddLine, RiEditLine, RiEyeLine, RiShieldLine } from 'react-icons/ri'

import { TableWrapper } from '../../../components/ui/table-wrapper'
import { apiClient } from '../../../lib/api-client'

export default function RolesListPage() {
  const {
    data: roles,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => apiClient('/roles'),
  })

  return (
    <TableWrapper
      title="Cargos e Permissões"
      description="Gerencie os cargos do sistema e as permissões de cada perfil de acesso"
      actionButton={
        <Link
          href="/cargos/novo"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-md shadow-emerald-950 transition-colors"
        >
          <RiAddLine className="h-4 w-4" />
          <span>Novo Cargo</span>
        </Link>
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={!roles || roles.length === 0}
    >
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs text-zinc-400 uppercase tracking-wider">
            <th className="py-3.5 px-6 font-semibold">Cargo</th>
            <th className="py-3.5 px-6 font-semibold">Identificador (Key)</th>
            <th className="py-3.5 px-6 font-semibold">Tipo</th>
            <th className="py-3.5 px-6 font-semibold">Status</th>
            <th className="py-3.5 px-6 font-semibold text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          {roles?.map(
            (role: {
              id: string
              name: string
              key: string
              isSystem: boolean
              isActive: boolean
            }) => (
              <tr
                key={role.id}
                className="hover:bg-zinc-800/30 transition-colors"
              >
                <td className="py-4 px-6 font-medium text-zinc-100">
                  {role.name}
                </td>
                <td className="py-4 px-6 font-mono text-xs text-zinc-400">
                  {role.key}
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      role.isSystem
                        ? 'bg-purple-950 text-purple-300 border-purple-800'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {role.isSystem ? 'Sistema' : 'Customizado'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      role.isActive
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border-rose-800'
                    }`}
                  >
                    {role.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right space-x-2">
                  <Link
                    href={`/cargos/${role.id}`}
                    className="inline-flex items-center p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                    title="Ver detalhes"
                  >
                    <RiEyeLine className="h-4 w-4" />
                  </Link>
                  {!role.isSystem && (
                    <Link
                      href={`/cargos/${role.id}/editar`}
                      className="inline-flex items-center p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                      title="Editar"
                    >
                      <RiEditLine className="h-4 w-4" />
                    </Link>
                  )}
                  <Link
                    href={`/cargos/${role.id}/permissoes`}
                    className="inline-flex items-center p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 transition-colors"
                    title="Configurar permissões"
                  >
                    <RiShieldLine className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </TableWrapper>
  )
}
