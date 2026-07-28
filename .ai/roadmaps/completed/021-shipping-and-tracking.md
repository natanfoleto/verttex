# 021 — Entregas e Rastreamento

## Metadata

- Status: completed
- Priority: High
- Created at: 2026-07-23
- Activated at: 2026-07-28
- Completed at: 2026-07-28
- Dependencies: [`completed/019-orders-and-checkout.md`](.ai/roadmaps/completed/019-orders-and-checkout.md), [`completed/020-payments.md`](.ai/roadmaps/completed/020-payments.md)

---

## 1. Objetivo Geral

Gerenciar fretes, expedição de mercadorias e rastreamento de entregas aos compradores no VERTTEX.

---

## 2. Principais Responsabilidades Entregues

- **Módulo de Entregas & Rastreamento na API (`apps/api/src/modules/shipping`)**:
  - `POST /shipping/quote`: Cotação de frete e prazos por CEP.
  - `POST /shipping/orders/:orderId/dispatch`: Expedição de pedidos (`SHIPPED`) com **revalidação estrita da margem de validade sanitária do lote (`minDeliveryShelfLifeDays`)** e emissão de `StockMovement.type = 'DISPATCH'`.
  - `POST /shipping/orders/:orderId/tracking`: Atualização de eventos de rastreamento de transporte.
  - `POST /shipping/orders/:orderId/deliver`: Confirmação de entrega ao cliente (`DELIVERED`).
- **Testes Automatizados Vitest**:
  - Suíte `apps/api/src/modules/shipping/shipping.spec.ts` com 4 testes cobrindo cotação de frete, expedição, bloqueio por validade vencida e confirmação de entrega.
