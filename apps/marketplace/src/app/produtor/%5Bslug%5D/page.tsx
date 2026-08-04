import type { Metadata } from 'next'

import { ProductDiscoveryView } from '@/components/discovery/product-discovery-view'
import {
  buildMetadata,
  fetchStoreDetails,
  getPageNumber,
  hasActiveFilters,
} from '@/lib/seo'

export interface ProducerPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  params,
  searchParams,
}: ProducerPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  const slug = resolvedParams.slug
  const cleanCanonicalPath = `/produtor/${slug}`

  const store = await fetchStoreDetails(slug)

  if (!store) {
    return buildMetadata({
      title: 'Produtor não encontrado',
      description: 'O produtor solicitado não existe ou está indisponível.',
      canonicalPath: cleanCanonicalPath,
      noIndex: true,
    })
  }

  const title = `${store.name} | Produtor`
  const description =
    store.description ||
    `Conheça a loja e os produtos artesanais de ${store.name} no VERTTEX Marketplace.`

  const filtersApplied = hasActiveFilters(resolvedSearchParams)
  const pageNum = getPageNumber(resolvedSearchParams)

  return buildMetadata({
    title,
    description,
    canonicalPath: cleanCanonicalPath,
    hasFilters: filtersApplied,
    page: pageNum,
    ogImage: store.logoUrl,
  })
}

export default async function ProducerPage({ params }: ProducerPageProps) {
  const resolvedParams = await params
  return <ProductDiscoveryView initialStoreSlug={resolvedParams.slug} />
}
