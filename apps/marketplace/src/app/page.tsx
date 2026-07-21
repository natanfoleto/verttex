'use client'

import Link from 'next/link'
import { RiArrowRightLine, RiHeartLine, RiStore2Line } from 'react-icons/ri'

export default function MarketplaceHomePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 font-sans text-stone-100 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-900/40 bg-linear-to-br from-amber-950 via-stone-900 to-amber-950/80 p-8 shadow-2xl sm:p-14">
        <div className="absolute top-0 right-0 h-64 w-64 translate-x-12 -translate-y-12 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="relative max-w-2xl space-y-6">
          <span className="inline-flex items-center space-x-2 rounded-full border border-amber-800/60 bg-amber-900/60 px-3 py-1 text-xs font-semibold text-amber-300">
            <RiHeartLine className="h-3.5 w-3.5 text-amber-400" />
            <span>Feito com paixão na nossa região</span>
          </span>
          <h1 className="font-serif text-4xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">
            Descubra sabores autênticos e produtores locais.
          </h1>
          <p className="text-sm leading-relaxed text-amber-200/80 sm:text-base">
            Na Verttex, aproximamos você de queijos artesanais, vinhos da serra,
            doces caseiros, méis puros e embutidos tradicionais diretamente de
            quem produz.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/lojas"
              className="inline-flex items-center space-x-2 rounded-full bg-amber-600 px-6 py-3.5 text-xs font-semibold text-white shadow-lg shadow-amber-950 transition-colors hover:bg-amber-500"
            >
              <RiStore2Line className="h-4 w-4" />
              <span>Conhecer Produtores</span>
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex items-center space-x-2 rounded-full border border-amber-800/80 px-6 py-3.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-900/40"
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
