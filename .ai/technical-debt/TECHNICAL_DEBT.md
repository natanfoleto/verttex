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
| **DEBT-002** | Uso de Tags HTML Nativas (`<button>`, `<input>`, `<select>`, `<textarea>`) em Telas de Funcionalidade | Frontend | Manager / Marketplace | `HIGH` | `MEDIUM` | `RESOLVED` |
| **DEBT-003** | Tipagem frouxa (`any` / casts) em Handlers e Componentes React | Frontend | Manager / Marketplace | `MEDIUM` | `MEDIUM` | `RESOLVED` |
| **DEBT-004** | Uso de Tags `<img>` Nativas em vez de `next/image` | Frontend / Infraestrutura | Marketplace | `LOW` | `LOW` | `ACCEPTED` (Mantido por custo/recursos Vercel) |
| **DEBT-005** | Regras de Formatação Prettier e Ordenação de Imports Desalinhadas no ESLint | Tooling / DX | Workspace | `MEDIUM` | `LOW` | `RESOLVED` |
| **DEBT-006** | Vulnerabilidades de Autenticação e Rate Limiting (`VULN-001`, `VULN-002`, `VULN-003`) | Segurança | API Fastify | `CRITICAL` | `HIGH` | `RESOLVED` |
| **DEBT-007** | Mensagens Brutas de Validação de Erros nos Formulários (`body/variations/0/price...`) | UX / Frontend | Manager / API Client | `MEDIUM` | `LOW` | `OPEN` |

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
- **Descrição:** Diversos componentes e telas em `apps/manager` (ex: `relatorios/page.tsx`, `produtos/components/product-form-dialog.tsx`, `variant-bulk-editor.tsx`) e `apps/marketplace` (ex: `marketplace-header.tsx`, `mobile-menu-drawer.tsx`, `enderecos/page.tsx`) usavam elementos nativos como `<button>`, `<input>`, `<select>` ou `<textarea>` diretamente em vez das abstrações padronizadas do Shadcn UI (`<Button>`, `<Input>`, `<Select>`, `<NativeSelect>`, `<Textarea>`).
- **Motivo:** Criação acelerada de interfaces de formulários sem substituição do JSX padrão.
- **Impacto Atual:** Nenhuma violação remanescente nas telas de funcionalidade. Elementos nativos específicos (ex: `<input type="radio">` ou `<input type="file">` onde apropriado) mantidos intencionalmente com isolamento por linter.
- **Risco Futuro:** Nenhum.
- **Área Afetada:** `apps/manager/src/`, `apps/marketplace/src/`
- **Prioridade:** `HIGH`
- **Severidade:** `MEDIUM`
- **Esforço Estimado:** M (4-6 horas)
- **Dependências:** Regra canônica de UI em `.ai/frontend/FRONTEND_UI.md#1013`
- **Recomendação:** Substituir gradualmente os elementos HTML nativos pelos componentes reutilizáveis do Shadcn UI conforme cada tela for atualizada.
- **Possibilidade de Correção:** Alta.
- **Status:** `RESOLVED` (Corrigido em 2026-08-03).

---

### DEBT-003 — Tipagem Frouxa (`any` / Casts) em Handlers e Componentes

- **ID:** `DEBT-003`
- **Título:** Tipagem Frouxa (`any`) em Chamadas de API e Componentes React
- **Categoria:** Frontend / Qualidade de Código
- **Descrição:** Presença de tipos `any` em diversos formulários e rotas dos frontends (ex: `product-form-dialog.tsx`, `products-table.tsx`, `marketplace-header.tsx`, `mobile-menu-drawer.tsx`), enfraquecendo a checagem de tipos do TypeScript.
- **Motivo:** Tratamento de objetos dinâmicos retornados pela API sem declaração estrita de interfaces locais.
- **Impacto Atual:** Todos os tipos `any` nas aplicações `apps/manager` e `apps/marketplace` foram substituídos por interfaces estritas, tipos união literais ou type guards. Checagem de tipos executada com 0 erros (`npm run typecheck`).
- **Risco Futuro:** Nenhum.
- **Área Afetada:** `apps/manager/src/`, `apps/marketplace/src/`
- **Prioridade:** `MEDIUM`
- **Severidade:** `MEDIUM`
- **Esforço Estimado:** M (3-4 horas)
- **Dependências:** `@verttex/types`
- **Recomendação:** Refatorar os manipuladores de dados para consumir os tipos centralizados exportados pelo pacote `@verttex/types` ou aplicar type guards explícitos.
- **Possibilidade de Correção:** Alta.
- **Status:** `RESOLVED` (Corrigido em 2026-08-03).

---

### DEBT-004 — Uso de Tags de Imagem Nativas (`<img>`) em Vez do `next/image`

- **ID:** `DEBT-004`
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

---

### DEBT-005 — Regras de Formatação Prettier e Imports Desalinhadas no ESLint

- **ID:** `DEBT-005`
- **Título:** Conflitos de Regras de Formatação Prettier e Ordenação de Imports no ESLint
- **Categoria:** Tooling / Developer Experience (DX)
- **Descrição:** O comando `pnpm lint` apontava erros de formatação e ordenação de imports (`simple-import-sort/imports`).
- **Motivo:** Execução pontual de comandos de formatação sem hook automatizado no pré-commit.
- **Impacto Atual:** Prettier e ESLint formatados e ordenados em todo o workspace.
- **Risco Futuro:** Nenhum.
- **Área Afetada:** Configurações globais de ESLint e Prettier.
- **Prioridade:** `MEDIUM`
- **Severidade:** `LOW`
- **Esforço Estimado:** S (1 hora)
- **Dependências:** `config/eslint`, `config/prettier`
- **Recomendação:** Padronizar as regras de formato no ESLint, rodar `prettier --write` como script de build e integrar ao pipeline.
- **Possibilidade de Correção:** Imédiata.
- **Status:** `RESOLVED` (Corrigido em 2026-08-03).

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

---

### DEBT-007 — Mensagens Brutas de Validação de Erros nos Formulários (`body/variations/0/price...`)

- **ID:** `DEBT-007`
- **Título:** Mensagens Brutas de Validação de Erros nos Formulários de Cadastro / Edição
- **Categoria:** UX / Tratamento de Erros no Frontend
- **Descrição:** Ao tentar submeter formulários contendo erros de validação em campos aninhados ou coleções (ex: cadastrar um produto variável sem preencher o preço das variações), o sistema exibe mensagens brutas contendo o caminho interno do payload Fastify/Zod, como `body/variations/0/price Preço deve ser maior que zero, body/variations/1/price...`.
- **Motivo:** O utilitário `apiClient` e os tratadores `onError` das mutations concatenam e repassam a string de erro enviada pela API sem higienização visual ou mapeamento para campos do formulário no frontend.
- **Impacto Atual:** Experiência de usuário (UX) poluída e técnica no painel administrativo.
- **Risco Futuro:** Dificuldade para usuários leigos identificarem exatamente qual item de uma lista contém o erro de validação.
- **Área Afetada:** `apps/manager/src/lib/api-client.ts`, `apps/manager/src/app/(dashboard)/produtos/components/product-form-dialog.tsx`, `apps/marketplace/src/lib/api-client.ts`
- **Prioridade:** `MEDIUM`
- **Severidade:** `LOW`
- **Esforço Estimado:** S (1-2 horas)
- **Dependências:** Utilitário de tratamento/higienização de erros da API Fastify/Zod para exibição em Toasts ou erros de campo.
- **Recomendação:** Implementar um formatador de erros de validação no `apiClient` para converter caminhos como `body/variations/0/price` em mensagens amigáveis (ex: *"Variação #1: Preço deve ser maior que zero"*).
- **Possibilidade de Correção:** Alta.
- **Status:** `OPEN` (Registrado em 2026-08-03).

