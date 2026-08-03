import Link from 'next/link'
import { RiTimeLine } from 'react-icons/ri'

export default function SessionExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 font-sans text-zinc-100 antialiased">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-800/60 bg-amber-950/60 text-amber-400">
          <RiTimeLine className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-100">Sessão Expirada</h2>
          <p className="text-sm text-zinc-400">
            Sua sessão de acesso expirou por inatividade ou renovação de
            credenciais. Por favor, autentique-se novamente.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-500"
        >
          Ir para Login
        </Link>
      </div>
    </div>
  )
}
