'use client'

import Link from 'next/link'
import { useState } from 'react'
import { RiCheckLine, RiLockPasswordLine, RiUser3Line } from 'react-icons/ri'

import { CustomerAuthGuard } from '../../components/guards/customer-auth-guard'
import { apiClient } from '../../lib/api-client'
import { useCustomer } from '../../providers/customer-auth-provider'

export default function CustomerProfilePage() {
  const { customer, refetchCustomer } = useCustomer()

  const [name, setName] = useState(customer?.name || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await apiClient('/customer/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name, phone }),
      })
      refetchCustomer()
      setSuccessMessage('Perfil atualizado com sucesso!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      setSuccessMessage('Erro ao atualizar perfil.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomerAuthGuard>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 font-sans text-stone-900 antialiased">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
            Minha Conta de Cliente
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Gerencie suas informações cadastrais na Verttex.
          </p>
        </div>

        <div className="space-y-6 rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 pb-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-800">
                <RiUser3Line className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-stone-900">
                Dados Pessoais
              </h2>
            </div>

            <Link
              href="/perfil/alterar-senha"
              className="inline-flex items-center space-x-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-emerald-600 hover:bg-stone-50 hover:text-emerald-800"
            >
              <RiLockPasswordLine className="h-3.5 w-3.5" />
              <span>Alterar Senha</span>
            </Link>
          </div>

          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                E-mail (Não alterável)
              </label>
              <input
                type="email"
                disabled
                value={customer?.email || ''}
                className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-stone-200 bg-stone-100 px-4 py-2.5 text-xs text-stone-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs text-stone-900 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs text-stone-900 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex w-full cursor-pointer items-center justify-center space-x-2 rounded-lg bg-emerald-800 px-4 py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
            >
              <RiCheckLine className="h-4 w-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </form>
        </div>
      </div>
    </CustomerAuthGuard>
  )
}
