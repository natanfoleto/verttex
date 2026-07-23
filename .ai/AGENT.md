# AI Agent Guidelines — VERTTEX Monorepo

> **Versão:** 2.0 — Centralizada em `.ai/`  
> **Status:** Documento Mandatório para todas as IAs e Desenvolvedores que colaboram com o projeto

Bem-vindo! Este documento define as regras obrigatórias de conduta, a hierarquia de leitura e as restrições de execução para qualquer inteligência artificial ou desenvolvedor no projeto **VERTTEX NF**.

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

---

## 2. Regras Absolutas de Execução para a IA

- **Criação Obrigatória de Testes Automatizados:** Toda nova funcionalidade, rota, endpoint, serviço, alteração de regra de negócio ou correção de bug **DEVE obrigatoriamente incluir a criação ou atualização de testes automatizados (Vitest)**. Nenhuma tarefa é considerada concluída sem a presença e execução bem-sucedida de testes automatizados cobrindo o caminho feliz (sucesso) e caminhos de exceção (validação, erro e autorização).
- **Seguir o Roadmap Ativo:** A IA deve seguir o roadmap ativo. Quando uma solicitação estiver fora do roadmap, deverá informar que a atividade está fora do roadmap e registrar essa condição antes da implementação.
- **Não Pular Etapas:** Não implementar tarefas de fases ou roadmaps futuros sem autorização explícita.
- **Evidências Reais de Conclusão:** Nunca marcar um roadmap ou etapa como concluído sem executar os testes e apresentar evidências verificáveis. Código gerado ou compilação simples **não constituem conclusão**.
- **Proibição de Inventar Testes:** Nunca afirmar que testes foram executados se não foram realmente executados.
- **Segurança Desde o Início:** Todo código deve nascer seguro. É obrigatório consultar e seguir `.ai/security/AI_SECURITY_RULES.md`.
- **Zero Trust no Frontend:** O backend é sempre a autoridade de segurança. O frontend apenas oculta elementos para experiência do usuário.
- **Proibição Absoluta de Diálogos Nativos do Navegador:** É estritamente proibido utilizar funções nativas do JavaScript como `confirm()`, `alert()` ou `prompt()`. Qualquer ação que exija confirmação do usuário (ex: arquivar, excluir, desativar, alterar permissão) **DEVE obrigatoriamente utilizar o componente `AlertDialog` do Shadcn UI** (`AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction` de `@/components/ui/alert-dialog`).
- **Uso Obrigatório do Shadcn UI (Lib Principal de Componentes):** Toda e qualquer nova página, modal, componente de formulário, tabela, menu, tooltip, aba, badge ou elemento visual **DEVE obrigatoriamente buscar e reutilizar os componentes oficiais do Shadcn UI / Radix UI** (`@/components/ui/...` como `Dialog`, `AlertDialog`, `Sheet`, `DropdownMenu`, `Tabs`, `Table`, `Tooltip`, `Select`, `Input`, `Button`, etc.). É proibido criar elementos visuais ou modais customizados do zero (como `div` com `fixed inset-0`) quando o Shadcn UI possuir o recurso equivalente. Apenas em cenários raríssimos onde não exista recurso no Shadcn/Radix será permitida a criação de um componente próprio.
- **Classe `cursor-pointer` Mandatória:** **TODOS** os elementos clicáveis do frontend (botões de formulário, botões de ação na tabela, ícones de fechar dialog, links, badges interativas e seletores) **DEVEM obrigatoriamente conter a classe Tailwind `cursor-pointer`**.
- **Nunca Inventar o Estado do Projeto:** Inspecione sempre o código e banco reais antes de fazer afirmações sobre o sistema.
- **Atualização de Documentação:** Toda alteração de funcionalidade deve ser acompanhada da atualização dos documentos relacionados em `.ai/`.

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
