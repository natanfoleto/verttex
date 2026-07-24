# Observabilidade e Auditoria — VERTTEX

> **Categoria:** Regras de Audit Log, Logs Estruturados e Rastreabilidade  
> **Localização:** `.ai/observability/`

## Objetivo da Categoria

Esta pasta documenta os requisitos e padrões de observabilidade do projeto VERTTEX NF, garantindo que toda mutação de dados e evento crítico seja auditado e rastreável.

## Documentos Vigentes (Fontes de Verdade)

- [AUDIT_RULES.md](./AUDIT_RULES.md) — Taxonomia de ações de auditoria, sanitização de dados sensíveis, checklist e matriz de cobertura de audit log.

## Regras de Atualização

1. Qualquer novo módulo ou entidade que passe a registrar histórico de mutações deve ter suas ações e taxonomias documentadas em `AUDIT_RULES.md`.
2. A política de proteção contra vazamento de credenciais em logs deve seguir `.ai/security/SECURITY_LOGGING.md`.
