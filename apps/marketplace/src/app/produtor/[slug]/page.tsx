import { ProductDiscoveryView } from '@/components/discovery/product-discovery-view'

export interface ProducerPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProducerPage({ params }: ProducerPageProps) {
  const resolvedParams = await params
  return <ProductDiscoveryView initialStoreSlug={resolvedParams.slug} />
}
