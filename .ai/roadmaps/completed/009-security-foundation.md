# 009 — Security Foundation

## Metadata

- Status: Completed
- Priority: Critical
- Created at: 2026-07-22
- Started at: 2026-07-22
- Completed at: 2026-07-22
- Related documents: `.ai/security/*` (20 documentos de política, arquitetura e matrizes)
- Previous roadmap: [`completed/008-marketplace-ui.md`](.ai/roadmaps/completed/008-marketplace-ui.md)
- Next roadmap: [`planned/010-security-validation-and-hardening.md`](.ai/roadmaps/planned/010-security-validation-and-hardening.md)

---

## Context

Com a conclusão da Fase 1 funcional (Roadmaps 001 a 008), o sistema VERTTEX NF possui capacidade de processar dados sensíveis de usuários gestores, fornecedores, lojas, clientes e transações. Estabeleceu-se formalmente que a segurança deve fazer parte da arquitetura, do desenvolvimento, das regras de negócio e da observabilidade antes do avanço para novos módulos de e-commerce e pagamentos.

---

## Objectives

1. Mapear o estado atual de segurança e estabelecer a base documental alinhada com OWASP ASVS 5.0 (Nível 2 / Nível 3 para auth) e NIST SSDF.
2. Eliminar vulnerabilidades críticas conhecidas na camada de autenticação (VULN-001).
3. Implementar defesas em profundidade na API Fastify (`@fastify/helmet`, `@fastify/rate-limit`, `trustProxy`, `bodyLimit`).
4. Fortalecer tokens JWT com claims de segurança (`jti`, `iss`, `aud`), denylist híbrida (Redis + PostgreSQL) no logout e detecção de reutilização de refresh token.
5. Configurar headers de segurança nos frontends Next.js (Manager e Marketplace).
6. Implementar testes automatizados de segurança com Vitest e estabelecer o checklist de gates pré-deploy.

---

## Scope

- Auditoria completa do projeto e criação da documentação oficial em `.ai/security/`.
- Correção do fallback inseguro de senha em `apps/api/src/shared/utils/crypto.ts`.
- Aplicação de headers HTTP com `@fastify/helmet` na API Fastify.
- Implementação de Rate Limiting com suporte a Redis (`ioredis`) e fallback gracioso em memória.
- Proteção dos endpoints de autenticação de usuários e clientes contra brute force e enumeração.
- JWT Security Claims (`jti`, `iss`, `aud`), `trustProxy: 1` e denylist em Redis (`revoked_jti:`) + PostgreSQL (`revoked_tokens`).
- Mecanismo de detecção e contenção de reutilização de refresh tokens já revogados.
- Limite global de payload no Fastify (`bodyLimit: 256 KB`).
- Arquivos `next.config.ts` para Manager e Marketplace com CSP (Report-Only), HSTS, X-Frame-Options e Referrer-Policy.
- Estruturação de suíte de testes de segurança com Vitest e gates pré-deploy de código.

---

## Security Principles Adopted

- **Defesa em Profundidade:** Defesas em múltiplas camadas (Edge, HTTP Server, Auth, Data Validation, Storage, Audit).
- **Menor Privilégio & Least Trust:** O backend é a autoridade absoluta de segurança.
- **Fail Secure & Mensagens Genéricas:** Falhas de autenticação retornam mensagens genéricas e tempo constante.
- **Denylist de Tokens Revogados:** Access tokens revogados antes da expiração são rejeitados imediatamente.
- **Sanitização de Log por Padrão:** O log de auditoria sanitiza recursivamente credenciais e tokens.

---

## Implemented Controls

| Controle                                    | Estado       | Evidência / Arquivo                                                                                                          |
| :------------------------------------------ | :----------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Governança & Políticas                      | Implementado | 20 arquivos em [`.ai/security/`](.ai/security/)                                                                              |
| Hash de senhas estrito (`scrypt`)           | Implementado | [`crypto.ts`](../../apps/api/src/shared/utils/crypto.ts)                                                                     |
| Removido fallback inseguro (VULN-001)       | Implementado | [`crypto.ts`](../../apps/api/src/shared/utils/crypto.ts#L31-L48)                                                             |
| Headers de segurança HTTP (Helmet)          | Implementado | [`helmet.ts`](../../apps/api/src/plugins/helmet.ts)                                                                          |
| Rate Limiting por IP/Conta (Redis + Memory) | Implementado | [`rate-limit.ts`](../../apps/api/src/plugins/rate-limit.ts) + [`redis.ts`](../../apps/api/src/infrastructure/redis/redis.ts) |
| Claims JWT (`jti`, `iss`, `aud`)            | Implementado | [`auth-users.service.ts`](../../apps/api/src/modules/auth-users/auth-users.service.ts)                                       |
| Validação de Issuer e Audience              | Implementado | [`auth.ts`](../../apps/api/src/plugins/auth.ts)                                                                              |
| Trust Proxy (`trustProxy: 1`)               | Implementado | [`app.ts`](../../apps/api/src/app.ts)                                                                                        |
| Denylist de `jti` (Redis + DB)              | Implementado | [`token-denylist.ts`](../../apps/api/src/shared/utils/token-denylist.ts)                                                     |
| Re-use detection de Refresh Token           | Implementado | `auth-users.service.ts` e `auth-customers.service.ts`                                                                        |
| Body Limit global (256 KB)                  | Implementado | [`app.ts`](../../apps/api/src/app.ts)                                                                                        |
| CSP Headers (Next.js Frontends)             | Implementado | `apps/manager/next.config.ts` e `apps/marketplace/next.config.ts`                                                            |
| Suíte de testes Vitest                      | Implementado | `crypto.spec.ts` e `token-denylist.spec.ts`                                                                                  |
| Gates pré-deploy documentados (SD-005)      | Implementado | `.ai/security/SECURITY_ARCHITECTURE.md`                                                                                      |

---

## Documentation Created

Todos os 20 documentos exigidos foram criados em `.ai/security/`:

1. `README.md`
2. `SECURITY_POLICY.md`
3. `AI_SECURITY_RULES.md`
4. `SECURITY_ARCHITECTURE.md`
5. `THREAT_MODEL.md`
6. `ASVS_CHECKLIST.md`
7. `ACCESS_CONTROL_MATRIX.md`
8. `BUSINESS_SECURITY_INVARIANTS.md`
9. `AUTHENTICATION_SECURITY.md`
10. `SESSION_AND_TOKEN_SECURITY.md`
11. `RATE_LIMIT_MATRIX.md`
12. `INPUT_VALIDATION_POLICY.md`
13. `FILE_UPLOAD_SECURITY.md`
14. `SECRETS_MANAGEMENT.md`
15. `SECURITY_LOGGING.md`
16. `SECURITY_TEST_PLAN.md`
17. `AI_RED_TEAM_PLAN.md`
18. `INCIDENT_RESPONSE.md`
19. `PENTEST_READINESS.md`
20. `SECURITY_DECISIONS.md` (SD-001 a SD-005)

---

## Architecture Decisions

- **SD-001:** Adotado `scrypt` via `node:crypto` com salt de 16 bytes. Estratégia de migração transparente para Argon2id quando Node 24.x LTS estiver disponível.
- **SD-002:** Isolamento rígido de schemas Zod entre escopos `User` (Manager) e `Customer` (Marketplace).
- **SD-003:** Denylist de `jti` com busca prioritária em Redis (TTL automático) e persistência em PostgreSQL.
- **SD-004:** Rate limit dinâmico via `@fastify/rate-limit` integrado a `ioredis` quando `REDIS_URL` é configurado, com fallback em memória.
- **SD-005:** Gates de segurança pré-deploy (`pnpm typecheck`, `pnpm --filter @verttex/api test`, Anti-Raw SQL, Secret Scan) executados obrigatoriamente antes da promoção do código.

---

## Automated Tests Created

- [`crypto.spec.ts`](../../apps/api/src/shared/utils/crypto.spec.ts):
  - Valida hash e verificação de senha com `scrypt`.
  - Valida que falha de senha retorna `false`.
  - **Valida estritamente a rejeição de hashes sem o separador `:` (VULN-001).**
  - Valida geração de tokens de 32 bytes e hash SHA-256.
- [`token-denylist.spec.ts`](../../apps/api/src/shared/utils/token-denylist.spec.ts):
  - Valida que `jti` não revogado retorna `false`.
  - Valida revogação de `jti` e confirma que passa a retornar `true` em Redis/PostgreSQL.

---

## Validations Performed

- `pnpm typecheck`: 9/9 pacotes compilando com 0 erros de TypeScript.
- `pnpm --filter @verttex/api test`: 6/6 testes unitários de segurança passando com sucesso.
- Conexão e teste em container Docker com Redis 7: Conectado e validado (`✅ [REDIS] Conectado com sucesso!`).

---

## Known Limitations

- **Upload de Arquivos:** Requisitos e pipeline documentados em `FILE_UPLOAD_SECURITY.md`, porém nenhum endpoint de upload foi implementado no código até o momento.
- **MFA / 2FA:** Schema do Prisma possui colunas preparadas, mas fluxo de ativação e verificação de TOTP não foi construído nesta fase.
- **CSP Enforcement:** CSP configurada como `Report-Only` nos frontends Next.js para evitar quebra de recursos antes dos testes do Roadmap 010.

---

## Items Not Validated

- Comportamento de rate limit distribuído em ambiente multi-instância sob carga real.
- Testes adversariais profundos de IDOR/BOLA e concorrência (serão executados no Roadmap 010).

---

## Risks Carried Forward

- Janela de risco até a execução do Roadmap 010: a efetividade de todos os controles sob ataques adversariais simulados ainda será testada.

---

## Completion Criteria

- [x] Documentação de segurança em `.ai/security/` completa e coerente.
- [x] Correção de `crypto.ts` (VULN-001) implementada e validada via teste automatizado.
- [x] `@fastify/helmet`, `@fastify/rate-limit`, `trustProxy: 1` e `bodyLimit: 256 KB` configurados na API.
- [x] Claims JWT (`jti`, `iss`, `aud`), denylist de `jti` e detecção de reutilização de refresh token implementados.
- [x] `next.config.ts` configurados no Manager e Marketplace.
- [x] 6/6 testes de segurança passando em Vitest.

---

## Final Status

**Completed**

> Este roadmap registra a conclusão da fase inicial de fundação e implementação de segurança. A eficácia dos controles será validada pelo roadmap seguinte, que realizará testes automatizados, manuais, adversariais e de regressão.

---

## Related Follow-Up Roadmap

- [`planned/010-security-validation-and-hardening.md`](.ai/roadmaps/planned/010-security-validation-and-hardening.md)
