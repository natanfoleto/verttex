import type { Metadata } from 'next'

import { ProductDiscoveryView } from '@/components/discovery/product-discovery-view'
import { buildMetadata, sanitizeMetaText } from '@/lib/seo'

export interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams
  const rawQ = resolvedSearchParams.q || resolvedSearchParams.search
  const q = typeof rawQ === 'string' ? sanitizeMetaText(rawQ) : ''

  const title = q ? `Resultados para "${q}"` : 'Busca de Produtos'
  const description = q
    ? `Exibindo produtos artesanais para a busca "${q}" no VERTTEX Marketplace`
    : 'Pesquise e encontre produtos artesanais e locais no VERTTEX Marketplace'

  return buildMetadata({
    title,
    description,
    canonicalPath: '/busca',
    noIndex: true, // Internal search pages MUST be noindex
  })
}

export default function SearchPage() {
  return <ProductDiscoveryView />
}
