# 020 — Entregas e Rastreamento

## Metadata

- Status: Planned
- Priority: High
- Created at: 2026-07-23
- Started at: Não iniciado
- Completed at: Em aberto
- Dependencies: [`planned/018-orders-and-checkout.md`](.ai/roadmaps/planned/018-orders-and-checkout.md)

---

> **Observação Importante:** Este roadmap representa um registro conceitual da sequência futura de desenvolvimento do projeto VERTTEX NF. Ele será detalhado, analisado e implementado em uma etapa exclusiva posterior.

---

## 1. Objetivo Geral

Cálculo de frete em tempo real (Correios, Melhor Envio, Frenet ou regras locais por região/loja) e gestão de códigos de rastreamento de entregas.

## 2. Dependências e Relação com Módulos Anteriores

- **Depende de:** `013 — Catálogo` (peso e dimensões dos produtos), `016 — Endereços` e `018 — Pedidos`.

## 3. Principais Responsabilidades

- Cálculo de frete e prazos na página do produto e no checkout.
- Atualização do código de rastreio e operadora no Manager pela loja.
- Status de movimentação do frete visível ao cliente no Marketplace.

## 4. Decisões a Serem Tomadas no Futuro

- Definição da estratégia de frete próprio/local para produtores artesanais de regiões próximas.

## 5. Riscos Conhecidos

- Indisponibilidade de APIs de frete externas (exige fallback com tabela estática ou cache).
