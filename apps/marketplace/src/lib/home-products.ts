export interface HomeCatalogProduct {
  id: string
  mainImageUrl?: string
  name: string
  price: number
  promotionalPrice?: number | null
  slug: string
}

export interface HomeCarouselProduct {
  id: string
  imageUrl?: string
  name: string
  originalPrice?: number
  price: number
  slug: string
}

export function buildHomeProductSections(products: HomeCatalogProduct[]): {
  catalogProducts: HomeCarouselProduct[]
  offerProducts: HomeCarouselProduct[]
} {
  const normalizedProducts = products.map((product) => {
    const realPromotionalPrice =
      typeof product.promotionalPrice === 'number' &&
      product.promotionalPrice < product.price
        ? product.promotionalPrice
        : undefined

    return {
      id: product.id,
      imageUrl: product.mainImageUrl || undefined,
      name: product.name,
      ...(realPromotionalPrice !== undefined
        ? { originalPrice: product.price }
        : {}),
      price: realPromotionalPrice ?? product.price,
      slug: product.slug,
    }
  })

  return {
    catalogProducts: normalizedProducts.slice(0, 12),
    offerProducts: normalizedProducts
      .filter((product) => product.originalPrice !== undefined)
      .slice(0, 12),
  }
}
