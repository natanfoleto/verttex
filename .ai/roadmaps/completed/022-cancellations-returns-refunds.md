# 022 — Cancelamentos, Trocas e Reembolsos

## Metadata

- Status: completed
- Priority: Medium
- Created at: 2026-07-23
- Activated at: 2026-07-28
- Completed at: 2026-07-28
- Dependencies: [`completed/019-orders-and-checkout.md`](.ai/roadmaps/completed/019-orders-and-checkout.md), [`completed/020-payments.md`](.ai/roadmaps/completed/020-payments.md), [`completed/021-shipping-and-tracking.md`](.ai/roadmaps/completed/021-shipping-and-tracking.md)

---

## 1. Objetivo Geral

Gerenciar devoluções de clientes, solicitações de reembolso e inspeção sanitária de itens retornados no VERTTEX.

---

## 2. Principais Responsabilidades Entregues

- **Módulo de Devoluções & Quarentena na API (`apps/api/src/modules/returns`)**:
  - `POST /returns/request`: Solicitação de devolução vinculada a pedido entregue.
  - `POST /returns/:returnId/quarantine-entry`: Recebimento e **entrada compulsória em Quarentena Sanitária de Segurança** (`QUARANTINE_ENTRY` e `CUSTOMER_RETURN`), bloqueando relistagem direta.
  - `POST /returns/:returnId/quarantine-release`: Inspeção técnica sanitária e emissão de laudo para liberação em estoque comercial (`QUARANTINE_RELEASE`) ou descarte por avaria/vencimento (`DAMAGE_DISCARD`/`EXPIRATION_DISCARD`).
  - `POST /returns/:returnId/refund`: Conclusão do reembolso financeiro ao comprador com atualização de `paymentStatus = 'refunded'` e auditoria via `logAudit()`.
- **Testes Automatizados Vitest**:
  - Suíte `apps/api/src/modules/returns/returns.spec.ts` com 5 testes cobrindo solicitação, quarentena compulsória, laudo sanitário de liberação/descarte e reembolso.
