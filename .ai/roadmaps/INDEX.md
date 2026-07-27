# Índice Consolidado de Roadmaps — VERTTEX

> **Visão Geral dos Roadmaps do Projeto**  
> **Localização:** `.ai/roadmaps/INDEX.md`  
> **Última Atualização:** 2026-07-23

---

## Tabela Consolidada de Roadmaps

|  Nº | Roadmap                                              | Status      | Prioridade | Dependências  | Caminho                                                                                                                 |
| --: | :--------------------------------------------------- | :---------- | :--------- | :------------ | :---------------------------------------------------------------------------------------------------------------------- |
| 001 | Foundation                                           | `completed` | critical   | Nenhuma       | [`completed/001-foundation.md`](.ai/roadmaps/completed/001-foundation.md)                                               |
| 002 | Data Modeling                                        | `completed` | critical   | 001           | [`completed/002-data-modeling.md`](.ai/roadmaps/completed/002-data-modeling.md)                                         |
| 003 | User Authentication                                  | `completed` | critical   | 002           | [`completed/003-user-authentication.md`](.ai/roadmaps/completed/003-user-authentication.md)                             |
| 004 | Customer Authentication                              | `completed` | critical   | 002           | [`completed/004-customer-authentication.md`](.ai/roadmaps/completed/004-customer-authentication.md)                     |
| 005 | Roles and Permissions                                | `completed` | critical   | 002, 003      | [`completed/005-roles-and-permissions.md`](.ai/roadmaps/completed/005-roles-and-permissions.md)                         |
| 006 | Stores Management                                    | `completed` | high       | 002, 003, 005 | [`completed/006-stores-management.md`](.ai/roadmaps/completed/006-stores-management.md)                                 |
| 007 | Manager UI                                           | `completed` | high       | 003, 005, 006 | [`completed/007-manager-ui.md`](.ai/roadmaps/completed/007-manager-ui.md)                                               |
| 008 | Marketplace UI                                       | `completed` | high       | 004           | [`completed/008-marketplace-ui.md`](.ai/roadmaps/completed/008-marketplace-ui.md)                                       |
| 009 | Security Foundation                                  | `completed` | critical   | 001 a 008     | [`completed/009-security-foundation.md`](.ai/roadmaps/completed/009-security-foundation.md)                             |
| 010 | Security Validation and Hardening                    | `completed` | high       | 009           | [`completed/010-security-validation-and-hardening.md`](.ai/roadmaps/completed/010-security-validation-and-hardening.md) |
| 011 | Consolidação do Núcleo Atual                         | `completed` | critical   | 009, 010      | [`completed/011-core-consolidation.md`](.ai/roadmaps/completed/011-core-consolidation.md)                               |
| 012 | Categorias e Marcas                                  | `completed` | high       | 011           | [`completed/012-categories-and-brands.md`](.ai/roadmaps/completed/012-categories-and-brands.md)                         |
| 013 | Catálogo de Produtos, Variações, Mídias e Uploads R2 | `completed` | high       | 011, 012      | [`completed/013-product-catalog-media-and-uploads.md`](.ai/roadmaps/completed/013-product-catalog-media-and-uploads.md) |
| 014 | Estoque, Lotes, FEFO e Movimentações                 | `completed` | high       | 013           | [`completed/014-inventory-and-stock-movements.md`](.ai/roadmaps/completed/014-inventory-and-stock-movements.md)           |
| 015 | Publicação e Catálogo do Marketplace                 | `completed` | high       | 013, 014      | [`completed/015-marketplace-catalog-publishing.md`](.ai/roadmaps/completed/015-marketplace-catalog-publishing.md)         |
| 016 | Clientes e Endereços                                 | `completed` | high       | 004           | [`completed/016-customers-and-addresses.md`](.ai/roadmaps/completed/016-customers-and-addresses.md)                     |
| 017 | Carrinho e Regras de Preço                           | `completed` | high       | 013, 016      | [`completed/017-cart-and-pricing-rules.md`](.ai/roadmaps/completed/017-cart-and-pricing-rules.md)                       |
| 018 | Página do Produto e Integração Dinâmica do Catálogo | `completed` | high       | 013, 015, 017 | [`completed/018-marketplace-product-page-and-dynamic-catalog.md`](.ai/roadmaps/completed/018-marketplace-product-page-and-dynamic-catalog.md) |
| 019 | Pedidos e Checkout                                   | `planned`   | high       | 016, 017, 018 | [`planned/019-orders-and-checkout.md`](.ai/roadmaps/planned/019-orders-and-checkout.md)                                 |
| 020 | Pagamentos                                           | `planned`   | high       | 019           | [`planned/020-payments.md`](.ai/roadmaps/planned/020-payments.md)                                                       |
| 021 | Entregas e Rastreamento                              | `planned`   | high       | 019           | [`planned/021-shipping-and-tracking.md`](.ai/roadmaps/planned/021-shipping-and-tracking.md)                             |
| 022 | Cancelamentos, Trocas e Reembolsos                   | `planned`   | medium     | 019, 020      | [`planned/022-cancellations-returns-refunds.md`](.ai/roadmaps/planned/022-cancellations-returns-refunds.md)             |
| 023 | Avaliações e Perguntas                               | `planned`   | medium     | 013, 019      | [`planned/023-reviews-and-qa.md`](.ai/roadmaps/planned/023-reviews-and-qa.md)                                           |
| 024 | Notificações                                         | `planned`   | medium     | 019, 021      | [`planned/024-notifications.md`](.ai/roadmaps/planned/024-notifications.md)                                             |
| 025 | Relatórios Comerciais e Operacionais                 | `planned`   | medium     | 019, 020      | [`planned/025-commercial-and-operational-reports.md`](.ai/roadmaps/planned/025-commercial-and-operational-reports.md)   |

---

## Resumo por Status

| Status      | Quantidade | Observação                                  |
| :---------- | :--------- | :------------------------------------------ |
| `completed` | 18         | Roadmaps 001 a 018 concluídos e validados   |
| `active`    | 0          | Nenhum roadmap ativo                        |
| `planned`   | 7          | Roadmaps 019 a 025 planejados e registrados |
| `archived`  | 0          | Nenhum roadmap arquivado                    |

---

## Observações

- Os roadmaps 001 a 008 representam as entregas da Fase 1 funcional da plataforma VERTTEX.
- Os roadmaps 009 e 010 representam o estabelecimento e validação completa da fundação de segurança.
- Os roadmaps 011 a 024 foram registrados para planejar a evolução sequencial da plataforma, com detalhamento aprofundado dos roadmaps 011, 012 e 013.
