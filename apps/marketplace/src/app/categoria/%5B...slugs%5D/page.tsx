import type { Metadata } from 'next'

import { ProductDiscoveryView } from '@/components/discovery/product-discovery-view'
import { buildMetadata, fetchDiscoveryContext, hasActiveFilters } from '@/lib/seo'

export interface CategoryPageProps {
  params: Promise<{
    slugs: string[]
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  const slugs = resolvedParams.slugs || []
  const categoryPath = slugs.join('/')
  const cleanCanonicalPath = `/categoria/${categoryPath}`

  const discovery = await fetchDiscoveryContext({ categoryPath })
  const category = discovery?.context?.category

  if (!category && !discovery?.context?.title) {
    return buildMetadata({
      title: 'Categoria não encontrada',
      description: 'A categoria solicitada não existe ou está indisponível.',
      canonicalPath: cleanCanonicalPath,
      noIndex: true,
    })
  }

  const title = category?.name || discovery?.context?.title || 'Categoria'
  const description =
    discovery?.context?.description ||
    `Confira a seleção de ${title} de produtores locais e artesanais no VERTTEX Marketplace.`

  const filtersApplied = hasActiveFilters(resolvedSearchParams)

  return buildMetadata({
    title,
    description,
    canonicalPath: cleanCanonicalPath,
    hasFilters: filtersApplied,
  })
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params
  const slugs = resolvedParams.slugs || []
  const targetCategorySlug = slugs[slugs.length - 1] || ''

  return <ProductDiscoveryView initialCategorySlug={targetCategorySlug} />
}
