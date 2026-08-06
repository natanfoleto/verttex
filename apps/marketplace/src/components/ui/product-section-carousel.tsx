'use client'

import React, { useEffect, useRef, useState } from 'react'
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri'

import { Button } from './button'
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
  const [effectiveItemsPerPage, setEffectiveItemsPerPage] =
    useState<number>(itemsPerPage)

  // Arraste / Swipe
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const isDragging = useRef(false)

  // Ajusta dinamicamente a quantidade de itens por página de acordo com a largura da tela (exatamente 1 linha por página)
  useEffect(() => {
    const updateItemsPerPage = () => {
      const w = window.innerWidth
      if (w < 384)
        setEffectiveItemsPerPage(1) // < 2xs: 1 item por página (1 linha)
      else if (w < 640)
        setEffectiveItemsPerPage(2) // 2xs: 2 itens por página (1 linha)
      else if (w < 768)
        setEffectiveItemsPerPage(3) // sm: 3 itens por página (1 linha)
      else if (w < 1024)
        setEffectiveItemsPerPage(4) // md: 4 itens por página (1 linha)
      else setEffectiveItemsPerPage(itemsPerPage) // lg+: 5 itens por página (1 linha)
    }

    updateItemsPerPage()
    window.addEventListener('resize', updateItemsPerPage)
    return () => window.removeEventListener('resize', updateItemsPerPage)
  }, [itemsPerPage])

  // Divide os produtos em páginas (garantindo sempre 1 única linha de exibição)
  const pages: CarouselProductItem[][] = []
  for (let i = 0; i < products.length; i += effectiveItemsPerPage) {
    pages.push(products.slice(i, i + effectiveItemsPerPage))
  }

  const totalPages = pages.length || 1

  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1))
    }
  }, [totalPages, currentPage])

  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0))
  }

  // Eventos de Swipe (Touch & Mouse)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (touch) touchStartX.current = touch.clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0]
    if (touch) {
      touchEndX.current = touch.clientX
      const diff = touchStartX.current - touchEndX.current
      if (Math.abs(diff) > 40) {
        if (diff > 0) handleNext()
        else handlePrev()
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    touchStartX.current = e.clientX
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    touchEndX.current = e.clientX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext()
      else handlePrev()
    }
    isDragging.current = false
  }

  const handleMouseLeave = () => {
    isDragging.current = false
  }

  return (
    <section className="relative space-y-3 font-sans">
      {/* Header com Título e Indicadores Verdes Menores */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-bold tracking-tight text-stone-900 sm:text-xl">
          {title}
        </h3>

        {/* Pontinhos Verdes Pequenos de Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-1.5">
            {Array.from({ length: totalPages }).map((_, index) => (
              <Button
                key={index}
                type="button"
                onClick={() => setCurrentPage(index)}
                className={`h-1.5 w-1.5 cursor-pointer rounded-full p-0 transition-colors ${
                  index === currentPage
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
        {/* Setas Flutuantes Laterais — Exibidas EXCLUSIVAMENTE em telas >= 1408px */}
        {totalPages > 1 && currentPage > 0 && (
          <Button
            type="button"
            onClick={handlePrev}
            className="absolute top-27.5 -left-14 z-30 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full shadow-md transition-colors hover:bg-stone-50 min-[1408px]:flex sm:top-31.25 lg:top-33.75"
            aria-label="Anterior"
          >
            <RiArrowLeftSLine className="size-5 text-emerald-700" />
          </Button>
        )}

        {totalPages > 1 && currentPage < totalPages - 1 && (
          <Button
            type="button"
            onClick={handleNext}
            className="absolute top-27.5 -right-14 z-30 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full shadow-md transition-colors hover:bg-stone-50 min-[1408px]:flex sm:top-31.25 lg:top-33.75"
            aria-label="Próximo"
          >
            <RiArrowRightSLine className="size-5 text-emerald-700" />
          </Button>
        )}

        {/* Track Deslizante — Efeito Puxar / Slide idêntico ao carrossel principal */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="w-full cursor-grab overflow-hidden select-none active:cursor-grabbing"
        >
          <div
            className="flex w-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {pages.map((pageProducts, pageIndex) => (
              <div
                key={pageIndex}
                className="2xs:grid-cols-2 grid w-full flex-none shrink-0 grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5"
              >
                {pageProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botões Centralizados na Parte Inferior para telas < 1408px */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 min-[1408px]:hidden">
          <Button
            type="button"
            onClick={handlePrev}
            disabled={currentPage === 0}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-emerald-700 shadow-md transition-colors hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-30"
            aria-label="Anterior"
          >
            <RiArrowLeftSLine className="size-5 text-emerald-700" />
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            disabled={currentPage >= totalPages - 1}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-emerald-700 shadow-md transition-colors hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-30"
            aria-label="Próximo"
          >
            <RiArrowRightSLine className="size-5 text-emerald-700" />
          </Button>
        </div>
      )}
    </section>
  )
}
