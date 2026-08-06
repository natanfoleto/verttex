# Oportunidades de Melhoria e Evolução — VERTTEX

> **Localização:** `.ai/technical-debt/IMPROVEMENTS.md`  
> **Status:** Documento Oficial de Oportunidades e Evolução  
> **Última Atualização:** 2026-08-03

Este documento registra oportunidades de evolução arquitetural, melhorias de performance, acessibilidade, observabilidade e Developer Experience (DX) que **não constituem débitos técnicos ou falhas atuais**, mas representam evoluções valiosas para o futuro do ecossistema VERTTEX.

---

## Tabela de Oportunidades de Melhoria

| ID          | Categoria             | Título                                                   | Impacto Esperado                                                               | Complexidade |
| :---------- | :-------------------- | :------------------------------------------------------- | :----------------------------------------------------------------------------- | :----------- |
| **IMP-001** | Arquitetura / UI      | Extração Opcional do Pacote `@verttex/ui`                | Redução de duplicação de estilos base                                          | Média        |
| **IMP-002** | Observabilidade       | Métricas Prometheus & Tracing OpenTelemetry na API       | Monitoramento de latência e saúde de rotas em tempo real                       | Média        |
| **IMP-003** | DX / Tooling          | Hook de Pré-commit com Husky e lint-staged               | Impedir commits com falhas de formatação ou lint                               | Baixa        |
| **IMP-004** | Performance / Cache   | Camada de Cache Redis para Consultas do Catalogo Público | Redução de carga no banco de dados para vitrines                               | Alta         |
| **IMP-005** | Acessibilidade (a11y) | Auditoria Automatizada com axe-core nos Frontends        | Garantir navegabilidade por teclado e leitores de tela em 100% dos componentes | Média        |

---

## Detalhamento das Oportunidades

### IMP-001 — Extração Opcional do Pacote `@verttex/ui`

- **Descrição:** Extrair componentes visuais atômicos agnósticos de domínio (ex: `Button`, `Input`, `PriceInput`, `AlertDialog`, `Dialog`, `Badge`) de `apps/manager` e `apps/marketplace` para o pacote workspace `@verttex/ui` em `packages/ui`.
- **Benefício:** Garantia absoluta de consistência visual entre o painel gestor e o marketplace público, reduzindo duplicação de componentes primitivos.

### IMP-002 — Métricas Prometheus & Tracing OpenTelemetry na API

- **Descrição:** Adicionar plugin `@fastify/express` ou `prom-client` para expor o endpoint `/metrics` e integrar OpenTelemetry para tracing distribuído.
- **Benefício:** Observabilidade de nível enterprise com dashboards no Grafana e alertas em tempo real.

### IMP-003 — Hook de Pré-commit com Husky e lint-staged

- **Descrição:** Configurar Husky no monorepo para rodar `prettier --write` e `tsc --noEmit` automaticamente antes de cada commit.
- **Benefício:** Eliminar regressões de linter e formatação no repositório.

### IMP-004 — Camada de Cache Redis para Consultas do Catálogo Público

- **Descrição:** Adicionar cache distribuído Redis para rotas públicas de alta demanda como `/public/carousel`, `/public/categories`, `/public/products`.
- **Benefício:** Resposta de API sub-10ms em épocas de alto tráfego (ex: Black Friday) aliviando consultas no PostgreSQL.

### IMP-005 — Auditoria Automatizada de Acessibilidade (a11y)

- **Descrição:** Integrar `@axe-core/react` ou testes a11y via Vitest/Playwright para auditar marcadores ARIA, contraste de cores e navegação por Tab.
- **Benefício:** Experiência inclusiva e total conformidade com diretrizes WCAG 2.1 AA.
