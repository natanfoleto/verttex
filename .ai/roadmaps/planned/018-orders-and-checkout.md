# 018 — Pedidos e Checkout

## Metadata

- Status: Planned
- Priority: High
- Created at: 2026-07-23
- Started at: Não iniciado
- Completed at: Em aberto
- Dependencies: [`planned/016-customers-and-addresses.md`](.ai/roadmaps/planned/016-customers-and-addresses.md), [`planned/017-cart-and-pricing-rules.md`](.ai/roadmaps/planned/017-cart-and-pricing-rules.md)

---

> **Observação Importante:** Este roadmap representa um registro conceitual da sequência futura de desenvolvimento do projeto VERTTEX NF. Ele será detalhado, analisado e implementado em uma etapa exclusiva posterior.

---

## 1. Objetivo Geral

Orquestrar a criação, ciclo de vida e acompanhamento de pedidos comerciais no ecossistema VERTTEX, desde a confirmação do checkout no Marketplace até a gestão de etapas pelo vendedor no Manager.

## 2. Dependências e Relação com Módulos Anteriores

- **Depende de:** `013 — Catálogo`, `014 — Estoque`, `016 — Clientes` e `017 — Carrinho`.

## 3. Principais Responsabilidades

- Tabelas `orders` (`Order`) e `order_items` (`OrderItem`) com snapshot de dados no momento da compra (preço, nome do produto, SKU, loja, endereço de entrega).
- Máquina de estados do pedido: `pending_payment` -> `paid` -> `processing` -> `shipped` -> `delivered` / `canceled`.
- Visualização de pedidos no Manager (por loja) e no Marketplace (meus pedidos do cliente).

## 4. Decisões a Serem Tomadas no Futuro

- Formato de identificação pública do pedido (código amigável tipo `#VT-10492`).

## 5. Riscos Conhecidos

- Alterações futuras nos produtos/preços não podem afetar os dados históricos de pedidos antigos (obriga o uso de snapshot).
