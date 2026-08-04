# Roadmap 027 — Product Discovery & Product Listing Engine

> **Status:** `active`  
> **Prioridade:** `critical`  
> **Dependências:** Roadmaps 012, 013, 015, 018  
> **Módulo:** `apps/api/src/modules/catalog` & `apps/marketplace`  
> **Caminho:** `.ai/roadmaps/active/027-product-discovery-engine.md`

---

## 🎯 Objetivo

Evoluir a arquitetura de listagem e descoberta de produtos do Marketplace VERTTEX para uma infraestrutura unificada de **Product Discovery Engine**. 

A navegação pública deixará de depender de uma página genérica `/produtos` e passará a ser orientada por intenção (`/busca?q=...`, `/categoria/[...slugs]`, `/produtor/[slug]`, `/marca/[slug]`, `/ofertas`), consumindo um motor de descoberta robusto com **busca textual ranqueada via PostgreSQL**, **facetas dinâmicas disjuntivas com contagem de produtos distintos (`COUNT DISTINCT productId`)**, **resolução hierárquica de subcategorias**, **breadcrumbs dinâmicos**, **filtro de estoque comercial FEFO** e **SEO otimizado**.

---

## 🏗️ Especificações Arquiteturais & Regras Técnicas Concatendas

### 1. Unidade de Resultado e Facetas por Produto Distinto
- **Unidade de Saída:** O resultado final da listagem e da paginação é sempre **PRODUTO** (nunca variantes individualizadas).
- **Deduplicação nas Facetas:** As contagens de facetas (`brand`, `store`, `attributes`, `price`) usam agregação por produto distinto (`COUNT(DISTINCT productId)` ou Set deduplicado), garantindo que múltiplos tipos/pesos de um mesmo produto não inflem as contagens.
- **Match de SKU/GTIN:** Busca por SKU ou código de barras encontra a variante exata, mas retorna o produto correspondente (carregando opcionalmente `matchedVariantId`).

### 2. Rota, Contexto e Estado dos Filtros na URL
- **Rota Padronizada:** `/busca?q=termo` com query params compartilháveis (`/busca?q=mel&florada=silvestre&peso=500g&sort=price_asc&page=2`).
- **Navegação e URL:** O estado dos filtros é gerenciado e refletido na URL (limpando parâmetros vazios e resetando a página para 1 ao alterar filtros).
- **Indexação SEO:** Páginas de busca e filtros aplicados usam `noindex, follow`. Categorias e produtores usam `index, follow` com URLs canônicas.

### 3. Semântica de Facetas & Contagem Disjuntiva (Disjunctive Faceting)
- **Operadores:** Mesma faceta = `OR` (`Florada: Silvestre OR Eucalipto`); Facetas distintas = `AND`.
- **Self-Excluding Facet Counting:** Para calcular as contagens de opções da faceta X, consideram-se todos os filtros ativos *exceto* os selecionados na própria faceta X.

### 4. Validação de Combinações Reais de Variantes Comercializáveis
- **Atributos e Preço:** Filtros por atributos múltiplos (`Peso = 1kg AND Florada = Silvestre`) e faixas de preço (`minPrice`, `maxPrice`) devem obrigatoriamente corresponder a **uma única variante comercialmente disponível** (ativa, não vencida e com estoque comercial `commercialStockAvailable > 0`).

### 5. Ranking Determinístico & Tie-Breaker Estável
- **Desempate Estável:** Toda ordenação inclui `id DESC` como tie-breaker determinístico para evitar duplicação ou desaparecimento de itens entre páginas:
  - `relevance`: `relevanceScore DESC, id DESC`
  - `price_asc`: `price ASC, id DESC`
  - `price_desc`: `price DESC, id DESC`
  - `newest`: `createdAt DESC, id DESC`

### 6. Sanitização Zod & Limites de Paginação
- **Entradas Protegidas:** `page` (min 1, default 1), `perPage` (min 1, max 100, default 12). Bloqueia valores abusivos (`page = -1` ou `limit = 1000000`) via schema Zod com código `400 Bad Request`.

### 7. Resolução Hierárquica de Categorias (`/categoria/[...slugs]`)
- **Fluxo:** 
  1. Validar a hierarquia inteira do caminho (Pai -> Filho -> Neto).
  2. Resolver a árvore de descendentes.
  3. Buscar os produtos pertencentes à categoria contextual e subcategorias descendentes.

### 8. Contrato de Erros da API
- **Parâmetro inválido:** `400 Bad Request`.
- **Entidade inexistente:** `404 Not Found`.
- **Busca sem resultados:** `200 OK` com `products: []`, `total: 0`.

### 9. Responsabilidade do Frontend (`<ProductDiscoveryView />`)
- O componente frontend **NÃO duplica regras de negócio** (não recalcula estoque, facetas ou ordenação). Apresenta a UI, lê/escreve a URL, e trata os estados de loading, erro e empty state.

---

## 📌 Etapas de Implementação

### Etapa 1: Fundação do `PublicDiscoveryService` & Contrato de Resposta `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`
- **Artefatos:** [discovery.service.ts](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/src/modules/catalog/discovery.service.ts), [discovery.schemas.ts](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/src/modules/catalog/discovery.schemas.ts), Rota `GET /public/catalog/discover`, [discovery.spec.ts](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/api/src/modules/catalog/discovery.spec.ts).

### Etapa 2: Busca Textual Relevante no PostgreSQL (`tsvector`, `unaccent` & SKU exact match) `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`
- **Artefatos:** Algoritmo `calculateProductRelevance()`, busca por SKU/Barcode com Score 1000, `unaccent` insensível e ranking determinístico.

### Etapa 3: Resolução Hierárquica de Categorias & Breadcrumbs Recursivos `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`
- **Artefatos:** Resolução recursiva de subcategorias em múltiplos níveis (`getCategorySubtreeIds`), construtor de breadcrumbs (`buildCategoryBreadcrumbs`) e tratamento de erro `404`.

### Etapa 4: Facetas Dinâmicas Disjuntivas por Atributos de Variação `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`
- **Artefatos:** Agregação com `COUNT DISTINCT productId`, filtragem estrita de combinações em variante única vendável e facetas de atributos.

### Etapa 5: Componente Frontend Reutilizável `<ProductDiscoveryView />` `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`
- **Artefatos:** [product-discovery-view.tsx](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/marketplace/src/components/discovery/product-discovery-view.tsx) com sincronização bidirecional na URL, sidebar responsiva e desempate de paginação.

### Etapa 6: Rotas Públicas Orientadas por Intenção no Marketplace `[CONCLUÍDA & VALIDADA]`
- **Status:** `completed`
- **Artefatos:** [/busca](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/marketplace/src/app/busca/page.tsx), [/categoria/[...slugs]](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/marketplace/src/app/categoria/%5B...slugs%5D/page.tsx), [/produtor/[slug]](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/marketplace/src/app/produtor/%5Bslug%5D/page.tsx), [/marca/[slug]](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/marketplace/src/app/marca/%5Bslug%5D/page.tsx), [/produtos](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/marketplace/src/app/produtos/page.tsx).

### Etapa 7: Otimização de SEO, URLs Canônicas & Metadados
- **Metadados:** Tags `title`, `description`, `canonicalUrl` e `noindex, follow` para buscas e filtros aplicados.

### Etapa 8: Auditoria Final de Testes, Integração, Observabilidade & Benchmark
- **Qualidade:** Testes integrados regressivos, observabilidade (logs de tempo de discovery), benchmark de performance (fixtures 1k+ produtos) e hardening.

### Etapa 9: Seed Diversificada de Desenvolvimento
- **Dados:** Atualização do `seed.ts` com dados realistas (Queijos, Mel, Cachaças, Doces, floradas, marcas e lotes).
