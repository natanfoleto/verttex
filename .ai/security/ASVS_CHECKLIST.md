# Checklist OWASP ASVS 5.0 — VERTTEX

> **Nível alvo:** 2 geral / 3 em áreas críticas  
> **Versão:** 1.0 — 2026-07-22  
> **Legenda:** ✅ Implementado | ⚠️ Parcial | ❌ Não implementado | 🔵 Não aplicável | ❓ Não validado

---

## V2 — Autenticação

| ID     | Requisito (resumido)                            | Nível | Status | Observação                               |
| :----- | :---------------------------------------------- | :---- | :----- | :--------------------------------------- |
| 2.1.1  | Senha mínimo 12 caracteres                      | 1     | ❓     | Verificar schema Zod                     |
| 2.1.2  | Senha máximo 128 caracteres                     | 1     | ❓     | Verificar schema Zod                     |
| 2.1.3  | Sem truncamento de senha                        | 1     | ⚠️     | Não há `.trim()` na senha, mas verificar |
| 2.1.6  | Senha não alterada na validação                 | 1     | ✅     | Senha passada diretamente para scrypt    |
| 2.1.7  | Verificar contra lista de senhas comprometidas  | 3     | ❌     | Não implementado                         |
| 2.1.9  | Sem regras de composição obrigatória restritiva | 1     | ❓     | Verificar                                |
| 2.1.12 | Autenticação por múltiplos fatores              | 1     | ❌     | Campos preparados, sem implementação     |
| 2.2.1  | Rate limit em autenticação                      | 1     | ❌     | VULN-002 — Fase 3                        |
| 2.2.2  | Mensagem genérica em falha                      | 1     | ✅     | `'E-mail ou senha inválidos'`            |
| 2.2.3  | Anti-automação (CAPTCHA)                        | 1     | ❌     | Planejado com rate limit                 |
| 2.3.1  | Tokens de ativação expiram em ≤24h              | 1     | ✅     | Reset token: 1h                          |
| 2.5.1  | Resposta genérica em recuperação                | 1     | ✅     | `'Se existir uma conta...'`              |
| 2.5.6  | Tokens de recuperação aleatórios                | 1     | ✅     | 64 bytes via `randomBytes`               |
| 2.6.1  | OTP de uso único                                | 2     | 🔵     | Sem OTP                                  |
| 2.8.1  | Hash de senha com salt                          | 1     | ✅     | scrypt + salt 16 bytes                   |
| 2.8.2  | Comparação em tempo constante                   | 1     | ✅     | `timingSafeEqual`                        |
| 2.8.3  | Algoritmo moderno (Argon2, scrypt, bcrypt)      | 1     | ✅     | scrypt                                   |
| 2.8.5  | Pepper armazenado separadamente                 | 3     | ❌     | Não implementado                         |
| 2.9.1  | MFA para operações sensíveis                    | 3     | ❌     | Não implementado                         |

---

## V3 — Sessões

| ID    | Requisito (resumido)                    | Nível | Status | Observação                                    |
| :---- | :-------------------------------------- | :---- | :----- | :-------------------------------------------- |
| 3.1.1 | ID de sessão nunca em URL               | 1     | ✅     | Cookies apenas                                |
| 3.2.1 | Novo ID de sessão após login            | 1     | ✅     | Nova sessão criada                            |
| 3.2.2 | ID de sessão ≥64 bits de entropia       | 1     | ✅     | 64 bytes hex = 512 bits                       |
| 3.2.3 | Sessão salva no servidor                | 1     | ✅     | `UserSession` no DB                           |
| 3.2.4 | jti para revogação                      | 2     | ❌     | VULN-004 — Fase 4                             |
| 3.3.1 | Logout invalida sessão no servidor      | 1     | ✅     | `revokedAt`                                   |
| 3.3.2 | Access token ≤24h (recomendado ≤1h)     | 1     | ✅     | 15 minutos                                    |
| 3.3.3 | Revogar após reset de senha             | 1     | ✅     | Transação com `updateMany`                    |
| 3.4.1 | Cookie HttpOnly                         | 1     | ✅     | Implementado                                  |
| 3.4.2 | Cookie Secure                           | 1     | ✅     | Em produção                                   |
| 3.4.3 | Cookie com atributo SameSite            | 1     | ✅     | `lax`                                         |
| 3.4.5 | Cookie com Path restrito                | 1     | ⚠️     | Access token em `/`, refresh em `/auth/users` |
| 3.5.1 | Não armazenar em localStorage           | 2     | ✅     | Cookies HttpOnly                              |
| 3.7.1 | Reautenticação para operações sensíveis | 2     | ❌     | Não implementado                              |

---

## V4 — Controle de Acesso

| ID    | Requisito (resumido)                        | Nível | Status | Observação                                           |
| :---- | :------------------------------------------ | :---- | :----- | :--------------------------------------------------- |
| 4.1.1 | Negação por padrão                          | 1     | ✅     | CASL                                                 |
| 4.1.2 | Verificação de permissão em todas as rotas  | 1     | ⚠️     | Parcial — nem todas as rotas têm `requirePermission` |
| 4.1.3 | Verificação de ownership em nível de objeto | 1     | ⚠️     | Parcial — VULN não documentada ainda                 |
| 4.2.1 | Validação de multi-tenant                   | 1     | ⚠️     | Parcial                                              |
| 4.3.2 | Interface admin com autenticação separada   | 2     | ✅     | `actorType: 'user'` separado de customer             |

---

## V5 — Validação de Entrada

| ID    | Requisito (resumido)                    | Nível | Status | Observação                                                        |
| :---- | :-------------------------------------- | :---- | :----- | :---------------------------------------------------------------- |
| 5.1.1 | Whitelist de propriedades permitidas    | 1     | ⚠️     | Zod com `.strip()` por padrão, não `.strict()`                    |
| 5.1.2 | Sem mass assignment                     | 1     | ⚠️     | Depende do schema Zod de cada rota                                |
| 5.1.3 | Schema de validação em todos os inputs  | 1     | ⚠️     | Parcial — alguns endpoints sem schema de params/query             |
| 5.1.4 | Body limit definido                     | 1     | ⚠️     | Default 1 MiB — VULN-010 — Fase 7                                 |
| 5.2.1 | Sanitização de output HTML              | 1     | ⚠️     | React escapa por padrão; sem `dangerouslySetInnerHTML` encontrado |
| 5.3.4 | Sem SQL injection via ORM parametrizado | 1     | ✅     | Zero raw SQL                                                      |

---

## V6 — Criptografia

| ID    | Requisito (resumido)                        | Nível | Status | Observação        |
| :---- | :------------------------------------------ | :---- | :----- | :---------------- |
| 6.2.1 | Algoritmo aprovado para hash de senha       | 1     | ✅     | scrypt            |
| 6.2.2 | Salt único por usuário                      | 1     | ✅     | 16 bytes por hash |
| 6.2.3 | Não armazenar senha em texto claro          | 1     | ✅     | Apenas hash       |
| 6.3.1 | Geração criptograficamente segura de tokens | 1     | ✅     | `randomBytes()`   |

---

## V7 — Tratamento de Erros e Log

| ID    | Requisito (resumido)                | Nível | Status | Observação                   |
| :---- | :---------------------------------- | :---- | :----- | :--------------------------- |
| 7.1.1 | Não logar credenciais               | 1     | ✅     | `SENSITIVE_KEYS` em audit.ts |
| 7.1.2 | Não expor stack trace               | 1     | ✅     | `http-error-handler.ts`      |
| 7.2.1 | Logar eventos de autenticação       | 1     | ✅     | LOGIN, LOGIN_FAILED, LOGOUT  |
| 7.2.2 | Logar eventos de autorização falhos | 1     | ⚠️     | Parcial                      |
| 7.3.1 | Timestamp em UTC nos logs           | 1     | ✅     | Fastify logger padrão        |

---

## V9 — Comunicação

| ID    | Requisito (resumido)           | Nível | Status | Observação                 |
| :---- | :----------------------------- | :---- | :----- | :------------------------- |
| 9.1.1 | TLS para todas as comunicações | 1     | ✅     | Cloudflare em produção     |
| 9.1.2 | Versões TLS seguras            | 1     | ✅     | Gerenciado pela Cloudflare |
| 9.2.2 | CORS restritivo                | 1     | ✅     | Allowlist via env          |

---

## V13 — API e Web Service

| ID     | Requisito (resumido)                     | Nível | Status | Observação        |
| :----- | :--------------------------------------- | :---- | :----- | :---------------- |
| 13.1.1 | Usar HTTP correto (POST para mutações)   | 1     | ✅     |                   |
| 13.1.3 | Schema de validação em todas as entradas | 1     | ⚠️     | Parcial           |
| 13.2.1 | Schema de validação de params/query      | 1     | ⚠️     | Parcial           |
| 13.2.5 | Rate limiting na API                     | 1     | ❌     | VULN-002 — Fase 3 |
| 13.4.1 | Sem raw SQL                              | 1     | ✅     |                   |
