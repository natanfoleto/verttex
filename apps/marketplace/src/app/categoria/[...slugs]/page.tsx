import { ProductDiscoveryView } from '@/components/discovery/product-discovery-view'

export interface CategoryPageProps {
  params: Promise<{
    slugs: string[]
  }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params
  const slugs = resolvedParams.slugs || []
  const targetCategorySlug = slugs.join('/')

  return <ProductDiscoveryView initialCategorySlug={targetCategorySlug} />
}
