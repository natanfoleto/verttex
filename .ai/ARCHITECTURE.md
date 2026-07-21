# Architecture Overview — Verttex

This document describes the high-level system architecture and structural components of the Verttex project.

## 1. Monorepo Organization

The monorepo uses `pnpm workspaces` and `Turborepo` for package building and caching orchestration:

```mermaid
graph TD
  manager[apps/manager] --> ui[@verttex/ui]
  manager --> env[@verttex/env]
  manager --> types[@verttex/types]
  manager --> auth[@verttex/auth]

  marketplace[apps/marketplace] --> ui
  marketplace --> env
  marketplace --> types
  marketplace --> auth

  api[apps/api] --> env
  api --> types
  api --> auth

  ui --> types
  auth --> types
```

### Core Parts

1.  **Apps**:
    - `apps/api`: Fastify modular-monolith backend application serving API requests.
    - `apps/manager`: Next.js admin portal UI for management users.
    - `apps/marketplace`: Next.js customer marketplace platform (`verttexloja.com.br`).
2.  **Shared Workspace Packages**:
    - `packages/auth`: CASL definitions, abilities, roles, subjects, and shared authorization helpers for both backend and frontend.
    - `packages/env`: Type-safe validation engine for environment variables.
    - `packages/types`: Shared contract types, schemas, and API response schemas.
    - `packages/ui`: Unified visual components using Tailwind CSS v4 and shadcn/ui.
3.  **Configs**:
    - `config/eslint`: Shared rules for ESLint code quality.
    - `config/prettier`: Central styling rules.
    - `config/typescript`: Predefined typescript tsconfigs templates.

---

## 2. API Architecture

The API uses a **modular monolith** style grouped by features under `apps/api/src/modules/`.

- Routes register the schemas and controllers.
- Controllers handle request mapping and contract-abiding responses.
- Prisma database layer is accessed via a single database instance inside `infrastructure/database/prisma.ts`.

---

## 3. Frontend Architecture

Both frontends utilize Next.js App Router.

- `src/app/` contains routing configurations.
- `src/features/` holds domain-specific assets, hooks, components.
- Common visual components are resolved from the workspace package `@verttex/ui`.
- Server components fetch data directly, client components utilize `@tanstack/react-query` to fetch from the Fastify API.

---

## 4. Data Model Overview (Phase 1)

Main entities planned for Phase 1:

```
User                 — Management user (admin, employee, supplier)
Role                 — Cargo with key, name, description
Permission           — Functional permission (resource.action pattern)
RolePermission       — Default permissions assigned to a role
UserPermission       — Individual overrides (allow or deny) per user
Store                — Partner store/producer in the marketplace
StoreUser            — Many-to-many: users linked to stores
Customer             — Marketplace buyer (separate from User)
UserSession          — Active sessions for management users
CustomerSession      — Active sessions for customers
UserPasswordResetToken
CustomerPasswordResetToken
```

Optional entities to consider:
```
UserEmailVerificationToken
CustomerEmailVerificationToken
AuditLog
```

---

## 5. Authentication Architecture

- Two separate authentication contexts: `User` and `Customer`
- Tokens carry `actorType` to identify the context
- Access tokens: short-lived JWT
- Refresh tokens: rotated, stored as hash only
- Cookies: `httpOnly`, `secure` in production
- See `.ai/BACKEND_API.md` for full route and middleware documentation

---

## 6. Authorization Architecture (`@verttex/auth`)

The `@verttex/auth` package concentrates:
- CASL `Actions`, `Subjects`, and `AppAbility` type
- Role definitions (persisted in DB, seeded initially)
- Permission names (`resource.action` pattern)
- `defineAbilityFor(user)` function
- Shared helpers for both backend guards and frontend `<Can>` components

> **Note**: The current state of `@verttex/auth` is a placeholder with only `ADMIN` and `USER` roles. It will be refactored in Roadmap 005 to align with the Phase 1 specification (`admin`, `employee`, `supplier` and full permission subjects).

See `.ai/PERMISSIONS.md` for the full permissions reference.
