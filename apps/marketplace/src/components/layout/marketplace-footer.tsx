import Link from 'next/link'
import { RiBankCardLine, RiShieldCheckLine, RiTruckLine } from 'react-icons/ri'

export function MarketplaceFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white font-sans text-stone-700 antialiased">
      {/* Top Value Proposition Section (Mercado Livre Style) */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:divide-x md:divide-stone-200">
          {/* Card 1: Payment */}
          <div className="flex flex-col items-center space-y-2 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center text-emerald-800">
              <RiBankCardLine className="h-8 w-8 text-emerald-800" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">
              Escolha como pagar
            </h4>
            <p className="max-w-xs text-xs leading-relaxed text-stone-500">
              Pague com Pix, cartão de crédito ou boleto. Processamento seguro
              garantido pela tecnologia Verttex.
            </p>
            <span className="cursor-pointer pt-1 text-xs font-semibold text-emerald-800 hover:underline">
              Como pagar com Verttex
            </span>
          </div>

          {/* Card 2: Delivery */}
          <div className="flex flex-col items-center space-y-2 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center text-emerald-800">
              <RiTruckLine className="h-8 w-8 text-emerald-800" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">
              Frete e entrega na sua região
            </h4>
            <p className="max-w-xs text-xs leading-relaxed text-stone-500">
              Logística regional dedicada para preservar o frescor e a qualidade
              dos alimentos artesanais.
            </p>
            <span className="cursor-pointer pt-1 text-xs font-semibold text-emerald-800 hover:underline">
              Conheça as opções de entrega
            </span>
          </div>

          {/* Card 3: Security */}
          <div className="flex flex-col items-center space-y-2 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center text-emerald-800">
              <RiShieldCheckLine className="h-8 w-8 text-emerald-800" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">
              Segurança, do início ao fim
            </h4>
            <p className="max-w-xs text-xs leading-relaxed text-stone-500">
              Sua compra 100% protegida. Do produtor credenciado direto para a
              sua mesa.
            </p>
            <span className="cursor-pointer pt-1 text-xs font-semibold text-emerald-800 hover:underline">
              Como te protegemos
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Compact Links & Copyright Section */}
      <div className="border-t border-stone-200 bg-stone-50 py-8">
        <div className="mx-auto max-w-7xl space-y-4 px-4 text-center sm:px-6 lg:px-8">
          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-stone-600">
            <Link href="/lojas" className="hover:text-stone-900">
              Produtores Parceiros
            </Link>
            <Link href="/produtos" className="hover:text-stone-900">
              Todos os Produtos
            </Link>
            <span className="cursor-pointer hover:text-stone-900">
              Termos e condições
            </span>
            <span className="cursor-pointer hover:text-stone-900">
              Como cuidamos da sua privacidade
            </span>
            <span className="cursor-pointer hover:text-stone-900">
              Contato & Suporte
            </span>
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
