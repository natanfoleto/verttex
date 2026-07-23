# 019 — Pagamentos

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

Integrar meios de pagamento (Pix, Cartão de Crédito, Boleto) via gateway (ex: Asaas / Mercado Pago / Pagar.me) com suporte a **Split de Pagamento** para repasse automático aos fornecedores/lojas.

## 2. Dependências e Relação com Módulos Anteriores

- **Depende de:** `018 — Pedidos e Checkout`.

## 3. Principais Responsabilidades

- Integração de Webhooks seguros para notificação de pagamento aprovado / recusado / estornado.
- Geração de QR Code Pix e cópia-e-cola com tempo de expiração.
- Repasse/Split financeiro proporcional por loja transacionada.

## 4. Decisões a Serem Tomadas no Futuro

- Escolha do gateway principal com menor taxa para Pix e suporte nativo a marketplace split.

## 5. Riscos Conhecidos

- Falhas de concorrência em webhooks duplicados (exige idempotência rigorosa via cabeçalho/ID da transação).
