# Índice Consolidado de Roadmaps — VERTTEX

> **Visão Geral dos Roadmaps do Projeto**  
> **Localização:** `.ai/roadmaps/INDEX.md`  
> **Última Atualização:** 2026-07-23

---

## Tabela Consolidada de Roadmaps

| Nº | Roadmap | Status | Prioridade | Dependências | Caminho |
|--:|:---|:---|:---|:---|:---|
| 001 | Foundation | `completed` | critical | Nenhuma | [`completed/001-foundation.md`](.ai/roadmaps/completed/001-foundation.md) |
| 002 | Data Modeling | `completed` | critical | 001 | [`completed/002-data-modeling.md`](.ai/roadmaps/completed/002-data-modeling.md) |
| 003 | User Authentication | `completed` | critical | 002 | [`completed/003-user-authentication.md`](.ai/roadmaps/completed/003-user-authentication.md) |
| 004 | Customer Authentication | `completed` | critical | 002 | [`completed/004-customer-authentication.md`](.ai/roadmaps/completed/004-customer-authentication.md) |
| 005 | Roles and Permissions | `completed` | critical | 002, 003 | [`completed/005-roles-and-permissions.md`](.ai/roadmaps/completed/005-roles-and-permissions.md) |
| 006 | Stores Management | `completed` | high | 002, 003, 005 | [`completed/006-stores-management.md`](.ai/roadmaps/completed/006-stores-management.md) |
| 007 | Manager UI | `completed` | high | 003, 005, 006 | [`completed/007-manager-ui.md`](.ai/roadmaps/completed/007-manager-ui.md) |
| 008 | Marketplace UI | `completed` | high | 004 | [`completed/008-marketplace-ui.md`](.ai/roadmaps/completed/008-marketplace-ui.md) |
| 009 | Security Foundation | `completed` | critical | 001 a 008 | [`completed/009-security-foundation.md`](.ai/roadmaps/completed/009-security-foundation.md) |
| 010 | Security Validation and Hardening | `completed` | high | 009 | [`completed/010-security-validation-and-hardening.md`](.ai/roadmaps/completed/010-security-validation-and-hardening.md) |
| 011 | Consolidação do Núcleo Atual | `completed` | critical | 009, 010 | [`completed/011-core-consolidation.md`](.ai/roadmaps/completed/011-core-consolidation.md) |
| 012 | Categorias e Marcas | `completed` | high | 011 | [`completed/012-categories-and-brands.md`](.ai/roadmaps/completed/012-categories-and-brands.md) |
| 013 | Catálogo de Produtos, Variações, Mídias e Uploads R2 | `completed` | high | 011, 012 | [`completed/013-product-catalog-media-and-uploads.md`](.ai/roadmaps/completed/013-product-catalog-media-and-uploads.md) |
| 014 | Estoque e Movimentações | `planned` | high | 013 | [`planned/014-inventory-and-stock-movements.md`](.ai/roadmaps/planned/014-inventory-and-stock-movements.md) |
| 015 | Publicação e Catálogo do Marketplace | `planned` | high | 013, 014 | [`planned/015-marketplace-catalog-publishing.md`](.ai/roadmaps/planned/015-marketplace-catalog-publishing.md) |
| 016 | Clientes e Endereços | `planned` | high | 004 | [`planned/016-customers-and-addresses.md`](.ai/roadmaps/planned/016-customers-and-addresses.md) |
| 017 | Carrinho e Regras de Preço | `planned` | high | 013, 016 | [`planned/017-cart-and-pricing-rules.md`](.ai/roadmaps/planned/017-cart-and-pricing-rules.md) |
| 018 | Pedidos e Checkout | `planned` | high | 016, 017 | [`planned/018-orders-and-checkout.md`](.ai/roadmaps/planned/018-orders-and-checkout.md) |
| 019 | Pagamentos | `planned` | high | 018 | [`planned/019-payments.md`](.ai/roadmaps/planned/019-payments.md) |
| 020 | Entregas e Rastreamento | `planned` | high | 018 | [`planned/020-shipping-and-tracking.md`](.ai/roadmaps/planned/020-shipping-and-tracking.md) |
| 021 | Cancelamentos, Trocas e Reembolsos | `planned` | medium | 018, 019 | [`planned/021-cancellations-returns-refunds.md`](.ai/roadmaps/planned/021-cancellations-returns-refunds.md) |
| 022 | Avaliações e Perguntas | `planned` | medium | 013, 018 | [`planned/022-reviews-and-qa.md`](.ai/roadmaps/planned/022-reviews-and-qa.md) |
| 023 | Notificações | `planned` | medium | 018, 020 | [`planned/023-notifications.md`](.ai/roadmaps/planned/023-notifications.md) |
| 024 | Relatórios Comerciais e Operacionais | `planned` | medium | 018, 019 | [`planned/024-commercial-and-operational-reports.md`](.ai/roadmaps/planned/024-commercial-and-operational-reports.md) |

---

## Resumo por Status

| Status | Quantidade | Observação |
|:---|:---|:---|
| `completed` | 13 | Roadmaps 001 a 013 concluídos e validados |
| `active` | 0 | Nenhum roadmap ativo |
| `planned` | 11 | Roadmaps 014 a 024 planejados e registrados |
| `archived` | 0 | Nenhum roadmap arquivado |

---

## Observações
- Os roadmaps 001 a 008 representam as entregas da Fase 1 funcional da plataforma VERTTEX.
- Os roadmaps 009 e 010 representam o estabelecimento e validação completa da fundação de segurança.
- Os roadmaps 011 a 024 foram registrados para planejar a evolução sequencial da plataforma, com detalhamento aprofundado dos roadmaps 011, 012 e 013.
