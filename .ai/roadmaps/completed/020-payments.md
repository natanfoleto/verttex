# 020 — Pagamentos

## Metadata

- Status: completed
- Priority: High
- Created at: 2026-07-23
- Activated at: 2026-07-28
- Completed at: 2026-07-28
- Dependencies: [`completed/019-orders-and-checkout.md`](.ai/roadmaps/completed/019-orders-and-checkout.md)

---

## 1. Objetivo Geral

Integrar o módulo de pagamentos no VERTTEX com suporte a transações Pix e Cartão de Crédito, **processamento assíncrono idempotente via Webhooks**, alteração automática de status de pedido e emissão de eventos de auditoria.

---

## 2. Principais Responsabilidades Entregues

- **Módulo de Pagamentos na API (`apps/api/src/modules/payments`)**:
  - Geração de cobranças Pix (payload QR Code, copia-e-cola e expiração) e Cartão de Crédito.
  - Endpoint seguro de Webhook (`POST /payments/webhook`) com validação de assinatura e controle rigoroso de idempotência (`processedWebhooks`).
  - Atualização automática do status do Pedido:
    - `PAID`: Confirma o pagamento, atualiza `paymentStatus` para `approved` e dispara registro de auditoria via `logAudit()`.
    - `FAILED` / `EXPIRED`: Transiciona o pedido para `CANCELLED` e dispara a liberação atômica da reserva de estoque FEFO (`StockMovement.type = 'RELEASE_RESERVATION'`).
- **Testes Automatizados Vitest**:
  - Suíte `apps/api/src/modules/payments/payments.spec.ts` com 5 testes cobrindo geração de cobrança, idempotência de webhook, e cancelamento com liberação de estoque FEFO.
