# 015 — Publicação e Catálogo do Marketplace

## Metadata

- Status: Planned
- Priority: High
- Created at: 2026-07-23
- Started at: Não iniciado
- Completed at: Em aberto
- Dependencies: [`planned/013-product-catalog-media-and-uploads.md`](.ai/roadmaps/planned/013-product-catalog-media-and-uploads.md), [`planned/014-inventory-and-stock-movements.md`](.ai/roadmaps/planned/014-inventory-and-stock-movements.md)

---

> **Observação Importante:** Este roadmap representa um registro conceitual da sequência futura de desenvolvimento do projeto VERTTEX NF. Ele será detalhado, analisado e implementado em uma etapa exclusiva posterior.

---

## 1. Objetivo Geral

Expor publicamente o catálogo de produtos e lojas no Marketplace (`apps/marketplace`), oferecendo busca em tempo real, filtros por categoria, marca e preço, e vitrines organizadas para os compradores.

## 2. Dependências e Relação com Módulos Anteriores

- **Depende de:** `012 — Categorias e Marcas`, `013 — Catálogo de Produtos` e `014 — Estoque`.
- **Exposição Pública:** Transforma os produtos ativos/publicados do Manager em listagens otimizadas para clientes compradores.

## 3. Principais Responsabilidades

- Rotas públicas de consulta (`GET /public/products`, `GET /public/products/:slug`, `GET /public/stores/:slug`).
- Filtros por categoria hierárquica, faixa de preço, marcas e ordenação (relevância, menor preço, lançamentos).
- Páginas de produto no Marketplace com galerias de fotos, seleção de variações e SEO SSR.

## 4. Decisões a Serem Tomadas no Futuro

- Estratégia de busca full-text (PostgreSQL `tsvector` vs. Meilisearch/Elasticsearch).
- Caching de vitrines de produtos com Redis para alta concorrência.

## 5. Riscos Conhecidos

- Gargalos de performance em consultas de busca sem índices adequados ou sem caching em datas comemorativas.
