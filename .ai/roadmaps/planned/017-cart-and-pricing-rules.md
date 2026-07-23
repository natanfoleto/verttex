# 017 — Carrinho e Regras de Preço

## Metadata

- Status: Planned
- Priority: High
- Created at: 2026-07-23
- Started at: Não iniciado
- Completed at: Em aberto
- Dependencies: [`planned/013-product-catalog-media-and-uploads.md`](.ai/roadmaps/planned/013-product-catalog-media-and-uploads.md), [`planned/016-customers-and-addresses.md`](.ai/roadmaps/planned/016-customers-and-addresses.md)

---

> **Observação Importante:** Este roadmap representa um registro conceitual da sequência futura de desenvolvimento do projeto VERTTEX NF. Ele será detalhado, analisado e implementado em uma etapa exclusiva posterior.

---

## 1. Objetivo Geral

Prover a gestão de carrinho de compras (para clientes autenticados e visitantes), agrupando itens por loja (multi-vendor cart), aplicando cupons de desconto e regras de preço.

## 2. Dependências e Relação com Módulos Anteriores

- **Depende de:** `013 — Catálogo de Produtos`, `014 — Estoque` e `016 — Clientes`.

## 3. Principais Responsabilidades

- Armazenamento de carrinho em sessão/Redis para visitantes e persistência no banco para clientes autenticados.
- Separação visual e lógica dos itens por loja (cada loja gera um sub-pedido ou checkout integrado).
- Motor de regras de preço: cupons de desconto, preço promocional por variação, valor mínimo de pedido por loja.

## 4. Decisões a Serem Tomadas no Futuro

- Estratégia de carrinho multi-loja: pagamento único (split) ou checkouts separados por loja.

## 5. Riscos Conhecidos

- Divergência de preços e estoque entre a adição ao carrinho e a finalização do checkout.
