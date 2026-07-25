# 021 — Cancelamentos, Trocas e Reembolsos

## Metadata

- Status: Planned
- Priority: Medium
- Created at: 2026-07-23
- Dependencies: [`planned/018-orders-and-checkout.md`](.ai/roadmaps/planned/018-orders-and-checkout.md), [`active/014-inventory-and-stock-movements.md`](.ai/roadmaps/active/014-inventory-and-stock-movements.md)

---

## 1. Objetivo Geral

Gerenciar devoluções de clientes e cancelamentos de pedidos.

---

## 2. Quarentena Obrigatória de Devoluções

- Devoluções de produtos alimentícios ou artesanais com validade entram **obrigatoriamente em quarentena** (`status: quarantine`) ao retornar ao estoque (`StockMovement.type = 'CUSTOMER_RETURN'`).
- O item não é liberado para revenda até inspeção sanitária e liberação formal autorizada.
