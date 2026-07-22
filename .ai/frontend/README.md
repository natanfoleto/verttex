# Frontend & UI/UX — VERTTEX

> **Categoria:** Padrões de Interface, Design System e Comportamento Visual  
> **Localização:** `.ai/frontend/`

## Objetivo da Categoria
Esta pasta centraliza as especificações das aplicações visuais do projeto:
- **Manager (`apps/manager`):** Painel administrativo/gestor.
- **Marketplace (`apps/marketplace`):** E-commerce dos clientes compradores.

## Documentos Vigentes (Fontes de Verdade)
- [FRONTEND_UI.md](./FRONTEND_UI.md) — Diretrizes de UI/UX, componentes React/Next.js 15, padrões de formulários, modais, tabela, empty states e tratamento visual de erros.

## Regras de Atualização
1. Todo padrão repetível de página, formulário, tabela, modal, feedback, loading e erro deve ser documentado em `FRONTEND_UI.md` antes de ser replicado em larga escala.
2. Alterações de design system ou layout global devem ser refletidas aqui.

## O que NÃO deve estar nesta pasta
- Regras de autorização backend (devem ficar em `.ai/domain/PERMISSIONS.md` e `.ai/security/`).
- Contratos de payload de API (devem ficar em `.ai/backend/BACKEND_API.md`).
