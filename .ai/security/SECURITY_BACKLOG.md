# Backlog de Segurança — VERTTEX

> Toda vulnerabilidade, lacuna ou melhoria de segurança que não pode ser corrigida imediatamente deve ser registrada aqui.  
> **Nenhuma vulnerabilidade pode ser ignorada silenciosamente.**

---

## Legenda de Severidade

| Severidade     | Critério                                                                |
| :------------- | :---------------------------------------------------------------------- |
| 🔴 **Crítico** | Exploração imediata possível, dados comprometidos, perda de controle    |
| 🟠 **Alto**    | Vetor de ataque direto disponível, impacto significativo                |
| 🟡 **Médio**   | Exploração possível com condições específicas ou acesso pré-autenticado |
| 🟢 **Baixo**   | Melhoria de postura, sem exploração imediata                            |

---

## VULN-001 — Fallback Inseguro em `verifyPassword`

| Campo                | Conteúdo                                                                                                                                                                                                                                                                                                                                                                                  |
| :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severidade**       | 🔴 Crítico                                                                                                                                                                                                                                                                                                                                                                                |
| **Status**           | 🔧 Em correção — Fase 6                                                                                                                                                                                                                                                                                                                                                                   |
| **Data de registro** | 2026-07-22                                                                                                                                                                                                                                                                                                                                                                                |
| **Arquivo**          | [`apps/api/src/shared/utils/crypto.ts:L24-27`](../../apps/api/src/shared/utils/crypto.ts#L24-L27)                                                                                                                                                                                                                                                                                         |
| **Descrição**        | A função `verifyPassword` possui um fallback que, quando o hash armazenado não contém `:`, realiza comparação direta de string (`password === storedHash`). Isso significa que qualquer usuário cujo hash foi gerado sem o separador `:` (ex: hashes de seed, hashes legados em texto claro, ou `storedHash.includes(password)`) pode ter sua senha aceita sem verificação criptográfica. |
| **Evidência**        | `if (!storedHash.includes(':')) { return password === storedHash \|\| storedHash.includes(password) }`                                                                                                                                                                                                                                                                                    |
| **Impacto**          | Autenticação bypassada para usuários com hash sem formato correto                                                                                                                                                                                                                                                                                                                         |
| **Correção**         | Remover o bloco legado; retornar `false` para hashes sem formato `salt:hash`; regenerar seeds usando `hashPassword()`                                                                                                                                                                                                                                                                     |
| **Fase**             | Fase 6                                                                                                                                                                                                                                                                                                                                                                                    |

---

## VULN-002 — Ausência de Rate Limiting

| Campo                | Conteúdo                                                                                                                                                                            |
| :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severidade**       | 🟠 Alto                                                                                                                                                                             |
| **Status**           | ⏳ Planejado — Fase 3                                                                                                                                                               |
| **Data de registro** | 2026-07-22                                                                                                                                                                          |
| **Arquivo**          | — (ausência de controle)                                                                                                                                                            |
| **Descrição**        | Nenhum endpoint possui rate limiting. Endpoints de login, forgot-password e cadastro estão abertos a brute force, credential stuffing e abuso automatizado sem qualquer throttling. |
| **Impacto**          | Brute force de credenciais, enumeração de contas via timing, sobrecarga da API                                                                                                      |
| **Correção**         | Implementar `@fastify/rate-limit` com chaves independentes por IP e por conta                                                                                                       |
| **Fase**             | Fase 3                                                                                                                                                                              |

---

## VULN-003 — Ausência de Headers HTTP de Segurança

| Campo                | Conteúdo                                                                                                                                                                                                               |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severidade**       | 🟠 Alto                                                                                                                                                                                                                |
| **Status**           | ⏳ Planejado — Fase 2                                                                                                                                                                                                  |
| **Data de registro** | 2026-07-22                                                                                                                                                                                                             |
| **Arquivo**          | [`apps/api/src/app.ts`](../../apps/api/src/app.ts)                                                                                                                                                                     |
| **Descrição**        | `@fastify/helmet` não está instalado. Nenhum dos headers de segurança recomendados está sendo enviado: sem HSTS, sem `X-Content-Type-Options`, sem `X-Frame-Options`, sem `Referrer-Policy`, sem `Permissions-Policy`. |
| **Impacto**          | MIME sniffing, clickjacking, information disclosure, ausência de second line of defense contra XSS                                                                                                                     |
| **Correção**         | Instalar e configurar `@fastify/helmet`                                                                                                                                                                                |
| **Fase**             | Fase 2                                                                                                                                                                                                                 |

---

## VULN-004 — Claims JWT Incompletos (sem jti, iss, aud)

| Campo                | Conteúdo                                                                                                                                                                                                                                                               |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severidade**       | 🟡 Médio-Alto                                                                                                                                                                                                                                                          |
| **Status**           | ⏳ Planejado — Fase 4                                                                                                                                                                                                                                                  |
| **Data de registro** | 2026-07-22                                                                                                                                                                                                                                                             |
| **Arquivo**          | [`apps/api/src/modules/auth-users/auth-users.service.ts:L66-74`](../../apps/api/src/modules/auth-users/auth-users.service.ts#L66-L74)                                                                                                                                  |
| **Descrição**        | O access token JWT não inclui `jti` (impossibilita revogação imediata), `iss` (permite confusão entre emissores) ou `aud` (permite uso de token em contexto errado). O logout apenas revoga a sessão no banco, mas o access token permanece válido por até 15 minutos. |
| **Impacto**          | Token roubado permanece válido por 15 min após logout; confusão de tokens entre contextos                                                                                                                                                                              |
| **Correção**         | Adicionar `jti`, `iss`, `aud`; implementar denylist de `jti`                                                                                                                                                                                                           |
| **Fase**             | Fase 4                                                                                                                                                                                                                                                                 |

---

## VULN-005 — `trustProxy` Não Configurado

| Campo                | Conteúdo                                                                                                                                                                                                                                                                                             |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severidade**       | 🟡 Médio                                                                                                                                                                                                                                                                                             |
| **Status**           | ⏳ Planejado — Fase 4                                                                                                                                                                                                                                                                                |
| **Data de registro** | 2026-07-22                                                                                                                                                                                                                                                                                           |
| **Arquivo**          | [`apps/api/src/server.ts`](../../apps/api/src/server.ts)                                                                                                                                                                                                                                             |
| **Descrição**        | O Fastify não está configurado com `trustProxy`. Em ambiente com Cloudflare como proxy reverso, o IP real do cliente está em `X-Forwarded-For`. Sem `trustProxy`, o `request.ip` pode ser o IP do Cloudflare, e rate limits baseados em IP seriam bypassáveis por falsificação de `X-Forwarded-For`. |
| **Impacto**          | Rate limit por IP ineficaz; auditoria com IP incorreto                                                                                                                                                                                                                                               |
| **Correção**         | Configurar `trustProxy: 1` no Fastify                                                                                                                                                                                                                                                                |
| **Fase**             | Fase 4                                                                                                                                                                                                                                                                                               |

---

## VULN-006 — Detecção de Reutilização de Refresh Token Ausente

| Campo                | Conteúdo                                                                                                                                                                                                                                                                                                                    |
| :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severidade**       | 🟡 Médio                                                                                                                                                                                                                                                                                                                    |
| **Status**           | ⏳ Planejado — Fase 5                                                                                                                                                                                                                                                                                                       |
| **Data de registro** | 2026-07-22                                                                                                                                                                                                                                                                                                                  |
| **Arquivo**          | [`apps/api/src/modules/auth-users/auth-users.service.ts:L198-255`](../../apps/api/src/modules/auth-users/auth-users.service.ts#L198-L255)                                                                                                                                                                                   |
| **Descrição**        | O refresh token é rotacionado a cada uso (o antigo é revogado e um novo é criado). Porém, se um atacante roubar um refresh token antes da rotação e o usar após a vítima já ter gerado um novo, a sessão do atacante não é detectada. A detecção de reutilização (usar token já revogado = suspeito) não está implementada. |
| **Impacto**          | Token de refresh comprometido pode ser usado por atacante sem alertas                                                                                                                                                                                                                                                       |
| **Correção**         | Implementar `familyId`; detectar uso de token de família revogada; revogar família inteira e alertar                                                                                                                                                                                                                        |
| **Fase**             | Fase 5                                                                                                                                                                                                                                                                                                                      |

---

## VULN-007 — `LOGIN_FAILED` Persiste E-mail Tentado no Banco

| Campo                | Conteúdo                                                                                                                                                                 |
| :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severidade**       | 🟡 Médio                                                                                                                                                                 |
| **Status**           | ⏳ Aguardando Fase 3 (rate limit)                                                                                                                                        |
| **Data de registro** | 2026-07-22                                                                                                                                                               |
| **Arquivo**          | [`apps/api/src/modules/auth-users/auth-users.controller.ts:L56`](../../apps/api/src/modules/auth-users/auth-users.controller.ts#L56)                                     |
| **Descrição**        | O audit log de `LOGIN_FAILED` armazena `attemptedEmail: request.body.email`. Isso pode expor e-mails de ataque (que podem ser e-mails de vítimas) nos logs de auditoria. |
| **Impacto**          | Acumulação de e-mails de tentativas nos logs; privacidade                                                                                                                |
| **Correção**         | Substituir por hash ou truncamento do e-mail, ou logar apenas o domínio                                                                                                  |
| **Fase**             | Fase 3 / Fase 9                                                                                                                                                          |

---

## VULN-008 — CI/CD Inexistente

| Campo                | Conteúdo                                                                                                                                                                |
| :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severidade**       | 🟠 Alto (risco operacional e de supply chain)                                                                                                                           |
| **Status**           | ⏳ Planejado — Fase 9                                                                                                                                                   |
| **Data de registro** | 2026-07-22                                                                                                                                                              |
| **Arquivo**          | — (ausência de `.github/workflows/`)                                                                                                                                    |
| **Descrição**        | Não há pipeline de CI/CD. Nenhuma verificação automática de typecheck, lint, testes, secrets, dependências vulneráveis ou Prisma raw SQL é executada em commits ou PRs. |
| **Impacto**          | Código com erros, vulnerabilidades ou secrets pode entrar no repositório sem detecção                                                                                   |
| **Correção**         | Criar GitHub Actions com gates de segurança obrigatórios                                                                                                                |
| **Fase**             | Fase 9                                                                                                                                                                  |

---

## VULN-009 — CSP Ausente nos Frontends

| Campo                | Conteúdo                                                                                                                                                              |
| :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severidade**       | 🟡 Médio                                                                                                                                                              |
| **Status**           | ⏳ Planejado — Fase 8                                                                                                                                                 |
| **Data de registro** | 2026-07-22                                                                                                                                                            |
| **Arquivo**          | `apps/manager/` e `apps/marketplace/` — sem `next.config.ts`                                                                                                          |
| **Descrição**        | Nenhum dos frontends possui Content-Security-Policy. Sem CSP, XSS armazenado ou refletido pode executar scripts arbitrários sem nenhuma camada adicional de proteção. |
| **Impacto**          | XSS sem segunda linha de defesa                                                                                                                                       |
| **Correção**         | Implementar CSP via `next.config.ts` com `Content-Security-Policy-Report-Only` primeiro                                                                               |
| **Fase**             | Fase 8                                                                                                                                                                |

---

## VULN-010 — Body Limit Global Não Configurado Explicitamente

| Campo                | Conteúdo                                                                                                                                            |
| :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severidade**       | 🟢 Baixo-Médio                                                                                                                                      |
| **Status**           | ⏳ Planejado — Fase 7                                                                                                                               |
| **Data de registro** | 2026-07-22                                                                                                                                          |
| **Arquivo**          | [`apps/api/src/app.ts`](../../apps/api/src/app.ts)                                                                                                  |
| **Descrição**        | O Fastify possui body limit padrão de 1 MiB, mas não está configurado explicitamente. Rotas que deveriam aceitar no máximo 16 KB aceitam até 1 MiB. |
| **Impacto**          | Payloads excessivos podem causar sobrecarga de parsing                                                                                              |
| **Correção**         | Configurar `bodyLimit: 256 * 1024` (256 KB) globalmente com exceções documentadas                                                                   |
| **Fase**             | Fase 7                                                                                                                                              |
