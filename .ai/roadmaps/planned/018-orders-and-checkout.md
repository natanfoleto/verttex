# 018 — Pedidos e Checkout

## Metadata

- Status: Planned
- Priority: High
- Created at: 2026-07-23
- Dependencies: [`planned/016-customers-and-addresses.md`](.ai/roadmaps/planned/016-customers-and-addresses.md), [`planned/017-cart-and-pricing-rules.md`](.ai/roadmaps/planned/017-cart-and-pricing-rules.md), [`active/014-inventory-and-stock-movements.md`](.ai/roadmaps/active/014-inventory-and-stock-movements.md)

---

## 1. Objetivo Geral

Executar o fluxo de checkout e criação de pedidos, realizando a **reserva atômica de estoque por lote (FEFO)**, prevenindo overselling via concorrência e garantindo revalidação de validade na confirmação.

---

## 2. Principais Responsabilidades & Integração com Lotes/FEFO

- Seleção atômica de lotes via algoritmo FEFO no momento da geração de reserva (`StockMovement.type = 'RESERVATION'`).
- Transação com isolamento para evitar que duas compras concorrentes reservem a mesma quantidade física do mesmo lote.
- Cancelamento de pedido ou expiração de pagamento libera a exata quantidade do lote reservado (`StockMovement.type = 'RELEASE_RESERVATION'`).
- Rastreabilidade: O pedido registra internamente os `lotId`s reservados para auditoria e recall sanitário futuro.
