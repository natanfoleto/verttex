import Link from 'next/link'
import { RiStore2Line } from 'react-icons/ri'

export default function StoreDetailPlaceholderPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-24 text-center font-sans antialiased">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-800/60 bg-amber-900/40 text-amber-400 shadow-xl">
        <RiStore2Line className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white">
          Página do Produtor — Em Breve
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-amber-300/80">
          A vitrine e história deste produtor estarão disponíveis em breve.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center rounded-full bg-amber-600 px-6 py-3 text-xs font-semibold text-white shadow-md shadow-amber-950 transition-colors hover:bg-amber-500"
      >
        Voltar à Página Inicial
      </Link>
    </div>
  )
}
