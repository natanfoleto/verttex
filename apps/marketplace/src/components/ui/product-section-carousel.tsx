"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiImage2Line,
} from "react-icons/ri";

export interface CarouselProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  installments?: string;
  benefitBadge?: string;
  freeShipping?: boolean;
  imageUrl?: string;
}

export interface ProductSectionCarouselProps {
  title: string;
  products: CarouselProductItem[];
  itemsPerPage?: number;
}

export function ProductSectionCarousel({
  title,
  products,
  itemsPerPage = 5,
}: ProductSectionCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // Divide os produtos em páginas (máximo de 4 páginas)
  const pages: CarouselProductItem[][] = [];
  const maxPages = 4;
  for (let i = 0; i < products.length && pages.length < maxPages; i += itemsPerPage) {
    pages.push(products.slice(i, i + itemsPerPage));
  }

  const totalPages = pages.length || 1;

  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

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
                  ? "bg-emerald-700"
                  : "bg-stone-200 hover:bg-stone-300"
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
                {pageProducts.map((product) => {
                  const integerPrice = Math.floor(product.price);
                  const decimalCents = (product.price % 1)
                    .toFixed(2)
                    .substring(2)
                    .padStart(2, "0");

                  const formattedOriginalPrice = product.originalPrice
                    ? new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(product.originalPrice)
                    : null;

                  const calcDiscount =
                    product.originalPrice && product.originalPrice > product.price
                      ? Math.round(
                        ((product.originalPrice - product.price) /
                          product.originalPrice) *
                        100
                      )
                      : product.discountPercent;

                  return (
                    <div key={product.id} className="group flex flex-col cursor-pointer">
                      {/* Foto do Produto */}
                      <Link
                        href={`/produtos/${product.slug}`}
                        className="relative aspect-square w-full overflow-hidden bg-stone-100 rounded-sm block cursor-pointer"
                      >
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-300">
                            <RiImage2Line className="h-12 w-12 text-stone-300" />
                          </div>
                        )}
                      </Link>

                      {/* Informações do Produto com Verde Emerald Padrão */}
                      <div className="flex flex-col pt-3">
                        {/* Título com Hover Seco Verde */}
                        <Link
                          href={`/produtos/${product.slug}`}
                          className="text-xs sm:text-sm text-stone-800 font-normal line-clamp-2 leading-snug group-hover:text-emerald-700 cursor-pointer"
                        >
                          {product.name}
                        </Link>

                        {/* Preço de Tabela Riscado */}
                        {formattedOriginalPrice && (
                          <span className="text-xs text-stone-400 line-through leading-none mt-1.5">
                            {formattedOriginalPrice}
                          </span>
                        )}

                        {/* Preço Atual + Badge % OFF Verde */}
                        <div className="flex items-baseline space-x-1.5 mt-1">
                          <span className="text-lg sm:text-xl font-bold text-stone-900 leading-none">
                            R$ {integerPrice}
                            <sup className="text-xs font-bold align-super ml-0.5">
                              {decimalCents}
                            </sup>
                          </span>
                          {calcDiscount && calcDiscount > 0 && (
                            <span className="bg-emerald-600 text-white font-bold text-xs px-1.5 py-0.5 rounded-xs leading-none">
                              {calcDiscount}% OFF
                            </span>
                          )}
                        </div>

                        {/* Parcelamento / Linha de Crédito */}
                        <span className="text-xs text-stone-600 leading-tight mt-1">
                          {product.installments ||
                            `3x R$ ${(product.price / 3).toFixed(2).replace(".", ",")} com sua Linha de Crédito`}
                        </span>

                        {/* Badge de Benefício em Verde Suave */}
                        {product.benefitBadge !== null && (
                          <div className="mt-1">
                            <span className="inline-block bg-emerald-50 text-emerald-800 font-medium text-[11px] px-2 py-0.5 rounded-xs leading-tight">
                              {product.benefitBadge || "20% OFF no Pix"}
                            </span>
                          </div>
                        )}

                        {/* Frete Grátis */}
                        {product.freeShipping !== false && (
                          <span className="text-xs font-semibold text-emerald-600 mt-1">
                            Frete grátis
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
