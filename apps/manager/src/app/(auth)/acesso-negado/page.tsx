import Link from 'next/link'
import { RiShieldCrossLine } from 'react-icons/ri'

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 font-sans text-zinc-100 antialiased">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-800/60 bg-rose-950/60 text-rose-400">
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
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          Voltar ao Painel Principal
        </Link>
      </div>
    </div>
  )
}
