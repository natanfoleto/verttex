# Arquitetura de Segurança — VERTTEX NF

> **Versão:** 1.0 — Estado atual do sistema em 2026-07-22  
> **Atualizar sempre que:** Nova camada, novo plugin de segurança, nova configuração ou alteração estrutural for implementada

---

## 1. Modelo de Defesa em Profundidade

O VERTTEX NF adota o modelo de defesa em profundidade. A falha de uma camada não pode resultar em comprometimento completo do sistema.

### Camada 1 — Edge e Rede

| Controle | Estado | Observação |
|:---|:---|:---|
| TLS obrigatório | ✅ Cloudflare em produção | Gerenciado via Cloudflare |
| WAF | 🔴 Não configurado | A ser configurado na Cloudflare |
| Proteção contra bots | 🔴 Não configurado | Cloudflare Bot Management — planejado |
| Rate limit no edge | 🔴 Não configurado | Cloudflare Rate Limiting — planejado |
| Restrição de endpoints administrativos por IP | 🔴 Não implementado | Planejado |
| Ocultação da origem | ⚠️ Parcial | Cloudflare como proxy — verificar se origem está exposta |

### Camada 2 — Servidor HTTP (Fastify 5.2.1)

| Controle | Estado | Arquivo | Observação |
|:---|:---|:---|:---|
| `trustProxy` configurado | 🔴 Não implementado | [`app.ts`](../../apps/api/src/app.ts) | Deve ser configurado para Cloudflare |
| Headers de segurança (`@fastify/helmet`) | 🔴 Não implementado | — | **Fase 2 — Pendente** |
| HSTS | 🔴 Não implementado | — | Depende do helmet |
| `X-Content-Type-Options: nosniff` | 🔴 Não implementado | — | Depende do helmet |
| `X-Frame-Options` | 🔴 Não implementado | — | Depende do helmet |
| Referrer-Policy | 🔴 Não implementado | — | Depende do helmet |
| Limite global de body | ⚠️ Default Fastify (1 MiB) | [`app.ts`](../../apps/api/src/app.ts) | Deve ser configurado explicitamente — Fase 7 |
| Timeouts de request | ⚠️ Default Fastify | — | Verificar |
| Tratamento centralizado de erros | ✅ Implementado | [`http-error-handler.ts`](../../apps/api/src/shared/errors/http-error-handler.ts) | Não expõe stack trace |
| CORS com allowlist | ✅ Implementado | [`cors.ts`](../../apps/api/src/plugins/cors.ts) | Via `CORS_ORIGIN` env |

### Camada 3 — Validação de Entrada

| Controle | Estado | Observação |
|:---|:---|:---|
| JSON Schema em todas as rotas | ⚠️ Parcial | Zod nos principais, alguns endpoints sem schema de params/query |
| `additionalProperties: false` equivalente | ⚠️ Parcial | Zod exige `.strict()` explícito por schema |
| Limites de paginação explícitos | ⚠️ Parcial | Implementado em listagens principais — revisar |
| Limite máximo de body por rota | 🔴 Não implementado | Fase 7 |

### Camada 4 — Autenticação e Sessão

| Controle | Estado | Arquivo | Observação |
|:---|:---|:---|:---|
| Hash de senha com scrypt | ✅ Implementado | [`crypto.ts`](../../apps/api/src/shared/utils/crypto.ts) | Salt 16 bytes, saída 64 bytes |
| Fallback inseguro em verifyPassword | 🔴 Vulnerabilidade | [`crypto.ts:L24-27`](../../apps/api/src/shared/utils/crypto.ts#L24-L27) | **Fase 6 — CRÍTICO** |
| Comparação em tempo constante | ✅ Implementado | [`crypto.ts:L34`](../../apps/api/src/shared/utils/crypto.ts#L34) | `timingSafeEqual` |
| Mensagens genéricas no login | ✅ Implementado | [`auth-users.service.ts`](../../apps/api/src/modules/auth-users/auth-users.service.ts) | `'E-mail ou senha inválidos'` |
| Mensagem genérica no forgot-password | ✅ Implementado | [`auth-users.service.ts:L262-265`](../../apps/api/src/modules/auth-users/auth-users.service.ts#L262-L265) | Resposta genérica |
| Rate limit em autenticação | 🔴 Não implementado | — | **Fase 3 — Pendente** |
| Access token JWT (15 min) | ✅ Implementado | [`auth-users.service.ts:L66-74`](../../apps/api/src/modules/auth-users/auth-users.service.ts#L66-L74) | `expiresIn: '15m'` |
| Claims completos no JWT (`jti`, `iss`, `aud`) | 🔴 Não implementado | — | **Fase 4 — Pendente** |
| Denylist de jti (revogação imediata) | 🔴 Não implementado | — | **Fase 4 — Pendente** |
| Cookies HttpOnly + Secure | ✅ Implementado | [`auth-users.controller.ts:L29-42`](../../apps/api/src/modules/auth-users/auth-users.controller.ts#L29-L42) | `httpOnly: true`, `secure: isProduction` |
| SameSite em cookies | ✅ Implementado | — | `sameSite: 'lax'` |
| MFA | ⚠️ Schema preparado | — | Campos no modelo User, sem implementação |

### Camada 5 — Autorização

| Controle | Estado | Arquivo | Observação |
|:---|:---|:---|:---|
| CASL para autorização | ✅ Implementado | [`@verttex/auth`](../../packages/auth) | `defineAbilityFor(user)` |
| `requirePermission` middleware | ✅ Implementado | [`require-permission.ts`](../../apps/api/src/shared/middlewares/require-permission.ts) | |
| Ownership check em nível de objeto | ⚠️ Parcial | — | Implementado nos principais endpoints; revisar listagens |
| Validação de escopo de loja | ⚠️ Parcial | — | `requireStoreAccess` existe mas cobertura a verificar |
| Negação por padrão | ✅ Implementado | — | CASL nega por padrão |

### Camada 6 — Regras de Negócio

| Controle | Estado | Observação |
|:---|:---|:---|
| Valores calculados no servidor | ✅ Implementado | Não há pedidos/pagamentos ainda |
| Soft delete | ✅ Implementado | `deletedAt` em User, Customer, Store, Role |
| Transações em alterações relacionadas | ✅ Parcial | Usado em reset/change password |
| Idempotência | 🔴 Não implementado | A implementar em fluxos futuros |
| Proteção contra repetição | 🔴 Não implementado | Planejado com rate limit |

### Camada 7 — Banco de Dados (PostgreSQL + Prisma 7.8.0)

| Controle | Estado | Observação |
|:---|:---|:---|
| ORM sem raw SQL | ✅ Implementado | Zero ocorrências de `$queryRaw` ou equivalente |
| Constraints `@unique` | ✅ Implementado | Email em User e Customer, slug em Store |
| Foreign keys com integridade referencial | ✅ Implementado | Cascade delete nas relações |
| Índices para auditoria | ✅ Implementado | `userId`, `entity`, `entityId`, `action`, `createdAt` |
| Credencial de runtime com menor privilégio | 🔴 Não verificado | Mesma credencial para runtime e migrate — revisar |
| Backups automáticos | 🔴 Não verificado | Depende do provedor |

### Camada 8 — Arquivos (Cloudflare R2)

| Controle | Estado | Observação |
|:---|:---|:---|
| Buckets privados | 🔴 Não verificado | R2 SDK instalado, sem implementação de upload |
| Pipeline de quarentena | 🔴 Não implementado | Fase 20 — planejado |
| Validação de magic bytes | 🔴 Não implementado | — |
| Re-encode de imagens | 🔴 Não implementado | — |

### Camada 9 — Infraestrutura e Secrets

| Controle | Estado | Observação |
|:---|:---|:---|
| `.env.*` no `.gitignore` | ✅ Implementado | Apenas `.env.example` rastreado |
| Variáveis de ambiente tipadas com Zod | ✅ Implementado | `@t3-oss/env-core` |
| Secret scanning automatizado | 🔴 Não implementado | Fase 9 — CI/CD |
| Pre-commit hooks | 🔴 Não implementado | Fase 9 |
| Secrets diferentes por ambiente | ⚠️ Não verificado | A documentar |

### Camada 10 — Detecção e Resposta

| Controle | Estado | Observação |
|:---|:---|:---|
| Auditoria de ações | ✅ Implementado | `logAudit()` em `audit.ts` com sanitização |
| Logs estruturados (Fastify logger) | ✅ Implementado | Fastify built-in logger |
| Alertas e métricas | 🔴 Não implementado | — |
| Plano de incidente | ✅ Documentado | `INCIDENT_RESPONSE.md` |

### Camada 11 — Verificação Pré-Deploy (Gates Obrigatórios)

> **Nota de Arquitetura:** O pipeline automatizado via `.github/workflows` não é obrigatório e foi descontinuado do repositório por decisão de infraestrutura. Todas as verificações de qualidade e segurança abaixo **devem ser executadas obrigatoriamente como um passo manual/script pré-deploy** antes de promover qualquer alteração para staging ou produção.

| Controle | Estado | Processo |
|:---|:---|:---|
| Typecheck estrito (`pnpm typecheck`) | ✅ Obrigatório | 0 erros de TypeScript em todo o monorepo |
| Testes de segurança (`pnpm --filter @verttex/api test`) | ✅ Obrigatório | 100% dos testes de segurança em Vitest passando |
| Verificação Anti-Raw SQL | ✅ Obrigatório | Verificação com `grep` contra `queryRaw`/`executeRaw` |
| Secret scanning pré-deploy | ✅ Obrigatório | Verificação de segredos hardcoded antes do build |
| Build de produção | ✅ Obrigatório | `pnpm build` sem erros |

---

## 2. Fluxo de Autenticação — Estado Atual

```
Cliente
  ↓ POST /auth/users/login { email, password }
Fastify API
  ↓ Zod schema validation
  ↓ prisma.user.findUnique({ email })
  ↓ verifyPassword(password, user.passwordHash)  ← scrypt + timingSafeEqual
  ↓ prisma.userSession.create({ refreshTokenHash, expiresAt })
  ↓ app.jwt.sign({ sub, actorType: 'user', role, sessionId }, expiresIn: '15m')
  ↓ setCookie('user_access_token', ...)  ← httpOnly, secure (prod), sameSite: lax
  ↓ setCookie('user_refresh_token', ...)  ← httpOnly, secure (prod), sameSite: lax, path: /auth/users
  ↓ response: { accessToken, refreshToken, user }
```

**Gaps no fluxo:** Sem `jti`, sem `iss`, sem `aud`, sem rate limit.

---

## 3. Fluxo de Autorização — Estado Atual

```
Request com token
  ↓ authenticateUser (preHandler)
  ↓ Verifica cookie 'user_access_token' ou Authorization header
  ↓ app.jwt.verify(token)  ← valida assinatura e expiração
  ↓ prisma.userSession.findUnique({ sessionId })
  ↓ Verifica: revokedAt, expiresAt, user.status === 'active'
  ↓ Carrega rolePermissions + userPermissions
  ↓ request.userPayload = { id, name, email, role, sessionId, ... }
  ↓
  ↓ requirePermission('action', 'subject') (preHandler opcional)
  ↓ defineAbilityFor(user)  ← CASL
  ↓ ability.can(action, subject) → 403 se não autorizado
```

**Gaps:** Sem validação de `iss`/`aud`; sem verificação de `jti` na denylist; IP pode ser forjado sem `trustProxy`.
