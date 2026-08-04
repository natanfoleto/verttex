import type { Metadata } from 'next'

import { ProductDiscoveryView } from '@/components/discovery/product-discovery-view'
import { buildMetadata, hasActiveFilters } from '@/lib/seo'

export interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams
  const filtersApplied = hasActiveFilters(resolvedSearchParams)

  return buildMetadata({
    title: 'Catálogo de Produtos',
    description:
      'Explore todos os produtos artesanais e locais disponíveis no VERTTEX Marketplace.',
    canonicalPath: '/produtos',
    hasFilters: filtersApplied,
  })
}

export default function ProductsPage() {
  return <ProductDiscoveryView />
}
