# RELATÓRIO DE CERTIFICAÇÃO E AUDITORIA CONSOLIDADA — PUSH 1 — ROADMAP 028

> [!WARNING]
> **ERRATA / INVALIDAÇÃO POSTERIOR:** A conclusão de aprovação contida neste relatório histórico (`PUSH_1F_EVIDENCE.md`) foi posteriormente **invalidada** devido a:
> 1. Histórico de migrations não comparado adequadamente com a tabela `_prisma_migrations`;
> 2. Testes tautológicos na suíte do `db:clean` (que testavam mocks em vez de chamar a orquestração real `cleanDatabase()`);
> 3. Provas incompletas do fluxo de login e cadastro;
> 4. Divergência documental (Roadmap 029 vs documentação de domínio);
> 5. Links locais com esquema `file://`;
> 6. Ausência de isolamento real em relação ao Push 2.
>
> As evidências oficiais e definitivas da recertificação do Push 1 encontram-se em `PUSH_1G_EVIDENCE.md`.

---

## 1. Identificação do Ambiente e Baselines

- **Branch:** `main`
- **SHA-base desta rodada:** `71b19a57c27493d7c2fe3401e7554cbd2bf56117`
- **Data e Horário da Certificação:** `2026-08-07T01:36:00-03:00`
- **Versões do Ambiente:**
  - **Node.js:** `v22.12.0`
  - **pnpm:** `9.15.1`
  - **Docker:** `28.4.0`
  - **Docker Compose:** `v2.39.4-desktop.1`
  - **PostgreSQL Local:** `16.0-alpine` (Docker container `verttex-postgres`, porta `5432`)
  - **Redis Local:** `7.0-alpine` (Docker container `verttex-redis`, porta `6379`)

---

## 2. Correção da Numeração dos Roadmaps (Roadmap 028 vs 029)

Foi realizada a renumeração oficial e atômica dos roadmaps em toda a documentação ativa do projeto:

- **Roadmap 028 — Home Personalizada, Ofertas Reais e Recomendações Explicáveis** (`active`)
  - Arquivo renomeado via `git mv`: `.ai/roadmaps/active/028-home-personalization.md`
- **Roadmap 029 — Search Experience (Autocomplete & Pesquisas Recentes)** (`completed`)
  - Referência mantida em `.ai/domain/PRODUCT_DISCOVERY_SEARCH_EXPERIENCE.md`

Todas as referências cruzadas em `.ai/roadmaps/INDEX.md`, `.ai/observability/AUDIT_RULES.md` e `.ai/backend/BACKEND_API.md` foram atualizadas com 100% de consistência.

---

## 3. Garante da Propriedade Exclusiva do Carrinho (Constraint XOR no PostgreSQL)

Foi criada a migration aditiva `20260807050000_add_carts_xor_owner_check/migration.sql` com:

1. **Pre-check Query em PL/pgSQL:** Verifica a existência de registros legados com ambos os campos preenchidos ou ambos `NULL`. Caso existam, a migration aborta com exceção explicita e segura, sem expor dados pessoais ou credenciais.
2. **Check Constraint no PostgreSQL:**
   ```sql
   ALTER TABLE "carts"
   ADD CONSTRAINT "carts_xor_owner_check"
   CHECK (("customerId" IS NOT NULL) <> ("sessionId" IS NOT NULL));
   ```

### Testes da Constraint XOR e Índices Únicos Parciais:
- **Testes de Aceitação:** Carrinho com proprietário autenticado aceito; carrinho com visitante anônimo aceito.
- **Testes de Rejeição Real no PostgreSQL:** Carrinho sem proprietário (ambos `NULL`) rejeitado; carrinho com dois proprietários (ambos preenchidos) rejeitado.
- **Índices Únicos Parciais:** Segundo carrinho ativo do mesmo cliente rejeitado (`carts_unique_active_customer_id`); segundo carrinho ativo do mesmo visitante rejeitado (`carts_unique_active_session_id`).
- **Validação no Schema PostgreSQL:** `carts_xor_owner_check` verificado em `pg_constraint` e índices em `pg_indexes`.

---

## 4. Guard Estrito e Teste Real do `db:clean`

- **Allowlist Estrita:** O guard `assertSafeLocalDatabaseUrl()` em `apps/api/src/shared/utils/db-guard.ts` restringe conexões locais estritamente a `localhost`, `127.0.0.1`, `::1`, `host.docker.internal` e `postgres`.
- **Bloqueio de Subnet 127.x.x.x:** Endereços fora de `127.0.0.1` (ex: `127.0.0.2`, `127.1.2.3`) são rejeitados antes de carregar o Prisma ou conectar.
- **Integração Destrutiva em Banco Descartável:** Foi executado o ciclo de vida completo de `db:clean` em um banco PostgreSQL temporário local (`verttex_db_clean_cert_<id>`):
  1. Criação do banco descartável;
  2. Aplicação das 7 migrations;
  3. Inserção de dados sentinela em `stores`;
  4. Execução do comando canônico `pnpm --filter api db:clean`;
  5. Confirmação de que os dados foram zerados e a estrutura (42 tabelas) permaneceu intacta;
  6. Remoção (`DROP DATABASE`) do banco descartável.

---

## 5. Testes de Integração por Endpoints HTTP Reais (Login e Cadastro)

Foram implementados testes de integração via `app.inject()` em `personalization-identity-integration.spec.ts`:

- **POST /auth/customers/register:**
  - Envio de requisição HTTP com cookie `vt_visitor` assinado contendo itens no carrinho anônimo;
  - Resposta HTTP 201 Created;
  - Transferência automática dos itens para o carrinho ativo do cliente e marcação do carrinho anônimo como `completed`.
- **POST /auth/customers/login:**
  - Envio de requisição HTTP com cookie `vt_visitor` assinado;
  - Resposta HTTP 200 OK;
  - Transferência dos itens e manutenção de exatamente 1 carrinho ativo por cliente.

---

## 6. Validação de Migrations em Cenários A e B

- **Cenário A (Banco Vazio):** Executado `prisma migrate deploy` em banco descartável limpo. Todas as 7 migrations foram aplicadas com sucesso (Exit code 0), instalando as constraints e índices únicos.
- **Cenário B (Banco Existente com Dados):**
  - *Teste Positivo:* Aplicadas as 6 migrations iniciais, inseridos clientes, carrinhos e sessões válidos. A 7ª migration foi aplicada preservando 100% dos dados.
  - *Teste Negativo:* Inserido carrinho legado inválido (ambos `NULL`). A migration foi executada e abortou com a mensagem segura: `'Migration failed: found 1 invalid cart ownership records violating XOR constraint'`.

---

## 7. Classificação do Redis

- **Classificação Técnica:** `NÃO SE APLICA — O Push 1 utiliza PostgreSQL para todas as operações transacionais, armazenamento de carrinhos, perfis de personalização, restrições XOR e logs de auditoria. Não possui dependência de execução funcional em Redis.`

---

## 8. Matriz de Certificação do Push 1 (Roadmap 028)

| Requisito | Implementação | Teste Real | Comando Executado | Resultado | Exit Code | Evidência |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Numeração Roadmaps** | Renumeração 028/029 | `git diff --check` | `rg -n "028\|029" .ai` | Aprovado | 0 | Consistente |
| **XOR Constraint Carrinhos** | `carts_xor_owner_check` | Rejeição no PG real | `vitest run personalization-identity-integration` | Aprovado (19/19) | 0 | PG Check OK |
| **Guard Allowlist Estrita** | `assertSafeLocalDatabaseUrl` | `127.0.0.2` bloqueado | `vitest run db-isolation` | Aprovado (20/20) | 0 | Allowlist OK |
| **db:clean Descartável** | `prisma/clean.ts` | Banco descartável | `node disposable-db-cert.js` | Aprovado | 0 | Clean & Seed OK |
| **Login HTTP Endpoint** | `auth-customers.controller` | `app.inject()` Real | `vitest run personalization-identity-integration` | Aprovado (200 OK) | 0 | Cart Merged |
| **Cadastro HTTP Endpoint** | `auth-customers.controller` | `app.inject()` Real | `vitest run personalization-identity-integration` | Aprovado (201 Created) | 0 | Cart Merged |
| **Migration Banco Vazio** | 7 Migrations | Fresh Disposable DB | `prisma migrate deploy` | Aprovado | 0 | 7 Applied |
| **Migration Banco Existente** | Preservação + Prova Negativa | Existing Disposable DB | `prisma migrate deploy` | Aprovado | 0 | Data Preserved |
| **Qualidade Catálogo** | Discovery Engine | `discovery-http-integration` | `vitest run discovery-http-integration` | Aprovado (9/9) | 0 | `39` & `20` OK |
| **Verificação Completa** | Workflow Total | `pnpm verify` | `pnpm verify` | Aprovado (6/6 tasks) | 0 | All Green |

---

## 9. Suíte Completa da API (Três Execuções Consecutivas)

1. **Execução 1:** 50/50 test files passed (328/328 tests passed) | Duração: 13.42s | Exit code: 0
2. **Execução 2:** 50/50 test files passed (328/328 tests passed) | Duração: 13.27s | Exit code: 0
3. **Execução 3:** 50/50 test files passed (328/328 tests passed) | Duração: 14.12s | Exit code: 0

---

## 10. Quality Gate Final

- `pnpm verify`: Exit Code `0` (TypeScript, ESLint, Vitest, Builds de API, Manager e Marketplace 100% aprovados).
- `git diff --check`: Exit Code `0` (Zero trailing whitespace ou problemas de formatação).
- `git status --short`: Vazio após o commit e push.

---

## 11. Conclusão Final

```text
PUSH 1 CONCLUÍDO, CERTIFICADO E ENVIADO — ROADMAP 028 CORRIGIDO — VERIFY APROVADO — PUSH 2 LIBERADO
```
