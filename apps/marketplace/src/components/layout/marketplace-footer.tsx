import Link from 'next/link'

export function MarketplaceFooter() {
  return (
    <footer className="font-sans text-stone-700 antialiased">
      {/* Bottom Compact Links & Copyright Section */}
      <div className="bg-stone-50 py-8">
        <div className="mx-auto max-w-7xl space-y-4 px-4 text-center sm:px-6 lg:px-8">
          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-stone-600">
            <Link
              href="/lojas"
              className="hover:text-stone-900 transition-colors"
            >
              Produtores Parceiros
            </Link>
            <Link
              href="/produtos"
              className="hover:text-stone-900 transition-colors"
            >
              Todos os Produtos
            </Link>
            <span className="cursor-pointer hover:text-stone-900 transition-colors">
              Termos e condições
            </span>
            <span className="cursor-pointer hover:text-stone-900 transition-colors">
              Como cuidamos da sua privacidade
            </span>
            <Link
              href="/atendimento"
              className="hover:text-stone-900 transition-colors"
            >
              Contato & Suporte
            </Link>
          </div>

          {/* Legal / Copyright Info */}
          <div className="space-y-1 text-[11px] text-stone-400">
            <p>
              Copyright © {new Date().getFullYear()} Verttex Mercado Regional
              Ltda. Todos os direitos reservados.
            </p>
            <p>
              CNPJ n.º 00.000.000/0001-00 / Serra Gaúcha, RS - Brasil — Empresa
              do grupo Verttex.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
