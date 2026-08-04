import type { Metadata } from 'next'

import { ProductDiscoveryView } from '@/components/discovery/product-discovery-view'
import {
  buildMetadata,
  fetchDiscoveryContext,
  getPageNumber,
  hasActiveFilters,
} from '@/lib/seo'

export interface BrandPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  params,
  searchParams,
}: BrandPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  const slug = resolvedParams.slug
  const cleanCanonicalPath = `/marca/${slug}`

  const discovery = await fetchDiscoveryContext({ brandSlug: slug })
  const brand = discovery?.context?.brand

  if (!brand && !discovery?.context?.title) {
    return buildMetadata({
      title: 'Marca não encontrada',
      description: 'A marca solicitada não existe ou foi removida.',
      canonicalPath: cleanCanonicalPath,
      noIndex: true,
    })
  }

  const brandName = brand?.name || discovery?.context?.title || slug
  const title = `${brandName} | Marca`
  const description =
    discovery?.context?.description ||
    `Encontre produtos artesanais da marca ${brandName} no VERTTEX Marketplace.`

  const filtersApplied = hasActiveFilters(resolvedSearchParams)
  const pageNum = getPageNumber(resolvedSearchParams)

  return buildMetadata({
    title,
    description,
    canonicalPath: cleanCanonicalPath,
    hasFilters: filtersApplied,
    page: pageNum,
  })
}

export default async function BrandPage({ params }: BrandPageProps) {
  const resolvedParams = await params
  return <ProductDiscoveryView initialBrandSlug={resolvedParams.slug} />
}
