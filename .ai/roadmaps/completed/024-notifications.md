# 024 — Notificações

## Metadata

- Status: completed
- Priority: Medium
- Created at: 2026-07-23
- Activated at: 2026-07-28
- Completed at: 2026-07-28
- Dependencies: [`completed/019-orders-and-checkout.md`](.ai/roadmaps/completed/019-orders-and-checkout.md), [`completed/021-shipping-and-tracking.md`](.ai/roadmaps/completed/021-shipping-and-tracking.md)

---

> **Maturidade factual (baseline 2026-08-07):** protótipo funcional, não pronto para produção. Notificações e chaves de desduplicação ficam em memória, incluindo dados iniciais demonstrativos; não há entrega real por e-mail, push ou mensageria. `completed` indica apenas encerramento do escopo histórico.

## 1. Objetivo Geral

Central de notificações transacionais e alertas sanitários de validade/vencimento de lotes no VERTTEX.

---

## 2. Principais Responsabilidades Entregues

- **Módulo de Notificações na API (`apps/api/src/modules/notifications`)**:
  - `GET /notifications`: Central de notificações transacionais e sanitárias com controle de não lidas (`unreadOnly`).
  - `PATCH /notifications/:id/read`: Marcação de notificação como lida.
  - `POST /notifications/expiration-check`: Checagem sanitária de validade por faixas de dias (180, 90, 60, 30, 15, 7, 1 dia e Vencido) com **prevenção de alertas ruidosos duplicados via chave única de desduplicação (`lotId:bracket`)**.
- **Testes Automatizados Vitest**:
  - Suíte `apps/api/src/modules/notifications/notifications.spec.ts` com 3 testes cobrindo criação, leitura, cálculo de faixas de vencimento e garantia de não-duplicidade.
