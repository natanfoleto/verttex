import Link from 'next/link'
import {
  RiHeartLine,
  RiMapPinLine,
  RiShieldCheckLine,
  RiTruckLine,
} from 'react-icons/ri'

export function MarketplaceFooter() {
  return (
    <footer className="bg-amber-950 text-amber-200 border-t border-amber-900/60 pt-16 pb-12 antialiased font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Value Proposition Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-amber-900/50">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-2xl bg-amber-900/50 border border-amber-800/60 text-amber-400 shrink-0">
              <RiMapPinLine className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">
                Origem & Produtores
              </h4>
              <p className="text-xs text-amber-300/70 mt-1 leading-relaxed">
                Produtos selecionados diretamente de pequenos produtores da
                nossa região.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-2xl bg-amber-900/50 border border-amber-800/60 text-amber-400 shrink-0">
              <RiShieldCheckLine className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">
                Compra Garantida
              </h4>
              <p className="text-xs text-amber-300/70 mt-1 leading-relaxed">
                A Verttex assegura o pagamento e o suporte de ponta a ponta do
                seu pedido.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-2xl bg-amber-900/50 border border-amber-800/60 text-amber-400 shrink-0">
              <RiTruckLine className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Entrega Direta</h4>
              <p className="text-xs text-amber-300/70 mt-1 leading-relaxed">
                Logística regional cuidada para manter a frescura e qualidade
                dos alimentos.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-lg text-white">
                V
              </div>
              <span className="font-bold text-lg text-white font-serif">
                Verttex
              </span>
            </div>
            <p className="text-xs text-amber-300/70 leading-relaxed">
              Valorizamos os produtores locais e conectamos quem produz com quem
              aprecia a verdadeira qualidade artesanal.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
              Navegação
            </h5>
            <ul className="space-y-2.5 text-xs text-amber-300/80">
              <li>
                <Link
                  href="/lojas"
                  className="hover:text-white transition-colors"
                >
                  Produtores Parceiros
                </Link>
              </li>
              <li>
                <Link
                  href="/produtos"
                  className="hover:text-white transition-colors"
                >
                  Todos os Produtos
                </Link>
              </li>
              <li>
                <Link
                  href="/cadastro"
                  className="hover:text-white transition-colors"
                >
                  Criar Conta de Cliente
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
              Para Produtores
            </h5>
            <ul className="space-y-2.5 text-xs text-amber-300/80">
              <li>
                <span className="hover:text-white transition-colors">
                  Como vender na Verttex
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors">
                  Painel de Gestão (Manager)
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors">
                  Políticas de Qualidade
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
              Atendimento & Suporte
            </h5>
            <p className="text-xs text-amber-300/70 leading-relaxed">
              Segunda a Sexta das 8h às 18h
              <br />
              suporte@verttexloja.com.br
            </p>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-amber-900/40 flex flex-col sm:flex-row items-center justify-between text-xs text-amber-400/60 gap-4">
          <p>
            © {new Date().getFullYear()} Verttex Mercado Regional. Todos os
            direitos reservados.
          </p>
          <div className="flex items-center space-x-1">
            <span>Desenvolvido com</span>
            <RiHeartLine className="h-3.5 w-3.5 text-rose-400 inline" />
            <span>para nossa comunidade.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
