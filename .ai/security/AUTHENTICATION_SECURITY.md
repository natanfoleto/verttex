# Autenticação Segura — VERTTEX NF

> **Versão:** 1.0 — 2026-07-22

---

## 1. Estado Atual

### 1.1 Hash de Senhas

- **Algoritmo:** `scrypt` via `node:crypto` (Node.js 22.12.0)
- **Salt:** 16 bytes aleatórios via `randomBytes(16)`
- **Saída:** 64 bytes
- **Formato armazenado:** `salt_hex:hash_hex`
- **Comparação:** `timingSafeEqual` — proteção contra timing attacks
- **⚠️ Vulnerabilidade:** Fallback inseguro para hashes sem `:` — **ver VULN-001, corrigir na Fase 6**
- **Decisão:** SD-001

### 1.2 Fluxo de Login

1. Email normalizado: `toLowerCase().trim()`
2. `prisma.user.findUnique({ where: { email } })`
3. Se não encontrado ou inativo → mensagem genérica (`'E-mail ou senha inválidos'`)
4. `verifyPassword(password, user.passwordHash)` com `timingSafeEqual`
5. Se senha inválida → mesma mensagem genérica
6. Sessão criada, refresh token gerado (64 bytes hex) e armazenado como SHA-256 hash
7. JWT access token gerado (15 min)
8. Cookies `HttpOnly + Secure (prod) + SameSite: Lax` definidos

### 1.3 Tokens e Sessões

| Token | Tipo | Duração | Armazenamento |
|:---|:---|:---|:---|
| Access token | JWT assinado | 15 min | Cookie HttpOnly / Authorization header |
| Refresh token | Opaco (64 bytes hex) | 7 dias | Cookie HttpOnly; armazenado como SHA-256 hash no DB |
| Reset token | Opaco (64 bytes hex) | 1 hora | Armazenado como SHA-256 hash no DB |

---

## 2. Gaps e Melhorias Planejadas

| Gap | VULN | Fase |
|:---|:---|:---|
| Fallback inseguro em `verifyPassword` | VULN-001 | Fase 6 |
| Rate limiting em login | VULN-002 | Fase 3 |
| Claims JWT sem `jti`, `iss`, `aud` | VULN-004 | Fase 4 |
| Denylist de `jti` para revogação imediata | VULN-004 | Fase 4 |
| Hash dummy para usuário inexistente (anti-timing) | — | Fase 4 |
| Detecção de reutilização de refresh token | VULN-006 | Fase 5 |
| MFA para admins | — | Roadmap futuro |

---

## 3. Regras de Implementação

- Nunca normalizar senha silenciosamente (`.trim()` não deve ser chamado na senha)
- Sempre usar `timingSafeEqual` para comparar hashes
- Sempre retornar mensagem genérica em login, independente do motivo da falha
- Tokens de recuperação: sempre de uso único, com expiração e armazenados como hash
- Após reset/change de senha: sempre revogar todas as sessões ativas
- Após logout: revogar sessão + (Fase 4) adicionar `jti` à denylist

---

## 4. Migração de Hash Futuro (Argon2id)

Quando Node.js 24.x LTS com API Argon2 estável estiver disponível:

1. Adicionar campos `passwordAlgorithm` e `passwordVersion` ao modelo `User` e `Customer`
2. Na autenticação: verificar algoritmo do hash armazenado
3. Se `scrypt`: verificar com `scrypt`, após sucesso → gerar novo hash Argon2id, salvar, registrar migração
4. Novo cadastro já usa Argon2id
5. Parâmetros mínimos: `memory: 19456`, `iterations: 2`, `parallelism: 1`, `saltLength: 16`
6. Não forçar redefinição de senha — migração transparente no próximo login

**Referência:** SD-001
