import type { Metadata } from 'next'

import { ProductDetailView } from '@/components/products/product-detail-view'
import { APP_BASE_URL, buildMetadata, fetchProductDetails } from '@/lib/seo'

export interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const slug = resolvedParams.slug
  const cleanCanonicalPath = `/produtos/${slug}`

  const product = await fetchProductDetails(slug)

  if (!product) {
    return buildMetadata({
      title: 'Produto não encontrado',
      description: 'O produto solicitado não existe ou está indisponível.',
      canonicalPath: cleanCanonicalPath,
      noIndex: true,
    })
  }

  const title = product.name
  const description =
    product.shortDescription ||
    (product.fullDescription
      ? product.fullDescription.slice(0, 160)
      : `Compre ${product.name} diretamente de ${product.store?.name || 'produtor local'} no VERTTEX Marketplace.`)

  const ogImage =
    product.images?.[0]?.url ||
    product.images?.find((img: any) => img.isMain)?.url

  return buildMetadata({
    title,
    description,
    canonicalPath: cleanCanonicalPath,
    ogImage,
    type: 'article',
  })
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params
  const slug = resolvedParams.slug

  const product = await fetchProductDetails(slug)

  // JSON-LD Structured Data for Product and BreadcrumbList (SEO Best Practices)
  const productJsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.shortDescription || product.fullDescription,
        image: product.images?.[0]?.url ? [product.images[0].url] : undefined,
        category: product.category?.name,
        brand: product.brand
          ? {
              '@type': 'Brand',
              name: product.brand.name,
            }
          : undefined,
        offers: {
          '@type': 'Offer',
          url: `${APP_BASE_URL}/produtos/${slug}`,
          priceCurrency: 'BRL',
          price:
            product.variations?.[0]?.promotionalPrice ||
            product.variations?.[0]?.price ||
            0,
          availability: product.variations?.[0]?.isAvailable
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: product.store?.name,
          },
        },
      }
    : null

  const breadcrumbJsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Início',
            item: APP_BASE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Produtos',
            item: `${APP_BASE_URL}/produtos`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.category?.name || 'Categoria',
            item: `${APP_BASE_URL}/categoria/${product.category?.slug}`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: product.name,
            item: `${APP_BASE_URL}/produtos/${slug}`,
          },
        ],
      }
    : null

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <ProductDetailView slug={slug} />
    </>
  )
}
