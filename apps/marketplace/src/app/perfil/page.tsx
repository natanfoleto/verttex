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
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 font-sans antialiased">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white">
            Minha Conta de Cliente
          </h1>
          <p className="mt-1 text-xs text-amber-300/80">
            Gerencie suas informações cadastrais na Verttex
          </p>
        </div>

        <div className="space-y-6 rounded-3xl border border-amber-900/40 bg-amber-950/40 p-8 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-amber-900/40 pb-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-2xl border border-amber-800/60 bg-amber-900/60 p-2.5 text-amber-400">
                <RiUser3Line className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-white">Dados Pessoais</h2>
            </div>

            <Link
              href="/perfil/alterar-senha"
              className="inline-flex items-center space-x-1.5 rounded-full border border-amber-800/60 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-900/50"
            >
              <RiLockPasswordLine className="h-3.5 w-3.5" />
              <span>Alterar Senha</span>
            </Link>
          </div>

          {successMessage && (
            <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 p-4 text-xs text-emerald-300">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold tracking-wider text-amber-200/90 uppercase">
                E-mail (Não alterável)
              </label>
              <input
                type="email"
                disabled
                value={customer?.email || ''}
                className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-amber-900/40 bg-amber-950/60 px-4 py-2.5 text-xs text-amber-400/60"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold tracking-wider text-amber-200/90 uppercase">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-amber-800/60 bg-amber-950/80 px-4 py-2.5 text-xs text-white transition-colors focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold tracking-wider text-amber-200/90 uppercase">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-amber-800/60 bg-amber-950/80 px-4 py-2.5 text-xs text-white transition-colors focus:border-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex w-full items-center justify-center space-x-2 rounded-xl bg-amber-600 px-4 py-3 text-xs font-semibold text-white shadow-md shadow-amber-950 transition-colors hover:bg-amber-500"
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
