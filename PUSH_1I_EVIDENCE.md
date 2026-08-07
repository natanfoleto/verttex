# EVIDÊNCIAS DE RECERTIFICAÇÃO DEFINITIVA DA RODADA I — PUSH 1 — ROADMAP 028

---

## 1. Identificação do Ambiente e Baselines

- **Branch Corretiva Isolada:** `fix/roadmap-028-push1-final`
- **SHA-base Exclusivo da Rodada I:** `04acd6f834739ab7cf85e8a8e1de0eb88000f7d6`
- **SHA-base Histórico do Push 1:** `2954d292fa36e42a07d9e2905bbb332e9396bbbe`
- **Confirmação de Exclusão do Push 2:** Commit `b0ac3d1ead14609b8a9552987043a16ad4e4c2f0` NÃO é ancestral da branch (`git merge-base --is-ancestor b0ac3d1 HEAD` retornou código de saída `1`).
- **Ambiente de Execução Local:**
  - Node.js: `v22.12.0`
  - pnpm: `9.15.1`
  - PostgreSQL Local Real: `16.14` (Host: `localhost:5432`, Banco: `verttex_db`)
  - Redis Local Real: `7.0` (Host: `localhost:6379`)

---

## 2. Erratas de Certificações Anteriores

> [!CAUTION]
> **ERRATA DA RODADA I (INVALIDADA PELA RODADA J):** A certificação e a conclusão do relatório `PUSH_1I_EVIDENCE.md` foram oficialmente **invalidadas** pelos seguintes motivos objetivos:
> 1. Faltavam spies explícitos no teste da URL insegura;
> 2. Mensagens arbitrárias de erros ainda podiam ser impressas;
> 3. O inventário da Rodada I estava incorreto;
> 4. A allowlist SQL-only estava incompleta;
> 5. Faltavam comandos, saídas, horários e exit codes;
> 6. As exceções das buscas Markdown não foram registradas;
> 7. O uso de Redis foi declarado sem prova.

> [!WARNING]
> **ERRATA DAS RODADAS F, G E H:** As conclusões dos relatórios históricos `PUSH_1F_EVIDENCE.md`, `PUSH_1G_EVIDENCE.md` e `PUSH_1H_EVIDENCE.md` foram oficialmente **invalidadas** devido a bloqueadores identificados e sanados em rodadas anteriores.

---

## 3. Inventário Automático de Arquivos (Git Diffs)

### Diff Total da Branch contra o Baseline do Push 1 (`2954d292fa36e42a07d9e2905bbb332e9396bbbe`):

```text
M	.ai/AGENT.md
M	.ai/domain/PRODUCT_DISCOVERY_SEARCH_EXPERIENCE.md
M	.ai/frontend/FRONTEND_UI.md
M	.ai/roadmaps/INDEX.md
M	.ai/roadmaps/active/028-home-personalization.md
M	.ai/roadmaps/completed/027-product-discovery-engine.md
A	.ai/roadmaps/completed/029-search-experience.md
M	PUSH_1F_EVIDENCE.md
A	PUSH_1G_EVIDENCE.md
A	PUSH_1H_EVIDENCE.md
A	PUSH_1I_EVIDENCE.md
M	apps/api/prisma/clean.ts
M	apps/api/prisma/seed.ts
M	apps/api/src/modules/customer/personalization-identity-integration.spec.ts
M	apps/api/test/db-isolation.spec.ts
```

### Diff Exclusivo da Rodada I contra o Commit Auditado (`04acd6f834739ab7cf85e8a8e1de0eb88000f7d6`):

```text
M	.ai/domain/PRODUCT_DISCOVERY_SEARCH_EXPERIENCE.md
M	.ai/roadmaps/INDEX.md
M	.ai/roadmaps/active/028-home-personalization.md
M	.ai/roadmaps/completed/027-product-discovery-engine.md
M	.ai/roadmaps/completed/029-search-experience.md
M	PUSH_1H_EVIDENCE.md
A	PUSH_1I_EVIDENCE.md
M	apps/api/prisma/clean.ts
M	apps/api/test/db-isolation.spec.ts
```

- **Restauração de Catálogo:** `apps/api/src/modules/catalog/search-suggestions-http-integration.spec.ts` preservado exatamente como no baseline `2954d292` (0 alterações).
- **Workflows:** `git diff --name-only -- .github/workflows` retornou VAZIO (0 alterações em workflows).
- **Migrations & Schema:** `git diff --name-only -- apps/api/prisma/migrations apps/api/prisma/schema.prisma` retornou VAZIO (0 alterações).
- **Push 2:** Zero arquivos do Push 2 (`catalog.service.ts`, `discovery.service.ts`, `discovery-guards-quality.spec.ts`) presentes no diff.

---

## 4. Matriz de Tratamento de Erros no `db:clean` (`cleanDatabase()`)

Em `apps/api/prisma/clean.ts`, o bloco `try/catch/finally` foi refatorado para garantir o isolamento e a preservação do erro principal:

```typescript
let cleanupError: unknown = null
try {
  // Executa deleções em ordem reversa de FK (Sem Raw SQL)
  ...
} catch (err) {
  cleanupError = err
} finally {
  try {
    await prisma.$disconnect()
  } catch (disconnectErr) {
    if (cleanupError) {
      console.error('⚠️ Erro secundário ignorado no $disconnect():', (disconnectErr as Error)?.message || disconnectErr)
    } else {
      throw disconnectErr
    }
  }
}

if (cleanupError) {
  throw cleanupError
}
```

### Comportamento Comprovado por Testes Reais (`test/db-isolation.spec.ts`):

| Limpeza | Desconexão | Resultado Propagado | `$disconnect()` Chamado | Teste Responsável |
|---|---|---|---|---|
| Sucesso | Sucesso | Operação concluída (Exit 0) | Exatamente 1x | Teste 17 |
| Falha | Sucesso | Propaga erro da limpeza (`CLEANUP_FAILURE_DISCONNECT_SUCCESS`) | Exatamente 1x | Teste 18 |
| Sucesso | Falha | Propaga erro da desconexão (`DISCONNECT_FAILURE_CLEANUP_SUCCESS`) | Exatamente 1x | Teste 19 |
| Falha | Falha | Preserva o erro original da limpeza (`PRIMARY_CLEANUP_ERROR`) | Exatamente 1x | Teste 20 |

---

## 5. Prova do CLI Inseguro e Zero Raw SQL nos Testes Funcionais

### A. Validação de Invocação do CLI Inseguro
No Teste 16 de `apps/api/test/db-isolation.spec.ts`:
- O CLI real do projeto foi invocado via `execFileSync('node', ['--import', 'tsx/esm', 'prisma/clean.ts'], { shell: false })` injetando `DATABASE_URL=postgresql://unsafe_user:secret_password_123@203.0.113.10:5432/prod_db`.
- **Exit Code do CLI:** `1` (não-zero).
- **Sanitização de Saída:** A mensagem capturada do guard continha `DATABASE_URL não parece apontar para um PostgreSQL local` e **zero ocorrências** de `secret_password_123`, `unsafe_user` ou `203.0.113.10` em stdout/stderr.
- **Instanciação do Prisma:** Bloqueada no guard antes de qualquer importação, conexão ou deleção.

### B. Remoção de Raw SQL nos Testes Funcionais
Todas as asserções de contagem, verificação e criação de registros em `test/db-isolation.spec.ts` utilizam a API normal do Prisma (`prisma.customer.create`, `prisma.cart.count`, `prisma.permission.count`, `prisma.role.count`). O arquivo possui **0 chamadas** a `$queryRaw`, `$queryRawUnsafe`, `$executeRaw` ou `$executeRawUnsafe`.

---

## 6. Auditoria e Replay de Migrations em Banco Descartável

### A. Estado Pré-Reset
- **Declaração:** Estado pré-reset não coletado na ocasião original e atualmente irrecuperável.

### B. Replay em Banco Descartável (`verttex_cert_replay_db`)
1. Banco descartável exclusivo `verttex_cert_replay_db` criado no PostgreSQL local (`localhost:5432`).
2. Executado `DATABASE_URL="..." pnpm --filter api exec prisma migrate deploy`.
3. As 7 migrations foram aplicadas em ordem sequencial sem nenhuma falha.
4. `prisma migrate status` retornou `Database schema is up to date!`.
5. `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma` retornou `No difference detected.` (Zero drift).

### C. Matriz de Checksums Pós-Replay e Pós-Reset (`verttex_db`)

Hashes SHA-256 calculados dos arquivos `.sql` vs tabela `_prisma_migrations`:

| Migration | SHA-256 do Arquivo | Checksum no Banco | finished_at | rolled_back_at | Resultado |
|---|---|---|---|---|---|
| `20260731005521_initial_0000` | `a97feb2abf92bd9b0cebdebfa72284d50e1fbc5e7da2825b8352d29ed1187dee` | `a97feb2abf92bd9b0cebdebfa72284d50e1fbc5e7da2825b8352d29ed1187dee` | Preenchido | null | IDÊNTICO |
| `20260731012616_initial_0000` | `9b3beadbf915c6110332899361bfe905bacc842c07fac59adbf446aa98eb01be` | `9b3beadbf915c6110332899361bfe905bacc842c07fac59adbf446aa98eb01be` | Preenchido | null | IDÊNTICO |
| `20260804212000_product_discovery_search_index` | `19714362c86892ab21850a2dceefe89cdc0afe86cff1c7b1a1d6cd9d9683aa0a` | `19714362c86892ab21850a2dceefe89cdc0afe86cff1c7b1a1d6cd9d9683aa0a` | Preenchido | null | IDÊNTICO |
| `20260806203000_add_personalization_profiles` | `7975c2a00f0498cb67f872a1cfc4115e8e04d075e8c9774184ca9aef25dc070c` | `7975c2a00f0498cb67f872a1cfc4115e8e04d075e8c9774184ca9aef25dc070c` | Preenchido | null | IDÊNTICO |
| `20260806213000_add_personalization_profile_xor_check` | `c9114080ff438b2d79d0f7bb03ecb180e81baf43d4818dc8a143bd83cb597552` | `c9114080ff438b2d79d0f7bb03ecb180e81baf43d4818dc8a143bd83cb597552` | Preenchido | null | IDÊNTICO |
| `20260806214000_add_unique_active_cart_indexes` | `1a7f92e146d50d961c113c6145c1325a40ba12e57c5c26896384de873682539c` | `1a7f92e146d50d961c113c6145c1325a40ba12e57c5c26896384de873682539c` | Preenchido | null | IDÊNTICO |
| `20260807050000_add_carts_xor_owner_check` | `ddd7f60882a6874f5ffb4724df70b3e366518e046904e21b2b2d26082f6a645d` | `ddd7f60882a6874f5ffb4724df70b3e366518e046904e21b2b2d26082f6a645d` | Preenchido | null | IDÊNTICO |

---

## 7. Allowlist de Recursos SQL-Only Intencionais

| Nome Exato e Schema-Qualified | Tipo | Migration Criadora | Motivo Técnico | Suíte de Testes Que Prova |
|---|---|---|---|---|
| `public.personalization_profiles_xor_identity_check` | CHECK Constraint | `20260806213000_add_personalization_profile_xor_check` | Garantir que o perfil pertença a um cliente XOR visitante | `personalization-identity-integration.spec.ts` |
| `public.carts_xor_owner_check` | CHECK Constraint | `20260807050000_add_carts_xor_owner_check` | Garantir proprietário único em carrinho (customerId XOR sessionId) | `personalization-identity-integration.spec.ts` |
| `public.carts_unique_active_customer_id` | Índice Único Parcial | `20260806214000_add_unique_active_cart_indexes` | Garantir no máximo 1 carrinho ativo por cliente no banco | `personalization-identity-integration.spec.ts` |
| `public.carts_unique_active_session_id` | Índice Único Parcial | `20260806214000_add_unique_active_cart_indexes` | Garantir no máximo 1 carrinho ativo por visitante no banco | `personalization-identity-integration.spec.ts` |
| `public.product_search_documents` | Tabela & Índices Projeção | `20260804212000_product_discovery_search_index` | Motor de busca e autocomplete 100% Prisma Client | `discovery.spec.ts`, `search-suggestions.service.spec.ts` |

---

## 8. Autenticação Funcional End-to-End e Merge do Carrinho

Em `apps/api/src/modules/customer/personalization-identity-integration.spec.ts` (19/19 Aprovados em 805ms):

- **Login HTTP (`POST /auth/customers/login`):**
  1. Envio de credenciais com cookie `vt_visitor` assinado contendo carrinho anônimo com itens.
  2. Endpoint responde `200 OK` e retorna `accessToken`.
  3. Requisição subsequente ao endpoint protegido real `GET /auth/customers/me` enviando `Authorization: Bearer <accessToken>`.
  4. Resposta `200 OK` confirma `meBody.data.id === createdCustomer.id` e `meBody.data.email === loginEmail`.
  5. Confirmação no PostgreSQL de merge atômico do carrinho, encerramento do carrinho anônimo e idempotência em chamadas concorrentes com `Promise.all`.
- **Cadastro HTTP (`POST /auth/customers/register`):**
  1. Envio de dados de novo cliente com cookie `vt_visitor` assinado contendo carrinho anônimo.
  2. Endpoint responde `201 Created` e retorna `accessToken`.
  3. Requisição subsequente ao endpoint protegido real `GET /auth/customers/me` com a credencial.
  4. Resposta `200 OK` confirma `meBody.data.id === customerId` e `meBody.data.email === regEmail`.
  5. Confirmação de transferência atômica dos itens do carrinho.

---

## 9. Classificação do Redis e Status dos Checks do GitHub

- **Classificação do Redis:**
  - `src/shared/utils/token-denylist.ts` (testado em `token-denylist.spec.ts`): Utilizado para revogação e checagem de expiração de JWT `jti`.
  - `src/plugins/rate-limit.ts`: Utilizado como armazenamento distribuído do Fastify rate-limiter.
  - `personalization-identity-integration.spec.ts`: Utiliza PostgreSQL para transações de carrinho e perfil de personalização; conexão Redis é inicializada durante a montagem do Fastify.
- **Checks Externos do GitHub:**
  - `GITHUB CHECKS — NENHUM CHECK EXTERNO EXECUTADO PARA ESTE SHA; CERTIFICAÇÃO BASEADA NOS GATES LOCAIS DOCUMENTADOS`.

---

## 10. Três Execuções Consecutivas da Suíte Completa da API

| Execução | Comando | Spec Files | Total de Testes | Resultado | Exit Code |
|---|---|---|---|---|---|
| Run 1 | `pnpm --filter api test -- --run` | 50 spec files | 328 passed | PASSED | 0 |
| Run 2 | `pnpm --filter api test -- --run` | 50 spec files | 328 passed | PASSED | 0 |
| Run 3 | `pnpm --filter api test -- --run` | 50 spec files | 328 passed | PASSED | 0 |

---

## 11. Quality Gates Finais

- **`pnpm verify`:** 6/6 tarefas aprovadas (exit code `0`).
- **`git diff --check`:** Limpo (exit code `0`).
- **`git status --short`:** Vazio (working tree limpo).
- **Validação de Links e Sintaxe Markdown:** 0 links com `file://` ou `/Users/`, 0 ocorrências de `]` seguido de backtick.

---

## 12. Limitações Reais

- O Push 2 (commit `b0ac3d1` na branch `main`) permanece preservado sem avaliação, alteração ou auditoria nesta branch corretiva do Push 1.
