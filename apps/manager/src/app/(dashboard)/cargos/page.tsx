'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { RiAddLine, RiEditLine, RiShieldLine } from 'react-icons/ri'

import { TableWrapper } from '../../../components/ui/table-wrapper'
import { apiClient } from '../../../lib/api-client'
import { RoleFormDialog, RoleItem } from './components/role-form-dialog'

export default function RolesListPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)

  const {
    data: roles,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => apiClient('/roles'),
  })

  const openCreateModal = () => {
    setEditingRole(null)
    setIsDialogOpen(true)
  }

  const openEditModal = (role: RoleItem) => {
    setEditingRole(role)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      <TableWrapper
        title="Cargos e Permissões"
        description="Gerencie os cargos do sistema e as permissões de cada perfil de acesso"
        actionButton={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex cursor-pointer items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-emerald-950 transition-colors hover:bg-emerald-500"
          >
            <RiAddLine className="h-4 w-4" />
            <span>Novo Cargo</span>
          </button>
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={!roles || roles.length === 0}
      >
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs tracking-wider text-zinc-400 uppercase">
              <th className="px-6 py-3.5 font-semibold">Cargo</th>
              <th className="px-6 py-3.5 font-semibold">Identificador (Key)</th>
              <th className="px-6 py-3.5 font-semibold">Tipo</th>
              <th className="px-6 py-3.5 font-semibold">Status</th>
              <th className="px-6 py-3.5 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {roles?.map((role: RoleItem) => (
              <tr
                key={role.id}
                className="transition-colors hover:bg-zinc-800/30"
              >
                <td className="px-6 py-4 font-medium text-zinc-100">
                  {role.name}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                  {role.key}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      role.isSystem
                        ? 'border-purple-800 bg-purple-950 text-purple-300'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {role.isSystem ? 'Sistema' : 'Customizado'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      role.isActive
                        ? 'border-emerald-800 bg-emerald-950 text-emerald-400'
                        : 'border-rose-800 bg-rose-950 text-rose-400'
                    }`}
                  >
                    {role.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="space-x-2 px-6 py-4 text-right">
                  {!role.isSystem && (
                    <button
                      type="button"
                      onClick={() => openEditModal(role)}
                      className="inline-flex cursor-pointer items-center rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                      title="Editar"
                    >
                      <RiEditLine className="h-4 w-4" />
                    </button>
                  )}
                  <a
                    href={`/cargos/${role.id}/permissoes`}
                    className="inline-flex items-center rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-purple-400"
                    title="Configurar permissões"
                  >
                    <RiShieldLine className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>

      {/* Role Form Dialog Component */}
      <RoleFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingRole(null)
        }}
        roleToEdit={editingRole}
      />
    </div>
  )
}
