'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  RiAppleFill,
  RiEyeLine,
  RiEyeOffLine,
  RiGoogleFill,
  RiHeartLine,
  RiLockLine,
  RiMailLine,
  RiShieldCheckLine,
  RiUser3Line,
} from 'react-icons/ri'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { apiClient, ApiError } from '@/lib/api-client'
import { useCustomer } from '@/providers/customer-auth-provider'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode?: 'login' | 'register'
}

export function AuthDialog({
  open,
  onOpenChange,
  initialMode = 'login',
}: AuthDialogProps) {
  const { refetchCustomer } = useCustomer()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Sync mode state whenever dialog opens or initialMode prop changes
  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setShowPassword(false)
    }
  }, [open, initialMode])

  const handleModeSwitch = (newMode: 'login' | 'register') => {
    setMode(newMode)
    setShowPassword(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        await apiClient('/auth/customers/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        toast.success('Login realizado com sucesso!')
      } else {
        await apiClient('/auth/customers/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        })
        toast.success('Conta criada com sucesso!')
      }

      refetchCustomer()
      onOpenChange(false)
      // Reset form
      setName('')
      setEmail('')
      setPassword('')
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Erro ao realizar autenticação')
      } else {
        toast.error('Ocorreu um erro inesperado')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-170 overflow-hidden p-0 border-0 bg-stone-950 text-stone-900 shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">
          {mode === 'login' ? 'Fazer Login' : 'Criar Conta'}
        </DialogTitle>

        <div className="grid h-full grid-cols-1 md:grid-cols-12">
          {/* Left Column: Form Panel using Marketplace Light Theme */}
          <div className="md:col-span-7 flex flex-col justify-between p-8 sm:p-10 overflow-y-auto bg-white">
            <div>
              {/* Header Branding */}
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 font-bold text-white text-base shadow-xs">
                  V
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-extrabold tracking-tight text-stone-900">
                    Verttex
                  </span>
                  <span className="-mt-1 text-[10px] font-semibold tracking-widest text-amber-700 uppercase">
                    Mercado Regional
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="mt-8 space-y-1.5">
                <h2 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
                  {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                </h2>
                <p className="text-sm text-stone-500">
                  {mode === 'login'
                    ? 'Acesse sua conta para acompanhar pedidos e produtos favoritos.'
                    : 'Cadastre-se gratuitamente para comprar direto da origem.'}
                </p>
              </div>

              {/* Social Login Buttons */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    toast.info('Login social com Google em breve!')
                  }
                  className="h-11"
                >
                  <RiGoogleFill className="h-4.5 w-4.5 text-emerald-700" />
                  <span>Google</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast.info('Login social com Apple em breve!')}
                  className="h-11"
                >
                  <RiAppleFill className="h-4.5 w-4.5 text-stone-900" />
                  <span>Apple</span>
                </Button>
              </div>

              {/* Divider */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="w-full border-t border-stone-200" />
                <span className="absolute bg-white px-3 font-mono text-[10px] font-bold text-stone-400 uppercase">
                  OU
                </span>
              </div>

              {/* Form Input Fields */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <RiUser3Line className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <Input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                    E-mail
                  </label>
                  <div className="relative">
                    <RiMailLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                      Senha
                    </label>
                    {mode === 'login' && (
                      <Link
                        href="/esqueci-minha-senha"
                        onClick={() => onOpenChange(false)}
                        className="text-xs font-semibold text-emerald-800 transition-colors hover:underline"
                      >
                        Esqueceu a senha?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <RiLockLine className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        mode === 'login'
                          ? 'Sua senha'
                          : 'Crie uma senha de acesso'
                      }
                      className="h-11 pr-10 pl-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 h-6 w-6 -translate-y-1/2 p-0 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? (
                        <RiEyeOffLine className="h-4 w-4" />
                      ) : (
                        <RiEyeLine className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-11.5 w-full bg-emerald-800 hover:bg-emerald-700 font-bold"
                >
                  {isSubmitting
                    ? 'Aguarde...'
                    : mode === 'login'
                      ? 'Entrar no Marketplace'
                      : 'Criar Minha Conta'}
                </Button>
              </form>
            </div>

            {/* Bottom Mode Switcher */}
            <div className="pt-4 text-center text-xs text-stone-500">
              {mode === 'login' ? (
                <>
                  Ainda não possui uma conta?{' '}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => handleModeSwitch('register')}
                    className="p-0 font-bold text-emerald-800 hover:underline h-auto text-xs"
                  >
                    Cadastrar-se agora
                  </Button>
                </>
              ) : (
                <>
                  Já possui uma conta?{' '}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => handleModeSwitch('login')}
                    className="p-0 font-bold text-emerald-800 hover:underline h-auto text-xs"
                  >
                    Fazer login
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Visual Brand Showcase Panel */}
          <div className="md:col-span-5 relative hidden flex-col justify-between overflow-hidden border-l border-stone-200/80 bg-linear-to-br from-stone-900 via-stone-850 to-amber-950 p-8 sm:p-10 md:flex text-white">
            {/* Background Radial Glow Effects */}
            <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-emerald-600/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-amber-600/20 blur-3xl" />

            {/* Top Badge */}
            <div className="relative z-10">
              <div className="inline-flex items-center space-x-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-xs">
                <RiShieldCheckLine className="h-4 w-4 text-emerald-400" />
                <span>100% Produtores Verificados</span>
              </div>
            </div>

            {/* Middle Big Headline */}
            <div className="relative z-10 my-auto space-y-4 py-8">
              <h3 className="text-3xl font-extrabold tracking-tight text-white leading-snug sm:text-4xl">
                100+ Produtores Locais. <br />
                <span className="text-emerald-400">1.000+ Produtos</span>{' '}
                Artesanais.
              </h3>
              <p className="text-xs leading-relaxed text-stone-300 sm:text-sm">
                Queijos coloniais, vinhos nobres, méis puros e embutidos
                defumados entregues diretamente da origem para a sua mesa.
              </p>
            </div>

            {/* Bottom Visual Glassmorphic Card */}
            <div className="relative z-10 rounded-2xl border border-white/15 bg-white/10 p-5 text-xs backdrop-blur-md">
              <div className="flex items-center space-x-2 font-semibold text-amber-300">
                <RiHeartLine className="h-4.5 w-4.5 text-amber-400" />
                <span>Direto do Produtor da Serra</span>
              </div>
              <p className="mt-1.5 text-xs text-stone-300">
                Apoiando a economia familiar e preservando nossas tradições
                artesanais.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
