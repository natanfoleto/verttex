# 017 — Carrinho e Regras de Preço

## Metadata

- Status: Planned
- Priority: High
- Created at: 2026-07-23
- Dependencies: [`completed/013-product-catalog-media-and-uploads.md`](.ai/roadmaps/completed/013-product-catalog-media-and-uploads.md), [`active/014-inventory-and-stock-movements.md`](.ai/roadmaps/active/014-inventory-and-stock-movements.md), [`planned/016-customers-and-addresses.md`](.ai/roadmaps/planned/016-customers-and-addresses.md)

---

## 1. Objetivo Geral

Gerenciar os carrinhos de compras dos clientes no Marketplace, aplicando regras de preço, cupons, descontos por lote próximo do vencimento e validação prévia de disponibilidade comercial por FEFO.

---

## 2. Principais Responsabilidades & Integração com FEFO

- Validação da disponibilidade comercial por FEFO antes da adição ao carrinho.
- **Promoções de Próximo Vencimento:** Suporte a campanhas comerciais com desconto específico para lotes próximos da validade (com transparência para o consumidor e trava automática caso o lote vença).
- O carrinho de compras **não deve bloquear estoque indefinidamente** sem confirmação ou pagamento. A reserva atômica por lote ocorre no momento da aprovação do pedido/pagamento (Roadmap 018).
