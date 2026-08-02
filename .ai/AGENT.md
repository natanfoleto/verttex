# AI Agent Guidelines — VERTTEX Monorepo

> **Versão:** 2.0 — Centralizada em `.ai/`  
> **Status:** Documento Mandatório para todas as IAs e Desenvolvedores que colaboram com o projeto

Bem-vindo! Este documento define as regras obrigatórias de conduta, a hierarquia de leitura e as restrições de execução para qualquer inteligência artificial ou desenvolvedor no projeto **VERTTEX**.

---

## 1. Ordem de Prioridade e Leitura Obrigatória de Contexto

Antes de iniciar a análise ou alteração de qualquer código, você **DEVE** ler os documentos na seguinte ordem estrita:

1. [`.ai/README.md`](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/README.md) — Índice geral e estrutura de toda a documentação
2. [`.ai/AGENT.md`](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/AGENT.md) (este documento) — Regras de conduta e diretrizes gerais da IA
3. Regras obrigatórias de segurança em [`.ai/security/AI_SECURITY_RULES.md`](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/security/AI_SECURITY_RULES.md)
4. [`.ai/roadmaps/INDEX.md`](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/roadmaps/INDEX.md) — Índice oficial dos roadmaps
5. Roadmap ativo em `.ai/roadmaps/active/` (quando existir)
6. Arquitetura aplicável em [`.ai/architecture/ARCHITECTURE.md`](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/architecture/ARCHITECTURE.md)
7. Regras de domínio aplicáveis em [`.ai/domain/BUSINESS_RULES.md`](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/domain/BUSINESS_RULES.md), [`.ai/domain/PERMISSIONS.md`](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/domain/PERMISSIONS.md) e [`.ai/domain/WORKFLOWS.md`](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/domain/WORKFLOWS.md)
8. Documentação específica de [`.ai/backend/BACKEND_API.md`](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/backend/BACKEND_API.md) ou [`.ai/frontend/FRONTEND_UI.md`](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/frontend/FRONTEND_UI.md)
9. Documentos de observabilidade em [`.ai/observability/AUDIT_RULES.md`](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/observability/AUDIT_RULES.md)
10. Taxonomia de armazenamento e uploads no R2 em [`.ai/storage/R2_UPLOADS.md`](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/storage/R2_UPLOADS.md)

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
- **Uso Obrigatório do Shadcn UI (Regra Arquitetural Não Negociável):** Toda e qualquer página, modal, formulário, tabela, menu, tooltip, aba, badge, card ou elemento visual **DEVE obrigatoriamente utilizar os componentes oficiais do Shadcn UI / Radix UI** (`@/components/ui/...` como `Button`, `Input`, `Textarea`, `Select`, `NativeSelect`, `Checkbox`, `Dialog`, `AlertDialog`, `Sheet`, `DropdownMenu`, `Tabs`, `Table`, `Tooltip`, etc.). É **estritamente proibido** utilizar tags HTML nativas como `<button>`, `<input>`, `<select>`, `<textarea>`, `<dialog>` ou modais artesanais (`div` com `fixed inset-0`) em códigos de funcionalidade dos front-ends. O descumprimento é bloqueado automaticamente pela regra ESLint `react/forbid-elements`. Consulte [`.ai/frontend/FRONTEND_UI.md#1013`](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/frontend/FRONTEND_UI.md) para detalhes.
- **Classe `cursor-pointer` Mandatória:** **TODOS** os elementos clicáveis do frontend (botões do Shadcn, botões de ação na tabela, ícones de fechar dialog, links, badges interativas e seletores) **DEVEM obrigatoriamente conter a classe Tailwind `cursor-pointer`**.
- **Uso Obrigatório Absoluto do `apiClient` para Requisições HTTP no Frontend (Regra Arquitetural Não Negociável):** É **estritamente proibido** utilizar a função nativa `fetch()` diretamente em componentes, páginas ou hooks dos front-ends (`apps/manager` e `apps/marketplace`) para chamadas à API da aplicação. **TODAS** as requisições HTTP para o backend **DEVEM obrigatoriamente** utilizar o utilitário centralizado `apiClient` (`@/lib/api-client`). Isso garante o envio automático de credenciais de autenticação (`credentials: "include"`), renovação silenciosa de tokens em erros 401 e tratamento unificado de erros. A única exceção tolerada para uso direto do `fetch` é a transferência binária direta de arquivos para URLs pré-assinadas de storages de terceiros (ex: Cloudflare R2 / S3 presigned URLs).
- **Regra de Classes Utilitárias Numéricas Nativas do Tailwind CSS (Proibição de Colchetes `[...]` para Pixels):** Em telas e componentes que utilizam Tailwind CSS, é proibido usar sintaxe de colchetes arbitrários para dimensões em pixels (ex: `min-h-[420px]`, `w-[760px]`, `h-[400px]`, `p-[16px]`). Em vez disso, faça a divisão do valor em pixels por 4 e utilize a classe numérica nativa direta (ex: `min-h-105` para 420px, `min-w-190` para 760px, `h-100` para 400px, `h-185` para 740px). O Tailwind v4 suporta escala numérica arbitrária sem necessidade de colchetes para larguras, alturas, paddings, margens e espaçamentos.
- **Proibição Absoluta de Cores Arbitrárias em Hexadecimal (`-[#...]`):** É **estritamente proibido** utilizar valores arbitrários de cores hexadecimais em classes do Tailwind CSS (ex: `bg-[#333333]`, `border-[#444444]`, `text-[#f5f5f5]`, `border-b-[#333333]`). **TODAS** as cores de background, borda, texto, anel e preenchimento **DEVEM obrigatoriamente** utilizar as paletas de cores nativas do Tailwind CSS (ex: `bg-zinc-800`, `border-zinc-700`, `bg-stone-100`, `text-stone-800`, `bg-emerald-600`, etc.) ou variáveis de design tokens do sistema (`bg-background`, `text-foreground`, `border-border`).
- **Regra Mandatória de Reatividade de Dados e Invalidação Cross-Módulo (Non-Negotiable UX Rule):** Toda mutation que cria, atualiza ou exclui uma entidade **DEVE obrigatoriamente invalidar TODAS as query keys de todos os módulos que consomem essa entidade**, incluindo as queries de dropdown (`dropdown()`) usadas em formulários de outros módulos. **NUNCA invalidar apenas a query de listagem local** sem também invalidar os dropdowns dependentes. Use sempre os helpers centralizados (`invalidateCategories`, `invalidateBrands`, `invalidateRoles`, `invalidateStores`) definidos em `src/lib/query-keys.ts`. Queries de dropdown **DEVEM ter `staleTime: 0`** para garantir refetch imediato ao re-montar. A falha nesta regra resulta em usuários vendo dados desatualizados em formulários (ex: categoria criada não aparece no select de produtos sem refresh de página) — o que é inaceitável em uma plataforma profissional.
- **Regra Mandatória de Input de Preço — `<PriceInput>` (Non-Negotiable):** É **estritamente proibido** usar `<Input type="number">` para campos monetários (preço de venda, preço promocional, preço de custo, etc.). **TODOS** os campos de preço devem usar o componente `<PriceInput>` (`src/components/ui/price-input.tsx`). O componente formata automaticamente no estilo `R$ 105,00` enquanto o usuário digita e retorna um `number` limpo via `onValueChange`. O estado interno dos formulários deve ser `number` (não `string`) para campos de preço. As funções utilitárias puras estão em `src/lib/price.ts`.
- **Regra Mandatória de Habilitação do Botão de Salvar (`isDirty`):** Em **TODOS** os formulários da aplicação (`apps/manager` e `apps/marketplace`), o botão de salvar/submeter alterações **DEVE obrigatoriamente** permanecer desabilitado (`disabled={!isDirty || isSubmitting}`) quando o formulário estiver pristine (sem alterações em relação ao estado original ou salvo).
- **Nunca Inventar o Estado do Projeto:** Inspecione sempre o código e banco reais antes de fazer afirmações sobre o sistema.
- **Atualização de Documentação:** Toda alteração de funcionalidade deve ser acompanhada da atualização dos documentos relacionados em `.ai/`.

### 2.1 Regra Mandatória de Testes Automatizados (Vitest)

Toda nova implementação, endpoint, serviço, funcionalidade, correção de bug ou roadmap **DEVE obrigatoriamente incluir a criação e execução de testes automatizados (Vitest)**. Nenhuma tarefa é considerada finalizada ou marcada como concluída sem a presença, execução e aprovação dos testes automatizados correspondentes cobrindo os cenários de sucesso e exceção.

### 2.2 Regra Mandatória de Skeleton Loading no Frontend

Toda e qualquer página, modal, listagem ou tela com carregamento assíncrono de dados **DEVE obrigatoriamente utilizar componentes de Skeleton Loading (`animate-pulse`)** que espelhem com precisão o layout final da tela, eliminando telas em branco e spinners genéricos soltos.

---

## 3. Diretrizes de Arquitetura e Monorepo

### 🔴 Regra Permanente de Auditoria (Obrigatória)

Toda ação realizada por um usuário ou sistema que crie, modifique, remova, publique, arquive, restaure, aprove, rejeite, autentique, exporte ou altere o estado de qualquer recurso **DEVE gerar um registro de auditoria** via `logAudit()` em `apps/api/src/shared/utils/audit.ts`. Nenhuma funcionalidade de mutação é considerada completa sem auditoria.

### Regras de Dependência entre Pacotes

- `apps/` podem importar de `packages/` via workspace (ex: `@verttex/ui`, `@verttex/env`).
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
