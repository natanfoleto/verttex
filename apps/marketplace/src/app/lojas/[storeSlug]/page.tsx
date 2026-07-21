import Link from 'next/link'
import { RiStore2Line } from 'react-icons/ri'

export default function StoreDetailPlaceholderPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6 antialiased font-sans">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-900/40 border border-amber-800/60 text-amber-400 shadow-xl">
        <RiStore2Line className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white font-serif tracking-tight">
          Página do Produtor — Em Breve
        </h1>
        <p className="text-sm text-amber-300/80 max-w-md mx-auto leading-relaxed">
          A vitrine e história deste produtor estarão disponíveis em breve.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-md shadow-amber-950"
      >
        Voltar à Página Inicial
      </Link>
    </div>
  )
}
