'use client'

import Link from 'next/link'
import { RiArrowRightLine, RiHeartLine, RiStore2Line } from 'react-icons/ri'

export default function MarketplaceHomePage() {
  return (
    <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans text-stone-100">
      {/* Hero Section */}
      <section className="relative rounded-3xl border border-amber-900/40 bg-linear-to-br from-amber-950 via-stone-900 to-amber-950/80 p-8 sm:p-14 shadow-2xl overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-64 w-64 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="relative max-w-2xl space-y-6">
          <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-900/60 text-amber-300 border border-amber-800/60">
            <RiHeartLine className="h-3.5 w-3.5 text-amber-400" />
            <span>Feito com paixão na nossa região</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white font-serif tracking-tight leading-tight">
            Descubra sabores autênticos e produtores locais.
          </h1>
          <p className="text-sm sm:text-base text-amber-200/80 leading-relaxed">
            Na Verttex, aproximamos você de queijos artesanais, vinhos da serra,
            doces caseiros, méis puros e embutidos tradicionais diretamente de
            quem produz.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/lojas"
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-amber-950"
            >
              <RiStore2Line className="h-4 w-4" />
              <span>Conhecer Produtores</span>
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-full border border-amber-800/80 text-amber-200 hover:bg-amber-900/40 font-semibold text-xs transition-colors"
            >
              <span>Criar Conta de Cliente</span>
              <RiArrowRightLine className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
