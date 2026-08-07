# AI Agent Guidelines — VERTTEX Monorepo

> **Versão:** 2.0 — Centralizada em `.ai/`  
> **Status:** Documento Mandatório para todas as IAs e Desenvolvedores que colaboram com o projeto

Bem-vindo! Este documento define as regras obrigatórias de conduta, a hierarquia de leitura e as restrições de execução para qualquer inteligência artificial ou desenvolvedor no projeto **VERTTEX**.

---

## 1. Ordem de Prioridade e Leitura Obrigatória de Contexto

Antes de iniciar a análise ou alteração de qualquer código, você **DEVE** ler os documentos na seguinte ordem estrita:

1. [`.ai/README.md`](README.md) — Índice geral e estrutura de toda a documentação
2. [`.ai/BASELINE.md`](BASELINE.md) — Estado factual, maturidade e linha Git vigente
3. [`.ai/AGENT.md`](AGENT.md) (este documento) — Regras de conduta e diretrizes gerais da IA
4. Regras obrigatórias de segurança em [`.ai/security/AI_SECURITY_RULES.md`](security/AI_SECURITY_RULES.md)
5. [`.ai/roadmaps/INDEX.md`](roadmaps/INDEX.md) — Índice oficial dos roadmaps
6. Roadmap ativo em `.ai/roadmaps/active/` (quando existir)
7. Arquitetura aplicável em [`.ai/architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md)
8. Regras de domínio aplicáveis em [`.ai/domain/BUSINESS_RULES.md`](domain/BUSINESS_RULES.md), [`.ai/domain/PERMISSIONS.md`](domain/PERMISSIONS.md) e [`.ai/domain/WORKFLOWS.md`](domain/WORKFLOWS.md)
9. Documentação específica de [`.ai/backend/BACKEND_API.md`](backend/BACKEND_API.md) ou [`.ai/frontend/FRONTEND_UI.md`](frontend/FRONTEND_UI.md)
10. Documentos de observabilidade em [`.ai/observability/AUDIT_RULES.md`](observability/AUDIT_RULES.md)
11. Taxonomia de armazenamento e uploads no R2 em [`.ai/storage/R2_UPLOADS.md`](storage/R2_UPLOADS.md)

---

## 2. Regras Absolutas de Execução para a IA

- **Criação Obrigatória de Testes Automatizados:** Toda nova funcionalidade, rota, endpoint, serviço, módulo, alteração de regra de negócio, roadmap ou correção de bug **DEVE obrigatoriamente incluir a criação ou atualização de testes automatizados (Vitest)**. Nenhuma tarefa ou roadmap é considerado concluído sem a presença, execução e aprovação dos testes automatizados correspondentes cobrindo o caminho feliz (sucesso) e caminhos de exceção (validação, erro e autorização).
- **Seguir o Roadmap Ativo:** A IA deve seguir o roadmap ativo. Quando uma solicitação estiver fora do roadmap, deverá informar que a atividade está fora do roadmap e registrar essa condição antes da implementação.
- **Não Pular Etapas:** Não implementar tarefas de fases ou roadmaps futuros sem autorização explícita.
- **Evidências Reais de Conclusão:** Nunca marcar um roadmap ou etapa como concluído sem executar os testes e apresentar evidências verificáveis. Código gerado ou compilação simples **não constituem conclusão**.
- **Proibição de Inventar Testes:** Nunca afirmar que testes foram executados se não foram realmente executados.
- **Segurança Desde o Início:** Todo código deve nascer seguro. É obrigatório consultar e seguir `.ai/security/AI_SECURITY_RULES.md`.
- **Zero Trust no Frontend:** O backend é sempre a autoridade de segurança. O frontend apenas oculta elementos para experiência do usuário.
- **Proibição Absoluta de Diálogos Nativos do Navegador:** É estritamente proibido utilizar funções nativas do JavaScript como `confirm()`, `alert()` ou `prompt()`. Qualquer ação que exija confirmação do usuário (ex: arquivar, excluir, desativar, alterar permissão) **DEVE obrigatoriamente utilizar o componente `AlertDialog` do Shadcn UI** (`AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction` de `@/components/ui/alert-dialog`).
- **Uso Obrigatório do Shadcn UI (Regra Arquitetural Não Negociável):** Toda e qualquer página, modal, formulário, tabela, menu, tooltip, aba, badge, card ou elemento visual **DEVE obrigatoriamente utilizar os componentes oficiais do Shadcn UI / Radix UI** (`@/components/ui/...` como `Button`, `Input`, `Textarea`, `Select`, `NativeSelect`, `Checkbox`, `Dialog`, `AlertDialog`, `Sheet`, `DropdownMenu`, `Tabs`, `Table`, `Tooltip`, etc.). Toda nova interface deve nascer implementada com os componentes do Shadcn UI. Caso durante o teste visual no browser seja identificado que o componente do Shadcn (ex: `Button`) causa desalinhamentos de layout/padding inviáveis que prejudicam a experiência do usuário, a exceção pode ser concedida e documentada em [`.ai/frontend/FRONTEND_UI.md`](frontend/FRONTEND_UI.md) após esse primeiro teste.
- **Classe `cursor-pointer` Mandatória:** **TODOS** os elementos clicáveis do frontend (botões do Shadcn, botões de ação na tabela, ícones de fechar dialog, links, badges interativas e seletores) **DEVEM obrigatoriamente conter a classe Tailwind `cursor-pointer`**.
- **Uso Obrigatório Absoluto do `apiClient` para Requisições HTTP no Frontend (Regra Arquitetural Não Negociável):** É **estritamente proibido** utilizar a função nativa `fetch()` diretamente em componentes, páginas ou hooks dos front-ends (`apps/manager` e `apps/marketplace`) para chamadas à API da aplicação. **TODAS** as requisições HTTP para o backend **DEVEM obrigatoriamente** utilizar o utilitário centralizado `apiClient` (`@/lib/api-client`). Isso garante o envio automático de credenciais de autenticação (`credentials: "include"`), renovação silenciosa de tokens em erros 401 e tratamento unificado de erros. A única exceção tolerada para uso direto do `fetch` é a transferência binária direta de arquivos para URLs pré-assinadas de storages de terceiros (ex: Cloudflare R2 / S3 presigned URLs).
- **Regra de Classes Utilitárias Numéricas Nativas do Tailwind CSS (Proibição de Colchetes `[...]` para Pixels):** Em telas e componentes que utilizam Tailwind CSS, é proibido usar sintaxe de colchetes arbitrários para dimensões em pixels (ex: `min-h-[420px]`, `w-[760px]`, `h-[400px]`, `p-[16px]`). Em vez disso, faça a divisão do valor em pixels por 4 e utilize a classe numérica nativa direta (ex: `min-h-105` para 420px, `min-w-190` para 760px, `h-100` para 400px, `h-185` para 740px). O Tailwind v4 suporta escala numérica arbitrária sem necessidade de colchetes para larguras, alturas, paddings, margens e espaçamentos.
- **Proibição Absoluta de Cores Arbitrárias em Hexadecimal (`-[#...]`):** É **estritamente proibido** utilizar valores arbitrários de cores hexadecimais em classes do Tailwind CSS (ex: `bg-[#333333]`, `border-[#444444]`, `text-[#f5f5f5]`, `border-b-[#333333]`). **TODAS** as cores de background, borda, texto, anel e preenchimento **DEVEM obrigatoriamente** utilizar as paletas de cores nativas do Tailwind CSS (ex: `bg-zinc-800`, `border-zinc-700`, `bg-stone-100`, `text-stone-800`, `bg-emerald-600`, etc.) ou variáveis de design tokens do sistema (`bg-background`, `text-foreground`, `border-border`).
- **Regra Mandatória de Reatividade de Dados e Invalidação Cross-Módulo (Non-Negotiable UX Rule):** Toda mutation que cria, atualiza ou exclui uma entidade **DEVE obrigatoriamente invalidar TODAS as query keys de todos os módulos que consomem essa entidade**, incluindo as queries de dropdown (`dropdown()`) usadas em formulários de outros módulos. **NUNCA invalidar apenas a query de listagem local** sem também invalidar os dropdowns dependentes. Use sempre os helpers centralizados (`invalidateCategories`, `invalidateBrands`, `invalidateRoles`, `invalidateStores`) definidos em `src/lib/query-keys.ts`. Queries de dropdown **DEVEM ter `staleTime: 0`** para garantir refetch imediato ao re-montar. A falha nesta regra resulta em usuários vendo dados desatualizados em formulários (ex: categoria criada não aparece no select de produtos sem refresh de página) — o que é inaceitável em uma plataforma profissional.
- **Regra Mandatória de Input de Preço — `<PriceInput>` (Non-Negotiable):** É **estritamente proibido** usar `<Input type="number">` para campos monetários (preço de venda, preço promocional, preço de custo, etc.). **TODOS** os campos de preço devem usar o componente `<PriceInput>` (`src/components/ui/price-input.tsx`). O componente formata automaticamente no estilo `R$ 105,00` enquanto o usuário digita e retorna um `number` limpo via `onValueChange`. O estado interno dos formulários deve ser `number` (não `string`) para campos de preço. As funções utilitárias puras estão em `src/lib/price.ts`.
- **Regra Mandatória de Habilitação do Botão de Salvar (`isDirty`):** Em **TODOS** os formulários da aplicação (`apps/manager` e `apps/marketplace`), o botão de salvar/submeter alterações **DEVE obrigatoriamente** permanecer desabilitado (`disabled={!isDirty || isSubmitting}`) quando o formulário estiver pristine (sem alterações em relação ao estado original ou salvo).
- **Regra Mandatória de Exibição de Erros via `<ErrorDialog />` (Non-Negotiable UX Rule):** Em formulários, modais, páginas e ações de mutação do frontend onde a submissão falhar ou houver retornos de erro da API (erros de validação Zod/Fastify, regras de negócio 400/422/500), **DEVE-SE obrigatoriamente utilizar o componente `<ErrorDialog />`** via Provider central e hook `useErrorDialog()` (`const { showError } = useErrorDialog()`) em vez de Toasts temporários. O modal exibe os erros de forma clara e estruturada, não desaparece sozinho (ficando aberto até o usuário clicar em "Entendi") e se adapta dinamicamente ao tema do sistema. Veja [`.ai/frontend/FRONTEND_UI.md`](frontend/FRONTEND_UI.md).
- **Nunca Inventar o Estado do Projeto:** Inspecione sempre o código e banco reais antes de fazer afirmações sobre o sistema.
- **Atualização de Documentação:** Toda alteração de funcionalidade deve ser acompanhada da atualização dos documentos relacionados em `.ai/`.

### 2.1 Regra Mandatória de Testes Automatizados (Vitest)

Toda nova implementação, endpoint, serviço, funcionalidade, correção de bug ou roadmap **DEVE obrigatoriamente incluir a criação e execução de testes automatizados (Vitest)**. Nenhuma tarefa é considerada finalizada ou marcada como concluída sem a presença, execução e aprovação dos testes automatizados correspondentes cobrindo os cenários de sucesso e exceção.

### 2.3 Regra Mandatória de Quality Gate Canônico (`pnpm verify`)

Nenhuma implementação, refatoração, ajuste visual, correção de bug ou entrega por inteligência artificial ou desenvolvedor pode ser declarada concluída sem executar a sequência canônica do Quality Gate do monorepo, obrigatoriamente nesta ordem estrita:

1. **`lint`** (`pnpm lint`) — Qualidade e conformidade de código
2. **`typecheck`** (`pnpm typecheck`) — Integridade estática de tipos TypeScript
3. **`test`** (`pnpm test`) — Validação do comportamento funcional e testes de regressão
4. **`build`** (`pnpm build`) — Compilação e empacotamento de produção

A execução deve ser realizada preferencialmente pelo comando canônico unificado do root:

```bash
pnpm verify
```

#### Regras de Execução do Quality Gate:

- **Fail-Fast Automático:** Se qualquer fase falhar (`LINT`, `TYPECHECK`, `TEST` ou `BUILD`), a execução é interrompida e a tarefa **NÃO está concluída**.
- **Não-Equivalência das Fases:**
  - `lint PASS` NÃO substitui `typecheck`.
  - `typecheck PASS` NÃO substitui `testes`.
  - `testes PASS` NÃO substituem `build`.
  - `build PASS` NÃO substitui `lint`.
- **Proibição Absoluta de Enfraquecimento:** É estritamente proibido silenciar erros para forçar o gate a passar (ex: `eslint-disable` indiscriminado, `ts-ignore`, `ignoreBuildErrors`, ignorar testes falhos, `--force`, `|| true`, `continue-on-error`).
- **Relatório Factual Obrigatório para Agentes:** Ao concluir qualquer tarefa, a IA/agente deve obrigatoriamente executar o Quality Gate e apresentar o relatório factual discriminado por fase:
  - `Lint: PASS / FAIL`
  - `Typecheck: PASS / FAIL`
  - `Tests: X/X PASS / FAIL`
  - `Build: PASS / FAIL`
  - `QUALITY GATE: PASS / FAIL`
    (Caso alguma fase não se aplique a um workspace específico, deve-se informar `N/A + motivo técnico`, nunca simplesmente omiti-la).

---

## 3. Diretrizes de Arquitetura e Monorepo

### 🔴 Regra Permanente de Auditoria (Obrigatória)

Toda ação realizada por um usuário ou sistema que crie, modifique, remova, publique, arquive, restaure, aprove, rejeite, autentique, exporte ou altere o estado de qualquer recurso **DEVE gerar um registro de auditoria** via `logAudit()` em `apps/api/src/shared/utils/audit.ts`. Nenhuma funcionalidade de mutação é considerada completa sem auditoria.

### Regras de Dependência entre Pacotes

- `apps/` podem importar de `packages/` via workspace (atualmente `@verttex/auth`, `@verttex/env` e `@verttex/types`). Os componentes Shadcn permanecem locais em cada aplicação.
- `packages/` **NUNCA** podem importar nada de `apps/`.
- Uma app **NUNCA** pode importar arquivos diretamente de outra app (ex: sem imports de `apps/api/src` dentro de `apps/manager`).

### Exportações e Nomenclatura

- **Named Exports APENAS:** Sempre usar exportações nomeadas. Exportação default é permitida apenas em rotas do Next.js (`page.tsx`, `layout.tsx`) ou arquivos de configuração que a exigem.
- **Nomenclatura:** Arquivos em `kebab-case`, Componentes/Tipos em `PascalCase`, Funções/Variáveis em `camelCase`, Schemas terminando em `Schema`.

---

## 4. Regras de Banco de Dados e Entidades

- **MIGRATIONS APENAS:** Nunca rodar `prisma db push` ou `prisma db reset` sem consentimento humano explícito. Alterações via `pnpm db:migrate`.
- **`User` vs `Customer`:**
  - `User` representa **exclusivamente** usuários gestores que acessam `apps/manager`.
  - `Customer` representa **exclusivamente** clientes compradores do e-commerce que acessam `apps/marketplace`.
  - Nunca misturar ou usar `User` para clientes compradores.

---

## 5. Ações Proibidas

- Não escrever código fora dos módulos padrão.
- Não injetar tabelas temporárias ou dados fake sem documentar.
- Não expor ou hardcodar segredos ou credenciais no código-fonte.
- Não inventar regras de negócio que não estejam especificadas em `.ai/domain/BUSINESS_RULES.md`.
- Não utilizar `$queryRaw`, `$executeRaw` ou Prisma raw SQL sem aprovação formal e alteração na política de segurança.
