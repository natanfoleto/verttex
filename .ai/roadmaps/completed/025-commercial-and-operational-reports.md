# 025 — Relatórios Comerciais e Operacionais

## Metadata

- Status: completed
- Priority: Medium
- Created at: 2026-07-23
- Activated at: 2026-07-28
- Completed at: 2026-07-28
- Dependencies: [`completed/019-orders-and-checkout.md`](.ai/roadmaps/completed/019-orders-and-checkout.md), [`completed/020-payments.md`](.ai/roadmaps/completed/020-payments.md)

---

## 1. Objetivo Geral

Oferecer dashboards executivos e relatórios de inteligência comercial/operacional para gestores das lojas no VERTTEX (faturamento total, ticket médio, produtos mais vendidos, curva ABC e resumo de auditoria).

---

## 2. Principais Responsabilidades Entregues

- **Módulo de Relatórios na API (`apps/api/src/modules/reports`)**:
  - `GET /reports/sales-summary`: Resumo de vendas com faturamento líquido total, volume de pedidos e ticket médio.
  - `GET /reports/top-products`: Ranking de vendas e classificação de curva ABC de produtos (A: 80% do faturamento, B: 15%, C: 5%).
  - `GET /reports/inventory-losses`: Agregação de perdas de estoque por descarte sanitário/avaria (`DAMAGE_DISCARD` / `EXPIRATION_DISCARD`).
  - `GET /reports/export`: Exportação de dados consolidados em formato CSV e JSON com auditoria via `logAudit()`.
- **Testes Automatizados Vitest**:
  - Suíte `apps/api/src/modules/reports/reports.spec.ts` com 4 testes cobrindo cálculos financeiros, classificação da curva ABC, perdas de estoque e exportação em CSV com auditoria.
