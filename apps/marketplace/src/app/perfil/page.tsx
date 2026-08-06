'use client'

import { useEffect, useState } from 'react'
import { RiCheckLine, RiUser3Line } from 'react-icons/ri'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { CustomerAuthGuard } from '../../components/guards/customer-auth-guard'
import { ProfileHeader } from '../../components/profile/profile-header'
import { apiClient, ApiError } from '../../lib/api-client'
import { useCustomer } from '../../providers/customer-auth-provider'

export default function CustomerProfilePage() {
  const { customer, refetchCustomer } = useCustomer()

  const [name, setName] = useState(customer?.name || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [cpfCnpj, setCpfCnpj] = useState(customer?.cpfCnpj || '')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (customer) {
      setName(customer.name || '')
      setPhone(customer.phone || '')
      setCpfCnpj(customer.cpfCnpj || '')
    }
  }, [customer])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      setIsSubmitting(true)
      await apiClient('/customer/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name, phone, cpfCnpj }),
      })
      refetchCustomer()
      setSuccessMessage('Perfil atualizado com sucesso!')
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Erro ao atualizar perfil.')
      } else {
        setErrorMessage('Erro inesperado ao atualizar perfil.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDirty = customer
    ? name !== customer.name ||
      phone !== (customer.phone || '') ||
      cpfCnpj !== (customer.cpfCnpj || '')
    : false

  return (
    <CustomerAuthGuard>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 font-sans text-stone-900 antialiased sm:px-6 lg:px-8">
        <ProfileHeader />

        {/* Form Box */}
        <div className="space-y-6 rounded-2xl border border-stone-200/80 bg-white p-8 shadow-xs">
          <div className="flex items-center space-x-3 border-b border-stone-200 pb-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-800">
              <RiUser3Line className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Dados Pessoais
              </h2>
              <p className="text-xs text-stone-500">
                Atualize seus dados cadastrais para facilitar o atendimento.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-5">
            <div>
              <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                E-mail (Não alterável)
              </label>
              <Input
                type="email"
                value={customer?.email || ''}
                disabled
                className="mt-1.5 cursor-not-allowed bg-stone-100/80 text-xs text-stone-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                Nome Completo
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="mt-1.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                  CPF ou CNPJ
                </label>
                <Input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  placeholder="000.000.000-00"
                  className="mt-1.5 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                  Telefone / WhatsApp
                </label>
                <Input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="mt-1.5 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isDirty || isSubmitting}
              className="mt-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RiCheckLine className="h-4 w-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
            </Button>
          </form>
        </div>
      </div>
    </CustomerAuthGuard>
  )
}
