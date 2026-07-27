# Roadmap 015 — Publicação e Catálogo do Marketplace

> **Status:** `completed`  
> **Prioridade:** `high`  
> **Criado em:** 2026-07-23  
> **Iniciado em:** 2026-07-27  
> **Concluído em:** 2026-07-27  
> **Dependências:** `013 — Catálogo de Produtos, Variações, Mídias e Uploads R2`, `014 — Estoque, Lotes, FEFO e Movimentações`  
> **Caminho:** `.ai/roadmaps/completed/015-marketplace-catalog-publishing.md`  

---

## 1. Objetivo Geral

Estruturar, expor e integrar publicamente o catálogo de produtos e lojas no Marketplace (`apps/marketplace`), oferecendo busca em tempo real, filtros dinâmicos por categoria, marca, faixa de preço e disponibilidade de estoque comercializável (calculada estritamente via política **FEFO**, excluindo lotes vencidos, bloqueados, em quarentena ou sem margem de entrega).

---

## 2. O que foi Implementado

### 2.1 Backend Fastify (`apps/api`) — Módulo de Catálogo Público (`/public/catalog`)
- **`catalog.schemas.ts`**: Schemas Zod com `.strict()` para validação de busca, filtros de categoria, marca, loja, faixa de preço, ordenação e paginação.
- **`catalog.service.ts` (`PublicCatalogService`)**:
  - `listPublicProducts`: Filtra apenas produtos e lojas ativas/publicadas (`isPublished: true`, `status: 'active'`), calcula saldo comercial disponível via algoritmo FEFO em tempo real.
  - `getPublicProductDetails`: Detalhes completos do produto por slug ou ID com mídias e variações.
  - `listPublicCategories`: Árvore de categorias ativas com hierarquia e contagem de produtos publicados.
  - `listPublicBrands`: Marcas ativas e visíveis.
  - `listPublicStores`: Vitrine de produtoras e lojas parceiras.
  - `getPublicStoreDetails`: Perfil individual da loja parceira com vitrine própria.
- **`catalog.routes.ts` & `catalog.controller.ts`**: Rotas registradas no Fastify sob `/public/catalog/*`, de acesso público a visitantes (sem autenticação).
- **`catalog-integration.spec.ts`**: Suíte de testes de integração Vitest para isolamento de rascunhos, filtros e cálculo FEFO.

### 2.2 Frontend Marketplace (`apps/marketplace`)
- **Página de Produtos (`/produtos`)**: Conectada à API Fastify `/public/catalog/products` e `/public/catalog/categories` via React Query (`useQuery`), com busca em tempo real, filtros dinâmicos na `FilterSidebar`, `ProductCardSkeleton` durante o carregamento e paginação completa.
- **Página de Produtores (`/lojas`)**: Conectada à API `/public/catalog/stores` com grid de `StoreCard` e `StoreCardSkeleton`.
- **Página Individual do Produtor (`/lojas/[storeSlug]`)**: Perfil público do produtor com banner, bio, localização e vitrine própria de produtos.
- **Página por Categoria (`/categorias/[categorySlug]`)**: Listagem filtrada por categoria via API pública.

---

## 3. Validação e Qualidade

- **Compilação TypeScript**: `pnpm typecheck` — 9 pacotes compilados com 0 erros.
- **Suíte de Testes Vitest**: `pnpm --filter @verttex/api test` — 42 testes aprovados em 17 suítes.
