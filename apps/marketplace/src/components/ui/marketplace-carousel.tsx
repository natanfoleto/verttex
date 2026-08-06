'use client'

import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { RiLoader4Line } from 'react-icons/ri'

import { apiClient } from '../../lib/api-client'
import { Button } from './button'

export interface CarouselBannerItem {
  id: string
  imageUrl?: string | null
  title: string
  subtitle?: string | null
  linkUrl?: string | null
  ctaText?: string | null
  position: number
}

export function MarketplaceCarousel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Touch & Mouse Swipe / Drag
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const isDragging = useRef(false)
  const hasDragged = useRef(false)

  // Motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)

      const handleChange = (e: MediaQueryListEvent) =>
        setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener?.('change', handleChange)
      return () => mediaQuery.removeEventListener?.('change', handleChange)
    }
  }, [])

  const { data: settingsRes } = useQuery<{
    carouselAutoplay?: boolean
    carouselIntervalSeconds?: number
    carouselTitlePosition?: string | null
    carouselTitleHAlign?: string | null
  }>({
    queryKey: ['public-marketplace-settings'],
    queryFn: async () => {
      const res = await apiClient<
        | {
            carouselAutoplay?: boolean
            carouselIntervalSeconds?: number
            carouselTitlePosition?: string | null
            carouselTitleHAlign?: string | null
          }
        | {
            data: {
              carouselAutoplay?: boolean
              carouselIntervalSeconds?: number
              carouselTitlePosition?: string | null
              carouselTitleHAlign?: string | null
            }
          }
      >('/public/marketplace/settings')
      return 'data' in res ? res.data : res
    },
  })

  const carouselAutoplay = settingsRes?.carouselAutoplay ?? true
  const carouselIntervalSeconds = settingsRes?.carouselIntervalSeconds ?? 5
  const carouselTitlePosition = settingsRes?.carouselTitlePosition ?? 'CENTER'
  const carouselTitleHAlign = settingsRes?.carouselTitleHAlign ?? 'LEFT'

  const [isMounted, setIsMounted] = useState(false)
  const [cachedBanners, setCachedBanners] = useState<CarouselBannerItem[]>([])

  // Leitura segura do localStorage após a montagem (evita erros de hidratação SSR)
  useEffect(() => {
    setIsMounted(true)
    try {
      const saved = localStorage.getItem('verttex_cached_carousel_banners')
      if (saved) {
        setCachedBanners(JSON.parse(saved))
      }
    } catch {}
  }, [])

  // Busca banners públicos com imagem
  const { data: bannersRes, isLoading } = useQuery<{
    success: boolean
    data: CarouselBannerItem[]
  }>({
    queryKey: ['public-carousel-banners'],
    queryFn: async () => {
      const res = await apiClient<
        CarouselBannerItem[] | { data: CarouselBannerItem[] }
      >('/public/carousel')
      const list = Array.isArray(res)
        ? res
        : 'data' in res && Array.isArray(res.data)
          ? res.data
          : []
      return { success: true, data: list }
    },
    staleTime: 0,
  })

  // Atualiza e persiste em cache sempre que a API responder (inclusive se retornar array vazio ao apagar tudo)
  useEffect(() => {
    if (bannersRes?.data && Array.isArray(bannersRes.data)) {
      try {
        localStorage.setItem(
          'verttex_cached_carousel_banners',
          JSON.stringify(bannersRes.data),
        )
      } catch {}
      setCachedBanners(bannersRes.data)
    }
  }, [bannersRes?.data])

  // Se a requisição respondeu, usa o resultado real (mesmo que seja array vazio []).
  // cachedBanners é utilizado exclusivamente para exibição instantânea antes da query resolver no mount inicial.
  const banners = bannersRes ? bannersRes.data : cachedBanners

  const handleNext = useCallback(() => {
    if (banners.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }, [banners.length])

  const handlePrev = useCallback(() => {
    if (banners.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }, [banners.length])

  // Autoplay dinâmico baseado em configurações e preferências do usuário
  useEffect(() => {
    if (
      banners.length <= 1 ||
      isPaused ||
      prefersReducedMotion ||
      !carouselAutoplay
    )
      return

    const intervalMs = (carouselIntervalSeconds || 5) * 1000
    const timer = setInterval(() => {
      handleNext()
    }, intervalMs)

    return () => clearInterval(timer)
  }, [
    banners.length,
    isPaused,
    prefersReducedMotion,
    carouselAutoplay,
    carouselIntervalSeconds,
    handleNext,
  ])

  // Navegação por teclado (Setas Esquerda e Direita)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      )
        return
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext])

  // Swipe em dispositivos móveis (Touch)
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
        if (diff > 0) {
          handleNext()
        } else {
          handlePrev()
        }
      }
    }
  }

  // Arraste com o Mouse (Mouse Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    hasDragged.current = false
    touchStartX.current = e.clientX
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const diff = Math.abs(e.clientX - touchStartX.current)
    if (diff > 5) {
      hasDragged.current = true
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    touchEndX.current = e.clientX
    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
    isDragging.current = false
  }

  const handleMouseLeave = () => {
    if (isDragging.current) {
      isDragging.current = false
    }
    setIsPaused(false)
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault()
    }
  }

  // Se ainda não montou no cliente (SSR) ou estiver carregando sem cache prévio, exibe contêiner limpo
  if (!isMounted || (isLoading && banners.length === 0)) {
    return (
      <section
        className="relative mb-6 flex aspect-18/5 w-full items-center justify-center overflow-hidden py-0 sm:mb-8"
        aria-label="Carregando Carrossel..."
      >
        <div className="flex items-center space-x-2 text-xs font-semibold text-stone-400">
          <RiLoader4Line className="h-5 w-5 animate-spin text-emerald-700" />
        </div>
      </section>
    )
  }

  const hasBanners = banners.length > 0

  // Sem banners no banco e sem cache: exibe a hero section original
  if (!hasBanners) {
    return (
      <section className="relative flex min-h-125 w-full items-center overflow-hidden bg-linear-to-br from-stone-900 via-stone-800 to-amber-950 px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
        <div className="absolute top-0 right-0 h-96 w-96 translate-x-24 -translate-y-24 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-24 translate-y-24 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Sabor artesanal direto da{' '}
            <span className="text-amber-400">nossa terra</span> para a sua mesa.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-stone-300">
            Conectamos você aos melhores produtores artesanais e coloniais da
            nossa região. Produtos frescos, autênticos e com rastreabilidade
            sanitária de lote por FEFO.
          </p>
        </div>
      </section>
    )
  }

  // Com banners: trilha deslizante horizontal unificada
  const hasMultiple = banners.length > 1

  return (
    <section
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="group relative mb-8 w-full cursor-grab overflow-hidden py-0 select-none active:cursor-grabbing sm:mb-12"
      aria-label="Carrossel de Banners"
    >
      {/* Container principal ocupando 100% da largura da tela com altura fixa a partir de sm */}
      <div className="relative aspect-16/4.5 min-h-45 w-full overflow-hidden">
        {/* Slider track deslizante */}
        <div
          className={`flex h-full w-full ${
            prefersReducedMotion
              ? ''
              : 'transition-transform duration-500 ease-in-out'
          }`}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="relative h-full w-full flex-none shrink-0 px-0"
            >
              {/* Imagem do banner */}
              {banner.linkUrl ? (
                <a
                  href={banner.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  className="mx-auto block h-full w-full max-w-360 cursor-pointer"
                  aria-label={banner.title ?? 'Banner'}
                >
                  <img
                    src={banner.imageUrl!}
                    alt={banner.title ?? 'Banner'}
                    draggable={false}
                    className="pointer-events-none h-full w-full object-cover select-none"
                  />
                </a>
              ) : (
                <div className="mx-auto h-full w-full max-w-360">
                  <img
                    src={banner.imageUrl!}
                    alt={banner.title ?? 'Banner'}
                    draggable={false}
                    className="pointer-events-none h-full w-full object-cover select-none"
                  />
                </div>
              )}

              {/* Overlay de Título & Subtítulo conforme posição/alinhamento */}
              {carouselTitlePosition !== 'NONE' &&
                (banner.title || banner.subtitle) && (
                  <div
                    className={`pointer-events-none absolute inset-0 mx-auto flex max-w-360 flex-col px-8 sm:px-16 md:px-24 lg:px-40 ${
                      carouselTitlePosition === 'TOP'
                        ? 'justify-start pt-6 sm:pt-10'
                        : carouselTitlePosition === 'BOTTOM'
                          ? 'justify-end pb-6 sm:pb-10'
                          : 'justify-center'
                    } ${
                      carouselTitleHAlign === 'RIGHT'
                        ? 'items-end text-right'
                        : carouselTitleHAlign === 'CENTER'
                          ? 'items-center text-center'
                          : 'items-start text-left'
                    }`}
                  >
                    {banner.title && (
                      <h2 className="text-base font-extrabold tracking-tight text-white drop-shadow-md sm:text-2xl md:text-3xl">
                        {banner.title}
                      </h2>
                    )}
                    {banner.subtitle && (
                      <p className="mt-1 max-w-md text-xs font-normal text-white/90 drop-shadow-sm sm:text-sm">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* Indicadores de posição (Dots) posicionados no centro inferior */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center gap-1.5">
            {banners.map((b, idx) => (
              <Button
                key={b.id}
                type="button"
                variant="ghost"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ir para o banner ${idx + 1}`}
                className={`h-1.5 min-h-0 cursor-pointer rounded-full p-0 hover:bg-transparent ${
                  idx === currentIndex
                    ? 'w-6 bg-white shadow-xs'
                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botões cápsula/pill shape nas extremidades — Exibidos EXCLUSIVAMENTE no desktop (4xl) */}
      {hasMultiple && (
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrev}
            aria-label="Banner anterior"
            className="4xl:flex pointer-events-none absolute top-1/2 left-0 z-20 hidden h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-l-none rounded-r-full bg-white shadow-xl transition-all group-hover:pointer-events-auto group-hover:opacity-100 hover:bg-stone-50 hover:text-emerald-700 sm:h-12 sm:w-10 md:h-14 md:w-12"
          >
            <FiChevronLeft className="size-3.5 sm:size-4 md:size-5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleNext}
            aria-label="Próximo banner"
            className="4xl:flex pointer-events-none absolute top-1/2 right-0 z-20 hidden h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-l-full rounded-r-none bg-white shadow-xl transition-all group-hover:pointer-events-auto group-hover:opacity-100 hover:bg-stone-50 hover:text-emerald-700 sm:h-12 sm:w-10 md:h-14 md:w-12"
          >
            <FiChevronRight className="size-3.5 sm:size-4 md:size-5" />
          </Button>
        </>
      )}
    </section>
  )
}
