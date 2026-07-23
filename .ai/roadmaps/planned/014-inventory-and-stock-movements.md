# 014 — Estoque e Movimentações

## Metadata

- Status: Planned
- Priority: High
- Created at: 2026-07-23
- Started at: Não iniciado
- Completed at: Em aberto
- Dependencies: [`planned/013-product-catalog-media-and-uploads.md`](.ai/roadmaps/planned/013-product-catalog-media-and-uploads.md)

---

> **Observação Importante:** Este roadmap representa um registro conceitual da sequência futura de desenvolvimento do projeto VERTTEX NF. Ele será detalhado, analisado e implementado em uma etapa exclusiva posterior.

---

## 1. Objetivo Geral

Gerenciar a quantidade de estoque físico por variação de produto (`ProductVariation`), registrando todas as entradas, saídas, reservas temporárias para carrinho/checkout e ajustes de inventário.

## 2. Dependências e Relação com Módulos Anteriores

- **Depende de:** `013 — Catálogo de Produtos, Variações, Mídias e Uploads R2` (o estoque é vinculado diretamente às variações `ProductVariation`).
- **Relaciona-se com:** `011 — Consolidação do Núcleo` (permissões de gestão de estoque e auditoria).

## 3. Principais Responsabilidades

- Registro de saldo em estoque por variação de produto de uma loja.
- Histórico auditável de movimentações (entrada por reposição, saída por venda, reserva por carrinho/pedido, perda/ajuste).
- Alerta de estoque baixo e bloqueio de vendas de itens esgotados.

## 4. Decisões a Serem Tomadas no Futuro

- Tempo de expiração de reserva de estoque no carrinho de compras (ex: 15 minutos).
- Permissão para venda sem estoque físico (encomenda / pré-venda).

## 5. Riscos Conhecidos

- Concorrência de estoque em pico de vendas (exige transação com `SELECT ... FOR UPDATE` ou controle otimista/pessimista em banco).
