# Security — VERTTEX

> Documentação de segurança do projeto VERTTEX NF.  
> **Todos os documentos aqui devem refletir o estado real do código, não apenas o estado desejado.**  
> **Idioma:** Português do Brasil.

## Referências normativas

- OWASP ASVS 5.0 — Nível alvo: **2** em toda a aplicação; **3** em autenticação, autorização, pagamentos e administração
- OWASP API Security Top 10
- OWASP Web Security Testing Guide (WSTG)
- OWASP Cheat Sheet Series
- NIST SSDF — Integração de segurança ao ciclo de desenvolvimento

## Índice

| Arquivo | Conteúdo |
|:---|:---|
| [SECURITY_POLICY.md](./SECURITY_POLICY.md) | Política de segurança do projeto |
| [AI_SECURITY_RULES.md](./AI_SECURITY_RULES.md) | Regras obrigatórias para IAs que colaboram no projeto |
| [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md) | Arquitetura de segurança e defesa em profundidade |
| [THREAT_MODEL.md](./THREAT_MODEL.md) | Modelo de ameaças por fluxo crítico |
| [ASVS_CHECKLIST.md](./ASVS_CHECKLIST.md) | Checklist OWASP ASVS 5.0 — estado atual |
| [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md) | Matriz de controle de acesso por endpoint |
| [BUSINESS_SECURITY_INVARIANTS.md](./BUSINESS_SECURITY_INVARIANTS.md) | Invariantes de segurança por fluxo de negócio |
| [AUTHENTICATION_SECURITY.md](./AUTHENTICATION_SECURITY.md) | Especificação de autenticação segura |
| [SESSION_AND_TOKEN_SECURITY.md](./SESSION_AND_TOKEN_SECURITY.md) | JWT, refresh tokens, revogação e sessões |
| [RATE_LIMIT_MATRIX.md](./RATE_LIMIT_MATRIX.md) | Matriz de rate limiting por endpoint |
| [INPUT_VALIDATION_POLICY.md](./INPUT_VALIDATION_POLICY.md) | Política de validação de entradas |
| [FILE_UPLOAD_SECURITY.md](./FILE_UPLOAD_SECURITY.md) | Pipeline de upload seguro de arquivos |
| [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md) | Gerenciamento de secrets |
| [SECURITY_LOGGING.md](./SECURITY_LOGGING.md) | Logs e auditoria de segurança |
| [SECURITY_TEST_PLAN.md](./SECURITY_TEST_PLAN.md) | Plano de testes automatizados de segurança |
| [AI_RED_TEAM_PLAN.md](./AI_RED_TEAM_PLAN.md) | Plano de testes ofensivos assistidos por IA |
| [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) | Plano de resposta a incidentes |
| [PENTEST_READINESS.md](./PENTEST_READINESS.md) | Preparação para pentest profissional |
| [SECURITY_DECISIONS.md](./SECURITY_DECISIONS.md) | Registro de decisões de segurança (ADRs) |
| [SECURITY_BACKLOG.md](./SECURITY_BACKLOG.md) | Backlog de vulnerabilidades e melhorias pendentes |

## Regras de manutenção desta documentação

1. Toda mudança de segurança deve atualizar o documento correspondente.
2. Toda decisão importante gera um registro em `SECURITY_DECISIONS.md`.
3. Toda exceção deve indicar justificativa, responsável, risco aceito e prazo de revisão.
4. Toda vulnerabilidade não corrigida imediatamente entra em `SECURITY_BACKLOG.md`.
5. Toda nova rota deve ser adicionada à `ACCESS_CONTROL_MATRIX.md`.
6. Todo endpoint sensível deve ser adicionado à `RATE_LIMIT_MATRIX.md`.
7. Todo novo tipo de arquivo deve ser documentado em `FILE_UPLOAD_SECURITY.md` antes de ser aceito.
8. Todo novo segredo deve ser registrado apenas pelo nome, finalidade, responsável e política de rotação — **nunca o valor**.
9. A documentação deve representar o código real.
