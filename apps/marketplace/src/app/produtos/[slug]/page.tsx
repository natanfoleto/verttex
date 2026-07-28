"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { use, useState } from "react";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiCheckboxCircleLine,
  RiHeartLine,
  RiMapPinLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiShoppingBag3Line,
  RiStarFill,
  RiStore2Line,
  RiSubtractLine,
  RiTruckLine,
} from "react-icons/ri";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ProductDetailSkeleton } from "../../../components/products/product-detail-skeleton";
import { apiClient, ApiError } from "../../../lib/api-client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface ProductDetailsResponse {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  type: string;
  isFeatured: boolean;
  weight?: number;
  store: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    coverUrl?: string;
  };
  category: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string };
  images: { id: string; isMain: boolean; altText?: string; url?: string }[];
  options: { id: string; name: string; values: { id: string; value: string }[] }[];
  variations: {
    id: string;
    publicId?: string;
    sku: string;
    price: number;
    promotionalPrice?: number;
    isDefault: boolean;
    commercialStockAvailable: number;
    isAvailable: boolean;
    values: { optionValueId: string; value: string }[];
  }[];
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { data: product, isLoading, isError } = useQuery<ProductDetailsResponse>({
    queryKey: ["public-product", resolvedParams.slug],
    queryFn: async () => {
      const res = await apiClient<ProductDetailsResponse>(
        `/public/catalog/products/${resolvedParams.slug}`,
      );
      return res;
    },
  });

  // Sync variation from URL query param (?variant=<publicId|id> or ?sku=<sku>)
  useEffect(() => {
    if (!product || !product.variations || product.variations.length === 0) return;

    const variantQuery = searchParams.get("variant") || searchParams.get("sku");
    if (variantQuery) {
      const matched = product.variations.find(
        (v) =>
          v.publicId === variantQuery ||
          v.id === variantQuery ||
          v.sku.toLowerCase() === variantQuery.toLowerCase(),
      );
      if (matched) {
        setSelectedVariationId(matched.id);
        return;
      }
    }

    if (!selectedVariationId) {
      const defaultVar = product.variations.find((v) => v.isDefault) || product.variations[0];
      if (defaultVar) setSelectedVariationId(defaultVar.id);
    }
  }, [product, searchParams, selectedVariationId]);

  const handleSelectVariation = (varId: string) => {
    setSelectedVariationId(varId);
    if (!product) return;
    const targetVar = product.variations.find((v) => v.id === varId);
    if (targetVar) {
      const targetQuery = targetVar.publicId || targetVar.sku || targetVar.id;
      const newUrl = `${window.location.pathname}?variant=${encodeURIComponent(targetQuery)}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  const addToCartMutation = useMutation({
    mutationFn: async ({ variationId, qty }: { variationId: string; qty: number }) => {
      return apiClient("/cart/items", {
        method: "POST",
        body: JSON.stringify({ variationId, quantity: qty }),
      });
    },
    onSuccess: () => {
      toast.success("Produto adicionado ao carrinho com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["cart-summary"] });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Erro ao adicionar produto ao carrinho");
      }
    },
  });

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center font-sans antialiased">
        <RiShoppingBag3Line className="mx-auto h-16 w-16 text-stone-300" />
        <h1 className="mt-4 text-2xl font-bold text-stone-900">
          Produto não encontrado
        </h1>
        <p className="mt-2 text-xs text-stone-500">
          O produto solicitado não existe ou está temporariamente indisponível.
        </p>
        <Link
          href="/produtos"
          className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 cursor-pointer"
        >
          <RiArrowLeftLine className="h-4 w-4" />
          <span>Voltar ao Catálogo</span>
        </Link>
      </div>
    );
  }

  const selectedVariation =
    product.variations.find((v) => v.id === selectedVariationId) ||
    product.variations.find((v) => v.isDefault) ||
    product.variations[0];

  const currentPrice = selectedVariation
    ? selectedVariation.promotionalPrice || selectedVariation.price
    : 0;

  const originalPrice =
    selectedVariation && selectedVariation.promotionalPrice
      ? selectedVariation.price
      : null;

  const discountPercent =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null;

  const isAvailable = selectedVariation ? selectedVariation.isAvailable : false;
  const stockAvailable = selectedVariation ? selectedVariation.commercialStockAvailable : 0;

  const handleBuyNow = () => {
    if (!selectedVariation) return;
    addToCartMutation.mutate(
      { variationId: selectedVariation.id, qty: quantity },
      {
        onSuccess: () => {
          window.location.href = "/carrinho";
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8 py-8 font-sans text-stone-900 antialiased">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs font-semibold text-stone-500">
        <Link href="/" className="hover:text-emerald-800 transition-colors">
          Início
        </Link>
        <span>/</span>
        <Link href="/produtos" className="hover:text-emerald-800 transition-colors">
          Produtos
        </Link>
        <span>/</span>
        <Link
          href={`/produtos?categorySlug=${product.category.slug}`}
          className="hover:text-emerald-800 transition-colors"
        >
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-stone-900 font-bold truncate max-w-xs sm:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* Main 3-Column Mercado Livre Layout Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left & Center Main Area (span 8) */}
        <div className="space-y-8 lg:col-span-8">
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
              {/* Column 1: Photos & Thumbnails Below (md:col-span-6) */}
              <div className="space-y-4 md:col-span-6">
                {/* Main Large Image Container */}
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-stone-100 bg-stone-50">
                  {product.images[selectedImageIndex]?.url ? (
                    <img
                      src={product.images[selectedImageIndex].url}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-300">
                      <RiShoppingBag3Line className="h-24 w-24" />
                    </div>
                  )}

                  {/* Wishlist Icon Button Overlay */}
                  <button
                    type="button"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white/90 shadow-xs backdrop-blur-xs transition-colors cursor-pointer ${
                      isWishlisted ? "text-rose-600 bg-rose-50 border-rose-200" : "text-stone-500 hover:text-rose-600"
                    }`}
                    title="Salvar nos Favoritos"
                  >
                    <RiHeartLine className="h-5 w-5" />
                  </button>
                </div>

                {/* Thumbnails List Below Main Photo */}
                {product.images.length > 1 && (
                  <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
                    {product.images.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                          selectedImageIndex === idx
                            ? "border-emerald-800 ring-2 ring-emerald-800/20"
                            : "border-stone-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 2: Central Product Details (md:col-span-6) */}
              <div className="space-y-6 md:col-span-6">
                {/* Header Tag & Sales Info */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-[11px] font-semibold text-stone-500">
                    <span className="text-stone-600">Novo</span>
                    <span>|</span>
                    <span className="text-stone-600">+100 vendidos</span>
                  </div>

                  {product.isFeatured && (
                    <div className="inline-block rounded-md bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-stone-950">
                      1º em {product.category.name}
                    </div>
                  )}

                  <h1 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
                    {product.name}
                  </h1>

                  {/* Rating Stars */}
                  <div className="flex items-center space-x-1.5 text-xs">
                    <span className="font-bold text-stone-900">4.9</span>
                    <div className="flex text-amber-500">
                      <RiStarFill className="h-4 w-4" />
                      <RiStarFill className="h-4 w-4" />
                      <RiStarFill className="h-4 w-4" />
                      <RiStarFill className="h-4 w-4" />
                      <RiStarFill className="h-4 w-4" />
                    </div>
                    <span className="text-stone-400 font-medium">(42 opiniões)</span>
                  </div>
                </div>

                {/* Price Display Section */}
                <div className="space-y-1.5 border-t border-b border-stone-100 py-4">
                  {originalPrice && (
                    <span className="text-xs font-semibold text-stone-400 line-through">
                      R$ {originalPrice.toFixed(2)}
                    </span>
                  )}
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-stone-900 tracking-tight">
                      R$ {currentPrice.toFixed(2)}
                    </span>
                    {discountPercent && (
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800">
                        {discountPercent}% OFF no PIX
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 font-medium">
                    em até <strong className="text-stone-800">3x de R$ {(currentPrice / 3).toFixed(2)}</strong> sem juros
                  </p>
                </div>

                {/* Variation Options Picker */}
                {product.variations.length > 1 && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-stone-900">
                      Opções disponíveis:{" "}
                      <span className="font-medium text-stone-600">
                        {selectedVariation?.values.map((v) => v.value).join(" / ") || `SKU: ${selectedVariation?.sku}`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {product.variations.map((v) => {
                        const labelText =
                          v.values.map((val) => val.value).join(" / ") || `SKU: ${v.sku}`;
                        const isSelected = selectedVariation?.id === v.id;

                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectVariation(v.id)}
                            disabled={!v.isAvailable}
                            className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "border-emerald-800 bg-emerald-800 text-white shadow-xs"
                                : v.isAvailable
                                  ? "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                                  : "border-stone-100 bg-stone-100 text-stone-400 line-through opacity-60 cursor-not-allowed"
                            }`}
                          >
                            {labelText} {!v.isAvailable && "(Esgotado)"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bullet Points: "O que você precisa saber sobre este produto" */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    O que você precisa saber sobre este produto
                  </h3>
                  <ul className="space-y-2 text-xs text-stone-600">
                    <li className="flex items-start space-x-2">
                      <RiCheckboxCircleLine className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                      <span>Produzido por artesão regional com receitas tradicionais.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <RiCheckboxCircleLine className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                      <span>Ingredientes 100% naturais sem conservantes artificiais.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <RiCheckboxCircleLine className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                      <span>Rastreabilidade sanitária rigorosa com validação de lote por FEFO.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Detailed Description Below Main Card */}
            {product.fullDescription && (
              <div className="border-t border-stone-200 mt-8 pt-8 space-y-4">
                <h2 className="text-lg font-bold text-stone-900">
                  Descrição detalhada do produto
                </h2>
                <div className="prose prose-stone max-w-none text-xs text-stone-600 leading-relaxed">
                  {product.fullDescription}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Column: Buying Box, Shipping & Seller Profile (span 4) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card 1: Shipping & Buying Box */}
          <div className="space-y-6 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs">
            {/* Free Shipping Badge */}
            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center space-x-2">
              <RiTruckLine className="h-5 w-5 text-emerald-700 shrink-0" />
              <span>FRETE REGIONAL GRÁTIS ACIMA DE R$ 150</span>
            </div>

            {/* Shipping Info */}
            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-3">
                <RiTruckLine className="h-5 w-5 text-emerald-800 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-900">Chegará em domicílio</p>
                  <p className="text-stone-500 text-[11px]">
                    Entrega rápida por produtor regional (2 a 4 dias úteis)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <RiMapPinLine className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-stone-900">Retirada no produtor</p>
                  <p className="text-stone-500 text-[11px]">
                    Disponível para retirada na sede de {product.store.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Stock Availability & Quantity Control */}
            <div className="space-y-3 border-t border-stone-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">Estoque disponível</span>
                {stockAvailable > 5 ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                    <RiCheckLine className="h-4 w-4" />
                    <span>Em estoque ({stockAvailable} un.)</span>
                  </span>
                ) : stockAvailable > 0 ? (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center space-x-1">
                    <span>Últimas {stockAvailable} unidades!</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    Esgotado
                  </span>
                )}
              </div>

              {/* Quantity Picker */}
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-2">
                <span className="text-xs font-bold text-stone-700">Quantidade:</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 text-stone-600 hover:text-stone-900 cursor-pointer"
                  >
                    <RiSubtractLine className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-xs">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1 text-stone-600 hover:text-stone-900 cursor-pointer"
                  >
                    <RiAddLine className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Buying Action CTA Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                type="button"
                onClick={handleBuyNow}
                disabled={!isAvailable || addToCartMutation.isPending}
                className="w-full h-12 rounded-xl bg-emerald-800 text-xs font-extrabold text-white hover:bg-emerald-900 shadow-md cursor-pointer transition-all"
              >
                Comprar agora
              </Button>

              <Button
                type="button"
                onClick={() => {
                  if (selectedVariation) {
                    addToCartMutation.mutate({
                      variationId: selectedVariation.id,
                      qty: quantity,
                    });
                  }
                }}
                disabled={!isAvailable || addToCartMutation.isPending}
                className="w-full h-12 rounded-xl bg-emerald-100 text-xs font-bold text-emerald-900 hover:bg-emerald-200 border border-emerald-200 cursor-pointer transition-all"
              >
                <RiShoppingBag3Line className="h-4 w-4" />
                <span>
                  {addToCartMutation.isPending ? "Adicionando..." : "Adicionar ao carrinho"}
                </span>
              </Button>
            </div>

            {/* Trust & Guarantee Perks */}
            <div className="space-y-3 border-t border-stone-100 pt-4 text-xs text-stone-600">
              <div className="flex items-start space-x-2.5">
                <RiRefreshLine className="h-4 w-4 shrink-0 text-stone-400 mt-0.5" />
                <div>
                  <strong className="text-stone-900">Devolução grátis.</strong> Você tem 7 dias a partir do recebimento.
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <RiShieldCheckLine className="h-4 w-4 shrink-0 text-stone-400 mt-0.5" />
                <div>
                  <strong className="text-stone-900">Compra Garantida VERTTEX.</strong> Receba o produto esperado ou devolvemos seu dinheiro.
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Seller / Producer Info Box Below Buying Box */}
          <div className="space-y-4 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Informações sobre o vendedor
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-amber-50 text-amber-900 font-extrabold text-lg">
                {product.store.logoUrl ? (
                  <img
                    src={product.store.logoUrl}
                    alt={product.store.name}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  product.store.name.charAt(0)
                )}
              </div>

              <div className="overflow-hidden">
                <Link
                  href={`/produtores/${product.store.slug}`}
                  className="font-extrabold text-sm text-stone-900 hover:text-emerald-800 transition-colors line-clamp-1 cursor-pointer"
                >
                  {product.store.name}
                </Link>
                <div className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-800">
                  <RiStore2Line className="h-3.5 w-3.5" />
                  <span>Produtor Certificado VERTTEX</span>
                </div>
              </div>
            </div>

            {/* Seller Reputation Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 border-t border-stone-100 pt-4 text-center">
              <div className="space-y-0.5">
                <div className="text-sm font-extrabold text-stone-900">+1.000</div>
                <div className="text-[10px] text-stone-500 leading-tight">Vendas realizadas</div>
              </div>

              <div className="space-y-0.5 border-x border-stone-100">
                <div className="text-sm font-extrabold text-emerald-700">Excelente</div>
                <div className="text-[10px] text-stone-500 leading-tight">Bom atendimento</div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm font-extrabold text-amber-700">No prazo</div>
                <div className="text-[10px] text-stone-500 leading-tight">Entrega pontual</div>
              </div>
            </div>

            <Link
              href={`/produtores/${product.store.slug}`}
              className="block w-full text-center rounded-xl border border-stone-200 bg-stone-50 py-2.5 text-xs font-bold text-stone-800 hover:bg-stone-100 hover:border-stone-300 transition-colors cursor-pointer"
            >
              Ver perfil completo do produtor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
