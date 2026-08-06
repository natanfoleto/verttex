import Link from 'next/link'
import {
  RiArrowRightSLine,
  RiBankCardLine,
  RiShieldCheckLine,
  RiTruckLine,
} from 'react-icons/ri'

export function MarketplaceValueProps() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Payment */}
        <div className="group flex flex-col justify-between rounded-md bg-stone-50 p-6 shadow-2xs transition-all">
          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-stone-50 text-stone-800 shadow-2xs transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <RiBankCardLine className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold tracking-tight text-stone-900">
                Escolha como pagar
              </h4>
              <p className="text-xs leading-relaxed font-normal text-stone-500">
                Pague com Pix, cartão de crédito ou boleto. Processamento seguro
                garantido pela tecnologia Verttex.
              </p>
            </div>
          </div>
          <div className="mt-2 border-t border-stone-200/60 pt-4">
            <Link
              href="/produtos"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition-colors group-hover:underline hover:text-emerald-700"
            >
              <span>Como pagar com Verttex</span>
              <RiArrowRightSLine className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Delivery */}
        <div className="group flex flex-col justify-between rounded-md bg-stone-50 p-6 shadow-2xs transition-all">
          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-stone-50 text-stone-800 shadow-2xs transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <RiTruckLine className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold tracking-tight text-stone-900">
                Frete e entrega na sua região
              </h4>
              <p className="text-xs leading-relaxed font-normal text-stone-500">
                Logística regional dedicada para preservar o frescor e a
                qualidade dos alimentos artesanais.
              </p>
            </div>
          </div>
          <div className="mt-2 border-t border-stone-200/60 pt-4">
            <Link
              href="/produtos"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition-colors group-hover:underline hover:text-emerald-700"
            >
              <span>Conheça as opções de entrega</span>
              <RiArrowRightSLine className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: Security */}
        <div className="group flex flex-col justify-between rounded-md bg-stone-50 p-6 shadow-2xs transition-all">
          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-stone-50 text-stone-800 shadow-2xs transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <RiShieldCheckLine className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold tracking-tight text-stone-900">
                Segurança, do início ao fim
              </h4>
              <p className="text-xs leading-relaxed font-normal text-stone-500">
                Sua compra 100% protegida. Do produtor credenciado direto para a
                sua mesa.
              </p>
            </div>
          </div>
          <div className="mt-2 border-t border-stone-200/60 pt-4">
            <Link
              href="/atendimento"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition-colors group-hover:underline hover:text-emerald-700"
            >
              <span>Como te protegemos</span>
              <RiArrowRightSLine className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
