'use client'

import React, { useState } from 'react'
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from 'react-icons/ri'

import { ProductCard } from './product-card'

export interface CarouselProductItem {
  id: string
  name: string
  slug: string
  price: number
  originalPrice?: number
  discountPercent?: number
  installments?: string
  benefitBadge?: string
  freeShipping?: boolean
  imageUrl?: string
}

export interface ProductSectionCarouselProps {
  title: string
  products: CarouselProductItem[]
  itemsPerPage?: number
}

export function ProductSectionCarousel({
  title,
  products,
  itemsPerPage = 5,
}: ProductSectionCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0)

  // Divide os produtos em páginas (máximo de 4 páginas)
  const pages: CarouselProductItem[][] = []
  const maxPages = 4
  for (
    let i = 0;
    i < products.length && pages.length < maxPages;
    i += itemsPerPage
  ) {
    pages.push(products.slice(i, i + itemsPerPage))
  }

  const totalPages = pages.length || 1

  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0))
  }

  return (
    <section className="relative space-y-3 font-sans">
      {/* Header com Título e Indicadores Verdes Menores */}
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-base sm:text-xl font-bold text-stone-900 tracking-tight">
          {title}
        </h3>

        {/* Pontinhos Verdes Pequenos de Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-1.5">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentPage(index)}
                className={`h-1.5 w-1.5 rounded-full cursor-pointer transition-colors ${index === currentPage
                  ? 'bg-emerald-700'
                  : 'bg-stone-200 hover:bg-stone-300'
                  }`}
                title={`Página ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Container Relativo com Setas e Track Deslizante */}
      <div className="relative">
        {/* Seta Esquerda Flutuante */}
        {totalPages > 1 && currentPage > 0 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-md hover:bg-stone-50 cursor-pointer"
            aria-label="Anterior"
          >
            <RiArrowLeftSLine className="size-5 text-stone-700" />
          </button>
        )}

        {/* Seta Direita Flutuante em Verde Emerald */}
        {totalPages > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-emerald-700 shadow-md hover:bg-stone-50 cursor-pointer"
            aria-label="Próximo"
          >
            <RiArrowRightSLine className="size-5 text-emerald-700" />
          </button>
        )}

        {/* Track Deslizante — Efeito Puxar / Slide idêntico ao carrossel principal */}
        <div className="overflow-hidden w-full">
          <div
            className="flex w-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {pages.map((pageProducts, pageIndex) => (
              <div
                key={pageIndex}
                className="w-full shrink-0 flex-none grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6"
              >
                {pageProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
