"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { RiLoader4Line } from "react-icons/ri";
import { apiClient } from "../../lib/api-client";

export interface CarouselBannerItem {
  id: string;
  imageUrl?: string | null;
  title: string;
  subtitle?: string | null;
  linkUrl?: string | null;
  ctaText?: string | null;
  position: number;
}

export function MarketplaceCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch Swipe
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener?.("change", handleChange);
      return () => mediaQuery.removeEventListener?.("change", handleChange);
    }
  }, []);

  const { data: settingsRes } = useQuery<{
    carouselAutoplay?: boolean;
    carouselIntervalSeconds?: number;
    carouselTitlePosition?: string | null;
    carouselTitleHAlign?: string | null;
  }>({
    queryKey: ["public-marketplace-settings"],
    queryFn: async () => {
      const res = await apiClient<{ data: any }>("/public/marketplace/settings");
      return (res as any)?.data ?? res;
    },
  });

  const carouselAutoplay = settingsRes?.carouselAutoplay ?? true;
  const carouselIntervalSeconds = settingsRes?.carouselIntervalSeconds ?? 5;
  const carouselTitlePosition = settingsRes?.carouselTitlePosition ?? "CENTER";
  const carouselTitleHAlign = settingsRes?.carouselTitleHAlign ?? "LEFT";

  const [isMounted, setIsMounted] = useState(false);
  const [cachedBanners, setCachedBanners] = useState<CarouselBannerItem[]>([]);

  // Leitura segura do localStorage após a montagem (evita erros de hidratação SSR)
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem("verttex_cached_carousel_banners");
      if (saved) {
        setCachedBanners(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Busca banners públicos com imagem
  const { data: bannersRes, isLoading } = useQuery<{
    success: boolean;
    data: CarouselBannerItem[];
  }>({
    queryKey: ["public-carousel-banners"],
    queryFn: async () => {
      const res = await apiClient<CarouselBannerItem[] | { data: CarouselBannerItem[] }>("/public/carousel");
      const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
      return { success: true, data: list };
    },
    staleTime: 0,
  });

  // Atualiza e persiste em cache sempre que a API responder (inclusive se retornar array vazio ao apagar tudo)
  useEffect(() => {
    if (bannersRes?.data && Array.isArray(bannersRes.data)) {
      try {
        localStorage.setItem("verttex_cached_carousel_banners", JSON.stringify(bannersRes.data));
      } catch {}
      setCachedBanners(bannersRes.data);
    }
  }, [bannersRes?.data]);

  // Se a requisição respondeu, usa o resultado real (mesmo que seja array vazio []).
  // cachedBanners é utilizado exclusivamente para exibição instantânea antes da query resolver no mount inicial.
  const banners = bannersRes ? bannersRes.data : cachedBanners;

  const handleNext = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Autoplay dinâmico baseado em configurações e preferências do usuário
  useEffect(() => {
    if (banners.length <= 1 || isPaused || prefersReducedMotion || !carouselAutoplay) return;

    const intervalMs = (carouselIntervalSeconds || 5) * 1000;
    const timer = setInterval(() => {
      handleNext();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [banners.length, isPaused, prefersReducedMotion, carouselAutoplay, carouselIntervalSeconds, handleNext]);

  // Navegação por teclado (Setas Esquerda e Direita)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  // Swipe em dispositivos móveis
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) touchStartX.current = touch.clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    if (touch) {
      touchEndX.current = touch.clientX;
      const diff = touchStartX.current - touchEndX.current;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
  };

  // Se ainda não montou no cliente (SSR) ou estiver carregando sem cache prévio, exibe contêiner limpo
  if (!isMounted || (isLoading && banners.length === 0)) {
    return (
      <section
        className="relative w-full bg-stone-100 py-0 mb-6 sm:mb-8 overflow-hidden aspect-18/5 flex items-center justify-center"
        aria-label="Carregando Carrossel..."
      >
        <div className="flex items-center space-x-2 text-stone-400 text-xs font-semibold">
          <RiLoader4Line className="h-5 w-5 animate-spin text-emerald-700" />
        </div>
      </section>
    );
  }

  const hasBanners = banners.length > 0;

  // Sem banners no banco e sem cache: exibe a hero section original
  if (!hasBanners) {
    return (
      <section className="relative w-full overflow-hidden bg-linear-to-br from-stone-900 via-stone-800 to-amber-950 px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28 min-h-125 flex items-center">
        <div className="absolute top-0 right-0 h-96 w-96 translate-x-24 -translate-y-24 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-24 translate-y-24 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            Sabor artesanal direto da <span className="text-amber-400">nossa terra</span> para a sua mesa.
          </h1>
          <p className="max-w-2xl mt-6 text-base text-stone-300">
            Conectamos você aos melhores produtores artesanais e coloniais da nossa região. Produtos frescos, autênticos e com rastreabilidade sanitária de lote por FEFO.
          </p>
        </div>
      </section>
    );
  }

  // Com banners: trilha deslizante horizontal unificada
  const hasMultiple = banners.length > 1;

  return (
    <section
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="group relative w-full bg-stone-50 py-0 mb-8 sm:mb-12 overflow-hidden"
      aria-label="Carrossel de Banners"
    >
      {/* Container principal com proporção reduzida aspect-[18/5] */}
      <div className="relative w-full aspect-18/5 overflow-hidden">
        {/* Slider track deslizante — as margens laterais fazem parte da transição de cada slide */}
        <div
          className={`flex w-full h-full ${prefersReducedMotion ? "" : "transition-transform duration-500 ease-in-out"
            }`}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="w-full h-full shrink-0 flex-none relative px-6 sm:px-12 md:px-20 lg:px-32 bg-stone-50"
            >
              {/* Imagem do banner */}
              {banner.linkUrl ? (
                <a
                  href={banner.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full cursor-pointer"
                  aria-label={banner.title ?? "Banner"}
                >
                  <img
                    src={banner.imageUrl!}
                    alt={banner.title ?? "Banner"}
                    className="w-full h-full object-cover"
                  />
                </a>
              ) : (
                <img
                  src={banner.imageUrl!}
                  alt={banner.title ?? "Banner"}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Overlay de Título & Subtítulo conforme posição/alinhamento */}
              {carouselTitlePosition !== "NONE" && (banner.title || banner.subtitle) && (
                <div
                  className={`absolute inset-0 px-8 sm:px-16 md:px-24 lg:px-40 flex flex-col pointer-events-none ${
                    carouselTitlePosition === "TOP"
                      ? "justify-start pt-6 sm:pt-10"
                      : carouselTitlePosition === "BOTTOM"
                      ? "justify-end pb-6 sm:pb-10"
                      : "justify-center"
                  } ${
                    carouselTitleHAlign === "RIGHT"
                      ? "items-end text-right"
                      : carouselTitleHAlign === "CENTER"
                      ? "items-center text-center"
                      : "items-start text-left"
                  }`}
                >
                  {banner.title && (
                    <h2 className="text-base sm:text-2xl md:text-3xl font-extrabold text-white drop-shadow-md tracking-tight">
                      {banner.title}
                    </h2>
                  )}
                  {banner.subtitle && (
                    <p className="text-xs sm:text-sm text-white/90 drop-shadow-sm mt-1 font-normal max-w-md">
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
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-1.5">
            {banners.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ir para o banner ${idx + 1}`}
                className={`h-1.5 rounded-full cursor-pointer ${idx === currentIndex
                  ? "w-6 bg-white shadow-xs"
                  : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botões cápsula/pill shape nas extremidades (borda 1.5px reforçada, ícone fino com stroke 1.25) */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Banner anterior"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex h-10 w-8 sm:h-12 sm:w-10 md:h-16 md:w-16 items-center justify-center rounded-r-full bg-white shadow-none border-[1.5px] border-l-0 border-stone-300 text-stone-800 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto hover:shadow-[0_4px_8px_rgba(0,0,0,0.08)] cursor-pointer"
          >
            <FiChevronLeft className="size-4 sm:size-5 md:size-7 text-stone-800 stroke-[1.25]" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Próximo banner"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex h-10 w-8 sm:h-12 sm:w-10 md:h-16 md:w-16 items-center justify-center rounded-l-full bg-white shadow-none border-[1.5px] border-r-0 border-stone-300 text-stone-800 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto hover:shadow-[0_4px_8px_rgba(0,0,0,0.08)] cursor-pointer"
          >
            <FiChevronRight className="size-4 sm:size-5 md:size-7 text-stone-800 stroke-[1.25]" />
          </button>
        </>
      )}
    </section>
  );
}
