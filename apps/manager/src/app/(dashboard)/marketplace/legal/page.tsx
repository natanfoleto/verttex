'use client'

import { RiShieldLine } from 'react-icons/ri'

export default function MarketplaceLegalPage() {
  return (
    <div className="flex min-h-100 flex-col items-center justify-center space-y-4 p-12 text-center font-sans text-zinc-100">
      <div className="flex size-16 items-center justify-center rounded-full border border-zinc-700/60 bg-zinc-800/80 text-zinc-400">
        <RiShieldLine className="h-8 w-8 text-emerald-400" />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-zinc-100">
        Documentos Legais — Em Breve
      </h1>
      <p className="max-w-md text-xs leading-relaxed text-zinc-400">
        O módulo para gestão dos Termos de Uso, Política de Privacidade e
        Regulamentos Sanitários Regionais estará disponível em breve.
      </p>
    </div>
  )
}
