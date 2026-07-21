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
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 antialiased font-sans">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif tracking-tight">
            Minha Conta de Cliente
          </h1>
          <p className="text-xs text-amber-300/80 mt-1">
            Gerencie suas informações cadastrais na Verttex
          </p>
        </div>

        <div className="bg-amber-950/40 p-8 rounded-3xl border border-amber-900/40 space-y-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-amber-900/40 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-amber-900/60 text-amber-400 border border-amber-800/60">
                <RiUser3Line className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-white">Dados Pessoais</h2>
            </div>

            <Link
              href="/perfil/alterar-senha"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-amber-800/60 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 transition-colors"
            >
              <RiLockPasswordLine className="h-3.5 w-3.5" />
              <span>Alterar Senha</span>
            </Link>
          </div>

          {successMessage && (
            <div className="rounded-2xl bg-emerald-950/60 border border-emerald-800/60 p-4 text-xs text-emerald-300">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
                E-mail (Não alterável)
              </label>
              <input
                type="email"
                disabled
                value={customer?.email || ''}
                className="w-full mt-1.5 px-4 py-2.5 bg-amber-950/60 border border-amber-900/40 rounded-xl text-xs text-amber-400/60 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-amber-950/80 border border-amber-800/60 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-amber-950/80 border border-amber-800/60 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-950 transition-colors flex items-center justify-center space-x-2 mt-4"
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
