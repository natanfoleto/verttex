# Matriz de Rate Limiting — VERTTEX

> **Versão:** 1.0 — 2026-07-22  
> **Status:** Planejado — Fase 3  
> **Implementação:** `@fastify/rate-limit` com Redis (produção) / memória (desenvolvimento)  
> **Decisão:** SD-004  
> **Atualizar ao:** Adicionar novo endpoint sensível

---

## Estado Atual

❌ **Rate limiting não implementado.** Todos os endpoints estão sem proteção contra brute force ou abuso automatizado.

Ver VULN-002 no SECURITY_BACKLOG.md.

---

## Matriz de Limites (Baseline Inicial)

> Valores são baseline inicial. Devem ser ajustados com métricas reais de uso legítimo após implementação.

| Endpoint | Chave 1 | Limite 1 | Janela 1 | Chave 2 | Limite 2 | Janela 2 | Reação |
|:---|:---|:---|:---|:---|:---|:---|:---|
| `POST /auth/users/login` | conta (email normalizado) | 5 | 15 min | IP | 20 | 15 min | Atraso progressivo + 429 |
| `POST /auth/users/forgot-password` | conta | 3 | 30 min | IP | 10 | 30 min | Resposta genérica + 429 |
| `POST /auth/users/reset-password` | token/sessão de IP | 5 | 15 min | — | — | — | Invalidar + 429 |
| `POST /auth/users/change-password` | usuário autenticado | 5 | 15 min | — | — | — | Cooldown + 429 |
| `POST /auth/users/refresh` | IP | 30 | 15 min | — | — | — | 429 |
| `POST /auth/customers/register` | IP | 5 | 1 hora | — | — | — | 429 |
| `POST /auth/customers/login` | conta | 5 | 15 min | IP | 20 | 15 min | Atraso progressivo + 429 |
| `POST /auth/customers/forgot-password` | conta | 3 | 30 min | IP | 10 | 30 min | Resposta genérica + 429 |
| `GET /auth/users/me` | usuário autenticado | 60 | 1 min | — | — | — | 429 |
| API autenticada geral (leitura) | usuário | 300 | 1 min | IP | 600 | 1 min | 429 |
| API autenticada geral (escrita) | usuário | 30 | 1 min | — | — | — | 429 |
| `POST /users` (criar usuário) | usuário admin | 20 | 1 hora | — | — | — | 429 |
| Alteração de permissões/cargos | usuário admin | 10 | 15 min | — | — | — | Bloquear + alertar |
| Busca/autocomplete | usuário/IP | 60 | 1 min | — | — | — | 429 |
| Exportação de dados | usuário | 2 | 10 min | usuário | 10 | 24 horas | Enfileirar ou negar |
| Upload de arquivos | usuário | 10 | 1 min | usuário | 100 | 24 horas | 429 |
| Upload de arquivos | loja | configurável | 24 horas | — | — | — | Alerta + bloqueio |
| Convites | usuário remetente | 10 | 1 hora | — | — | — | Cooldown |
| Criação de pedido (futuro) | usuário/sessão | 5 | 1 min | — | — | — | Idempotência + 429 |
| Tentativa de cupom (futuro) | usuário + pedido | 10 | 15 min | — | — | — | Bloquear |

---

## Regras de Implementação

1. **Chaves independentes:** Limites por conta e por IP são **independentes** — não combinar em chave única
2. **Normalização de e-mail:** `email.toLowerCase().trim()` antes de usar como chave
3. **Resposta:** `429 Too Many Requests` com `Retry-After` header
4. **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
5. **Sem lockout permanente:** Preferir atraso progressivo, cooldown temporário e CAPTCHA adaptativo
6. **Logs:** Todo rate limit atingido deve gerar log estruturado
7. **Fingerprint:** Apenas sinal auxiliar — não usar como chave primária de rate limit

---

## Lockout — Política

Evitar bloqueios permanentes automáticos que possam ser usados para negar acesso a vítimas (Account DoS). Preferir:

- Atraso progressivo (1s → 2s → 5s → 10s)
- Cooldown temporário (ex: 15 min após N falhas)
- CAPTCHA adaptativo quando risco justificar
- Notificação ao usuário via e-mail
- MFA como requisito adicional após N falhas

---

## Implementação Técnica

```typescript
// apps/api/src/plugins/rate-limit.ts — a criar na Fase 3
import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'

export const rateLimitPlugin = fp(async (app) => {
  await app.register(rateLimit, {
    global: false,           // Configurar por rota
    max: 120,                // Default global
    timeWindow: '1 minute',
    // Redis: { client: redisClient } — quando Redis disponível
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  })
})
```
