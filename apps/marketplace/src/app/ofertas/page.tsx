import type { Metadata } from 'next'

import { ProductDiscoveryView } from '@/components/discovery/product-discovery-view'
import { buildMetadata, hasActiveFilters } from '@/lib/seo'

export interface OffersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  searchParams,
}: OffersPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams
  const filtersApplied = hasActiveFilters(resolvedSearchParams)

  return buildMetadata({
    title: 'Ofertas & Promoções',
    description:
      'Confira as melhores ofertas e produtos promocionais direto dos produtores no VERTTEX Marketplace.',
    canonicalPath: '/ofertas',
    hasFilters: filtersApplied,
  })
}

export default function OffersPage() {
  return (
    <ProductDiscoveryView
      overrideTitle="Ofertas & Promoções"
      overrideDescription="Confira as melhores ofertas e produtos promocionais direto dos produtores"
    />
  )
}
