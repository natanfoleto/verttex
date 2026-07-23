# 021 — Cancelamentos, Trocas e Reembolsos

## Metadata

- Status: Planned
- Priority: Medium
- Created at: 2026-07-23
- Started at: Não iniciado
- Completed at: Em aberto
- Dependencies: [`planned/018-orders-and-checkout.md`](.ai/roadmaps/planned/018-orders-and-checkout.md), [`planned/019-payments.md`](.ai/roadmaps/planned/019-payments.md)

---

> **Observação Importante:** Este roadmap representa um registro conceitual da sequência futura de desenvolvimento do projeto VERTTEX NF. Ele será detalhado, analisado e implementado em uma etapa exclusiva posterior.

---

## 1. Objetivo Geral

Gerenciar solicitações de cancelamento de pedidos, devolução por arrependimento/defeito (CDC) e estorno financeiro automático/manual de valores aos compradores.

## 2. Dependências e Relação com Módulos Anteriores

- **Depende de:** `018 — Pedidos` e `019 — Pagamentos`.

## 3. Principais Responsabilidades

- Fluxo de abertura de disputa/solicitação pelo cliente.
- Aprovação pela loja ou mediação pelos administradores no Manager.
- Estorno no gateway de pagamento e estorno de estoque em reposição.

## 4. Decisões a Serem Tomadas no Futuro

- Regras de prazo para cancelamento automático de pedidos sem pagamento (ex: Pix expira em 30 min, Boleto em 3 dias).

## 5. Riscos Conhecidos

- Complexidade em reembolsar pagamentos com split efetuado a fornecedores que já sacaram os valores.
