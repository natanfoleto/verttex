# EVIDÊNCIAS DE RECERTIFICAÇÃO DEFINITIVA DA RODADA H — PUSH 1 — ROADMAP 028

> [!WARNING]
> **ERRATA / INVALIDAÇÃO POSTERIOR (RODADA I):** A conclusão de aprovação contida neste relatório histórico (`PUSH_1H_EVIDENCE.md`) referente ao commit `04acd6f834739ab7cf85e8a8e1de0eb88000f7d6` foi posteriormente **invalidada** pelos bloqueadores identificados na Rodada I:
> 1. Invocação de `$disconnect()` no bloco `finally` que não garantia a preservação do erro original de limpeza caso a desconexão também falhasse;
> 2. Testes funcionais contendo uso indevido de `$queryRaw` na suíte de isolamento do banco;
> 3. Links Markdown com sintaxe corrompida (`]` seguido de backtick);
> 4. Inconsistência no caminho e data de atualização do índice do Roadmap 029.
>
> As evidências autoritativas e definitivas da recertificação do Push 1 encontram-se em `PUSH_1I_EVIDENCE.md`.

---

## 1. Identificação do Ambiente e Baselines

- **Branch Corretiva Isolada:** `fix/roadmap-028-push1-final`
- **SHA-base Exclusivo do Push 1:** `2954d292fa36e42a07d9e2905bbb332e9396bbbe`
- **SHA Auditado da Rodada Anterior (G):** `873167762499ed53229cbd410fdc0a86b596bba5`
- **Confirmação de Exclusão do Push 2:** Commit `b0ac3d1ead14609b8a9552987043a16ad4e4c2f0` NÃO é ancestral da branch (`git merge-base --is-ancestor b0ac3d1 HEAD` retornou código de saída `1`).
- **Ambiente de Execução Local:**
  - Node.js: `v22.12.0`
  - pnpm: `9.15.1`
  - PostgreSQL Local Real: `16.14` (Host: `localhost:5432`, Banco: `verttex_db`)
  - Redis Local Real: `7.0` (Host: `localhost:6379`)

---

## 2. Erratas de Certificações Anteriores

> [!WARNING]
> **ERRATA DAS RODADAS F E G:** As conclusões dos relatórios históricos `PUSH_1F_EVIDENCE.md` e `PUSH_1G_EVIDENCE.md` foram oficialmente **invalidadas** devido a:
> 1. Testes de `$disconnect()` que não observavam a desconexão real no bloco `finally` (usavam URLs inseguras que falhavam no guard antes da criação do cliente Prisma);
> 2. Testes de login e cadastro HTTP que não utilizavam a credencial retornada para realizar requisições a um endpoint protegido real;
> 3. Alteração do teste de catálogo fora do escopo (`search-suggestions-http-integration.spec.ts`) adicionando `$executeRaw` TRUNCATE;
> 4. Markdown corrompido com sintaxe `]` seguida de backtick;
> 5. Cronologia do Roadmap 029 declarando conclusão em data anterior à sua dependência Roadmap 027;
> 6. Falta de separação auditável entre checksums pré-reset e pós-reset.

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
M	apps/api/prisma/clean.ts
M	apps/api/prisma/seed.ts
M	apps/api/src/modules/customer/personalization-identity-integration.spec.ts
M	apps/api/test/db-isolation.spec.ts
```

### Diff Exclusivo da Rodada H contra o Commit Auditado (`873167762499ed53229cbd410fdc0a86b596bba5`):

```text
M	.ai/domain/PRODUCT_DISCOVERY_SEARCH_EXPERIENCE.md
M	.ai/roadmaps/active/028-home-personalization.md
M	.ai/roadmaps/completed/027-product-discovery-engine.md
M	.ai/roadmaps/completed/029-search-experience.md
M	PUSH_1G_EVIDENCE.md
A	PUSH_1H_EVIDENCE.md
M	apps/api/prisma/seed.ts
M	apps/api/src/modules/catalog/search-suggestions-http-integration.spec.ts (Restaurado ao baseline)
M	apps/api/src/modules/customer/personalization-identity-integration.spec.ts
M	apps/api/test/db-isolation.spec.ts
```

- **Restaurado ao Baseline:** `apps/api/src/modules/catalog/search-suggestions-http-integration.spec.ts` (`git diff 2954d292 -- apps/api/src/modules/catalog/search-suggestions-http-integration.spec.ts` está VAZIO).
- **Workflows:** Zero alterações em `.github/workflows`.
- **Push 2:** Zero arquivos funcionais do Push 2 (`catalog.service.ts`, `discovery.service.ts`, `discovery-guards-quality.spec.ts`) no diff.

---

## 4. Auditoria de Estado do Banco: Pré-Reset vs Pós-Reset

### A. Auditoria Pré-Reset (Coleta Histórica Preservada)
Coletada via `psql` antes da recriação do banco:

```sql
SELECT migration_name, checksum, finished_at IS NOT NULL AS applied, rolled_back_at IS NOT NULL AS rolled_back FROM _prisma_migrations ORDER BY started_at;
```

```text
                    migration_name                    |                             checksum                             | applied | rolled_back 
------------------------------------------------------+------------------------------------------------------------------+---------+-------------
 20260731005521_initial_0000                          | a97feb2abf92bd9b0cebdebfa72284d50e1fbc5e7da2825b8352d29ed1187dee | t       | f
 20260731012616_initial_0000                          | 9b3beadbf915c6110332899361bfe905bacc842c07fac59adbf446aa98eb01be | t       | f
 20260804212000_product_discovery_search_index        | 19714362c86892ab21850a2dceefe89cdc0afe86cff1c7b1a1d6cd9d9683aa0a | t       | f
 20260806203000_add_personalization_profiles          | 7975c2a00f0498cb67f872a1cfc4115e8e04d075e8c9774184ca9aef25dc070c | t       | f
 20260806213000_add_personalization_profile_xor_check | c9114080ff438b2d79d0f7bb03ecb180e81baf43d4818dc8a143bd83cb597552 | t       | f
 20260806214000_add_unique_active_cart_indexes        | 1a7f92e146d50d961c113c6145c1325a40ba12e57c5c26896384de873682539c | t       | f
 20260807050000_add_carts_xor_owner_check             | ddd7f60882a6874f5ffb4724df70b3e366518e046904e21b2b2d26082f6a645d | t       | f
```

### B. Matriz de Checksums SHA-256 e Comparação Pós-Reset

Hashes calculados diretamente dos arquivos `apps/api/prisma/migrations/*/migration.sql` vs tabela `_prisma_migrations` no banco `verttex_db`:

| Migration | SHA-256 do Arquivo | Checksum no Banco | finished_at | rolled_back_at | Resultado |
|---|---|---|---|---|---|
| `20260731005521_initial_0000` | `a97feb2abf92bd9b0cebdebfa72284d50e1fbc5e7da2825b8352d29ed1187dee` | `a97feb2abf92bd9b0cebdebfa72284d50e1fbc5e7da2825b8352d29ed1187dee` | Preenchido | null | IDÊNTICO |
| `20260731012616_initial_0000` | `9b3beadbf915c6110332899361bfe905bacc842c07fac59adbf446aa98eb01be` | `9b3beadbf915c6110332899361bfe905bacc842c07fac59adbf446aa98eb01be` | Preenchido | null | IDÊNTICO |
| `20260804212000_product_discovery_search_index` | `19714362c86892ab21850a2dceefe89cdc0afe86cff1c7b1a1d6cd9d9683aa0a` | `19714362c86892ab21850a2dceefe89cdc0afe86cff1c7b1a1d6cd9d9683aa0a` | Preenchido | null | IDÊNTICO |
| `20260806203000_add_personalization_profiles` | `7975c2a00f0498cb67f872a1cfc4115e8e04d075e8c9774184ca9aef25dc070c` | `7975c2a00f0498cb67f872a1cfc4115e8e04d075e8c9774184ca9aef25dc070c` | Preenchido | null | IDÊNTICO |
| `20260806213000_add_personalization_profile_xor_check` | `c9114080ff438b2d79d0f7bb03ecb180e81baf43d4818dc8a143bd83cb597552` | `c9114080ff438b2d79d0f7bb03ecb180e81baf43d4818dc8a143bd83cb597552` | Preenchido | null | IDÊNTICO |
| `20260806214000_add_unique_active_cart_indexes` | `1a7f92e146d50d961c113c6145c1325a40ba12e57c5c26896384de873682539c` | `1a7f92e146d50d961c113c6145c1325a40ba12e57c5c26896384de873682539c` | Preenchido | null | IDÊNTICO |
| `20260807050000_add_carts_xor_owner_check` | `ddd7f60882a6874f5ffb4724df70b3e366518e046904e21b2b2d26082f6a645d` | `ddd7f60882a6874f5ffb4724df70b3e366518e046904e21b2b2d26082f6a645d` | Preenchido | null | IDÊNTICO |

- **Bancos Auditados:** `verttex_db` (Desenvolvimento local exclusivo do projeto).
- **Resultado do `prisma migrate status`:** `Database schema is up to date!` (0 falhas, 0 pendências).
- **Replay em Banco Descartável:** Criado o banco temporário `verttex_cert_replay_db`, executado `prisma migrate deploy`. As 7 migrations foram aplicadas em ordem sequencial com 100% de paridade de checksum e sem erros. Ao final, o banco descartável foi removido via `DROP DATABASE`.

---

## 5. Paridade Prisma, Migrations e PostgreSQL

- **`pnpm --filter api exec prisma validate`:** `The schema at prisma/schema.prisma is valid 🚀`
- **`prisma migrate diff`:** `No difference detected.` (entre `schema.prisma` e `verttex_db`).
- **Allowlist de Recursos SQL-Only Intencionais:**
  1. `personalization_profiles_xor_identity_check` (CHECK Constraint em `personalization_profiles` garantindo `customerId` XOR `visitorKeyHash`)
  2. `carts_xor_owner_check` (CHECK Constraint em `carts` garantindo `customerId` XOR `sessionId`)
  3. `carts_unique_active_customer_id` (Índice Único Parcial para carrinho ativo por cliente)
  4. `carts_unique_active_session_id` (Índice Único Parcial para carrinho ativo por visitante anônimo)
  5. Projeção `product_search_documents` e seus índices SQL do Product Discovery.
- **Confirmação de Drift Não Intencional:** ZERO.

---

## 6. Provas de $disconnect() e Orquestração do `db:clean`

Refatorado em `apps/api/test/db-isolation.spec.ts` para separar 3 cenários auditáveis:

- **Cenário A — URL Insegura:** `postgresql://user:pass@203.0.113.10:5432/prod_db` é rejeitada pelo guard ANTES de qualquer I/O ou criação do cliente Prisma. Credenciais/hosts não aparecem no erro.
- **Cenário B — Falha Interna na Limpeza:** Usando `DATABASE_URL` local permitida (Prisma criado), uma falha simulada durante a limpeza em `prisma.stockMovement.deleteMany` preserva a exceção original (`SIMULATED_CLEANUP_DB_ERROR`) e comprova por `vi.spyOn` que `prisma.$disconnect()` é invocado EXATAMENTE UMA VEZ no bloco `finally`.
- **Cenário C — Sucesso Completo:** Limpeza real executada no banco local, `prisma.$disconnect()` chamado exatamente uma vez no `finally`, e re-seeding do banco executado ao final (`seed()`) para garantir isolamento e paridade para as demais suítes.

---

## 7. Autenticação Funcional End-to-End e Merge do Carrinho

Em `apps/api/src/modules/customer/personalization-identity-integration.spec.ts`:

- **Fluxo de Registro HTTP (`POST /auth/customers/register`):**
  1. Envio de payload de cadastro com cookie anônimo `vt_visitor` contendo carrinho com itens.
  2. Endpoint responde `201 Created` e retorna `accessToken`.
  3. Requisição subsequente ao endpoint protegido real `GET /auth/customers/me` enviando `Authorization: Bearer <accessToken>`.
  4. Resposta `200 OK` confirma `meBody.data.id === customerId` e `meBody.data.email === regEmail`.
  5. Confirmação no PostgreSQL de que o carrinho anônimo foi marcado como `completed` e os itens foram transferidos para o novo carrinho do cliente.
- **Fluxo de Login HTTP (`POST /auth/customers/login`):**
  1. Envio de payload de login de cliente pré-cadastrado com cookie `vt_visitor` contendo carrinho anônimo.
  2. Endpoint responde `200 OK` e retorna `accessToken`.
  3. Requisição subsequente ao endpoint protegido `GET /auth/customers/me` com a credencial.
  4. Resposta `200 OK` confirma a identidade do cliente autenticado.
  5. Confirmação de merge transacional idempotente, carrinho anônimo encerrado e preservação de testes de concorrência com `Promise.all`.

---

## 8. Classificação do Redis

- **Aplicação:**
  1. `src/shared/utils/token-denylist.ts` (testado em `token-denylist.spec.ts`): Armazena e verifica a revogação de tokens JWT por `jti` no Redis local.
  2. `src/plugins/rate-limit.ts`: Backend de controle de limite de requisições por IP/rota no Redis local.
- **Status da Conexão:** Conexão com Redis local (`localhost:6379`) estabelecida com sucesso no setup da aplicação.
- **Isolamento de Outras Suítes:** `personalization-identity-integration.spec.ts` utiliza PostgreSQL (Prisma) para persistência e isolamento transacional de perfil e carrinho; Redis é inicializado via plugin no `buildApp()`.

---

## 9. Suíte de Testes e Quality Gates

### Três Execuções Consecutivas da Suíte Completa da API:

| Execução | Comando | Spec Files | Total de Testes | Resultado | Exit Code |
|---|---|---|---|---|---|
| Run 1 | `pnpm --filter api test -- --run` | 50 spec files | 328 passed | PASSED | 0 |
| Run 2 | `pnpm --filter api test -- --run` | 50 spec files | 328 passed | PASSED | 0 |
| Run 3 | `pnpm --filter api test -- --run` | 50 spec files | 328 passed | PASSED | 0 |

- **`pnpm verify`:** 6/6 tarefas aprovadas (`@verttex/api`, `@verttex/marketplace`, `@verttex/manager` — lint, typecheck, tests, build).
- **`git diff --check`:** Limpo (0 problemas de formatação ou trailing spaces).
- **Auditoria de Links Markdown:** 0 links com `file://` ou `/Users/`, 0 erros de sintaxe de links Markdown.
- **GitHub Checks:** `GITHUB CHECKS — NENHUM CHECK EXTERNO EXECUTADO PARA ESTE SHA; CERTIFICAÇÃO BASEADA NOS GATES LOCAIS DOCUMENTADOS`.

---

## 10. Limitações Reais

- O Push 2 (commit `b0ac3d1` na branch `main`) permanece preservado e não foi avaliado ou auditado nesta branch corretiva do Push 1.
