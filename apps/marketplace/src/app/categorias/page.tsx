import type { Metadata } from 'next'

import { CategoriesOverviewView } from '@/components/categories/categories-overview-view'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Categorias de Produtos',
  description:
    'Explore todas as categorias de produtos artesanais e regionais disponíveis no VERTTEX Marketplace.',
  canonicalPath: '/categorias',
})

export default function CategoriesPage() {
  return <CategoriesOverviewView />
}
