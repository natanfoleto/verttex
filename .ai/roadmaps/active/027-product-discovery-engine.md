# Roadmap 027 — Product Discovery & Product Listing Engine

> **Status:** `active`  
> **Prioridade:** `critical`  
> **Dependências:** Roadmaps 012, 013, 015, 018  
> **Módulo:** `apps/api/src/modules/catalog` & `apps/marketplace`  
> **Caminho:** `.ai/roadmaps/active/027-product-discovery-engine.md`

---

## 🎯 Objetivo

Evoluir a arquitetura de listagem e descoberta de produtos do Marketplace VERTTEX para uma infraestrutura unificada de **Product Discovery Engine**. 

A navegação pública deixará de depender de uma página genérica `/produtos` e passará a ser orientada por intenção (`/busca?q=...`, `/categoria/[...slugs]`, `/produtor/[slug]`, `/marca/[slug]`, `/ofertas`), consumindo um motor de descoberta robusto com **busca textual ranqueada via PostgreSQL Search Projection (`search_vector` tsvector pré-calculado com f_unaccent IMMUTABLE, websearch_to_tsquery, setweight A/B/C/D e índice GIN)**, **facetas dinâmicas disjuntivas com contagem de produtos distintos (`COUNT DISTINCT productId`)**, **resolução hierárquica de subcategorias com validação de caminho**, **breadcrumbs dinâmicos**, **filtro de estoque comercial FEFO** e **SEO otimizado**.

---

## 🏗️ Especificações Arquiteturais & Estratégia de Search Projection (Etapa 2 Definitiva)

### 1. Coluna de Projeção `search_vector` e Indexação GIN
- **Migration SQL:** [20260804212000_product_discovery_search_index](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/prisma/migrations/20260804212000_product_discovery_search_index/migration.sql)
  - Coluna `search_vector tsvector` adicionada em `products`.
  - Função IMMUTABLE `f_unaccent(text)`.
  - Função de montagem do vetor `build_product_search_vector(p_product_id text)` agregando Nome do Produto (A), Categoria (B), Marca (B), Produtor/Loja (B), Atributos de Variantes (C) e Descrição curta (D).
  - Rotina de atualização `refresh_product_search_vector(p_product_id text)` e **Backfill automático** de produtos existentes.
  - Índice GIN direto em `products USING gin(search_vector)`.
  - Índices B-Tree Funcionais em `product_variations(LOWER(sku))` e `product_variations(LOWER(barcode))`.
- **Query de Leitura de Ultra-Baixa Latência:**
  ```sql
  SELECT p.id,
    CASE WHEN EXISTS (
      SELECT 1 FROM product_variations pv 
      WHERE pv."productId" = p.id AND pv.status = 'active' AND pv."deletedAt" IS NULL 
        AND (LOWER(pv.sku) = LOWER($search) OR LOWER(pv.barcode) = LOWER($search))
    ) THEN 1000.0
    ELSE CAST(ts_rank(COALESCE(p.search_vector, ...), websearch_to_tsquery('portuguese', f_unaccent($search))) AS float)
  END as rank
  FROM products p
  WHERE p.status = 'active' AND p."isPublished" = true AND p."deletedAt" IS NULL
    AND (
      EXISTS (...)
      OR p.search_vector @@ websearch_to_tsquery('portuguese', f_unaccent($search))
    )
  ORDER BY rank DESC, p.id DESC
  ```
- **Performance Garantida:** A consulta de busca lê diretamente o índice GIN `products_search_vector_gin_idx` via **Bitmap Index Scan** sem precisar recalcular agregados ou realizar joins pesados em runtime.

### 2. Unidade de Resultado e Facetas por Produto Distinto
- **Unidade de Saída:** O resultado final da listagem e da paginação é sempre **PRODUTO** (nunca variantes individualizadas).
- **Deduplicação nas Facetas:** As contagens de facetas (`brand`, `store`, `attributes`, `price`) usam agregação por produto distinto (`COUNT(DISTINCT productId)` ou Set deduplicado), garantindo que múltiplos tipos/pesos de um mesmo produto não inflem as contagens.

---

## 📌 Etapas de Implementação

### Etapa 1: Fundação do `PublicDiscoveryService` & Contrato de Resposta `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`

### Etapa 2: Busca Textual Relevante via Search Projection PostgreSQL (`search_vector` tsvector, `f_unaccent` IMMUTABLE, `websearch_to_tsquery`, `setweight A/B/C/D` & GIN index) `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`
- **Artefatos:** Migration SQL [20260804212000_product_discovery_search_index](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/prisma/migrations/20260804212000_product_discovery_search_index/migration.sql), método `refreshProductSearchDocument()`, método `searchPostgresFullText()` lendo a projeção `search_vector` com índice GIN nativo, prioridade de SKU/Barcode (Score 1000.0) e testes de aceitação em [discovery-postgres-search.spec.ts](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/src/modules/catalog/discovery-postgres-search.spec.ts).

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
