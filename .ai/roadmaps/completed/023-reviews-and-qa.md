# 023 — Avaliações e Perguntas

## Metadata

- Status: completed
- Priority: Medium
- Created at: 2026-07-23
- Activated at: 2026-07-28
- Completed at: 2026-07-28
- Dependencies: [`completed/018-marketplace-product-page-and-dynamic-catalog.md`](.ai/roadmaps/completed/018-marketplace-product-page-and-dynamic-catalog.md), [`completed/019-orders-and-checkout.md`](.ai/roadmaps/completed/019-orders-and-checkout.md)

---

## 1. Objetivo Geral

Permitir que clientes que efetuaram a compra avaliem os produtos (nota de 1 a 5 estrelas e comentário com compra verificada) e que visitantes realizem perguntas sobre itens do catálogo nas páginas do Marketplace.

---

## 2. Principais Responsabilidades Entregues

- **Módulo de Avaliações & Q&A na API (`apps/api/src/modules/reviews`)**:
  - `POST /reviews`: Avaliação de produto **restrita a compras verificadas (*Verified Purchase*)**, exigindo ao menos um pedido entregue (`DELIVERED`) contendo o produto.
  - `GET /reviews/product/:productId`: Cálculo de média de estrelas e listagem pública de avaliações.
  - `POST /reviews/questions`: Submissão de perguntas por visitantes e compradores.
  - `POST /reviews/questions/:questionId/answer`: Resposta oficial dos lojistas no Manager.
  - `PATCH /reviews/:reviewId/moderate`: Ferramenta para moderadores ocultarem avaliações no Manager com `logAudit()`.
- **Testes Automatizados Vitest**:
  - Suíte `apps/api/src/modules/reviews/reviews.spec.ts` com 4 testes cobrindo compra verificada, rejeição sem compra prévia, Q&A e moderação.
