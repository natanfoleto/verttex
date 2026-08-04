import { ProductDiscoveryView } from '@/components/discovery/product-discovery-view'

export interface BrandPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function BrandPage({ params }: BrandPageProps) {
  const resolvedParams = await params
  return <ProductDiscoveryView initialBrandSlug={resolvedParams.slug} />
}
