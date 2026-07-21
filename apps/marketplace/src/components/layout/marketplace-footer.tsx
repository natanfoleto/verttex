import Link from 'next/link'
import {
  RiHeartLine,
  RiMapPinLine,
  RiShieldCheckLine,
  RiTruckLine,
} from 'react-icons/ri'

export function MarketplaceFooter() {
  return (
    <footer className="border-t border-amber-900/60 bg-amber-950 pt-16 pb-12 font-sans text-amber-200 antialiased">
      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Badges */}
        <div className="grid grid-cols-1 gap-8 border-b border-amber-900/50 pb-12 md:grid-cols-3">
          <div className="flex items-start space-x-4">
            <div className="shrink-0 rounded-2xl border border-amber-800/60 bg-amber-900/50 p-3 text-amber-400">
              <RiMapPinLine className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Origem & Produtores
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-amber-300/70">
                Produtos selecionados diretamente de pequenos produtores da
                nossa região.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="shrink-0 rounded-2xl border border-amber-800/60 bg-amber-900/50 p-3 text-amber-400">
              <RiShieldCheckLine className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Compra Garantida
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-amber-300/70">
                A Verttex assegura o pagamento e o suporte de ponta a ponta do
                seu pedido.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="shrink-0 rounded-2xl border border-amber-800/60 bg-amber-900/50 p-3 text-amber-400">
              <RiTruckLine className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Entrega Direta</h4>
              <p className="mt-1 text-xs leading-relaxed text-amber-300/70">
                Logística regional cuidada para manter a frescura e qualidade
                dos alimentos.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-lg font-bold text-white">
                V
              </div>
              <span className="font-serif text-lg font-bold text-white">
                Verttex
              </span>
            </div>
            <p className="text-xs leading-relaxed text-amber-300/70">
              Valorizamos os produtores locais e conectamos quem produz com quem
              aprecia a verdadeira qualidade artesanal.
            </p>
          </div>

          <div>
            <h5 className="mb-4 text-xs font-bold tracking-wider text-white uppercase">
              Navegação
            </h5>
            <ul className="space-y-2.5 text-xs text-amber-300/80">
              <li>
                <Link
                  href="/lojas"
                  className="transition-colors hover:text-white"
                >
                  Produtores Parceiros
                </Link>
              </li>
              <li>
                <Link
                  href="/produtos"
                  className="transition-colors hover:text-white"
                >
                  Todos os Produtos
                </Link>
              </li>
              <li>
                <Link
                  href="/cadastro"
                  className="transition-colors hover:text-white"
                >
                  Criar Conta de Cliente
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="mb-4 text-xs font-bold tracking-wider text-white uppercase">
              Para Produtores
            </h5>
            <ul className="space-y-2.5 text-xs text-amber-300/80">
              <li>
                <span className="transition-colors hover:text-white">
                  Como vender na Verttex
                </span>
              </li>
              <li>
                <span className="transition-colors hover:text-white">
                  Painel de Gestão (Manager)
                </span>
              </li>
              <li>
                <span className="transition-colors hover:text-white">
                  Políticas de Qualidade
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="mb-4 text-xs font-bold tracking-wider text-white uppercase">
              Atendimento & Suporte
            </h5>
            <p className="text-xs leading-relaxed text-amber-300/70">
              Segunda a Sexta das 8h às 18h
              <br />
              suporte@verttexloja.com.br
            </p>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-amber-900/40 pt-8 text-xs text-amber-400/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Verttex Mercado Regional. Todos os
            direitos reservados.
          </p>
          <div className="flex items-center space-x-1">
            <span>Desenvolvido com</span>
            <RiHeartLine className="inline h-3.5 w-3.5 text-rose-400" />
            <span>para nossa comunidade.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
