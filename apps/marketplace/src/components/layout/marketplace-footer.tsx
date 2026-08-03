import Link from "next/link";
import {
  RiArrowRightSLine,
  RiBankCardLine,
  RiShieldCheckLine,
  RiTruckLine,
} from "react-icons/ri";

export function MarketplaceFooter() {
  return (
    <footer className="bg-stone-50 font-sans text-stone-700 antialiased">
      {/* Top Value Proposition Section — Cards Cinza no Fundo Padrão do Site (sem bordas superiores/cards) */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Card 1: Payment */}
          <div className="flex flex-col justify-between rounded-md bg-stone-100 p-6 shadow-2xs hover:bg-stone-100 transition-all group">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-stone-50 text-stone-800 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <RiBankCardLine className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-stone-900 tracking-tight">
                  Escolha como pagar
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed font-normal">
                  Pague com Pix, cartão de crédito ou boleto. Processamento seguro garantido pela tecnologia Verttex.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-stone-200/60">
              <Link
                href="/produtos"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group-hover:underline"
              >
                <span>Como pagar com Verttex</span>
                <RiArrowRightSLine className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: Delivery */}
          <div className="flex flex-col justify-between rounded-md bg-stone-100 p-6 shadow-2xs hover:bg-stone-100 transition-all group">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-stone-50 text-stone-800 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <RiTruckLine className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-stone-900 tracking-tight">
                  Frete e entrega na sua região
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed font-normal">
                  Logística regional dedicada para preservar o frescor e a qualidade dos alimentos artesanais.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-stone-200/60">
              <Link
                href="/produtos"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group-hover:underline"
              >
                <span>Conheça as opções de entrega</span>
                <RiArrowRightSLine className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 3: Security */}
          <div className="flex flex-col justify-between rounded-md bg-stone-100 p-6 shadow-2xs hover:bg-stone-100 transition-all group">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-stone-50 text-stone-800 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <RiShieldCheckLine className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-stone-900 tracking-tight">
                  Segurança, do início ao fim
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed font-normal">
                  Sua compra 100% protegida. Do produtor credenciado direto para a sua mesa.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-stone-200/60">
              <Link
                href="/atendimento"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group-hover:underline"
              >
                <span>Como te protegemos</span>
                <RiArrowRightSLine className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Compact Links & Copyright Section */}
      <div className="bg-stone-100 py-8">
        <div className="mx-auto max-w-7xl space-y-4 px-4 text-center sm:px-6 lg:px-8">
          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-stone-600">
            <Link href="/lojas" className="hover:text-stone-900 transition-colors">
              Produtores Parceiros
            </Link>
            <Link href="/produtos" className="hover:text-stone-900 transition-colors">
              Todos os Produtos
            </Link>
            <span className="cursor-pointer hover:text-stone-900 transition-colors">
              Termos e condições
            </span>
            <span className="cursor-pointer hover:text-stone-900 transition-colors">
              Como cuidamos da sua privacidade
            </span>
            <Link href="/atendimento" className="hover:text-stone-900 transition-colors">
              Contato & Suporte
            </Link>
          </div>

          {/* Legal / Copyright Info */}
          <div className="space-y-1 text-[11px] text-stone-400">
            <p>
              Copyright © {new Date().getFullYear()} Verttex Mercado Regional Ltda. Todos os direitos reservados.
            </p>
            <p>
              CNPJ n.º 00.000.000/0001-00 / Serra Gaúcha, RS - Brasil — Empresa do grupo Verttex.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
