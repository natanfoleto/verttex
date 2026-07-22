# Plano de Testes de Segurança — VERTTEX

> **Versão:** 1.0 — 2026-07-22  
> **Status:** Planejado — Fase 10  
> **Referência:** OWASP WSTG, ASVS 5.0

---

## 1. Princípios

- Toda funcionalidade sensível deve ter testes positivos e negativos
- Vulnerabilidade corrigida → teste de regressão obrigatório
- Testes de segurança fazem parte do CI/CD — não são opcionais

---

## 2. Casos de Teste — Autenticação

| ID | Caso de Teste | Resultado Esperado |
|:---|:---|:---|
| AUTH-001 | Login com usuário inexistente | 401 com mensagem genérica |
| AUTH-002 | Login com senha errada | 401 com mensagem genérica |
| AUTH-003 | Diferença de tempo entre usuário inexistente e senha errada | Diferença < 100ms (timing attack mitigation) |
| AUTH-004 | Login com conta inativa | 401 com mensagem genérica |
| AUTH-005 | Rate limit de login por conta | 429 após 5 tentativas em 15 min |
| AUTH-006 | Rate limit de login por IP | 429 após 20 tentativas em 15 min |
| AUTH-007 | Token expirado | 401 |
| AUTH-008 | Token alterado (assinatura inválida) | 401 |
| AUTH-009 | Token com `alg: none` | 401 |
| AUTH-010 | `jti` na denylist | 401 (Fase 4) |
| AUTH-011 | Refresh token reutilizado após rotação | 401 + família revogada (Fase 5) |
| AUTH-012 | Logout invalida sessão | Próximo request com mesmo token → 401 |
| AUTH-013 | Reset de senha revoga todas as sessões | Token anterior → 401 |
| AUTH-014 | Alteração de senha revoga sessões | Token anterior → 401 |
| AUTH-015 | forgot-password com e-mail inexistente | Resposta genérica, sem diferença |

---

## 3. Casos de Teste — Autorização

| ID | Caso de Teste | Resultado Esperado |
|:---|:---|:---|
| AUTHZ-001 | Usuário A acessando dados do usuário B | 403 ou 404 |
| AUTHZ-002 | Funcionário chamando endpoint admin | 403 |
| AUTHZ-003 | Alterar ID na URL para objeto de outro usuário | 403 ou 404 |
| AUTHZ-004 | Mass assignment de `roleId` via body | Campo ignorado |
| AUTHZ-005 | Mass assignment de `status: 'admin'` | Campo ignorado |
| AUTHZ-006 | Customer tentando chamar endpoint de User | 401 |
| AUTHZ-007 | User tentando chamar endpoint de Customer | 401 |
| AUTHZ-008 | Funcionário acessando loja não vinculada | 403 |

---

## 4. Casos de Teste — Validação de Entrada

| ID | Caso de Teste | Resultado Esperado |
|:---|:---|:---|
| INPUT-001 | Body com campo extra não definido no schema | Campo ignorado ou 400 |
| INPUT-002 | String com comprimento acima do máximo | 400 |
| INPUT-003 | Array com mais items que o máximo | 400 |
| INPUT-004 | Número fora do range permitido | 400 |
| INPUT-005 | `pageSize` acima de 100 | Limitado a 100 ou 400 |
| INPUT-006 | Payload acima do body limit | 413 |
| INPUT-007 | SQL injection em campo de busca | 400 ou resultado vazio |
| INPUT-008 | XSS payload em campo de texto | 400 ou saída escapada |

---

## 5. Casos de Teste — Crypto e Senha

| ID | Caso de Teste | Resultado Esperado |
|:---|:---|:---|
| CRYPTO-001 | Hash sem formato `salt:hash` (legado) → verifyPassword | false |
| CRYPTO-002 | Comparação com token correto | true |
| CRYPTO-003 | Comparação com token alterado | false |
| CRYPTO-004 | Salt é único por usuário | Dois hashes de mesma senha são diferentes |

---

## 6. Casos de Teste — Rate Limit (Fase 3)

| ID | Caso de Teste | Resultado Esperado |
|:---|:---|:---|
| RL-001 | 6 logins falhos de mesma conta em 15 min | 6ª tentativa → 429 |
| RL-002 | 21 tentativas de IPs diferentes da mesma conta | Limitado por conta |
| RL-003 | Alterar e-mail para burlar rate limit por conta | Cada e-mail tem seu próprio bucket |

---

## 7. Framework de Testes

A ser definido na Fase 10. Candidatos:
- **Integração/E2E na API**: `vitest` + `supertest` ou `fastify.inject()`
- **Testes de segurança automatizados**: Scripts customizados

---

## 8. Referências

- OWASP WSTG — Testing for Authentication
- OWASP WSTG — Testing for Authorization
- OWASP WSTG — Testing for Input Validation
- ASVS 5.0 — V2 (Authentication), V3 (Session), V4 (Access Control), V5 (Input Validation)
