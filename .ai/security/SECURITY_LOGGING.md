# Logs e Auditoria de Segurança — VERTTEX NF

> **Versão:** 1.0 — 2026-07-22

---

## 1. Estado Atual

| Controle | Status | Arquivo |
|:---|:---|:---|
| `logAudit()` com sanitização de campos sensíveis | ✅ | [`audit.ts`](../../apps/api/src/shared/utils/audit.ts) |
| `SENSITIVE_KEYS` com lista de campos protegidos | ✅ | `audit.ts` |
| Sanitização recursiva de `oldValues`/`newValues` | ✅ | `audit.ts` |
| Extração de IP com suporte a `X-Forwarded-For` | ✅ | `audit.ts` (atenção: VULN-005 — sem `trustProxy`) |
| Fastify logger estruturado | ✅ | `app.ts` |
| Índices na tabela `AuditLog` | ✅ | `schema.prisma` |
| Logs de segurança centralizados | ❌ | Sem stack de observabilidade |
| Alertas automáticos | ❌ | Não implementado |
| Retenção de logs definida | ❌ | Não definida |

---

## 2. Eventos de Segurança Obrigatórios

### Implementados

| Evento | `action` | Implementado em |
|:---|:---|:---|
| Login bem-sucedido | `LOGIN` | `auth-users.service.ts` |
| Login falho | `LOGIN_FAILED` | `auth-users.controller.ts` |
| Logout | `LOGOUT` | `auth-users.service.ts` |
| Reset de senha | `PASSWORD_RESET` | `auth-users.service.ts` |
| Alteração de senha | `PASSWORD_CHANGE` | `auth-users.service.ts` |
| Revogação de sessão específica | `REVOKE_SESSION` | `auth-users.service.ts` |
| Revogação de outras sessões | `REVOKE_OTHER_SESSIONS` | `auth-users.service.ts` |
| Criação de usuário | `CREATE` | `users.service.ts` |
| Atualização de usuário | `UPDATE` | `users.service.ts` |
| Arquivamento de usuário | `ARCHIVE` | `users.service.ts` |
| Restauração de usuário | `RESTORE` | `users.service.ts` |
| Alteração de permissões de usuário | `UPDATE_PERMISSIONS` | `users.service.ts` |
| Criação de cargo | `CREATE` | `roles.service.ts` |
| Atualização de cargo | `UPDATE` | `roles.service.ts` |
| Arquivamento de cargo | `ARCHIVE` | `roles.service.ts` |
| Alteração de permissões de cargo | `UPDATE_PERMISSIONS` | `roles.service.ts` |
| Criação de loja | `CREATE` | `stores.service.ts` |
| Atualização de loja | `UPDATE` | `stores.service.ts` |
| Arquivamento de loja | `ARCHIVE` | `stores.service.ts` |
| Restauração de loja | `RESTORE` | `stores.service.ts` |
| Adição de usuário à loja | `ADD_USER` | `stores.service.ts` |
| Remoção de usuário da loja | `REMOVE_USER` | `stores.service.ts` |

### Planejados

| Evento | `action` | Fase |
|:---|:---|:---|
| Reutilização suspeita de refresh token | `SUSPICIOUS_TOKEN_REUSE` | Fase 5 |
| Rate limit atingido | `RATE_LIMIT_HIT` | Fase 3 |
| Acesso negado por permissão | `ACCESS_DENIED` | Futuro |
| Upload de arquivo | `FILE_UPLOAD` | Futuro |
| Upload rejeitado | `FILE_UPLOAD_REJECTED` | Futuro |

---

## 3. O que Nunca Deve Ser Registrado

- Senha (plain text ou hash)
- Refresh token (plain text ou hash)
- Access token completo
- Cookie completo
- JWT secret
- Código MFA
- Token de recuperação (plain text)
- Dados de cartão de crédito
- Conteúdo sensível desnecessário

**Proteção automática:** `SENSITIVE_KEYS` em `audit.ts` com sanitização recursiva.

---

## 4. Campos de Log

Campos registrados no `AuditLog`:

| Campo | Tipo | Descrição |
|:---|:---|:---|
| `id` | cuid | Identificador único do registro |
| `userId` | string? | Usuário que executou a ação (nulo se sistema ou anônimo) |
| `action` | string | Ação executada |
| `entity` | string | Entidade afetada |
| `entityId` | string? | ID da entidade afetada |
| `oldValues` | JSON? | Estado anterior (sanitizado) |
| `newValues` | JSON? | Estado novo (sanitizado) |
| `ipAddress` | string? | IP do cliente |
| `userAgent` | string? | User-Agent do cliente |
| `createdAt` | DateTime | Timestamp UTC |

---

## 5. Campos `SENSITIVE_KEYS` — Lista Atual

```
password, passwordhash, currentpassword, newpassword, confirmpassword,
token, accesstoken, refreshtoken, refreshtokenhash, tokenhash,
secret, apikey, authorization, cookie, session, creditcard, cvv
```

Adicionar novos campos sensíveis ao conjunto conforme necessário.
