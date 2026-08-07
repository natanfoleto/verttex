# Roadmap 027 — Product Discovery & Product Listing Engine

> **Status:** `completed`  
> **Prioridade:** `critical`  
> **Dependências:** Roadmaps 012, 013, 015, 018  
> **Módulo:** `apps/api/src/modules/catalog` & `apps/marketplace`  
> **Data de Conclusão:** 2026-08-04  
> **Caminho:** `.ai/roadmaps/completed/027-product-discovery-engine.md`

---

## 🎯 Objetivo

Evoluir a arquitetura de listagem e descoberta de produtos do Marketplace VERTTEX para uma infraestrutura unificada de **Product Discovery Engine**.

A navegação pública deixará de depender de uma página genérica `/produtos` e passará a ser orientada por intenção (`/busca?q=...`, `/categoria/[...slugs]`, `/produtor/[slug]`, `/marca/[slug]`, `/ofertas`), consumindo um motor de descoberta robusto em **100% Prisma Client (Zero Raw SQL / Zero $queryRaw / Zero $executeRaw)** com **Search Projection (`ProductSearchDocument`)**, **facetas dinâmicas disjuntivas com contagem de produtos distintos (`COUNT DISTINCT productId`)**, **resolução hierárquica de subcategorias com validação de caminho**, **breadcrumbs dinâmicos**, **filtro de estoque comercial FEFO** e **SEO otimizado**.

---

## 🏗️ Especificações Arquiteturais & Estratégia de Segurança (Etapa 2 Consolidada)

### 1. Conformidade Absoluta com Regras Permanentes de Segurança

- **Runtime 100% Prisma Client:** O runtime da aplicação não contém `$queryRaw`, `$queryRawUnsafe`, `$executeRaw`, `$executeRawUnsafe` ou TypedSQL.
- **Modelagem em `schema.prisma`:**

  ```prisma
  model ProductSearchDocument {
    id                    String   @id @default(uuid())
    productId             String   @unique
    titleNormalized       String
    contextNormalized     String
    attributesNormalized  String
    descriptionNormalized String
    searchTextNormalized  String
    createdAt             DateTime @default(now())
    updatedAt             DateTime @updatedAt

    product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

    @@index([searchTextNormalized])
    @@map("product_search_documents")
  }
  ```

- **Serviço de Normalização & Sincronização:** `ProductSearchIndexService` em [product-search-index.service.ts]`apps/api/src/modules/catalog/product-search-index.service.ts` executa a normalização universal (`normalizeSearchText()`) e upserts via `prisma.productSearchDocument.upsert()`.

### 2. Unidade de Resultado e Facetas por Produto Distinto

- **Unidade de Saída:** O resultado final da listagem e da paginação é sempre **PRODUTO** (nunca variantes individualizadas).
- **Deduplicação nas Facetas:** As contagens de facetas (`brand`, `store`, `attributes`, `price`) usam agregação por produto distinto (`COUNT(DISTINCT productId)` ou Set deduplicado).

---

## 📋 Status de Execução das Etapas do Roadmap 027

### Etapa 1: Diagnóstico e Modelagem Unificada `[CONCLUÍDA & VALIDADA]`

- **Status:** `completed`
- **Artefatos:** DTOs e Interfaces em `discovery.schemas.ts`.

### Etapa 2: Engine de Busca & Search Projection 100% Prisma Client `[CONCLUÍDA & VALIDADA]`

- **Status:** `completed`
- **Artefatos:** `ProductSearchDocument`, `ProductSearchIndexService` com tokenização AND e ranking ponderado via Prisma.

### Etapa 3: Camada de Facetas Dinâmicas & Filtros Desagregados `[CONCLUÍDA & VALIDADA]`

- **Status:** `completed`
- **Artefatos:** Cálculo disjuntivo de facetas (`self-excluding counts`) e produto distinto.

### Etapa 4: Estoque Comercial & Regras de Validade/FEFO no Discovery `[CONCLUÍDA & VALIDADA]`

- **Status:** `completed`
- **Artefatos:** Integração com `calculateBatchCommercialStock()` respeitando quarentena e validade de lotes sem executar reservas.

### Etapa 5: Paginação e Ordenação Consistentes `[CONCLUÍDA & VALIDADA]`

- **Status:** `completed`
- **Artefatos:** Paginação baseada em produtos distintos com totalização de páginas exata.

### Etapa 6: Rotas Públicas Orientadas por Intenção no Marketplace `[CONCLUÍDA & VALIDADA]`

- **Status:** `completed`
- **Artefatos:** `/busca`, `/categoria/[...slugs]`, `/produtor/[slug]`, `/marca/[slug]`, `/ofertas`, `/produtos`.

### Etapa 7: Otimização de SEO, URLs Canônicas & Metadados `[CONCLUÍDA & VALIDADA]`

- **Status:** `completed`
- **Artefatos:** `seo.ts`, `robots.ts`, `sitemap.ts`, metadados App Router e JSON-LD (`Product`, `BreadcrumbList`).

### Etapa 8: Auditoria Final de Testes, Observabilidade & Benchmark `[CONCLUÍDA & VALIDADA]`

- **Status:** `completed`
- **Artefatos:** Benchmark com datasets de 1k, 5k e 10k produtos (< 20ms), hardening Zod (`page max 500`, `perPage max 100`), observabilidade de exceção com logger estruturado (`[SearchIndexRefreshError]`), `getDiscrepancyReport()`.

### Post-validation Bugfix — Frontend Response Rendering `[CONCLUÍDO & VALIDADO]`

- **Status:** `completed`
- **Artefatos:** `product-discovery-view.tsx` & `discovery-frontend-adapter.spec.ts`.
- **Causa Raiz & Solução:** O utilitário `apiClient` no Marketplace já realiza o unwrap automático de respostas HTTP retornando o objeto interno `data.data`. O componente `ProductDiscoveryView` efetuava uma segunda desestruturação (`discoveryRes?.data`), resultando em `undefined` para `products`, o que forçava um array vazio e exibia a tela de `EmptyState` ("Nenhum produto encontrado"). Ajustado a tipagem e consumo para `discoveryData?.products`, restabelecendo a renderização dos cards.

---

## 🏆 Resumo Executivo das Decisões Finais & Fechamento

1. **Segurança Permanente:** 100% Prisma Client em runtime. Zero `$queryRaw`, zero `$executeRaw`, zero TypedSQL.
2. **Projeção de Busca:** `ProductSearchDocument` mantém relação 1:1 exata por `productId` com 0 discrepâncias e recuperação idempotente via `rebuildAllSearchDocuments()`.
3. **Validação EAN/GTIN:** Todos os códigos de barras da seed e do catálogo cumprem o algoritmo GS1 Modulo 10 de checksum.
4. **Performance Comprovada:** O benchmark mediu o motor atual com 10.000 produtos obtendo latência inferior a 20ms. `pg_trgm` ou `FTS` não são necessários no momento.
5. **SEO & Next.js Production Build:** Produção compilada com 0 erros de rotas, metadados App Router e sitemap/robots nativos.
6. **Frontend Rendering Fix:** Correção da desestruturação do contrato no `ProductDiscoveryView`, garantindo exibição de cards em todas as rotas públicas de listagem.
