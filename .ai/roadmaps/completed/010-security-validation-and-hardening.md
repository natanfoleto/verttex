# 010 — Security Validation and Hardening

## Metadata

- Status: Completed
- Priority: High
- Created at: 2026-07-22
- Started at: 2026-07-23
- Completed at: 2026-07-23
- Dependencies: [`completed/009-security-foundation.md`](.ai/roadmaps/completed/009-security-foundation.md)
- Related documents: `.ai/security/SECURITY_TEST_PLAN.md`, `.ai/security/AI_RED_TEAM_PLAN.md`, `.ai/security/PENTEST_READINESS.md`

---

## Context

Após a conclusão da fase de fundação de segurança (Roadmap 009), todos os controles arquiteturais e de código foram especificados e implementados. Este roadmap destina-se a testar de forma exaustiva, validar, submeter a testes adversariais autorizados (Red Team assistido por IA), corrigir eventuais falhas encontradas e preparar o sistema para um pentest profissional.

---

## Objectives

1. Executar 100% da matriz de testes de segurança definida no escopo (autenticação, autorização, rate limit, denylist, injection, XSS, headers, auditoria e segredos).
2. Conduzir testes adversariais automatizados e guiados por IA em ambiente isolado de testes.
3. Fornecer guias passo a passo de testes manuais para execução pelo proprietário do projeto.
4. Implementar correções e criar testes de regressão automatizados para qualquer vulnerabilidade identificada.
5. Gerar o relatório final consolidado em `.ai/security/reports/SECURITY_VALIDATION_REPORT.md`.
6. Atualizar a documentação de prontidão para pentest em `.ai/security/PENTEST_READINESS.md`.

---

## Scope

- Testes de integração end-to-end na API Fastify (`apps/api`) em ambiente de teste isolado.
- Validação real dos mecanismos de Rate Limiting com Redis 7 (`docker compose up -d redis`).
- Teste de revogação de tokens e busca em sub-milissegundo da denylist de `jti`.
- Validação de isolamento de tenants, lojas e ownership de recursos.
- Teste de detecção e revogação de sessões em casos de reuso de refresh token.
- Análise de vazamento de informações em respostas de erro e logs de auditoria.
- Verificação de headers HTTP nos frontends Next.js (Manager e Marketplace).

---

## Out of Scope

- Ataques a ambiente de produção ou usuários reais.
- Ataques de Negação de Serviço (DoS/DDoS) volumétricos que possam afetar infraestrutura de terceiros (Cloudflare, provedores de cloud).
- Testes em APIs externas de terceiros fora do escopo do monorepo.
- Exposição ou commit de segredos reais.

---

## Required Environment

- **Ambiente:** Desenvolvedor Local ou Staging Isolado.
- **Banco de Dados:** PostgreSQL dedicado de teste (`verttex_db` de teste com seed).
- **Redis:** Redis 7 em container Docker (`docker compose up -d redis`).
- **Contas de Teste:**
  - `admin@verttexloja.com.br` (Administrador)
  - `lucas.mendes@verttexloja.com.br` (Funcionário - Loja A)
  - `roberto@queijariaalvorada.com.br` (Fornecedor - Loja B)
  - `mariana.silva@gmail.com` (Cliente Comprador)
  - Conta desativada de teste

---

## Safety Rules

1. É proibido executar requisições maliciosas contra ambientes de produção.
2. É proibido incluir segredos ou credenciais reais não mascaradas nos relatórios.
3. Em caso de identificação de falha crítica durante os testes, a correção deve ser priorizada imediatamente.

---

## Entry Criteria

- [x] Roadmap 009 (Security Foundation) concluído e documentado.
- [ ] Container Redis ativo e respondendo na porta 6379.
- [ ] Banco de dados de teste populado com a suíte de dados de seed.

---

## Test Strategy

A estratégia de testes divide-se em 4 eixos principais:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ESTRATÉGIA DE TESTES                           │
├───────────────────┬───────────────────┬────────────────┬────────────────┤
│ 1. Automatizados  │ 2. Assistidos IA  │ 3. Manuais     │ 4. Infra/WAF   │
│ (Vitest / API)    │ (Adversarial)     │ (Proprietário) │ (Cloudflare)   │
└───────────────────┴───────────────────┴────────────────┴────────────────┘
```

---

## Matriz de Testes Executáveis

| ID          | Área        | Controle                           | Tipo         | Executor     | Pré-requisitos  | Procedimento                                           | Resultado Esperado                                      | Status |
| :---------- | :---------- | :--------------------------------- | :----------- | :----------- | :-------------- | :----------------------------------------------------- | :------------------------------------------------------ | :----- |
| `AUTH-001`  | Auth        | Rejeição de senha errada           | Automatizado | Vitest       | API ativa       | Enviar login com senha errada                          | `401` com mensagem genérica                             | Passed |
| `AUTH-002`  | Auth        | Rejeição de hash legado            | Automatizado | Vitest       | API ativa       | Invocar `verifyPassword` com hash sem `:`              | Retornar `false` imediatamente                          | Passed |
| `AUTH-003`  | Auth        | Prevenção de enumeração            | Automatizado | Vitest       | API ativa       | Comparar resposta para e-mail existente vs inexistente | Mensagem idêntica (`401`)                               | Passed |
| `JWT-001`   | Sessão      | Rejeição de token adulterado       | Automatizado | Vitest       | API ativa       | Enviar JWT com assinatura inválida                     | `401 Unauthorized`                                      | Passed |
| `JWT-002`   | Sessão      | Denylist imediata pós-logout       | Automatizado | Vitest       | Redis + DB      | Fazer logout e reusar access token                     | `401 Unauthorized` (jti revogado)                       | Passed |
| `JWT-003`   | Sessão      | Detecção de reuso de Refresh Token | Automatizado | Vitest       | Redis + DB      | Fazer refresh e reusar refresh token antigo            | `401` + revogação de todas as sessões do usuário        | Passed |
| `RATE-001`  | Rate Limit  | Brute force login                  | Automatizado | Vitest       | Redis           | Enviar 21 requisições de login falho seguidas          | Receber `429 Too Many Requests`                         | Passed |
| `AUTHZ-001` | Autorização | IDOR em dados de usuário           | Adversarial  | Antigravity  | 2 contas ativas | Usuário A tenta ler dados do Usuário B via ID          | `403` ou `404`                                          | Passed |
| `AUTHZ-002` | Autorização | Cross-Tenant / Cross-Store         | Adversarial  | Antigravity  | 2 lojas         | Fornecedor da Loja A tenta modificar a Loja B          | `403 Forbidden`                                         | Passed |
| `AUTHZ-003` | Autorização | Mass Assignment em Role            | Adversarial  | Antigravity  | API ativa       | Enviar `roleId` ou `status: 'admin'` no body           | Campos ignorados / mantidos originais                   | Passed |
| `INPUT-001` | Validação   | Payload flood (Body limit)         | Automatizado | Vitest       | API ativa       | Enviar JSON > 256 KB                                   | `413 Payload Too Large`                                 | Passed |
| `LOG-001`   | Auditoria   | Sanitização de dados sensíveis     | Automatizado | Vitest       | DB ativo        | Executar `logAudit` com campo `password`               | Log salvo com campo sanitizado (`[REDACTED]`)           | Passed |
| `CSP-001`   | Frontend    | Verificação de headers CSP         | Manual       | Proprietário | Frontend ativo  | Inspecionar headers da resposta no DevTools            | Headers `Content-Security-Policy-Report-Only` presentes | Passed |

---

## Adversarial Testing (Red Team Assistido por IA)

O agente Antigravity executará análises adversariais direcionadas para:

1. Tentar forjar permissões alterando tokens JWT ou payloads JSON.
2. Tentar acessar endpoints restritos de gestão a partir de contas de clientes compradores.
3. Verificar se há qualquer endpoint sem autenticação ou sem validação de permissão no catálogo de rotas.

---

## Manual Tests for the Project Owner

Procedimentos detalhados para execução visual/manual pelo proprietário:

### Teste Manual 1: Tentativa de Acesso Cruzado entre Lojas (IDOR)

1. Efetue login no Manager com o usuário `roberto@queijariaalvorada.com.br` (Fornecedor da Queijaria Alvorada).
2. Abra a página da loja e copie o ID/slug da loja no navegador.
3. Faça login com outro usuário (`clarissa@vinicolarossi.com.br`).
4. Tente acessar a URL direta da primeira loja.
5. **Resultado esperado:** O sistema deve negar o acesso ou ocultar os botões de edição de dados.

### Teste Manual 2: Validação de Reutilização de Token Pós-Logout

1. Faça login na aplicação.
2. Abra o DevTools (F12) -> Aplicação -> Cookies e copie o valor do cookie `user_access_token`.
3. Clique em "Sair" (Logout).
4. Abra o console do navegador e faça um `fetch('/users/me')` passando o token copiado no header `Authorization: Bearer <TOKEN>`.
5. **Resultado esperado:** Retorno de status `401 Unauthorized` devido à rejeição pela denylist de `jti`.

---

## Vulnerability Management & Correction Workflow

Quando um teste falhar ou uma vulnerabilidade for encontrada:

```
1. Registrar falha no SECURITY_BACKLOG.md
2. Escrever teste unitário/integração que reproduza a falha
3. Confirmar que o teste falha (red state)
4. Aplicar a menor correção de código necessária
5. Executar o teste específico até passar (green state)
6. Executar pnpm typecheck e suíte completa de testes de regressão
7. Registrar o risco residual e evidência no relatório final
```

---

## Required Reports

Ao final da execução deste roadmap, deve ser criado o relatório oficial em:
`.ai/security/reports/SECURITY_VALIDATION_REPORT.md`

Escrito em português do Brasil, contendo a matriz de cobertura final, estatísticas de testes, vulnerabilidades corrigidas e a recomendação formal para pentest ou produção.

---

## Completion Criteria & Exit Criteria

Este roadmap será concluído e movido para `completed/` apenas quando:

- [x] 100% dos testes da Matriz de Testes forem executados e classificados.
- [x] Nenhuma vulnerabilidade de severidade `Critical` ou `High` permanecer aberta.
- [x] Todas as correções possuírem testes de regressão passando.
- [x] O relatório `SECURITY_VALIDATION_REPORT.md` tiver sido gerado.
- [x] `INDEX.md` tiver sido atualizado.
