# Domínio e Regras de Negócio — VERTTEX

> **Categoria:** Regras de Negócio, Permissões Funcionais e Fluxos do Sistema  
> **Localização:** `.ai/domain/`

## Objetivo da Categoria

Esta pasta documenta o coração da aplicação VERTTEX NF: entidades de negócio (Usuários, Cargos, Permissões, Lojas, Clientes, Produtos), fluxos de trabalho e regras funcionais.

## Documentos Vigentes (Fontes de Verdade)

- [BUSINESS_RULES.md](./BUSINESS_RULES.md) — Regras de negócio por módulo (Lojas, Usuários, Cargos, Produtos, Estoque).
- [PERMISSIONS.md](./PERMISSIONS.md) — Modelo funcional de cargos, permissões e precedência de overrides.
- [WORKFLOWS.md](./WORKFLOWS.md) — Fluxos de trabalho do usuário e passos operacionais.

## Regras de Atualização

1. Qualquer regra de validação de negócio ou transição de estado de entidade deve ser atualizada em `BUSINESS_RULES.md`.
2. O catálogo funcional de permissões (`resource.action`) deve ser mantido em `PERMISSIONS.md`.

## Relação com Segurança

- `PERMISSIONS.md` documenta a regra de negócio e o modelo funcional de permissões.
- `.ai/security/ACCESS_CONTROL_MATRIX.md` documenta e verifica os controles técnicos de autorização na API.
- Ambos os documentos são complementares e não devem conter regras conflitantes.
