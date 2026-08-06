# Roadmap 018 — Página do Produto e Integração Dinâmica do Catálogo no Marketplace

> **Status:** `completed`  
> **Prioridade:** `high`  
> **Criado em:** 2026-07-27  
> **Concluído em:** 2026-07-27  
> **Dependências:** `013 — Product Catalog, Media and Uploads`, `015 — Marketplace Catalog Publishing`, `017 — Cart and Pricing Rules`  
> **Caminho:** `.ai/roadmaps/completed/018-marketplace-product-page-and-dynamic-catalog.md`

---

## 1. Objetivo Geral

Disponibilizar a experiência completa de visualização de produto no Marketplace VERTTEX através da página dedicada do produto (`/produtos/[slug]`), perfil público do produtor artesanal (`/produtores/[slug]`), e substituição de todos os dados estáticos (_hardcoded_) por carregamento assíncrono direto do banco de dados (menu de categorias, vitrines da home e filtros do catálogo).

---

## 2. Especificação Completa das Entregas

### 2.1 Backend API (`apps/api/src/modules/catalog`)

1. **Endpoint `GET /public/catalog/products/:slug`**:
   - Retorna os dados completos do produto por slug para renderização da página individual: galeria de mídias R2, variações ativas, preços (normal e promocional), disponibilidade de estoque e dados do produtor local (`Store`).
2. **Endpoint `GET /public/catalog/stores/:slug`**:
   - Retorna os dados públicos da loja produtora (nome, imagem de capa, logo, biografia/descrição) e os produtos publicados vinculados a essa loja.
3. **Endpoint `GET /public/catalog/categories`**:
   - Retorna a árvore hierárquica de categorias ativas para o menu de navegação do Marketplace.

### 2.2 Frontend Marketplace (`apps/marketplace`)

1. **Página Dedicada de Produto (`/produtos/[slug]`)**:
   - Galeria de imagens do R2 com alternância por variação selecionada.
   - Seleção interativa de variação (peso, tamanho, sabor).
   - Exibição de preços e destaque para lotes promocionais por validade (FEFO).
   - Informações da loja produtora com botão _"Ver perfil do produtor"_.
   - Botão de _"Adicionar ao Carrinho"_ com feedback em tempo real no drawer do carrinho.
2. **Página do Produtor Artesanal (`/produtores/[slug]`)**:
   - Vitrine personalizada da loja artesanal com seus dados e catálogo de produtos.
3. **Menu e Home Dinâmicos**:
   - Navegação do cabeçalho alinhada com as categorias cadastradas no banco de dados.
   - Carrosséis e seções da Home consumindo dados reais das lojas e categorias ativas.
4. **Skeleton Loading (`ProductDetailSkeleton`)**:
   - Animações `animate-pulse` para carregamento assíncrono da página do produto.
