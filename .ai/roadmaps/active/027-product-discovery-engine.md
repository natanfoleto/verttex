# Roadmap 027 — Product Discovery & Product Listing Engine

> **Status:** `active`  
> **Prioridade:** `critical`  
> **Dependências:** Roadmaps 012, 013, 015, 018  
> **Módulo:** `apps/api/src/modules/catalog` & `apps/marketplace`  
> **Caminho:** `.ai/roadmaps/active/027-product-discovery-engine.md`

---

## 🎯 Objetivo

Evoluir a arquitetura de listagem e descoberta de produtos do Marketplace VERTTEX para uma infraestrutura unificada de **Product Discovery Engine**. 

A navegação pública deixará de depender de uma página genérica `/produtos` e passará a ser orientada por intenção (`/busca?q=...`, `/categoria/[...slugs]`, `/produtor/[slug]`, `/marca/[slug]`, `/ofertas`), consumindo um motor de descoberta robusto com **busca textual ranqueada via PostgreSQL (to_tsvector, f_unaccent IMMUTABLE, websearch_to_tsquery, ts_rank e índice GIN)**, **facetas dinâmicas disjuntivas com contagem de produtos distintos (`COUNT DISTINCT productId`)**, **resolução hierárquica de subcategorias com validação de caminho**, **breadcrumbs dinâmicos**, **filtro de estoque comercial FEFO** e **SEO otimizado**.

---

## 🏗️ Especificações Arquiteturais & Estratégia do Índice de Busca (Etapa 2 Definitiva)

### 1. Estratégia de Indexação e Busca PostgreSQL Nativas
- **Migration SQL:** [20260804212000_product_discovery_search_index](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/prisma/migrations/20260804212000_product_discovery_search_index/migration.sql)
  - Extensão PostgreSQL `unaccent` habilitada.
  - Função wrapper IMMUTABLE `f_unaccent(text)` para compatibilidade total com índices por expressão.
  - Índice GIN em `products USING gin(to_tsvector('portuguese', f_unaccent(COALESCE(name, '') || ' ' || COALESCE("shortDescription", ''))))`.
  - Índices B-Tree Funcionais em `product_variations(LOWER(sku))` e `product_variations(LOWER(barcode))`.
- **Query de Ranking DB:** `searchPostgresFullText()` executa `$queryRaw` nativo no PostgreSQL com filtragem `WHERE ... @@ websearch_to_tsquery('portuguese', f_unaccent($search))`:
  ```sql
  SELECT p.id,
    CASE WHEN EXISTS (
      SELECT 1 FROM product_variations pv 
      WHERE pv."productId" = p.id 
        AND pv.status = 'active' 
        AND pv."deletedAt" IS NULL 
        AND (LOWER(pv.sku) = LOWER($search) OR LOWER(pv.barcode) = LOWER($search))
    ) THEN 1000.0
    ELSE CAST(ts_rank(
      to_tsvector('portuguese', f_unaccent(COALESCE(p.name, '') || ' ' || COALESCE(p."shortDescription", ''))),
      websearch_to_tsquery('portuguese', f_unaccent($search))
    ) AS float) END as rank
  FROM products p
  WHERE p.status = 'active' AND p."isPublished" = true AND p."deletedAt" IS NULL
    AND (
      EXISTS (...)
      OR to_tsvector('portuguese', f_unaccent(...)) @@ websearch_to_tsquery('portuguese', f_unaccent($search))
    )
  ORDER BY rank DESC, p.id DESC
  ```
- **Simetria de Acentuação:** `f_unaccent` aplicada tanto no documento indexado quanto na query `websearch_to_tsquery` (garante que "cachaca" encontre "cachaça" e vice-versa).
- **Segurança de Entrada Pública:** `websearch_to_tsquery` trata nativamente aspas, pontuações, traços, stop-words e termos curtos sem nunca lançar erros de sintaxe 500 no banco.

### 2. Unidade de Resultado e Facetas por Produto Distinto
- **Unidade de Saída:** O resultado final da listagem e da paginação é sempre **PRODUTO** (nunca variantes individualizadas).
- **Deduplicação nas Facetas:** As contagens de facetas (`brand`, `store`, `attributes`, `price`) usam agregação por produto distinto (`COUNT(DISTINCT productId)` ou Set deduplicado), garantindo que múltiplos tipos/pesos de um mesmo produto não inflem as contagens.
- **Match de SKU/GTIN:** Busca por SKU ou código de barras encontra a variante exata, mas retorna o produto correspondente (carregando opcionalmente `matchedVariantId`).

### 3. Rota, Contexto e Estado dos Filtros na URL
- **Rota Padronizada:** `/busca?q=termo` com query params compartilháveis (`/busca?q=mel&florada=silvestre&peso=500g&sort=price_asc&page=2`).
- **Ofertas Reais no Domínio:** `/ofertas` consulta variações com `promotionalPrice != null` e `promotionalPrice < price`.
- **Indexação SEO:** Páginas de busca e filtros aplicados usam `noindex, follow`. Categorias e produtores usam `index, follow` com URLs canônicas.

### 4. Semântica de Facetas & Contagem Disjuntiva (Disjunctive Faceting)
- **Operadores:** Mesma faceta = `OR` (`Florada: Silvestre OR Eucalipto`); Facetas distintas = `AND`.
- **Self-Excluding Facet Counting:** Para calcular as contagens de opções da faceta X, consideram-se todos os filtros ativos *exceto* os selecionados na própria faceta X.

### 5. Validação de Combinações Reais de Variantes Comercializáveis
- **Atributos e Preço:** Filtros por atributos múltiplos (`Peso = 1kg AND Florada = Silvestre`) e faixas de preço (`minPrice`, `maxPrice`) devem obrigatoriamente corresponder a **uma única variante comercialmente disponível** (ativa, não vencida e com estoque comercial `commercialStockAvailable > 0`).

### 6. Ranking Determinístico & Tie-Breaker Estável
- **Desempate Estável:** Toda ordenação inclui `id DESC` como tie-breaker determinístico para evitar duplicação ou desaparecimento de itens entre páginas.

### 7. Sanitização Zod & Limites de Paginação
- **Entradas Protegidas:** `page` (min 1, default 1), `perPage` (min 1, max 100, default 12). Bloqueia valores abusivos via schema Zod com código `400 Bad Request`.

### 8. Resolução Hierárquica de Categorias (`/categoria/[...slugs]`)
- **Fluxo:** 
  1. Validar a hierarquia inteira do caminho (Pai -> Filho -> Neto).
  2. Resolver a árvore de descendentes.
  3. Buscar os produtos pertencentes à categoria contextual e subcategorias descendentes.

---

## 📌 Etapas de Implementação

### Etapa 1: Fundação do `PublicDiscoveryService` & Contrato de Resposta `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`

### Etapa 2: Busca Textual Relevante no PostgreSQL (`to_tsvector`, `f_unaccent` IMMUTABLE, `websearch_to_tsquery`, `ts_rank` & GIN index) `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`
- **Artefatos:** Migration SQL [20260804212000_product_discovery_search_index](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/prisma/migrations/20260804212000_product_discovery_search_index/migration.sql), método `searchPostgresFullText()` com `$queryRaw` nativo no PostgreSQL, predicado `WHERE @@ websearch_to_tsquery`, ranking `ts_rank` ponderado, prioridade de SKU exato no índice funcional `LOWER(sku)` (Score 1000.0) e teste de integração em [discovery-postgres-search.spec.ts](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/src/modules/catalog/discovery-postgres-search.spec.ts).

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
