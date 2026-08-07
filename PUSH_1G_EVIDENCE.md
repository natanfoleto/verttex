# EVIDÊNCIAS DE RECERTIFICAÇÃO DEFINITIVA — PUSH 1 — ROADMAP 028

---

## 1. Identificação da Branch e Baselines

- **Branch Corretiva Isolada:** `fix/roadmap-028-push1-final`
- **SHA-base Exclusivo:** `2954d292fa36e42a07d9e2905bbb332e9396bbbe`
- **Confirmação de Exclusão do Push 2:** Commit `b0ac3d1ead14609b8a9552987043a16ad4e4c2f0` NÃO é ancestral da branch (`git merge-base --is-ancestor` retornou código de saída diferente de 0).
- **Ambiente de Execução:**
  - Node.js: `v22.12.0`
  - pnpm: `9.15.1`
  - PostgreSQL Local Real: `16.14` (Host: `localhost:5432`, Banco: `verttex_db`)
  - Redis Local Real: `7.0` (Host: `localhost:6379`)

---

## 2. Inventário dos Bancos e Auditoria Pré/Pós-Reset

- **Classificação:** Banco local de desenvolvimento/teste exclusivo do projeto VERTTEX (`verttex_db`).
- **Autorização de Reset:** Concedida formalmente pelo responsável do projeto para reaplicação integral das migrations.
- **Auditoria de Checksums pré-reset e pós-reset:**

| Migration | Checksum Arquivo | Checksum Banco | Estado |
|---|---|---|---|
| `20260731005521_initial_0000` | `a97feb2abf92bd9b0cebdebfa72284d50e1fbc5e7da2825b8352d29ed1187dee` | `a97feb2abf92bd9b0cebdebfa72284d50e1fbc5e7da2825b8352d29ed1187dee` | IGUAL |
| `20260731012616_initial_0000` | `9b3beadbf915c6110332899361bfe905bacc842c07fac59adbf446aa98eb01be` | `9b3beadbf915c6110332899361bfe905bacc842c07fac59adbf446aa98eb01be` | IGUAL |
| `20260804212000_product_discovery_search_index` | `19714362c86892ab21850a2dceefe89cdc0afe86cff1c7b1a1d6cd9d9683aa0a` | `19714362c86892ab21850a2dceefe89cdc0afe86cff1c7b1a1d6cd9d9683aa0a` | IGUAL |
| `20260806203000_add_personalization_profiles` | `7975c2a00f0498cb67f872a1cfc4115e8e04d075e8c9774184ca9aef25dc070c` | `7975c2a00f0498cb67f872a1cfc4115e8e04d075e8c9774184ca9aef25dc070c` | IGUAL |
| `20260806213000_add_personalization_profile_xor_check` | `c9114080ff438b2d79d0f7bb03ecb180e81baf43d4818dc8a143bd83cb597552` | `c9114080ff438b2d79d0f7bb03ecb180e81baf43d4818dc8a143bd83cb597552` | IGUAL |
| `20260806214000_add_unique_active_cart_indexes` | `1a7f92e146d50d961c113c6145c1325a40ba12e57c5c26896384de873682539c` | `1a7f92e146d50d961c113c6145c1325a40ba12e57c5c26896384de873682539c` | IGUAL |
| `20260807050000_add_carts_xor_owner_check` | `ddd7f60882a6874f5ffb4724df70b3e366518e046904e21b2b2d26082f6a645d` | `ddd7f60882a6874f5ffb4724df70b3e366518e046904e21b2b2d26082f6a645d` | IGUAL |

- **Quantidade de Migrations:** 7 aplicadas em ordem sequencial.
- **Migrations falhas/pendentes:** 0.
- **Resultado do `prisma migrate status`:** `Database schema is up to date!`

---

## 3. Paridade Prisma, Migrations e PostgreSQL (Zero Drift)

- **Comando `prisma migrate diff`:** `No difference detected.` (entre o banco reconstruído pelas migrations e `schema.prisma`).
- **Allowlist de Diferenças SQL-Only Intencionais:**
  1. `personalization_profiles_xor_identity_check` (CHECK Constraint em `personalization_profiles` garantindo `customerId` XOR `visitorKeyHash`)
  2. `carts_xor_owner_check` (CHECK Constraint em `carts` garantindo `customerId` XOR `sessionId`)
  3. `carts_unique_active_customer_id` (Índice Único Parcial para carrinho ativo por cliente)
  4. `carts_unique_active_session_id` (Índice Único Parcial para carrinho ativo por visitante anônimo)
  5. Projeção `product_search_documents` e seus índices SQL do Product Discovery.
- **Confirmação de Drift Não Intencional:** ZERO.

---

## 4. Testes Reais do `db:clean` e Proteção de Conexão

- **Substituição de Mocks/Testes Tautológicos:** O utilitário `apps/api/prisma/clean.ts` foi refatorado para eliminar completamente `$queryRaw` e `$executeRawUnsafe` em favor de deleções ordenadas via Prisma `deleteMany()` respeitando a hierarquia de FKs.
- **Auto-execução via CLI:** `cleanDatabase()` só auto-executa se chamado diretamente como CLI script (`process.argv[1]` terminando em `clean.ts`/`clean.js`), permitindo importação limpa em specs.
- **Resultados dos Testes (`test/db-isolation.spec.ts` — 20/20 Aprovados):**
  1. `assertSafeLocalDatabaseUrl` bloqueia URLs remotas/públicas/inválidas antes de qualquer conexão ou I/O.
  2. `cleanDatabase()` invoca o guard antes de instanciar ou conectar o Prisma.
  3. `cleanDatabase()` desconecta o Prisma no bloco `finally` e preserva o erro original.
  4. Nenhuma credencial ou URL completa é exposta na mensagem de erro do guard.
  5. `cleanDatabase()` em banco descartável local remove os dados sem alterar schema ou a tabela `_prisma_migrations`.

---

## 5. Testes de Integração com PostgreSQL e Redis Reais

Suite de testes: `src/modules/customer/personalization-identity-integration.spec.ts` (19/19 Aprovados em 927ms).

### Constraint XOR e Índices
- Rejeição no PostgreSQL de carrinho sem proprietário (ambos `NULL`).
- Rejeição no PostgreSQL de carrinho com dois proprietários (ambos preenchidos).
- Rejeição de múltiplos carrinhos ativos para o mesmo `customerId` pelo índice único parcial `carts_unique_active_customer_id`.
- Rejeição de múltiplos carrinhos ativos para o mesmo `sessionId` pelo índice único parcial `carts_unique_active_session_id`.
- Aceitação de carrinhos encerrados (`completed`) coexistindo com carrinho ativo.

### Login, Cadastro, Merge, Rollback e Concorrência por Endpoints Reais
- **Login HTTP (`POST /auth/customers/login`):** Visitante com cookie `vt_visitor` assinado e itens no carrinho anônimo realiza login pelo endpoint real Fastify (`app.inject()`); sessão autenticada é criada e os itens são fundidos com o carrinho ativo do cliente.
- **Cadastro HTTP (`POST /auth/customers/register`):** Visitante com carrinho anônimo se cadastra pelo endpoint HTTP real e tem seus itens transferidos atomicamente para seu novo carrinho.
- **Merge Transacional & Idempotência:** Chamadas simultâneas via `Promise.all` executam merge sem duplicar quantidades ou criar estado inconsistente.
- **Rollback Transacional:** Falhas simuladas no meio do processo de merge desfazem alterações em `personalization_profiles` e mantêm o carrinho anônimo ativo em estado consistente.

---

## 6. Três Execuções Consecutivas da Suíte API

| Execução | Comando | Arquivos / Testes | Resultado | Exit Code |
|---|---|---|---|---|
| Run 1 | `pnpm --filter api test -- --run` | 33 spec files / 321 tests | PASSED | 0 |
| Run 2 | `pnpm --filter api test -- --run` | 33 spec files / 321 tests | PASSED | 0 |
| Run 3 | `pnpm --filter api test -- --run` | 33 spec files / 321 tests | PASSED | 0 |

---

## 7. Quality Gates e Audit de Diferenças

- **`pnpm verify`:** Aprovado (6/6 tarefas — lint, typecheck, unit tests, integration tests, build).
- **`git diff --check`:** Limpo (zero espaços/tabulações soltas ou conflitos).
- **`git diff --name-only 2954d292fa36e42a07d9e2905bbb332e9396bbbe`:**
  - `.ai/domain/PRODUCT_DISCOVERY_SEARCH_EXPERIENCE.md`
  - `.ai/frontend/FRONTEND_UI.md`
  - `.ai/roadmaps/INDEX.md`
  - `.ai/roadmaps/active/028-home-personalization.md`
  - `.ai/roadmaps/completed/027-product-discovery-engine.md`
  - `.ai/roadmaps/completed/029-search-experience.md`
  - `PUSH_1F_EVIDENCE.md`
  - `PUSH_1G_EVIDENCE.md`
  - `apps/api/prisma/clean.ts`
  - `apps/api/test/db-isolation.spec.ts`
- **Alterações no Workflows do GitHub (`.github/workflows`):** NENHUMA (resultado do diff vazio).
- **Inclusão de arquivos funcionais do Push 2 (`catalog.service.ts`, `discovery.service.ts`, `discovery-guards-quality.spec.ts`):** NENHUMA.

---

## 8. Limitações Reais e Considerações

- O Push 2 (implementado no commit `b0ac3d1` na branch `main`) não foi auditado, alterado ou avaliado nesta branch corretiva `fix/roadmap-028-push1-final`.
- Todos os testes de integração foram executados contra instâncias locais reais de PostgreSQL 16.14 e Redis 7.0.
