# Índice Consolidado de Roadmaps — VERTTEX

> **Visão Geral dos Roadmaps do Projeto**  
> **Localização:** `.ai/roadmaps/INDEX.md`  
> **Última Atualização:** 2026-08-07

---

## Tabela Consolidada de Roadmaps

> `completed` registra o encerramento do escopo histórico de um roadmap. Não significa, isoladamente, prontidão para produção; a maturidade factual por módulo está em [`.ai/BASELINE.md`](../BASELINE.md).

|  Nº | Roadmap                                               | Status      | Prioridade | Dependências  | Caminho                                                                                                                          |
| --: | :---------------------------------------------------- | :---------- | :--------- | :------------ | :------------------------------------------------------------------------------------------------------------------------------- |
| 001 | Foundation                                            | `completed` | critical   | Nenhuma       | [`completed/001-foundation.md`](completed/001-foundation.md)                                                                     |
| 002 | Data Modeling                                         | `completed` | critical   | 001           | [`completed/002-data-modeling.md`](completed/002-data-modeling.md)                                                               |
| 003 | User Authentication                                   | `completed` | critical   | 002           | [`completed/003-user-authentication.md`](completed/003-user-authentication.md)                                                   |
| 004 | Customer Authentication                               | `completed` | critical   | 002           | [`completed/004-customer-authentication.md`](completed/004-customer-authentication.md)                                           |
| 005 | Roles and Permissions                                 | `completed` | critical   | 002, 003      | [`completed/005-roles-and-permissions.md`](completed/005-roles-and-permissions.md)                                               |
| 006 | Stores Management                                     | `completed` | high       | 002, 003, 005 | [`completed/006-stores-management.md`](completed/006-stores-management.md)                                                       |
| 007 | Manager UI                                            | `completed` | high       | 003, 005, 006 | [`completed/007-manager-ui.md`](completed/007-manager-ui.md)                                                                     |
| 008 | Marketplace UI                                        | `completed` | high       | 004           | [`completed/008-marketplace-ui.md`](completed/008-marketplace-ui.md)                                                             |
| 009 | Security Foundation                                   | `completed` | critical   | 001 a 008     | [`completed/009-security-foundation.md`](completed/009-security-foundation.md)                                                   |
| 010 | Security Validation and Hardening                     | `completed` | high       | 009           | [`completed/010-security-validation-and-hardening.md`](completed/010-security-validation-and-hardening.md)                       |
| 011 | Consolidação do Núcleo Atual                          | `completed` | critical   | 009, 010      | [`completed/011-core-consolidation.md`](completed/011-core-consolidation.md)                                                     |
| 012 | Categorias e Marcas                                   | `completed` | high       | 011           | [`completed/012-categories-and-brands.md`](completed/012-categories-and-brands.md)                                               |
| 013 | Catálogo de Produtos, Variações, Mídias e Uploads R2  | `completed` | high       | 011, 012      | [`completed/013-product-catalog-media-and-uploads.md`](completed/013-product-catalog-media-and-uploads.md)                       |
| 014 | Estoque, Lotes, FEFO e Movimentações                  | `completed` | high       | 013           | [`completed/014-inventory-and-stock-movements.md`](completed/014-inventory-and-stock-movements.md)                               |
| 015 | Publicação e Catálogo do Marketplace                  | `completed` | high       | 013, 014      | [`completed/015-marketplace-catalog-publishing.md`](completed/015-marketplace-catalog-publishing.md)                             |
| 016 | Clientes e Endereços                                  | `completed` | high       | 004           | [`completed/016-customers-and-addresses.md`](completed/016-customers-and-addresses.md)                                           |
| 017 | Carrinho e Regras de Preço                            | `completed` | high       | 013, 016      | [`completed/017-cart-and-pricing-rules.md`](completed/017-cart-and-pricing-rules.md)                                             |
| 018 | Página do Produto e Integração Dinâmica do Catálogo   | `completed` | high       | 013, 015, 017 | [`completed/018-marketplace-product-page-and-dynamic-catalog.md`](completed/018-marketplace-product-page-and-dynamic-catalog.md) |
| 019 | Pedidos e Checkout                                    | `completed` | high       | 016, 017, 018 | [`completed/019-orders-and-checkout.md`](completed/019-orders-and-checkout.md)                                                   |
| 020 | Pagamentos                                            | `completed` | high       | 019           | [`completed/020-payments.md`](completed/020-payments.md)                                                                         |
| 021 | Entregas e Rastreamento                               | `completed` | high       | 019, 020      | [`completed/021-shipping-and-tracking.md`](completed/021-shipping-and-tracking.md)                                               |
| 022 | Cancelamentos, Trocas e Reembolsos                    | `completed` | medium     | 019, 020, 021 | [`completed/022-cancellations-returns-refunds.md`](completed/022-cancellations-returns-refunds.md)                               |
| 023 | Avaliações e Perguntas                                | `completed` | medium     | 018, 019      | [`completed/023-reviews-and-qa.md`](completed/023-reviews-and-qa.md)                                                             |
| 024 | Notificações                                          | `completed` | medium     | 019, 021      | [`completed/024-notifications.md`](completed/024-notifications.md)                                                               |
| 025 | Relatórios Comerciais e Operacionais                  | `completed` | medium     | 019, 020      | [`completed/025-commercial-and-operational-reports.md`](completed/025-commercial-and-operational-reports.md)                     |
| 026 | Integração e Consolidação Completa dos Front-ends     | `completed` | high       | 019 a 025     | [`completed/026-frontend-integration-and-completeness.md`](completed/026-frontend-integration-and-completeness.md)               |
| 027 | Product Discovery & Product Listing Engine            | `completed` | critical   | 012, 013, 015 | [`completed/027-product-discovery-engine.md`](completed/027-product-discovery-engine.md)                                         |
| 028 | Home Personalizada, Ofertas Reais e Recomendações     | `active`    | high       | 004, 018, 027 | [`active/028-home-personalization.md`](active/028-home-personalization.md)                                                       |
| 029 | Search Experience (Autocomplete & Pesquisas Recentes) | `completed` | high       | 027           | [`completed/029-search-experience.md`](completed/029-search-experience.md)                                                       |

---

## Resumo por Status

| Status      | Quantidade | Observação                                                                 |
| :---------- | :--------- | :------------------------------------------------------------------------- |
| `completed` | 28         | Escopos históricos 001 a 027 e 029 encerrados; maturidade varia por módulo |
| `active`    | 1          | Roadmap 028 em execução                                                    |
| `planned`   | 0          | Nenhum roadmap pendente                                                    |
| `archived`  | 0          | Nenhum roadmap arquivado                                                   |

---

## Observações

- Os roadmaps 001 a 008 representam as entregas da Fase 1 funcional da plataforma VERTTEX.
- Os roadmaps 009 e 010 representam o estabelecimento e validação completa da fundação de segurança.
- Os roadmaps 011 a 019 registram a evolução sequencial do núcleo de catálogo, estoque e pedidos.
- Os roadmaps 020 a 024 encerraram seus escopos como protótipos funcionais: pagamentos não têm gateway real, frete não tem transportadora real e devoluções, avaliações e notificações ainda dependem de estado em memória. Eles não estão prontos para produção.
- O Roadmap 028 está ativo. O Push 2 histórico foi retirado da `main` local e será refeito do zero após a recertificação do Push 1.
