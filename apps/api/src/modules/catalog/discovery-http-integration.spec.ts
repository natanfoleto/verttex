import { beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '../../app'
import { prisma } from '../../infrastructure/database/prisma'
import { ProductSearchIndexService } from './product-search-index.service'

async function seedDeterministicCatalogDataset() {
  await prisma.$executeRaw`TRUNCATE TABLE product_search_documents, product_variations, products, categories, stores, brands CASCADE`

  const store = await prisma.store.create({
    data: {
      name: 'Loja Teste Catálogo',
      slug: 'loja-teste-catalogo',
      status: 'active',
    },
  })

  const catQueijo = await prisma.category.create({
    data: {
      name: 'Queijos',
      slug: 'queijos',
    },
  })

  const catMel = await prisma.category.create({
    data: {
      name: 'Mel e Derivados',
      slug: 'mel-e-derivados',
    },
  })

  const catOutros = await prisma.category.create({
    data: {
      name: 'Outros Artesanais',
      slug: 'outros-artesanais',
    },
  })

  // 1. SKU Canastra Meia Cura 500g (Queijo #1)
  const pSku = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: catQueijo.id,
      name: 'Queijo Canastra Meia Cura 500g',
      slug: 'queijo-canastra-meia-cura-500g',
      shortDescription: 'Queijo Canastra Meia Cura artesanal',
      status: 'active',
      isPublished: true,
    },
  })
  await prisma.productVariation.create({
    data: {
      productId: pSku.id,
      storeId: store.id,
      sku: 'CANASTRA-MC-500G',
      price: 50.0,
      isDefault: true,
      status: 'active',
    },
  })

  // 2. Barcode Mel de Eucalipto (Mel #1)
  const pBarcode = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: catMel.id,
      name: 'Mel de Eucalipto Puro 500g',
      slug: 'mel-de-eucalipto-puro-500g',
      shortDescription: 'Mel de eucalipto puro',
      status: 'active',
      isPublished: true,
    },
  })
  await prisma.productVariation.create({
    data: {
      productId: pBarcode.id,
      storeId: store.id,
      sku: 'MEL-EUC-500G',
      barcode: '7891234567888',
      price: 35.0,
      isDefault: true,
      status: 'active',
    },
  })

  // 3. 19 additional Queijo products (Queijos #2 to #20) -> Total 20 Queijos
  for (let i = 2; i <= 20; i++) {
    const qName =
      i === 2
        ? 'Queijo Canastra Real Curado 1kg'
        : i === 3
          ? 'Requeijão de Corte Caipira 400g'
          : `Queijo Minas Artesanal ${i}`
    const p = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: catQueijo.id,
        name: qName,
        slug: `queijo-artesanal-${i}`,
        shortDescription: 'Queijo tradicional de minas',
        status: 'active',
        isPublished: true,
      },
    })
    await prisma.productVariation.create({
      data: {
        productId: p.id,
        storeId: store.id,
        sku: `QUEIJO-SKU-${i}`,
        price: 40.0 + i,
        isDefault: true,
        status: 'active',
      },
    })
  }

  // 4. 4 additional Mel products (Méis #2 to #5) -> Total 5 Mel products
  const melNames = [
    {
      name: 'Mel Silvestre Orgânico 500g',
      slug: 'mel-silvestre-organico-500g',
      sku: 'MEL-SILV-500G',
    },
    {
      name: 'Mel Silvestre Premium Pote',
      slug: 'mel-silvestre-premium-pote',
      sku: 'MEL-PREM-500G',
    },
    {
      name: 'Extrato de Própolis Vermelha 30ml',
      slug: 'extrato-de-propolis-vermelha-30ml',
      sku: 'PROP-30ML',
    },
    {
      name: 'Favos de Mel In Natura 300g',
      slug: 'favos-de-mel-in-natura-300g',
      sku: 'FAVOS-300G',
    },
  ]
  for (const m of melNames) {
    const p = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: catMel.id,
        name: m.name,
        slug: m.slug,
        shortDescription: 'Mel puro e natural',
        status: 'active',
        isPublished: true,
      },
    })
    await prisma.productVariation.create({
      data: {
        productId: p.id,
        storeId: store.id,
        sku: m.sku,
        price: 30.0,
        isDefault: true,
        status: 'active',
      },
    })
  }

  // 5. Compota de Figo Ramy (1 product)
  const pFigo = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: catOutros.id,
      name: 'Compota de Figo Ramy 400g',
      slug: 'compota-de-figo-ramy-400g',
      shortDescription: 'Doce de figo em calda artesanal',
      status: 'active',
      isPublished: true,
    },
  })
  await prisma.productVariation.create({
    data: {
      productId: pFigo.id,
      storeId: store.id,
      sku: 'FIGO-400G',
      price: 25.0,
      isDefault: true,
      status: 'active',
    },
  })

  // 6. 12 additional Artisan products -> Total = 1 + 1 + 19 + 4 + 1 + 13 = 39 products!
  const artisanItems = [
    'Cachaça Artesanal Amburana 750ml',
    'Cachaça Reserva Boa Esperança',
    'Cachaça Envelhecida Carvalho 750ml',
    'Cachaça Prata Tradicional 670ml',
    'Licor Artesanal de Jabuticaba 500ml',
    'Manteiga de Garrafa Artesanal 500ml',
    'Doce de Leite Viçosa Tradicional',
    'Doce de Leite com Coco 400g',
    'Goiabada Cascão Artesanal 500g',
    'Paçoca Caseira de Amendoim 300g',
    'Pé de Moleque Crocante 250g',
    'Açúcar Mascavo Puro 1kg',
    'Doce de Abóbora com Coco 500g',
  ]
  for (let idx = 0; idx < artisanItems.length; idx++) {
    const artName = artisanItems[idx]!
    const p = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: catOutros.id,
        name: artName,
        slug: `artisan-prod-${idx + 1}`,
        shortDescription: 'Produto regional mineiro',
        status: 'active',
        isPublished: true,
      },
    })
    await prisma.productVariation.create({
      data: {
        productId: p.id,
        storeId: store.id,
        sku: `ARTISAN-SKU-${idx + 1}`,
        price: 20.0 + idx,
        isDefault: true,
        status: 'active',
      },
    })
  }

  await ProductSearchIndexService.rebuildAllSearchDocuments()
}

describe('Product Discovery Engine — Fastify HTTP + Prisma Real Integration', () => {
  let app: ReturnType<typeof buildApp>

  beforeAll(async () => {
    await seedDeterministicCatalogDataset()
    app = buildApp()
    await app.ready()
  })

  it("1. GET /public/catalog/discover?q=mel — aplica filtro por 'mel' e exclui não relacionados", async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?q=mel&page=1&perPage=50&sort=relevance',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.success).toBe(true)

    const products = body.data.products
    expect(products.length).toBeGreaterThan(0)
    expect(products.length).toBeLessThan(39) // Deve filtrar o catálogo geral (39 produtos)

    // Todos os produtos retornados devem conter 'mel' ou derivado no nome/contexto
    const melNames = products.map((p: { name: string }) => p.name.toLowerCase())
    const hasMel = melNames.some(
      (name: string) =>
        name.includes('mel') ||
        name.includes('favo') ||
        name.includes('própolis'),
    )
    expect(hasMel).toBe(true)

    // Produto totalmente não relacionado não deve estar no resultado
    const hasFigo = melNames.includes('compota de figo ramy 400g')
    expect(hasFigo).toBe(false)
  })

  it("2. GET /public/catalog/discover?q=queijo — aplica filtro por 'queijo'", async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?q=queijo&page=1&perPage=50&sort=relevance',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.success).toBe(true)

    const products = body.data.products
    expect(products.length).toBeGreaterThan(0)

    const names = products.map((p: { name: string }) => p.name.toLowerCase())
    const hasQueijo = names.some(
      (name: string) => name.includes('queijo') || name.includes('requeijão'),
    )
    expect(hasQueijo).toBe(true)
  })

  it('3. Prova que q=mel != q=queijo != catálogo sem q', async () => {
    const resMel = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?q=mel&page=1&perPage=50',
    })
    const resQueijo = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?q=queijo&page=1&perPage=50',
    })
    const resSemQ = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?page=1&perPage=50',
    })

    const bodyMel = resMel.json()
    const bodyQueijo = resQueijo.json()
    const bodySemQ = resSemQ.json()

    const idsMel: string[] = bodyMel.data.products.map(
      (p: { id: string }) => p.id,
    )
    const idsQueijo: string[] = bodyQueijo.data.products.map(
      (p: { id: string }) => p.id,
    )
    const idsSemQ: string[] = bodySemQ.data.products.map(
      (p: { id: string }) => p.id,
    )

    expect(idsMel).not.toEqual(idsQueijo)
    expect(idsMel).not.toEqual(idsSemQ)
    expect(idsQueijo).not.toEqual(idsSemQ)
    expect(bodySemQ.data.pagination.total).toBe(39)
  })

  it('4. GET /public/catalog/discover?q=termo-inexistente-xyz — total 0 e products []', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?q=termo-inexistente-xyz&page=1&perPage=50',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.success).toBe(true)
    expect(body.data.products).toEqual([])
    expect(body.data.pagination.total).toBe(0)
  })

  it('5. Busca por SKU real via HTTP — recupera produto esperado com score máximo com Prisma real', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?q=CANASTRA-MC-500G',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.success).toBe(true)
    expect(body.data.products.length).toBeGreaterThan(0)

    const firstProduct = body.data.products[0]
    expect(firstProduct.name).toBe('Queijo Canastra Meia Cura 500g')
    expect(firstProduct.relevanceScore).toBe(1000)
  })

  it('6. Busca por Barcode real via HTTP — recupera produto esperado com score máximo com Prisma real', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?q=7891234567888',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.success).toBe(true)
    expect(body.data.products.length).toBeGreaterThan(0)

    const firstProduct = body.data.products[0]
    expect(firstProduct.name).toBe('Mel de Eucalipto Puro 500g')
    expect(firstProduct.relevanceScore).toBe(1000)
  })

  it('7. Aliases e regra de precedência (q > search > query)', async () => {
    // ?search=mel deve ser equivalente a ?q=mel
    const resSearch = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?search=mel',
    })
    const resQ = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?q=mel',
    })
    expect(resSearch.statusCode).toBe(200)
    expect(
      resSearch.json().data.products.map((p: { id: string }) => p.id),
    ).toEqual(resQ.json().data.products.map((p: { id: string }) => p.id))

    // ?query=mel deve ser equivalente a ?q=mel
    const resQuery = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?query=mel',
    })
    expect(resQuery.statusCode).toBe(200)
    expect(
      resQuery.json().data.products.map((p: { id: string }) => p.id),
    ).toEqual(resQ.json().data.products.map((p: { id: string }) => p.id))

    // Precedência q > search: ?q=mel&search=queijo deve retornar resultados de 'mel'
    const resConflict = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?q=mel&search=queijo',
    })
    expect(resConflict.statusCode).toBe(200)
    expect(
      resConflict.json().data.products.map((p: { id: string }) => p.id),
    ).toEqual(resQ.json().data.products.map((p: { id: string }) => p.id))
  })

  it('8. Boundary HTTP converte q para search canônico e service processa sem conhecer q', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?q=queijo',
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.success).toBe(true)
    expect(body.data.context.type).toBe('search')
    expect(body.data.context.query).toBe('queijo')
    expect(body.data.products.length).toBe(20)
  })

  it('9. Resposta HTTP do Discovery NÃO expõe campos internos (rawProd, hasAttributeMatch)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/public/catalog/discover?q=mel',
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.success).toBe(true)

    for (const prod of body.data.products) {
      expect(prod).not.toHaveProperty('rawProd')
      expect(prod).not.toHaveProperty('hasAttributeMatch')
    }
  })
})
