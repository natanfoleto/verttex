'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NativeSelect } from '@/components/ui/native-select'
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
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/lojas/${storeId}`}
          className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
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
        className="w-full space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
      >
        <h2 className="flex items-center space-x-2 text-base font-semibold text-zinc-200">
          <RiUserAddLine className="h-5 w-5 text-emerald-400" />
          <span>Vincular Novo Membro</span>
        </h2>

        {errorMessage && (
          <div className="rounded-xl border border-rose-800/80 bg-rose-950/50 p-3 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <NativeSelect
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            wrapperClassName="flex-1"
          >
            <option value="">Selecione um usuário para vincular...</option>
            {usersData?.data?.map(
              (user: { id: string; name: string; email: string }) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              )
            )}
          </NativeSelect>

          <label className="flex cursor-pointer items-center space-x-2 px-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={isOwner}
              onChange={(e) => setIsOwner(e.target.checked)}
            />
            <span>Proprietário</span>
          </label>

          <button
            type="submit"
            disabled={!selectedUserId || addMemberMutation.isPending}
            className="shrink-0 cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {addMemberMutation.isPending ? 'Adicionando...' : 'Vincular'}
          </button>
        </div>
      </form>

      {/* Members List */}
      <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <div className="border-b border-zinc-800 bg-zinc-950/60 p-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
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
                  className="flex items-center justify-between p-4 transition-colors hover:bg-zinc-800/20"
                >
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-zinc-100">
                        {su.user.name}
                      </span>
                      {su.isOwner && (
                        <span className="rounded border border-emerald-800 bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase">
                          Proprietário
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {su.user.email}
                    </p>
                  </div>

                  <button
                    onClick={() => removeMemberMutation.mutate(su.user.id)}
                    disabled={removeMemberMutation.isPending}
                    className="cursor-pointer rounded-lg border border-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-rose-400"
                    title="Desvincular membro"
                  >
                    <RiDeleteBinLine className="h-4 w-4" />
                  </button>
                </div>
              )
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
