# 019 — Pedidos e Checkout

## Metadata

- Status: completed
- Priority: High
- Created at: 2026-07-23
- Activated at: 2026-07-28
- Completed at: 2026-07-28
- Dependencies: [`completed/016-customers-and-addresses.md`](.ai/roadmaps/completed/016-customers-and-addresses.md), [`completed/017-cart-and-pricing-rules.md`](.ai/roadmaps/completed/017-cart-and-pricing-rules.md), [`completed/018-marketplace-product-page-and-dynamic-catalog.md`](.ai/roadmaps/completed/018-marketplace-product-page-and-dynamic-catalog.md)

---

## 1. Objetivo Geral

Executar o fluxo de checkout e criação de pedidos no VERTTEX, realizando a **reserva atômica de estoque por lote (FEFO)**, prevenindo overselling via concorrência, gravando **snapshot imutável do produto/variante/dados fiscais** no `OrderItem`, e fornecendo a interface completa de checkout e acompanhamento de pedidos no Marketplace.

---

## 2. Principais Responsabilidades & Integração com Lotes/FEFO

- **Reserva Atômica FEFO**: Seleção atômica de lotes sanitários elegíveis via algoritmo FEFO no momento do checkout (`StockMovement.type = 'RESERVATION'`).
- **Snapshot Imutável (`OrderItem`)**: Gravação dos dados exatos do produto (nome, SKU, opções, preço, custo, foto e tributação fiscal NCM/CEST) no instante da compra para garantir que alterações futuras no catálogo não afetem o histórico.
- **Rastreabilidade Sanitária (`OrderItemLot`)**: Registro de quais lotes específicos e quantidades atenderam cada item do pedido para fins de rastreabilidade e recall.
- **Liberação por Cancelamento**: Cancelamento de pedido ou expiração de checkout libera o lote reservado (`StockMovement.type = 'RELEASE_RESERVATION'`).
- **Marketplace UI**: Páginas `/checkout`, `/pedidos` e `/pedidos/[code]` com componentes Shadcn UI e Skeleton Loading (`animate-pulse`).
- **Testes Automatizados Vitest**: Suíte de testes automatizados cobrindo sucesso, exceções, snapshot e concorrência (`apps/api/src/modules/orders/orders.spec.ts`).
