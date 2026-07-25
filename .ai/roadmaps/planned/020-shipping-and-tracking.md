# 020 — Entregas e Rastreamento

## Metadata

- Status: Planned
- Priority: High
- Created at: 2026-07-23
- Dependencies: [`planned/018-orders-and-checkout.md`](.ai/roadmaps/planned/018-orders-and-checkout.md), [`active/014-inventory-and-stock-movements.md`](.ai/roadmaps/active/014-inventory-and-stock-movements.md)

---

## 1. Objetivo Geral

Gerenciar fretes, expedição e rastreamento de entregas aos compradores.

---

## 2. Integração com Lotes e Margem de Validade na Entrega

- Na expedição do pedido (`StockMovement.type = 'DISPATCH'`), o sistema revalida se a data estimada de entrega somada à margem mínima de validade (`minDeliveryShelfLifeDays`) continua sendo atendida pelo lote fisicamente separado.
- Registro dos lotes efetivamente despachados para rastreabilidade de entrega aos clientes.
