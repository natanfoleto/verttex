import { ProductDiscoveryView } from '@/components/discovery/product-discovery-view'

export const metadata = {
  title: 'Busca de Produtos | VERTTEX Marketplace',
  description: 'Pesquise e encontre produtos artesanais e locais no VERTTEX Marketplace',
  robots: {
    index: false,
    follow: true,
  },
}

export default function SearchPage() {
  return <ProductDiscoveryView />
}
