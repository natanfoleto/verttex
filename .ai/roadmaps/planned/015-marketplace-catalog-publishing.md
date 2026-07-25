# 015 — Publicação e Catálogo do Marketplace

## Metadata

- Status: Planned
- Priority: High
- Created at: 2026-07-23
- Started at: Não iniciado
- Completed at: Em aberto
- Dependencies: [`completed/013-product-catalog-media-and-uploads.md`](.ai/roadmaps/completed/013-product-catalog-media-and-uploads.md), [`active/014-inventory-and-stock-movements.md`](.ai/roadmaps/active/014-inventory-and-stock-movements.md)

---

> **Observação Importante:** Este roadmap representa um registro conceitual da sequência futura de desenvolvimento do projeto VERTTEX NF. Ele será detalhado, analisado e implementado em uma etapa exclusiva posterior.

---

## 1. Objetivo Geral

Expor publicamente o catálogo de produtos e lojas no Marketplace (`apps/marketplace`), oferecendo busca em tempo real, filtros por categoria, marca, preço e disponibilidade de estoque comercializável (respeitando a política FEFO e excluindo lotes vencidos ou em quarentena).

## 2. Dependências e Relação com Módulos Anteriores

- **Depende de:** `012 — Categorias e Marcas`, `013 — Catálogo de Produtos` e `014 — Estoque, Lotes e FEFO`.
- **Exposição Pública:** Transforma os produtos ativos/publicados do Manager em listagens otimizadas para clientes compradores.

## 3. Principais Responsabilidades

- Rotas públicas de consulta (`GET /public/products`, `GET /public/products/:slug`, `GET /public/stores/:slug`).
- Cálculo de disponibilidade pública agregada por produto/variação via FEFO (excluindo saldos de lotes vencidos, bloqueados, em quarentena ou sem margem mínima de entrega ao cliente).
- Nunca exibir código do lote ou estrutura interna ao consumidor em compras comuns (exceto em promoções específicas de validade próxima autorizadas).
- Filtros por categoria hierárquica, faixa de preço, marcas e ordenação.

## 4. Decisões a Serem Tomadas no Futuro

- Estratégia de busca full-text (PostgreSQL `tsvector` vs. Meilisearch/Elasticsearch).
- Caching de vitrines de produtos com Redis considerando invalidação ao mudar disponibilidade de lotes.

## 5. Riscos Conhecidos

- Exposição indevida de estoque físico não comercializável caso a consulta pública ignore o cálculo de FEFO.
