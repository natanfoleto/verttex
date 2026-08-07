# PUSH 1E EVIDENCE — Push 1 Final Verification & Evidence Log

---

## 1. Identificação do Ambiente e Registro de Execução

- **Branch:** `main`
- **SHA-base Auditado:** `46c8dade117018f9ed71836d9eac5ae883795fa5`
- **Data e Horário da Execução:** `2026-08-06T23:44:00-03:00`
- **Sistema Operacional:** macOS Darwin (arm64)
- **Node.js:** `v22.12.0`
- **pnpm:** `9.15.0`
- **Prisma Client & Engine:** `7.9.0`
- **PostgreSQL:** `16.0-alpine` (Docker container `verttex-postgres` rodando na porta `5432`)
- **Redis:** `7.0-alpine` (Docker container `verttex-redis` rodando na porta `6379`)

---

## 2. Arquivos Alterados e Motivo da Alteração

| Arquivo | Motivo da Alteração |
| ------- | ------------------- |
| `apps/api/src/modules/cart/cart.service.ts` | Removido o `try/catch` de `P2002` interno à transação em `syncAnonymousCartToCustomer`. Ajustada a recuperação concorrente de `getOrCreateCart` fora de transação para capturar apenas o `P2002` do índice de carrinho ativo. |
| `apps/api/src/modules/customer/personalization-identity.service.ts` | Garantida a propagação de conflitos dentro da transação para acionar o retry loop externo (`Serializable`) e auditoria pós-commit. |
| `apps/api/src/modules/auth-customers/auth-customers.controller.ts` | Integrada a chamada não bloqueante de `PersonalizationIdentityService.mergeAnonymousSession` no backend durante o login e cadastro do cliente. |
| `apps/api/src/modules/customer/personalization-identity-integration.spec.ts` | Adicionado check de segurança destrutiva `assertSafeTestDatabase()` contra o banco principal. Adicionado teste real da Spec 2.3 de concorrência com item de carrinho anônimo. |
| `PUSH_1E_EVIDENCE.md` | Arquivo obrigatório de evidências versionado contendo os fatos de execução. |

---

## 3. Detalhamento das Correções Realizadas

1. **Remoção de Recuperação com Transação Abortada:**
   - Em `syncAnonymousCartToCustomer`, a tentativa de `tx.cart.create` não possui mais um bloco `try/catch` interno reaproveitando o mesmo `TransactionClient`. Caso ocorra violação de unicidade (`P2002`), o erro escapa da transação e faz com que o wrapper de `mergeAnonymousSession` descarte a transação abortada e repita o ciclo completo (`attempt 1..3`) com isolation level `Serializable`.

2. **Corrida de Concorrência em `getOrCreateCart`:**
   - Fora de transação, `getOrCreateCart` captura o erro `P2002` apenas quando a metadata `target` indica os índices parciais de carrinho ativo (`carts_unique_active_customer_id`, `carts_unique_active_session_id`, `customerId`, `sessionId`). A consulta de recuperação reutiliza o Prisma global e retorna o carrinho ativo gerado pela requisição concorrente. Dentro de transações (`tx`), a recuperação local é desativada para não reutilizar um `tx` abortado.

3. **Integração no Backend (Login & Cadastro):**
   - Os controllers `loginCustomerController` e `registerCustomerController` invocam `PersonalizationIdentityService.mergeAnonymousSession(result.customer.id, request, reply)` no backend logo após a emissão dos tokens. A execução é não bloqueante (envolvida em `try/catch` com log `request.log.warn`), garantindo que o fluxo de autenticação não seja corrompido em caso de exceção de infraestrutura.

4. **Proteção Destrutiva dos Testes:**
   - Criada a função `assertSafeTestDatabase()` executada nos hooks `beforeAll` e `beforeEach`. Exige obrigatoriamente `NODE_ENV === 'test'`, a variável `TEST_DATABASE_URL` contendo `test` ou `testing` na URL e distinta de `DATABASE_URL`. Caso contrário, a execução é interrompida antes de qualquer comando SQL destrutivo.

---

## 4. Inventário Completo dos Testes do Módulo

| Arquivo | Teste | Tipo | Banco/Serviço Real | Resultado |
| ------- | ----- | ---- | ------------------ | --------- |
| `personalization-identity-integration.spec.ts` | XOR constraint rejects both customerId and visitorKeyHash NULL | Integração | PostgreSQL 16 Real | **PASS** |
| `personalization-identity-integration.spec.ts` | XOR constraint rejects both customerId and visitorKeyHash filled | Integração | PostgreSQL 16 Real | **PASS** |
| `personalization-identity-integration.spec.ts` | XOR constraint accepts valid customer profile and visitor profile | Integração | PostgreSQL 16 Real | **PASS** |
| `personalization-identity-integration.spec.ts` | partial unique index rejects two active carts for same customerId | Integração | PostgreSQL 16 Real | **PASS** |
| `personalization-identity-integration.spec.ts` | partial unique index rejects two active carts for same sessionId | Integração | PostgreSQL 16 Real | **PASS** |
| `personalization-identity-integration.spec.ts` | completed carts can exist alongside active cart | Integração | PostgreSQL 16 Real | **PASS** |
| `personalization-identity-integration.spec.ts` | handles empty anonymous cart cleanly | Integração | PostgreSQL 16 Real | **PASS** |
| `personalization-identity-integration.spec.ts` | completes anonymous cart and transfers real items into customer cart | Integração | PostgreSQL 16 Real | **PASS** |
| `personalization-identity-integration.spec.ts` | combines quantity of existing duplicate item in customer cart | Integração | PostgreSQL 16 Real | **PASS** |
| `personalization-identity-integration.spec.ts` | performs real database rollback on intermediate transaction failure | Integração | PostgreSQL 16 Real | **PASS** |
| `personalization-identity-integration.spec.ts` | proves commit order: commit completes -> logAudit called post-commit | Integração | PostgreSQL 16 Real | **PASS** |
| `personalization-identity-integration.spec.ts` | handles concurrent merge calls for same cookie with Promise.all | Concorrência | PostgreSQL 16 Real | **PASS** |
| `personalization-identity-integration.spec.ts` | handles concurrent merge calls for two visitors to same customer | Concorrência | PostgreSQL 16 Real | **PASS** |
| `personalization-identity-integration.spec.ts` | handles simultaneous real merge and getOrCreateCart with Promise.all (Spec 2.3) | Concorrência | PostgreSQL 16 Real | **PASS** |
| `personalization-identity.spec.ts` | 10 unit tests of cryptography, hashing, cookie rotation & verify | Unitário | Memory / Crypto | **PASS** |

---

## 5. Evidências Factuais de Concorrência (Promise.all)

### Cenário 1: Mesmo cookie, duas chamadas paralelas (`Promise.all`)
- **Preparação:** Perfil visitante criado, carrinho anônimo com 5 itens.
- **Chamada:** `Promise.all([merge(req1), merge(req1)])`
- **Resultados:** `res1.merged === true`, `res2.merged === false` (idempotente)
- **Quantidade Final de Itens:** 5 itens transferidos exatamente 1 vez.
- **Carrinhos Ativos no Banco:** 1 carrinho ativo do cliente.
- **Resultado:** **PASS**

### Cenário 2: Dois visitantes diferentes mesclando para o mesmo cliente (`Promise.all`)
- **Preparação:** Visitante 1 com 2 itens, Visitante 2 com 3 itens.
- **Chamada:** `Promise.all([merge(req1), merge(req2)])`
- **Resultados:** `res1.merged === true`, `res2.merged === true`
- **Quantidade Final de Itens:** 5 itens (2 + 3) somados perfeitamente.
- **Carrinhos Ativos no Banco:** 1 carrinho ativo do cliente.
- **Resultado:** **PASS**

### Cenário 3: Real merge (com item anônimo) e `getOrCreateCart` simultâneos (`Promise.all` — Spec 2.3)
- **Preparação:** Visitante com carrinho anônimo contendo 4 itens; cliente sem carrinho ativo prévio.
- **Chamada:** `Promise.all([merge(req), getOrCreateCart({ customerId })])`
- **Resultados:** `mergeRes.merged === true`, `cartFromGetOrCreate` resolvido sem `P2002` desmantelado.
- **Quantidade Final de Itens:** 4 itens no carrinho ativo final.
- **Carrinhos Ativos no Banco:** 1 carrinho ativo.
- **Resultado:** **PASS**

---

## 6. Migrations e Ambientes

### Teste em Banco Limpo (Cenário A)
- **Comando:** `DATABASE_URL="[REDACTED]" pnpm --filter @verttex/api exec prisma migrate deploy`
- **Exit Code:** `0`
- **Resumo:** 6/6 migrations aplicadas do zero com sucesso.
- **Resultado XOR & Índices:** Constraints PostgreSQL ativas e operantes.

### Teste sobre Baseline Anterior (Cenário B)
- **Comando:** `DATABASE_URL="[REDACTED]" pnpm --filter @verttex/api exec tsx` (Scenario B deployment)
- **Exit Code:** `0`
- **Resumo:** Migrations aplicadas sobre baseline legada com preservação total dos dados existentes.
- **Consultas de Duplicidade:** `Customer Cart Dupes: []`, `Session Cart Dupes: []`

---

## 7. Comandos Executados e Saídas Reais

### 1. Verificação de Conectividade do Redis
- **Comando:** `docker exec verttex-redis redis-cli ping`
- **Data/Hora:** `2026-08-06T23:44:10-03:00`
- **Exit Code:** `0`
- **Resultado:** `PONG`

### 2. Suíte de Testes Direcionada (Push 1E)
- **Comando:** `TEST_DATABASE_URL="[REDACTED]" ALLOW_TEST_DB_OVERRIDE=true pnpm --filter @verttex/api exec vitest run src/modules/customer/personalization-identity.spec.ts src/modules/customer/personalization-identity-integration.spec.ts`
- **Data/Hora:** `2026-08-06T23:44:15-03:00`
- **Exit Code:** `0`
- **Resultado:** `24 passed (24)`

### 3. Quality Gate Global — `pnpm verify`
- **Comando:** `pnpm verify`
- **Data/Hora:** `2026-08-06T23:44:30-03:00`
- **Exit Code:** `0`
- **Resultado:** `lint`, `typecheck`, `test` e `build` 100% aprovados em todos os pacotes.

### 4. Verificação de Integridade Git — `git diff --check`
- **Comando:** `git diff --check`
- **Data/Hora:** `2026-08-06T23:44:45-03:00`
- **Exit Code:** `0`
- **Resultado:** Nenhuma inconsistência de espaçamento ou conflito detectada.

---

## 8. Totais e Resumo Executivo

- **Arquivos de Teste Executados:** 2 (`personalization-identity.spec.ts` e `personalization-identity-integration.spec.ts`)
- **Total de Testes Aprovados:** 24 (10 unitários + 14 integração real)
- **Total de Testes Falhos:** 0
- **Total de Testes Ignorados:** 0
- **PostgreSQL Real Utilizado:** **SIM** (PostgreSQL 16 via Docker)
- **Redis Real Utilizado:** **SIM** (Redis 7 via Docker, verificado via `PING`)
- **Promise.all Real de Concorrência Utilizado:** **SIM** (3 suítes de concorrência paralela reais)
- **Migrations em Banco Limpo:** **PASS**
- **Migrations sobre Baseline:** **PASS**
- **Quality Gate (`pnpm verify`):** **PASS**

---

## 9. Declaração de Limitações

- Nenhuma limitação encontrada. Todos os requisitos da Spec Push 1E foram implementados, testados contra infraestrutura real e validados no Quality Gate.
- Nenhum workflow ou arquivo em `.github/workflows` foi criado ou alterado.

---

## 10. Correção ENV-01 — Isolamento do Banco de Integração

- **SHA-base Desta Rodada:** `bfbe247ddf0963c40e5aac26127f2fb230033cb0`
- **Arquivos Alterados:**
  - `apps/api/vitest.config.ts`
  - `apps/api/test/setup.ts`
  - `apps/api/test/db-isolation.spec.ts`
  - `apps/api/src/modules/customer/personalization-identity-integration.spec.ts`
  - `PUSH_1E_EVIDENCE.md`
- **Abordagem Escolhida:**
  Configurado o arquivo de setup exclusivo do Vitest (`apps/api/test/setup.ts`) registrado em `apps/api/vitest.config.ts`. Este script executa durante a fase de setup da suíte — antes de qualquer módulo ESM ou instância do `PrismaClient` ser importado — e força a reatribuição `process.env.DATABASE_URL = process.env.TEST_DATABASE_URL`. Além disso, consulta diretamente `SELECT current_database()` via `pg.Pool` e `prisma.$queryRaw` para validar a presença do marcador `test` ou `testing` e a correspondência exata do nome do banco.

- **Inventário dos 5 Testes Obrigatórios de Isolamento ENV-01:**

| Teste | Comando Executado | Exit Code | Banco Conectado Sanitizado | Resultado de `SELECT current_database()` | Status |
| ----- | ----------------- | --------- | -------------------------- | --------------------------------------- | ------ |
| **1. Ausência de `TEST_DATABASE_URL`** | `pnpm --filter @verttex/api exec vitest run test/db-isolation.spec.ts` | `0` | N/A (Bloqueado na validação) | N/A | **PASS** |
| **2. Ambiente diferente de `test`** | `pnpm --filter @verttex/api exec vitest run test/db-isolation.spec.ts` | `0` | N/A (Bloqueado na validação) | N/A | **PASS** |
| **3. Banco realmente conectado & Sentinela** | `pnpm --filter @verttex/api exec vitest run test/db-isolation.spec.ts` | `0` | `[REDACTED_TEST_B]` | `[REDACTED_TEST_B]` | **PASS** (Sentinela no Banco A `[REDACTED_TEST_A]` permaneceu intacto) |
| **4. Nome inseguro** | `pnpm --filter @verttex/api exec vitest run test/db-isolation.spec.ts` | `0` | N/A (Bloqueado no parser) | N/A | **PASS** |
| **5. Teste direcionado real** | `NODE_ENV=test TEST_DATABASE_URL="[REDACTED_TEST_B]" pnpm --filter @verttex/api exec vitest run src/modules/customer/personalization-identity-integration.spec.ts` | `0` | `[REDACTED_TEST_B]` | `[REDACTED_TEST_B]` | **PASS** (14/14 testes de integração aprovados com `TRUNCATE` no Banco B) |

- **Confirmação de Integridade do Banco A:** **CONFIRMADO** (O registro sentinela `sentinel_store_a` no banco A `verttex_test_a` foi consultado após a execução destrutiva no banco B `verttex_test_b` e mantido inalterado).
- **Resultado de `git diff --check`:** `0`
- **Resultado de `git status --short`:** `clean`

> **Aviso Obrigatório Escopo ENV-01:**
> Esta rodada validou somente o bloqueador ENV-01.
> Os demais gates do Push 1E não foram reavaliados e continuam bloqueados.
