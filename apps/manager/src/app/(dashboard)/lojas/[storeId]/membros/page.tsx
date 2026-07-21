'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { use, useState } from 'react'
import { RiArrowLeftLine, RiDeleteBinLine, RiUserAddLine } from 'react-icons/ri'

import { apiClient, ApiError } from '../../../../../lib/api-client'

export default function StoreMembersPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const resolvedParams = use(params)
  const storeId = resolvedParams.storeId
  const queryClient = useQueryClient()

  const [selectedUserId, setSelectedUserId] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: store, isLoading: isLoadingStore } = useQuery({
    queryKey: ['store-detail', storeId],
    queryFn: () => apiClient(`/stores/${storeId}`),
  })

  const { data: usersData } = useQuery({
    queryKey: ['all-users-select'],
    queryFn: () => apiClient('/users?perPage=100'),
  })

  const addMemberMutation = useMutation({
    mutationFn: (body: { userId: string; isOwner: boolean }) =>
      apiClient(`/stores/${storeId}/users`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-detail', storeId] })
      setSelectedUserId('')
      setIsOwner(false)
      setErrorMessage(null)
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Erro ao vincular membro')
      }
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      apiClient(`/stores/${storeId}/users/${targetUserId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-detail', storeId] })
    },
  })

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return
    addMemberMutation.mutate({ userId: selectedUserId, isOwner })
  }

  if (isLoadingStore) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100 mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/lojas/${storeId}`}
          className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Membros da Loja — {store?.name}
          </h1>
          <p className="text-sm text-zinc-400">
            Gerencie os usuários autorizados a gerenciar esta loja
          </p>
        </div>
      </div>

      {/* Add Member Form */}
      <form
        onSubmit={handleAddMember}
        className="p-6 bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-4"
      >
        <h2 className="text-base font-semibold text-zinc-200 flex items-center space-x-2">
          <RiUserAddLine className="h-5 w-5 text-emerald-400" />
          <span>Vincular Novo Membro</span>
        </h2>

        {errorMessage && (
          <div className="rounded-xl bg-rose-950/50 border border-rose-800/80 p-3 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Selecione um usuário para vincular...</option>
            {usersData?.data?.map(
              (user: { id: string; name: string; email: string }) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ),
            )}
          </select>

          <label className="flex items-center space-x-2 text-sm text-zinc-300 cursor-pointer px-2">
            <input
              type="checkbox"
              checked={isOwner}
              onChange={(e) => setIsOwner(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Proprietário</span>
          </label>

          <button
            type="submit"
            disabled={!selectedUserId || addMemberMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-md disabled:opacity-50 transition-colors shrink-0"
          >
            {addMemberMutation.isPending ? 'Adicionando...' : 'Vincular'}
          </button>
        </div>
      </form>

      {/* Members List */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
          Membros Atuais
        </div>

        <div className="divide-y divide-zinc-800/60">
          {store?.users && store.users.length > 0 ? (
            store.users.map(
              (su: {
                isOwner: boolean
                user: { id: string; name: string; email: string }
              }) => (
                <div
                  key={su.user.id}
                  className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors"
                >
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-sm text-zinc-100">
                        {su.user.name}
                      </span>
                      {su.isOwner && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Proprietário
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {su.user.email}
                    </p>
                  </div>

                  <button
                    onClick={() => removeMemberMutation.mutate(su.user.id)}
                    disabled={removeMemberMutation.isPending}
                    className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                    title="Desvincular membro"
                  >
                    <RiDeleteBinLine className="h-4 w-4" />
                  </button>
                </div>
              ),
            )
          ) : (
            <div className="p-8 text-center text-sm text-zinc-500">
              Nenhum membro vinculado a esta loja.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
