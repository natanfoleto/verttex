# Sessões e Tokens — VERTTEX NF

> **Versão:** 1.0 — 2026-07-22

---

## 1. Arquitetura de Sessão

```
AccessToken (JWT, 15 min)     ← renovado via RefreshToken
RefreshToken (opaco, 7 dias)  ← armazenado como hash SHA-256 no DB
UserSession / CustomerSession ← registra sessionId, ipAddress, userAgent, revokedAt, expiresAt
```

---

## 2. Claims do Access Token — Estado Atual

```json
{
  "sub": "<userId>",
  "actorType": "user" | "customer",
  "role": "<roleKey>",
  "sessionId": "<sessionId>",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Gaps (a implementar na Fase 4):**
- `jti`: UUID v4 — necessário para denylist
- `iss`: identificador do emissor
- `aud`: audiência esperada (`manager` / `marketplace`)
- `nbf`: início da validade

---

## 3. Claims do Access Token — Alvo (Fase 4)

```json
{
  "iss": "api.verttexloja.com.br",
  "aud": "manager",
  "sub": "<userId>",
  "jti": "<uuid-v4>",
  "actorType": "user",
  "role": "<roleKey>",
  "sessionId": "<sessionId>",
  "iat": 1234567890,
  "nbf": 1234567890,
  "exp": 1234568690
}
```

---

## 4. Revogação de Sessões

### Eventos que devem revogar sessões

| Evento | Ação |
|:---|:---|
| Logout | Revogar sessão atual + (Fase 4) jti na denylist |
| Logout de todos dispositivos | Revogar todas as sessões |
| Alteração de senha | Revogar todas as sessões |
| Reset de senha | Revogar todas as sessões |
| Desativação de usuário | Revogar todas as sessões |
| Alteração crítica de cargo | Revogar todas as sessões (planejado) |
| Detecção de comprometimento | Revogar todas as sessões |
| Reutilização de refresh token | Revogar família inteira (Fase 5) |

### Implementação atual

| Evento | Status |
|:---|:---|
| Logout | ✅ `revokedAt` na sessão |
| Logout de outros dispositivos | ✅ `revokeOtherSessions` |
| Alteração de senha | ✅ Transação com `updateMany({ revokedAt })` |
| Reset de senha | ✅ Transação com `updateMany({ revokedAt })` |
| Desativação de usuário | ✅ `status !== 'active'` verificado em cada request |
| Denylist de jti | ❌ Não implementado — VULN-004 — Fase 4 |
| Detecção de refresh token reutilizado | ❌ Não implementado — VULN-006 — Fase 5 |

---

## 5. Rotação de Refresh Token

1. Cliente envia refresh token (cookie ou body)
2. API calcula `SHA-256(refreshToken)` e busca no DB
3. Se encontrado, não revogado e não expirado:
   - Cria nova sessão com novo refresh token
   - Revoga a sessão/token anterior (`revokedAt`)
   - Retorna novo access token + novo refresh token
4. Se não encontrado ou revogado:
   - Retorna 401

**Gap (Fase 5):** Detectar reutilização de token de família revogada e revogar toda a família.

---

## 6. Armazenamento de Tokens no Cliente

| Token | Armazenamento | Justificativa |
|:---|:---|:---|
| Access token | Cookie HttpOnly OU memory (JS) | Não em localStorage — XSS inacessível |
| Refresh token | Cookie HttpOnly apenas | HttpOnly + path restrito + Secure |

**Configuração de cookies:**

```
httpOnly: true
secure: true (produção)
sameSite: 'lax'
path: '/' (access token)
path: '/auth/users' (refresh token de usuário)
path: '/auth/customers' (refresh token de cliente)
```

**SameSite: `strict` seria mais seguro mas impede navegação cross-site legítima. `lax` é o mínimo aceitável com cookies de autenticação.**

---

## 7. Denylist de jti — Design (Fase 4)

```sql
-- Tabela no PostgreSQL
CREATE TABLE revoked_tokens (
  jti TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);
```

- Verificação a cada request autenticado: `SELECT 1 FROM revoked_tokens WHERE jti = $1`
- Limpeza: job periódico deleta entradas onde `expires_at < NOW()`
- Decisão: SD-003
