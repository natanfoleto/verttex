import type { Metadata } from 'next'

import { StoresListingView } from '@/components/stores/stores-listing-view'
import { buildMetadata, hasActiveFilters } from '@/lib/seo'

export interface StoresPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  searchParams,
}: StoresPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams
  const filtersApplied = hasActiveFilters(resolvedSearchParams)

  return buildMetadata({
    title: 'Lojas e Produtores Parceiros',
    description:
      'Conheça os agricultores, cooperativas e artesãos locais que vendem no VERTTEX Marketplace.',
    canonicalPath: '/lojas',
    hasFilters: filtersApplied,
  })
}

export default function StoresPage() {
  return <StoresListingView />
}
