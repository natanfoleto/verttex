# 026 — Integração e Consolidação Completa dos Front-ends (Manager e Marketplace)

## Metadata

- Status: completed
- Priority: High
- Created at: 2026-07-28
- Activated at: 2026-07-28
- Completed at: 2026-07-28
- Dependencies: [`completed/019-orders-and-checkout.md`](.ai/roadmaps/completed/019-orders-and-checkout.md), [`completed/020-payments.md`](.ai/roadmaps/completed/020-payments.md), [`completed/021-shipping-and-tracking.md`](.ai/roadmaps/completed/021-shipping-and-tracking.md), [`completed/022-cancellations-returns-refunds.md`](.ai/roadmaps/completed/022-cancellations-returns-refunds.md), [`completed/023-reviews-and-qa.md`](.ai/roadmaps/completed/023-reviews-and-qa.md), [`completed/024-notifications.md`](.ai/roadmaps/completed/024-notifications.md), [`completed/025-commercial-and-operational-reports.md`](.ai/roadmaps/completed/025-commercial-and-operational-reports.md)

---

## 1. Objetivo Geral

Construir e integrar todas as telas, componentes e páginas de interface nos front-ends **Manager (`apps/manager`)** e **Marketplace (`apps/marketplace`)** correspondentes aos módulos do backend API desenvolvidos nos roadmaps 019 a 025.

---

## 2. Principais Responsabilidades Entregues

### Manager (`apps/manager`)

- **Página `/pedidos` (Gestão de Pedidos & Expedição)**:
  - Tabela com filtros de status (`PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
  - Modal `OrderDispatchDialog` com formulário de código de rastreio, transportadora e revalidação sanitária de lotes FEFO.
  - Botão de confirmação de entrega ao cliente.
- **Página `/devolucoes` (Gestão de Trocas, Devoluções & Quarentena Sanitária)**:
  - Tabela de solicitações de devolução de compradores.
  - Botão de entrada compulsória em Quarentena Sanitária (`POST /returns/:id/quarantine-entry`).
  - Modal `QuarantineInspectionDialog` para emissão de Laudo Técnico de inspeção sanitária (`POST /returns/:id/quarantine-release` com `QUARANTINE_RELEASE`, `DAMAGE_DISCARD` ou `EXPIRATION_DISCARD`).
  - Botão de processamento de reembolso (`POST /returns/:id/refund`).
- **Página `/notificacoes` (Central de Notificações & Alertas Sanitários de Validade)**:
  - Listagem de notificações com abas por leitura e tipo.
  - Alertas sanitários por faixas de dias (180, 90, 60, 30, 15, 7, 1 dia e Vencido).
  - Botão de execução manual de varredura sanitária de lotes (`POST /notifications/expiration-check`).
- **Página `/relatorios` (Relatórios Comerciais e Operacionais / BI)**:
  - KPI Cards com Faturamento Total, Ticket Médio e Perdas Sanitárias de Estoque por Descarte.
  - Tabela e análise da **Curva ABC de Produtos** (Classe A: 80%, Classe B: 15%, Classe C: 5%).
  - Seletor e botão de exportação em formato CSV e JSON.
- **Atualização da Sidebar (`admin-layout.tsx`)**:
  - Inclusão dos links e ícones para Gestão de Pedidos, Devoluções & Quarentena, Notificações e Relatórios & BI.

### Marketplace (`apps/marketplace`)

- **Página de Detalhes do Produto (`/produtos/[slug]`)**:
  - Seção de Avaliações e Média de Estrelas com destaque para opiniões de compras verificadas.
  - Aba e estrutura de Perguntas & Respostas sobre o produto.
- **Página do Pedido do Cliente (`/pedidos/[code]`)**:
  - Botão e Modal "Solicitar Troca / Devolução" ativado para pedidos entregues (`POST /returns/request`).
