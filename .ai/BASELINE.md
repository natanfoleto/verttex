# Baseline Canônica — VERTTEX

> **Data de consolidação:** 2026-08-07  
> **Branch de trabalho:** `main`  
> **SHA de origem da consolidação:** `d09e635ef8c9ede5907cc51219db8b39cd6ac256`  
> **Roadmap ativo:** 028 — Home Personalizada, Ofertas Reais e Recomendações  
> **Quality gate da baseline corrigida:** PASS em 2026-08-07 para o conteúdo consolidado (`lint`, `typecheck`, 372/372 testes e `build`)

Este documento é o painel resumido do estado atual. Ele não substitui os documentos de domínio; aponta qual implementação e qual nível de maturidade devem ser considerados durante planejamento, revisão e aprovação.

## 1. Regra de Git até a versão 1.0

- O desenvolvimento ocorre exclusivamente na `main`.
- Não criar branches de funcionalidade, correção ou certificação.
- A antiga implementação antecipada do Push 2 (`b0ac3d1`) foi retirada da `main` local por decisão do responsável e não integra esta baseline.
- O Push 2 deve ser planejado e implementado novamente a partir desta baseline.
- Nenhum push forçado ou alteração de `origin/main` faz parte desta consolidação local.

## 2. Estado do Roadmap 028

| Push | Estado canônico                         | Observação                                                                                                          |
| ---: | :-------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
|    0 | concluído historicamente                | Roadmap e diagnóstico inicial criados.                                                                              |
|    1 | implementado e recertificado localmente | Identidade anônima, perfil e merge passaram no Quality Gate junto ao hardening da baseline.                         |
|    2 | não iniciado                            | A implementação histórica `b0ac3d1` foi descartada da linha principal e não deve ser reaproveitada silenciosamente. |
|  3–7 | não iniciados                           | Seguir a ordem do roadmap ativo.                                                                                    |

## 3. Maturidade dos módulos

| Área                                         | Estado                                 | Limite atual                                                                                                                           |
| :------------------------------------------- | :------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| Auth, usuários, cargos e lojas               | implementado                           | Requer alinhar a política documental de CASL com exceções de escopo administrativo.                                                    |
| Catálogo, lotes, estoque, carrinho e pedidos | implementado                           | Publicação canônica e elegibilidade de mídia foram endurecidas e recertificadas; escopo multi-loja transversal continua em `DEBT-003`. |
| Uploads R2                                   | hardening recertificado nesta baseline | Decodificação real, MIME, 5 MB durante streaming, limite de pixels, reprocessamento sem metadados, checksum e dimensões.               |
| Product Discovery                            | implementado                           | Ranking, facetas, ordenação e paginação final têm processamento em memória; não há benchmark PostgreSQL real com SLO.                  |
| Pagamentos                                   | protótipo                              | Sem gateway real; idempotência de webhook em memória.                                                                                  |
| Frete                                        | protótipo                              | Cotação simulada e sem integração com transportadora.                                                                                  |
| Devoluções                                   | protótipo                              | Estado do fluxo em memória.                                                                                                            |
| Avaliações e perguntas                       | protótipo                              | Estado em memória.                                                                                                                     |
| Notificações                                 | protótipo                              | Estado e desduplicação em memória, com registros demonstrativos.                                                                       |
| Relatórios                                   | implementado                           | Agregações são feitas em memória após consultas Prisma.                                                                                |
| Home personalizada                           | não implementada                       | A Home provisória mostra apenas dados reais e não afirma personalização até os Pushes 3–5.                                             |

## 4. Testes e evidências

- Evidências `PUSH_1E` a `PUSH_1J` são históricas e permanecem úteis para rastreabilidade.
- Uma evidência só certifica o snapshot exato de conteúdo em que foi produzida.
- Contagem estática de arquivos ou blocos de teste não prova aprovação.
- A conclusão de qualquer correção exige `pnpm verify` e registro factual do resultado.
- Evidência atual: `pnpm verify` PASS em 2026-08-07; API 340/340, Marketplace 32/32, total 372/372. O resultado certifica este conjunto de alterações e perde validade se o conteúdo for modificado.

## 5. Fontes relacionadas

- [`roadmaps/active/028-home-personalization.md`](roadmaps/active/028-home-personalization.md)
- [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md)
- [`domain/BUSINESS_RULES.md`](domain/BUSINESS_RULES.md)
- [`domain/WORKFLOWS.md`](domain/WORKFLOWS.md)
- [`security/AI_SECURITY_RULES.md`](security/AI_SECURITY_RULES.md)
- [`storage/R2_UPLOADS.md`](storage/R2_UPLOADS.md)
- [`technical-debt/TECHNICAL_DEBT.md`](technical-debt/TECHNICAL_DEBT.md)
