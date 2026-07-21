# Agent Guidelines — Verttex Monorepo

Welcome, AI Agent! This file acts as the source of truth for your behavior and execution constraints in the **Verttex** monorepo.

## 1. Reading Context File Priority

Always read files in the following order before editing:

1. `.ai/AGENT.md` (this document)
2. `.ai/ARCHITECTURE.md`
3. `.ai/WORKFLOWS.md`
4. `.ai/BACKEND_API.md` / `.ai/FRONTEND_UI.md` (depending on domain)
5. `.ai/BUSINESS_RULES.md` (for domain-specific constraints)
6. `.ai/PERMISSIONS.md` (for authorization questions)
7. `.ai/audit-rules.md` (for any feature that writes to the database)

## 2. Strict Architectural Policies

### 🔴 Permanent Audit Rule (Mandatory — No Exceptions)

> **Every new implementation must be analyzed from an audit perspective.**
>
> Every action performed by a user and every automatic action performed by the system that creates, changes, removes, publishes, archives, restores, approves, rejects, authenticates, imports, exports, or modifies the state of any resource **must generate an audit record** via `logAudit()` in `apps/api/src/shared/utils/audit.ts`.
>
> **No future feature that changes system state may be considered complete without its corresponding audit implementation.**

See `.ai/audit-rules.md` for the full audit documentation, action taxonomy, entity standards, checklist, and coverage matrix.

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

## 4. Domain Rules

- The official public domain is `verttexloja.com.br` — always use this in public URLs, metadata, examples, configs.
- **Never use** `verttex.com.br` as the primary domain.

## 5. Entity Naming Rules

- `User` represents **exclusively** management/admin users who access `apps/manager`.
- `Customer` represents **exclusively** marketplace buyers who access `apps/marketplace`.
- **Never** use `User` to represent customer buyers.
- **Never** use inline role checks like `if (user.role === 'admin')` — all authorization must go through CASL.

## 6. Authorization Rules

- The **backend is always the authoritative source of security**.
- The frontend hides UI elements for UX only — this does not replace backend validation.
- All protected routes must be validated by both `requirePermission` and `requireStoreAccess` where applicable.
- Permissions follow the `resource.action` naming convention. See `.ai/PERMISSIONS.md`.

## 7. Pending Decisions Registry

The following decisions from the Phase 1 overview document are **not yet confirmed** and must NOT be implemented until resolved:

1. Will employees have global access or only access to linked stores?
2. Can suppliers only view, or will they edit data in the future?
3. Can admins create new roles via the panel?
4. Can system role permissions be changed?
5. Will individual denials always override role permissions?
6. Will login be only by email?
7. Is email verification mandatory?
8. Are users created only by admins?
9. Can customers register freely?
10. Can the same person be both customer and supplier with the same email?
11. Will users, customers, and stores be soft-deleted or hard-deleted?
12. Is the custom domain field only informational in Phase 1?
13. Must all sessions be recorded?
14. Can a user terminate other sessions?
15. Should there be preparation for two-factor authentication?
16. Can employees receive access to specific stores?
17. Will there be a primary owner per store in the future?
18. Do slug changes need to be audited from the start?

> These are registered in `.roadmaps/planned/002-data-modeling.md` as blockers.

## 8. Forbidden Actions

- Do not write code outside of standard modules.
- Do not inject temporary tables or fake models to circumvent building.
- Do not hardcode secrets or credentials in configurations or `.env` files.
- Do not implement custom business rules unless they are explicitly spec'd out in `.ai/BUSINESS_RULES.md`.
- Do not implement out-of-scope features (products, orders, payments, etc.) without a confirmed follow-up specification.
