# 022 — Avaliações e Perguntas

## Metadata

- Status: Planned
- Priority: Medium
- Created at: 2026-07-23
- Started at: Não iniciado
- Completed at: Em aberto
- Dependencies: [`planned/013-product-catalog-media-and-uploads.md`](.ai/roadmaps/planned/013-product-catalog-media-and-uploads.md), [`planned/018-orders-and-checkout.md`](.ai/roadmaps/planned/018-orders-and-checkout.md)

---

> **Observação Importante:** Este roadmap representa um registro conceitual da sequência futura de desenvolvimento do projeto VERTTEX NF. Ele será detalhado, analisado e implementado em uma etapa exclusiva posterior.

---

## 1. Objetivo Geral

Permitir que clientes que compraram produtos avaliem os itens (nota de 1 a 5 estrelas, comentário e foto) e que visitantes façam perguntas sobre produtos nas páginas do Marketplace.

## 2. Dependências e Relação com Módulos Anteriores

- **Depende de:** `013 — Catálogo`, `016 — Clientes` e `018 — Pedidos` (avaliação de compra verificada).

## 3. Principais Responsabilidades

- Avaliações exclusivas de compradores confirmados (_verified purchase_).
- Campo de perguntas & respostas entre visitantes e vendedores da loja no Marketplace.
- Moderação no Manager para remoção de conteúdo ofensivo ou spam.

## 4. Decisões a Serem Tomadas no Futuro

- Definição se perguntas de visitantes passam por pré-moderação antes de ficarem públicas.

## 5. Riscos Conhecidos

- Injeção de conteúdo malicioso ou SPAM em comentários (exige sanitização e moderação).
