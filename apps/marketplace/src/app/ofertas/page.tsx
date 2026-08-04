import { ProductDiscoveryView } from '@/components/discovery/product-discovery-view'

export const metadata = {
  title: 'Ofertas e Promoções | VERTTEX Marketplace',
  description: 'Descubra produtos artesanais em oferta especial no VERTTEX Marketplace',
  robots: {
    index: true,
    follow: true,
  },
}

export default function OffersPage() {
  return (
    <ProductDiscoveryView
      overrideTitle="Ofertas & Promoções"
      overrideDescription="Confira as melhores ofertas e produtos promocionais direto dos produtores"
    />
  )
}
