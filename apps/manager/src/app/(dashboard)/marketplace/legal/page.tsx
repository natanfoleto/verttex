'use client'

import { RiShieldLine } from 'react-icons/ri'

export default function MarketplaceLegalPage() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 font-sans text-zinc-100 min-h-100">
      <div className="size-16 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400">
        <RiShieldLine className="h-8 w-8 text-emerald-400" />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-zinc-100">
        Documentos Legais — Em Breve
      </h1>
      <p className="max-w-md text-xs text-zinc-400 leading-relaxed">
        O módulo para gestão dos Termos de Uso, Política de Privacidade e
        Regulamentos Sanitários Regionais estará disponível em breve.
      </p>
    </div>
  )
}
