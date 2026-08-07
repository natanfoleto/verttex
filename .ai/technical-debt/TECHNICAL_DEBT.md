# Catálogo Oficial de Débitos Técnicos — VERTTEX

> **Localização:** `.ai/technical-debt/TECHNICAL_DEBT.md`  
> **Status:** Documento Oficial de Acompanhamento Técnico  
> **Última Atualização:** 2026-08-07

Este documento funciona como a fonte única da verdade para o backlog de **Débitos Técnicos** do ecossistema VERTTEX. Todos os problemas estruturais, divergências de código, violações de regras arquiteturais e vulnerabilidades resolvidas ou pendentes devem ser catalogados e acompanhados aqui.

---

## Tabela Consolidada de Débitos Técnicos

| ID           | Título                                             | Categoria                  | Área        | Prioridade | Severidade | Status                                         |
| :----------- | :------------------------------------------------- | :------------------------- | :---------- | :--------- | :--------- | :--------------------------------------------- |
| **DEBT-001** | Uso de Tags `<img>` Nativas em vez de `next/image` | Frontend / Infraestrutura  | Marketplace | `LOW`      | `LOW`      | `ACCEPTED` (Mantido por custo/recursos Vercel) |
| **DEBT-002** | Estado volátil nos módulos 020–024                 | Persistência               | API         | `CRITICAL` | `HIGH`     | `OPEN`                                         |
| **DEBT-003** | Escopo de loja incompleto fora do módulo Stores    | Autorização / Multi-tenant | API         | `CRITICAL` | `CRITICAL` | `OPEN`                                         |
| **DEBT-004** | Discovery processa candidatos e facetas em memória | Performance                | API         | `HIGH`     | `HIGH`     | `OPEN`                                         |
| **DEBT-005** | Ausência de testes automatizados no Manager        | Testes                     | Manager     | `HIGH`     | `HIGH`     | `OPEN`                                         |
| **DEBT-006** | Taxonomia de permissões e seed divergentes         | Autorização                | Auth / API  | `HIGH`     | `HIGH`     | `OPEN`                                         |
| **DEBT-007** | Taxonomia de auditoria não normalizada             | Observabilidade            | API         | `MEDIUM`   | `MEDIUM`   | `OPEN`                                         |

---

### DEBT-001 — Uso de Tags de Imagem Nativas (`<img>`) em Vez do `next/image`

- **ID:** `DEBT-001`
- **Título:** Uso de Tags `<img>` Nativas em Vez do Componente `<Image />` do Next.js
- **Categoria:** Frontend / Infraestrutura & Custos
- **Descrição:** Diversos componentes de catálogo e perfil no marketplace (ex: `store-card.tsx`, `category-card.tsx`, `product-detail.tsx`, `marketplace-carousel.tsx`) utilizam a tag nativa `<img>` em vez do componente `<Image />` do Next.js.
- **Motivo / Decisão:** O uso de `<img>` nativo é **mantido intencionalmente por decisão de infraestrutura**, pois a otimização automática de imagens do Next.js consome cotas/recursos significativos na hospedagem da Vercel.
- **Impacto Atual:** Alertas informativos nos logs de compilação/linter (`@next/next/no-img-element`), porém reduz o consumo de cotas de Image Optimization na Vercel.
- **Risco Futuro:** Métrica de LCP sem compressão automática Next.js em conexões muito lentas.
- **Área Afetada:** `apps/marketplace/src/components/`
- **Prioridade:** `LOW`
- **Severidade:** `LOW`
- **Esforço Estimado:** S (Decisão de Arquitetura/Infra)
- **Dependências:** Análise cautelosa futura de custos de infraestrutura Vercel vs Cloudflare R2 image transformation.
- **Recomendação:** Manter a implementação atual com `<img>` nativo. Caso surja a necessidade de migração no futuro, realizar benchmark prévio de consumo e custos na Vercel.
- **Possibilidade de Correção:** Decisão pausada/aceita.
- **Status:** `ACCEPTED` (Decisão de infraestrutura/custos mantida).

### DEBT-002 — Estado Volátil nos Módulos 020–024

- **Descrição:** idempotência de pagamentos, devoluções, avaliações/perguntas e notificações/desduplicação usam estruturas em memória; frete usa cotação simulada e não tem integração externa.
- **Impacto:** dados se perdem em reinícios, divergem entre réplicas e não fornecem garantias transacionais de produção.
- **Recomendação:** criar modelagem/migrations e adaptadores reais por roadmap; gateway, transportadora e canais de notificação devem ter contratos idempotentes e testes de integração.
- **Status:** `OPEN`.

### DEBT-003 — Escopo de Loja Incompleto Fora do Módulo Stores

- **Descrição:** `requireStoreAccess()` protege rotas de lojas, mas produtos, lotes, estoque e associações de mídia não aplicam uniformemente o mesmo boundary por `storeId`/entidade relacionada.
- **Impacto:** um usuário não administrador com permissão funcional pode alcançar recursos de outra loja se conhecer identificadores válidos.
- **Recomendação:** introduzir policy central de acesso a loja e aplicá-la a listagem, leitura e mutações de todo recurso tenant-scoped, com testes negativos entre duas lojas.
- **Status:** `OPEN` — bloqueador de produção.

### DEBT-004 — Product Discovery com Processamento em Memória

- **Descrição:** o Prisma recupera candidatos, porém ranking, facetas, ordenação e paginação final são executados na aplicação.
- **Impacto:** uso de memória e latência crescem com o catálogo; o microbenchmark histórico não mede PostgreSQL, rede ou concorrência real.
- **Recomendação:** estabelecer dataset e SLO realistas, medir o fluxo integrado e então decidir por otimização Prisma, FTS/`pg_trgm` aprovado ou mecanismo dedicado.
- **Status:** `OPEN`.

### DEBT-005 — Ausência de Testes Automatizados no Manager

- **Descrição:** não há arquivos `*.spec.*` ou `*.test.*` em `apps/manager`, embora o aplicativo concentre fluxos administrativos críticos.
- **Impacto:** permissões visuais, formulários e regressões de integração dependem de inspeção manual.
- **Recomendação:** criar infraestrutura Vitest/Testing Library e cobrir autenticação, guards visuais, formulários e invalidação cross-módulo.
- **Status:** `OPEN`.

### DEBT-006 — Taxonomia de Permissões e Seed Divergentes

- **Descrição:** a documentação, `PERMISSION_MAP`, seeds e guards não usam uma nomenclatura única (por exemplo `files.upload` versus `files.create`, além de permissões de lotes/estoque não mapeadas uniformemente).
- **Impacto:** cargos podem receber chaves que não autorizam o action/subject esperado ou rotas podem ficar apenas autenticadas sem autorização funcional.
- **Recomendação:** definir matriz canônica action/subject, migrar seeds e guards e criar testes por cargo e por módulo.
- **Status:** `OPEN` — bloqueador de produção.

### DEBT-007 — Taxonomia de Auditoria Não Normalizada

- **Descrição:** ações usam combinações genéricas (`CREATE`) e específicas (`PUBLISH_PRODUCT`, `PAYMENT_APPROVED`, `SYSTEM_ACTION`) sem enum/contrato central único.
- **Impacto:** relatórios e alertas precisam conhecer variações locais e podem omitir eventos relevantes.
- **Recomendação:** estabelecer catálogo versionado de eventos, validar payloads e migrar produtores/consumidores gradualmente.
- **Status:** `OPEN`.
