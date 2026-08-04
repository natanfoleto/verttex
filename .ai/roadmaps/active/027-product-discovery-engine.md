# Roadmap 027 — Product Discovery & Product Listing Engine

> **Status:** `active`  
> **Prioridade:** `critical`  
> **Dependências:** Roadmaps 012, 013, 015, 018  
> **Módulo:** `apps/api/src/modules/catalog` & `apps/marketplace`  
> **Caminho:** `.ai/roadmaps/active/027-product-discovery-engine.md`

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

- **Serviço de Normalização & Sincronização:** `ProductSearchIndexService` em [product-search-index.service.ts](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/src/modules/catalog/product-search-index.service.ts) executa a normalização universal (`normalizeSearchText()`) e upserts via `prisma.productSearchDocument.upsert()`.

### 2. Unidade de Resultado e Facetas por Produto Distinto
- **Unidade de Saída:** O resultado final da listagem e da paginação é sempre **PRODUTO** (nunca variantes individualizadas).
- **Deduplicação nas Facetas:** As contagens de facetas (`brand`, `store`, `attributes`, `price`) usam agregação por produto distinto (`COUNT(DISTINCT productId)` ou Set deduplicado).

---

## 📌 Etapas de Implementação

### Etapa 1: Fundação do `PublicDiscoveryService` & Contrato de Resposta `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`

### Etapa 2: Busca Textual Relevante via Search Projection 100% Prisma Client (`ProductSearchDocument`, Zero Raw SQL) `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`
- **Artefatos:**
  - [schema.prisma](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/prisma/schema.prisma) — modelo `ProductSearchDocument` com `@@index([searchTextNormalized])` (índice B-Tree retido para `equals`/`startsWith` futuros; `contains` gera seq scan, aceitável para catálogos ≤ 10k produtos — ver Etapa 8).
  - [product-search-index.service.ts](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/src/modules/catalog/product-search-index.service.ts) — `normalizeSearchText()`, `tokenizeQuery()`, `syncProductSearchDocument()`, `refreshByBrand()`, `refreshByCategory()`, `refreshByStore()`, `rebuildAllSearchDocuments()` em batches de 100.
  - [discovery.service.ts](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/src/modules/catalog/discovery.service.ts) — `searchPrismaClient()` com semântica AND por token (multi-termo), ranking por campo (título+500, contexto+200, atributos+100, descrição+50), paginação após ranking.
  - [product-search-index.spec.ts](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/src/modules/catalog/product-search-index.spec.ts) — 19 testes cobrindo normalização, tokenização, AND cross-field, ranking, paginação estável, refresh de entidades compartilhadas e exclusão de produto arquivado.
- **Sincronização automática de Search Document:**
  - `products.service.ts` — após `createProduct`, `updateProduct`, `publishProduct`.
  - `brands.service.ts` — após `updateBrand` via `refreshByBrand()`.
  - `categories.service.ts` — após `updateCategory` via `refreshByCategory()`.
  - `stores.service.ts` — após `updateStore` via `refreshByStore()`.
  - `archiveProduct` — soft-delete: `onDelete: Cascade` **NÃO** é disparado. SearchDocument é retido intencionalmente. O Discovery filtra `{ status: "active", isPublished: true, deletedAt: null }` garantindo que produtos arquivados nunca apareçam publicamente.


### Etapa 3: Resolução Hierárquica de Categorias & Breadcrumbs Recursivos `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`

### Etapa 4: Facetas Dinâmicas Disjuntivas por Atributos de Variação `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`

### Etapa 5: Componente Frontend Reutilizável `<ProductDiscoveryView />` `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`

### Etapa 6: Rotas Públicas Orientadas por Intenção no Marketplace `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`

### Etapa 7: Otimização de SEO, URLs Canônicas & Metadados
- **Metadados:** Tags `title`, `description`, `canonicalUrl` e `noindex, follow` para buscas e filtros aplicados.

### Etapa 8: Auditoria Final de Testes, Integração, Observabilidade & Benchmark
- **Qualidade:** Testes integrados regressivos, observabilidade (logs de tempo de discovery), benchmark de performance (fixtures 1k+ produtos) e hardening.

### Etapa 9: Seed Diversificada de Desenvolvimento
- **Dados:** Atualização do `seed.ts` com dados realistas (Queijos, Mel, Cachaças, Doces, floradas, marcas e lotes).
