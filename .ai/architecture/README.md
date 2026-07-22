# Arquitetura — VERTTEX NF

> **Categoria:** Visão Geral de Arquitetura e Decisões de Design  
> **Localização:** `.ai/architecture/`

## Objetivo da Categoria
Esta pasta contém os documentos que descrevem a arquitetura geral do ecossistema VERTTEX NF, incluindo topologia de monorepo, separação entre aplicações (API, Manager, Marketplace, pacotes compartilhados), modelo de dados e decisões estruturais (ADRs).

## Documentos Vigentes (Fontes de Verdade)
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Documento principal de visão geral de arquitetura, stack tecnológica e estrutura de pastas.

## Subpastas
- [decisions/](./decisions/README.md) — Registro de Decisões de Arquitetura (ADRs).

## Regras de Atualização
1. Qualquer alteração estrutural no monorepo, alteração de framework ou introdução de novo pacote compartilhado deve ser refletida em `ARCHITECTURE.md`.
2. Decisões arquiteturais de grande impacto devem gerar um ADR registrado em `decisions/`.

## Relação com Outras Categorias
- **Backend:** Detalhes de implementação da API Fastify ficam em `.ai/backend/`.
- **Frontend:** Detalhes de UI/UX do Manager e Marketplace ficam em `.ai/frontend/`.
- **Segurança:** Políticas e arquitetura técnica de segurança ficam em `.ai/security/`.
