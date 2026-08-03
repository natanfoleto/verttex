# Catálogo Oficial de Débitos Técnicos — VERTTEX

> **Localização:** `.ai/technical-debt/TECHNICAL_DEBT.md`  
> **Status:** Documento Oficial de Acompanhamento Técnico  
> **Última Atualização:** 2026-08-03

Este documento funciona como a fonte única da verdade para o backlog de **Débitos Técnicos** do ecossistema VERTTEX. Todos os problemas estruturais, divergências de código, violações de regras arquiteturais e vulnerabilidades resolvidas ou pendentes devem ser catalogados e acompanhados aqui.

---

## Tabela Consolidada de Débitos Técnicos

| ID | Título | Categoria | Área | Prioridade | Severidade | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEBT-001** | Divergência de Documentação sobre Pacote `@verttex/ui` | Arquitetura | Monorepo / UI | `MEDIUM` | `LOW` | `RESOLVED` |
| **DEBT-002** | Uso de Tags HTML Nativas (`<button>`, `<input>`, `<select>`, `<textarea>`) em Telas de Funcionalidade | Frontend | Manager / Marketplace | `HIGH` | `MEDIUM` | `OPEN` |
| **DEBT-003** | Tipagem frouxa (`any` / casts) em Handlers e Componentes React | Frontend | Manager / Marketplace | `MEDIUM` | `MEDIUM` | `OPEN` |
| **DEBT-004** | Uso de Elementos de Imagem Nativos (`<img>`) sem Otimização de LCP (`next/image`) | Frontend / Performance | Marketplace | `LOW` | `LOW` | `OPEN` |
| **DEBT-005** | Regras de Formatação Prettier e Ordenação de Imports Desalinhadas no ESLint | Tooling / DX | Workspace | `MEDIUM` | `LOW` | `OPEN` |
| **DEBT-006** | Vulnerabilidades de Autenticação e Rate Limiting (`VULN-001`, `VULN-002`, `VULN-003`) | Segurança | API Fastify | `CRITICAL` | `HIGH` | `RESOLVED` |

---

## Detalhamento dos Débitos Técnicos

### DEBT-001 — Divergência de Documentação sobre Pacote `@verttex/ui`

- **ID:** `DEBT-001`
- **Título:** Divergência de Documentação sobre Pacote `@verttex/ui` no Monorepo
- **Categoria:** Arquitetura / Documentação
- **Descrição:** Os documentos iniciais (`ARCHITECTURE.md` e `BOOTSTRAP_PLAN.md`) indicavam a existência de um pacote workspace `@verttex/ui` em `packages/ui`. Na prática do projeto, a biblioteca Shadcn UI com Tailwind v4 foi mantida diretamente no diretório de componentes de cada app (`apps/manager/src/components/ui/` e `apps/marketplace/src/components/ui/`).
- **Motivo:** Decisão prática durante a implementação das UIs para aceleração de desenvolvimento e isolamento de estilos entre a área administrativa e o e-commerce público.
- **Impacto Atual:** Ambiguidade ao consultar a arquitetura inicial sem encontrar a pasta `packages/ui`.
- **Risco Futuro:** Desenvolvedores tentarem importar `@verttex/ui` em novas aplicações.
- **Área Afetada:** `packages/`, `.ai/architecture/ARCHITECTURE.md`, `.ai/planning/BOOTSTRAP_PLAN.md`
- **Prioridade:** `MEDIUM`
- **Severidade:** `LOW`
- **Esforço Estimado:** P (1 hora)
- **Dependências:** Nenhuma
- **Recomendação:** Atualizar `ARCHITECTURE.md` para refletir a estrutura real de UI por aplicação com Shadcn UI e manter registro em `IMPROVEMENTS.md` sobre uma potencial extração de pacote no futuro se justificável.
- **Possibilidade de Correção:** Alta (documental e arquitetural).
- **Status:** `RESOLVED` (Documentação corrigida em 2026-08-03).

---

### DEBT-002 — Uso de Tags HTML Nativas (`<button>`, `<input>`, `<select>`, `<textarea>`) em Telas

- **ID:** `DEBT-002`
- **Título:** Uso de Tags HTML Nativas em Telas de Funcionalidade Violando a Regra §10.13
- **Categoria:** Frontend / Padrão de UI
- **Descrição:** Diversos componentes e telas em `apps/manager` (ex: `relatorios/page.tsx`, `produtos/components/product-form-dialog.tsx`, `variant-bulk-editor.tsx`) e `apps/marketplace` (ex: `marketplace-header.tsx`, `mobile-menu-drawer.tsx`, `enderecos/page.tsx`) usam elementos nativos como `<button>`, `<input>`, `<select>` ou `<textarea>` diretamente em vez das abstrações padronizadas do Shadcn UI (`<Button>`, `<Input>`, `<Select>`, `<NativeSelect>`, `<Textarea>`).
- **Motivo:** Criação acelerada de interfaces de formulários sem substituição do JSX padrão.
- **Impacto Atual:** Avisos e erros no linter (`react/forbid-elements`), pequena inconsistência de temas e bordas ativas de foco.
- **Risco Futuro:** Dificuldade na manutenção de temas globais, acessibilidade (a11y) incompleta.
- **Área Afetada:** `apps/manager/src/`, `apps/marketplace/src/`
- **Prioridade:** `HIGH`
- **Severidade:** `MEDIUM`
- **Esforço Estimado:** M (4-6 horas)
- **Dependências:** Regra canônica de UI em `.ai/frontend/FRONTEND_UI.md#1013`
- **Recomendação:** Substituir gradualmente os elementos HTML nativos pelos componentes reutilizáveis do Shadcn UI conforme cada tela for atualizada.
- **Possibilidade de Correção:** Alta.
- **Status:** `OPEN`

---

### DEBT-003 — Tipagem Frouxa (`any` / Casts) em Handlers e Componentes

- **ID:** `DEBT-003`
- **Título:** Tipagem Frouxa (`any`) em Chamadas de API e Componentes React
- **Categoria:** Frontend / Qualidade de Código
- **Descrição:** Presença de tipos `any` em diversos formulários e rotas dos frontends (ex: `product-form-dialog.tsx`, `products-table.tsx`, `marketplace-header.tsx`, `mobile-menu-drawer.tsx`), enfraquecendo a checagem de tipos do TypeScript.
- **Motivo:** Tratamento de objetos dinâmicos retornados pela API sem declaração estrita de interfaces locais.
- **Impacto Atual:** Risco secundário de `TypeError` em tempo de execução se propriedades mudarem de nome.
- **Risco Futuro:** Falta de autocompletion e refatorações inseguras.
- **Área Afetada:** `apps/manager/src/`, `apps/marketplace/src/`
- **Prioridade:** `MEDIUM`
- **Severidade:** `MEDIUM`
- **Esforço Estimado:** M (3-4 horas)
- **Dependências:** `@verttex/types`
- **Recomendação:** Refatorar os manipuladores de dados para consumir os tipos centralizados exportados pelo pacote `@verttex/types` ou aplicar type guards explícitos.
- **Possibilidade de Correção:** Alta.
- **Status:** `OPEN`

---

### DEBT-004 — Uso de Tags de Imagem Nativas (`<img>`) sem Otimização de LCP

- **ID:** `DEBT-004`
- **Título:** Uso de Tags `<img>` Nativas sem Otimização do `next/image`
- **Categoria:** Frontend / Performance (Core Web Vitals)
- **Descrição:** Diversos componentes de catálogo e perfil no marketplace (ex: `store-card.tsx`, `category-card.tsx`, `product-detail.tsx`, `marketplace-carousel.tsx`) utilizam a tag nativa `<img>` em vez do componente `<Image />` do Next.js.
- **Motivo:** Carregamento simples de URLs dinâmicas pré-assinadas ou externas sem configurar `remotePatterns` no `next.config.js`.
- **Impacto Atual:** Alertas de LCP (Largest Contentful Paint) no Next.js lint; maior consumo de banda.
- **Risco Futuro:** Métrica de LCP degradada em conexões móveis.
- **Área Afetada:** `apps/marketplace/src/components/`
- **Prioridade:** `LOW`
- **Severidade:** `LOW`
- **Esforço Estimado:** S (2 horas)
- **Dependências:** Configuração de domínios em `next.config.ts` do marketplace.
- **Recomendação:** Migrar para `<Image />` do Next.js e habilitar domínios de mídia R2 no `next.config.ts`.
- **Possibilidade de Correção:** Alta.
- **Status:** `OPEN`

---

### DEBT-005 — Regras de Formatação Prettier e Imports Desalinhadas no ESLint

- **ID:** `DEBT-005`
- **Título:** Conflitos de Regras de Formatação Prettier e Ordenação de Imports no ESLint
- **Categoria:** Tooling / Developer Experience (DX)
- **Descrição:** O comando `pnpm lint` aponta erros de formatação (como aspas duplas vs simples e ausência de ponto-e-vírgula em arquivos específicos) e ordenação de imports (`simple-import-sort/imports`).
- **Motivo:** Execução pontual de comandos de formatação sem hook automatizado no pré-commit.
- **Impacto Atual:** Falha do comando `npm run lint` quando executado via CI/CD.
- **Risco Futuro:** Desperdício de tempo em PRs ajustando formatação manual.
- **Área Afetada:** Configurações globais de ESLint e Prettier.
- **Prioridade:** `MEDIUM`
- **Severidade:** `LOW`
- **Esforço Estimado:** S (1 hora)
- **Dependências:** `config/eslint`, `config/prettier`
- **Recomendação:** Padronizar as regras de formato no ESLint, rodar `prettier --write` com chave `--single-quote --no-semi` como script de build e integrar ao pipeline.
- **Possibilidade de Correção:** Imédiata.
- **Status:** `OPEN`

---

### DEBT-006 — Resolução Completa das Vulnerabilidades de Segurança (`VULN-001`, `VULN-002`, `VULN-003`)

- **ID:** `DEBT-006`
- **Título:** Atualização de Status das Vulnerabilidades Críticas de Segurança Resolvidas
- **Categoria:** Segurança / Backend
- **Descrição:** As vulnerabilidades registradas no inicio do projeto em `.ai/security/SECURITY_BACKLOG.md` (VULN-001 de fallback de senha, VULN-002 de rate limiting e VULN-003 de headers helmet) foram totalmente corrigidas no código da API Fastify, mas o documento de backlog permaneceu com status antigo.
- **Motivo:** Atualização de documentação não realizada no momento do commit de segurança.
- **Impacto Atual:** Divergência de relatório de segurança (o documento informava que a API estava vulnerável quando na verdade o código estava protegido).
- **Risco Futuro:** Incerteza durante auditorias de conformidade OWASP ASVS.
- **Área Afetada:** `apps/api/src/`, `.ai/security/SECURITY_BACKLOG.md`
- **Prioridade:** `CRITICAL`
- **Severidade:** `HIGH`
- **Esforço Estimado:** S (30 minutos)
- **Dependências:** `crypto.ts`, `app.ts`, `plugins/helmet.ts`, `plugins/rate-limit.ts`
- **Recomendação:** Atualizar a documentação de segurança oficial para marcar todas as vulnerabilidades corrigidas como `RESOLVED`.
- **Possibilidade de Correção:** Concluída.
- **Status:** `RESOLVED` (Documentação atualizada em 2026-08-03).
