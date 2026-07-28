# 021 — Entregas e Rastreamento

## Metadata

- Status: active
- Priority: High
- Created at: 2026-07-23
- Activated at: 2026-07-28
- Dependencies: [`completed/019-orders-and-checkout.md`](.ai/roadmaps/completed/019-orders-and-checkout.md), [`completed/020-payments.md`](.ai/roadmaps/completed/020-payments.md)

---

## 1. Objetivo Geral

Gerenciar fretes, expedição de mercadorias e rastreamento de entregas aos compradores no VERTTEX.

---

## 2. Integração com Lotes e Margem de Validade na Entrega

- Na expedição do pedido (`StockMovement.type = 'DISPATCH'`), o sistema revalida se a data estimada de entrega somada à margem mínima de validade (`minDeliveryShelfLifeDays`) continua sendo atendida pelo lote fisicamente separado.
- Registro dos lotes efetivamente despachados para rastreabilidade de entrega aos clientes.
