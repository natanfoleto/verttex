import Link from 'next/link'
import { RiShieldCrossLine } from 'react-icons/ri'

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100 antialiased font-sans">
      <div className="w-full max-w-md text-center space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-400">
          <RiShieldCrossLine className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-100">Acesso Negado</h2>
          <p className="text-sm text-zinc-400">
            Você não possui a permissão necessária para visualizar esta
            funcionalidade. Solicite acesso ao administrador do sistema.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm transition-colors"
        >
          Voltar ao Painel Principal
        </Link>
      </div>
    </div>
  )
}
