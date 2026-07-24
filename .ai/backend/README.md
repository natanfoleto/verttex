# Backend & API — VERTTEX

> **Categoria:** Documentação de Serviços, APIs e Banco de Dados  
> **Localização:** `.ai/backend/`

## Objetivo da Categoria

Esta pasta centraliza toda a documentação referente ao backend da plataforma VERTTEX NF, incluindo convenções de API RESTful (Fastify), integração com Prisma ORM, PostgreSQL, estratégias de erro, middlewares e rotas.

## Documentos Vigentes (Fontes de Verdade)

- [BACKEND_API.md](./BACKEND_API.md) — Contrato da API, padronização de respostas JSON, exceções, módulos e autenticação.

## Regras de Atualização

1. Novos módulos, endpoints ou middlewares criados na API Fastify (`apps/api`) devem ser documentados em `BACKEND_API.md`.
2. As matrizes técnicas de controle de acesso e segurança da API devem ser mantidas em sintonia com `.ai/security/ACCESS_CONTROL_MATRIX.md`.

## O que NÃO deve estar nesta pasta

- Regras de negócio puras (devem ficar em `.ai/domain/`).
- Especificações de interface visual (devem ficar em `.ai/frontend/`).
- Políticas de segurança e auditoria técnica (devem ficar em `.ai/security/`).
