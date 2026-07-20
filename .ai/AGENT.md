# Agent Guidelines — Verttex Monorepo

Welcome, AI Agent! This file acts as the source of truth for your behavior and execution constraints in the **Verttex** monorepo.

## 1. Reading Context File Priority

Always read files in the following order before editing:

1. `.ai/AGENT.md` (this document)
2. `.ai/ARCHITECTURE.md`
3. `.ai/WORKFLOWS.md`
4. `.ai/BACKEND_API.md` / `.ai/FRONTEND_UI.md` (depending on domain)

## 2. strict Architectural Policies

### Package dependency rules

- `apps/` can import `packages/` via package workspace bindings (e.g. `@verttex/ui`, `@verttex/env`).
- `packages/` MUST NEVER import anything from `apps/` or other internal apps.
- One app MUST NEVER import files directly from another app (e.g. no imports from `apps/api/src` inside `apps/manager`).
- `@verttex/types` must remain a runtime utility package and has no dependencies on React or Fastify.

### Import and Export Policies

- **Named Exports ONLY**: Always use named exports for functions, React components, hooks, controllers, utility files, routes, schemas.
- **Default Exports restrictions**: Only use default exports for Special Next.js router files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`) or configuration files when strictly required.
- **Automatic Sort**: All imports must be ordered via `eslint-plugin-simple-import-sort`. Do not sort imports manually.

### Naming Conventions

- **Files**: Always `kebab-case` (e.g., `user-controller.ts`).
- **React Components / TS Types**: Always `PascalCase` (e.g., `Button`).
- **Functions, Hooks, Variables**: Always `camelCase` (e.g., `useAuth`).
- **Schemas**: Always end with `Schema` (e.g., `PaginationMetaSchema`).

## 3. Database & Migrations Rules

- **NEVER run `prisma db push` or `prisma db reset`** on development/production databases.
- **MIGRATIONS ONLY**: To modify the database, run:
  ```bash
  pnpm db:migrate
  ```
  This calls `prisma migrate dev` under the hood. Keep all migrations in `apps/api/prisma/migrations`.

## 4. Forbidden Actions

- Do not write code outside of standard modules.
- Do not inject temporary tables or fake models to circumvent building.
- Do not hardcode secrets or credentials in configurations or `.env` files.
- Do not implement custom business rules unless they are explicitly spec'd out in `.ai/BUSINESS_RULES.md`.
