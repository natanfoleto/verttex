# EVIDÊNCIAS DE RECERTIFICAÇÃO DEFINITIVA DA RODADA J — PUSH 1 — ROADMAP 028

---

## 1. Identificação do Ambiente e Baselines

- **Branch Corretiva Isolada:** `fix/roadmap-028-push1-final`
- **SHA-base da Rodada J:** `f4149c2e47162c6bcc7555d6788b7c35e4a479b2`
- **Confirmação de Exclusão do Push 2:** Commit `b0ac3d1ead14609b8a9552987043a16ad4e4c2f0` NÃO é ancestral da branch (`git merge-base --is-ancestor b0ac3d1 HEAD` retornou exit code `1`).
- **Ambiente de Execução Local:**
  - Node.js: `v22.12.0`
  - pnpm: `9.15.1`
  - PostgreSQL Local Real: `16.14` (Host: `localhost:5432`, Banco Principal: `verttex_db`, Banco Replay: `verttex_replay_j`)
  - Redis Local Real: `7.0` (Host: `localhost:6379`)

---

## 2. Erratas das Certificações Anteriores

> [!CAUTION]
> **ERRATA DA RODADA I (INVALIDADA PELA RODADA J):** A certificação e a conclusão do relatório `PUSH_1I_EVIDENCE.md` foram oficialmente **invalidadas** pelos seguintes motivos objetivos:
> 1. Faltavam spies explícitos no teste da URL insegura;
> 2. Mensagens arbitrárias de erros ainda podiam ser impressas no CLI;
> 3. O inventário da Rodada I estava incorreto;
> 4. A allowlist SQL-only estava incompleta;
> 5. Faltavam comandos, saídas, horários e exit codes detalhados;
> 6. As exceções das buscas Markdown não foram registradas nominalmente;
> 7. O uso de Redis foi declarado sem prova funcional.

---

## 3. Inventário Exato dos Arquivos da Rodada J

### Diff contra o SHA-base `f4149c2e47162c6bcc7555d6788b7c35e4a479b2`:

```text
M	.ai/roadmaps/active/028-home-personalization.md
M	PUSH_1I_EVIDENCE.md
M	apps/api/prisma/clean.ts
M	apps/api/test/db-isolation.spec.ts
```

### Arquivos Criados:
- `PUSH_1J_EVIDENCE.md`

### Arquivos Alterados:
- `.ai/roadmaps/active/028-home-personalization.md`
- `PUSH_1I_EVIDENCE.md`
- `apps/api/prisma/clean.ts`
- `apps/api/test/db-isolation.spec.ts`

### Arquivos Removidos:
- Nenhum.

---

## 4. Allowlist SQL-Only Completa

Tabela de objetos PostgreSQL criados via SQL bruto em migrations e não representados integralmente no `schema.prisma`:

| Nome schema-qualified | Tipo | Migration Criadora | Representação no Prisma | Motivo | Prova no PostgreSQL (`pg_constraint` / `pg_indexes`) | Resultado no `migrate diff` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `public.personalization_profiles_xor_identity_check` | CHECK Constraint | `20260806213000_add_personalization_profile_xor_check` | Nenhuma (Prisma Schema não suporta CHECK constraints nativamente) | Garante integridade física XOR na coluna: `(customerId IS NOT NULL AND visitorKeyHash IS NULL) OR (customerId IS NULL AND visitorKeyHash IS NOT NULL)` | Confirmado em `pg_constraint` (`contype = 'c'`) | Omitido no diff pelo engine do Prisma |
| `public.carts_xor_owner_check` | CHECK Constraint | `20260807050000_add_carts_xor_owner_check` | Nenhuma (Prisma Schema não suporta CHECK constraints nativamente) | Garante propriedade exclusiva do carrinho: `(customerId IS NOT NULL) <> (sessionId IS NOT NULL)` | Confirmado em `pg_constraint` (`contype = 'c'`) | Omitido no diff pelo engine do Prisma |
| `public.carts_unique_active_customer_id` | Partial Unique Index (B-Tree) | `20260806214000_add_unique_active_cart_indexes` | Nenhuma (Prisma Schema não suporta cláusula `WHERE` em índices) | Garante no máximo 1 carrinho com `status = 'active'` por cliente (`customerId`) | Confirmado em `pg_indexes` (`WHERE ((status = 'active') AND ("customerId" IS NOT NULL))`) | Omitido no diff pelo engine do Prisma |
| `public.carts_unique_active_session_id` | Partial Unique Index (B-Tree) | `20260806214000_add_unique_active_cart_indexes` | Nenhuma (Prisma Schema não suporta cláusula `WHERE` em índices) | Garante no máximo 1 carrinho com `status = 'active'` por visitante anônimo (`sessionId`) | Confirmado em `pg_indexes` (`WHERE ((status = 'active') AND ("sessionId" IS NOT NULL))`) | Omitido no diff pelo engine do Prisma |
| `public.product_search_documents_productId_idx` | Non-unique Index (B-Tree) | `20260804212000_product_discovery_search_index` | Parcial (`model ProductSearchDocument` possui `@@unique([productId])`, sem `@@index([productId])`) | Otimiza pesquisas e consultas diretas por `productId` na projeção de busca do Product Discovery Engine | Confirmado em `pg_indexes` (`USING btree ("productId")`) | Exibido como `[+] Added index on columns (productId)` no diff schema -> banco |

---

## 5. Migrations, Checksums SHA-256 e Replay em Banco Descartável

### Banco Descartável Utilizado: `verttex_replay_j`

1. **Replay Completo das 7 Migrations:**
   - Comando: `DATABASE_URL="postgresql://verttex:verttex_dev_password@localhost:5432/verttex_replay_j?schema=public" pnpm --filter @verttex/api exec prisma migrate deploy`
   - Exit Code: `0`
   - Saída: `7 migrations found in prisma/migrations. All migrations have been successfully applied.`

2. **Comparação dos Checksums SHA-256 (Arquivo vs Tabela `_prisma_migrations`):**

| Migration Name | SHA-256 Arquivo Local (`migration.sql`) | Checksum Banco (`_prisma_migrations`) | Situação |
| :--- | :--- | :--- | :--- |
| `20260731005521_initial_0000` | `a97feb2abf92bd9b0cebdebfa72284d50e1fbc5e7da2825b8352d29ed1187dee` | `a97feb2abf92bd9b0cebdebfa72284d50e1fbc5e7da2825b8352d29ed1187dee` | Exact Match |
| `20260731012616_initial_0000` | `9b3beadbf915c6110332899361bfe905bacc842c07fac59adbf446aa98eb01be` | `9b3beadbf915c6110332899361bfe905bacc842c07fac59adbf446aa98eb01be` | Exact Match |
| `20260804212000_product_discovery_search_index` | `19714362c86892ab21850a2dceefe89cdc0afe86cff1c7b1a1d6cd9d9683aa0a` | `19714362c86892ab21850a2dceefe89cdc0afe86cff1c7b1a1d6cd9d9683aa0a` | Exact Match |
| `20260806203000_add_personalization_profiles` | `7975c2a00f0498cb67f872a1cfc4115e8e04d075e8c9774184ca9aef25dc070c` | `7975c2a00f0498cb67f872a1cfc4115e8e04d075e8c9774184ca9aef25dc070c` | Exact Match |
| `20260806213000_add_personalization_profile_xor_check` | `c9114080ff438b2d79d0f7bb03ecb180e81baf43d4818dc8a143bd83cb597552` | `c9114080ff438b2d79d0f7bb03ecb180e81baf43d4818dc8a143bd83cb597552` | Exact Match |
| `20260806214000_add_unique_active_cart_indexes` | `1a7f92e146d50d961c113c6145c1325a40ba12e57c5c26896384de873682539c` | `1a7f92e146d50d961c113c6145c1325a40ba12e57c5c26896384de873682539c` | Exact Match |
| `20260807050000_add_carts_xor_owner_check` | `ddd7f60882a6874f5ffb4724df70b3e366518e046904e21b2b2d26082f6a645d` | `ddd7f60882a6874f5ffb4724df70b3e366518e046904e21b2b2d26082f6a645d` | Exact Match |

3. **Status do Prisma Migrate:**
   - Comando: `DATABASE_URL="postgresql://verttex:verttex_dev_password@localhost:5432/verttex_replay_j?schema=public" pnpm --filter @verttex/api exec prisma migrate status`
   - Exit Code: `0`
   - Saída: `Database schema is up to date!`

4. **Migrate Diff (Schema vs PostgreSQL Reaplicado):**
   - Comando: `DATABASE_URL="postgresql://verttex:verttex_dev_password@localhost:5432/verttex_replay_j?schema=public" pnpm --filter @verttex/api exec prisma migrate diff --from-schema prisma/schema.prisma --to-config-datasource`
   - Saída: Apenas as diferenças intencionais listadas na allowlist (ex: `product_search_documents_productId_idx`).
   - Conclusão: Zero drift não intencional.

---

## 6. Provas de Segurança, Spies e Sanitização no `db-isolation.spec.ts`

1. **Spies Explícitos para URL Insegura:**
   - Teste `16. Spies explícitos comprovam que NENHUMA operação é iniciada quando a URL é insegura` declara mocks e spies para:
     ```typescript
     expect(createPrismaClient).not.toHaveBeenCalled()
     expect(connectSpy).not.toHaveBeenCalled()
     expect(cleanSpy).not.toHaveBeenCalled()
     expect(destructiveOperationSpy).not.toHaveBeenCalled()
     expect(disconnectSpy).not.toHaveBeenCalled()
     ```
   - Exit Code: `0` (Passou).

2. **Execução do CLI Real em Subprocesso:**
   - Teste `17. URL insegura bloqueia no guard e encerra CLI real em subprocesso (shell: false)`:
     - Comando: `node --import tsx/esm prisma/clean.ts`
     - Opções: `shell: false`, `stdio: 'pipe'`, URL fictícia: `postgresql://usuario-secreto:senha-secreta@host-secreto:5432/banco_prod`
     - Exit Code: `1` (Diferente de 0)
     - Saída Sanitizada: `Falha ao executar a limpeza do banco.`
     - Prova de Ausência de Credenciais: Asserções confirmam que `usuario-secreto`, `senha-secreta`, `host-secreto` e `banco_prod` NÃO aparecem na saída.

3. **Matriz de Erros e Sanitização com Sentinela:**
   - Teste `18. Testes com sentinelas comprovam que credenciais e mensagens de erros arbitrários nunca são impressos`:
     - Sentinela: `SENHA_NAO_PODE_APARECER_SECRET_12345`
     - Cenários testados: Falha na limpeza, Falha na desconexão, Falha dupla (limpeza + desconexão).
     - Prova: Spies em `console.log`, `console.error` e `console.warn` confirmam zero vazamentos.

---

## 7. Validação Markdown e Exceções

- **Erros Reais Encontrados:** `0`
- **Ocorrências Intencionais Documentadas:** `6`

| Arquivo | Linha / Trecho | Motivo da Ocorrência | Classificação |
| :--- | :--- | :--- | :--- |
| `AGENTS.md` | L3, L7-L14 | Links das diretrizes com protocolo `file:///Users/` exigidos pela IDE | Intencional |
| `README.md` | L67 | Link de referência a workflows com protocolo `file:///Users/` | Intencional |
| `PUSH_1F_EVIDENCE.md` | L9 | Documentação da errata histórica sobre `file://` | Intencional |
| `PUSH_1G_EVIDENCE.md` | L9, L70 | Documentação histórica da errata e flag CLI | Intencional |
| `PUSH_1H_EVIDENCE.md` | L7, L35, L189 | Documentação histórica da errata de links markdown | Intencional |
| `PUSH_1I_EVIDENCE.md` | L217 | Documentação histórica do inventário de erros markdown | Intencional |

---

## 8. Classificação do Redis

- **Classificação:** `NÃO APLICÁVEL — os testes desta rodada não dependem funcionalmente de Redis.`

---

## 9. Testes Obrigatórios e Quality Gates

### Suíte Completa da API (Três Execuções Consecutivas):

1. **Execução 1 (13:06:55-03:00):** 50 test files passed (331 tests), Exit Code: `0`
2. **Execução 2 (13:07:15-03:00):** 50 test files passed (331 tests), Exit Code: `0`
3. **Execução 3 (13:07:33-03:00):** 50 test files passed (331 tests), Exit Code: `0`

### Quality Gate Completo (`pnpm verify` & `git diff --check`):
- `pnpm verify` (Tasks: 6 successful, 6 total) -> Exit Code: `0`
- `git diff --check` -> Exit Code: `0` (Zero conflitos de espaços/linhas).

---

## 10. Checks Externos vs Gates Locais

- **Checks Externos do GitHub:** Inexistentes para o SHA local.
- **Gates Locais:** Executados e aprovados localmente com comandos, saídas e exit codes registrados acima.
