# Architecture Overview — Verttex

This document describes the high-level system architecture and structural components of the Verttex project.

## 1. Monorepo Organization

The monorepo uses `pnpm workspaces` and `Turborepo` for package building and caching orchestration:

```mermaid
graph TD
  manager[apps/manager] --> ui[@verttex/ui]
  manager --> env[@verttex/env]
  manager --> types[@verttex/types]

  storefront[apps/storefront] --> ui
  storefront --> env
  storefront --> types

  api[apps/api] --> env
  api --> types
  api --> auth[@verttex/auth]

  ui --> types
  auth --> types
```

### Core Parts

1.  **Apps**:
    - `apps/api`: Fastify monoto-modular backend application serving API requests.
    - `apps/manager`: Next.js admin portal UI.
    - `apps/storefront`: Next.js customer marketplace platform.
2.  **Shared Workspace Packages**:
    - `packages/auth`: CASL definitions for client and server actions.
    - `packages/env`: Type-safe validation engine for environment variables.
    - `packages/types`: Shared contract types, schemas, and schemas responses.
    - `packages/ui`: Unified visual components using Tailwind CSS v4 and shadcn/ui.
3.  **Configs**:
    - `config/eslint`: Shared rules for ESLint code quality.
    - `config/prettier`: Central styling rules.
    - `config/typescript`: Predefined typescript tsconfigs templates.

## 2. API Architecture

The API uses a **modular monolith** style grouped by features under `apps/api/src/modules/`.

- Routes register the schemas and controllers.
- Controllers handle request mapping and contract-abiding responses.
- Prisma database layer is accessed via a single database instance inside `infrastructure/database/prisma.ts`.

## 3. Frontend Architecture

Both frontends utilize Next.js App Router.

- `src/app/` contains routing configurations.
- `src/features/` holds domain-specific assets, hooks, components.
- Common visual components are resolved from the workspace package `@verttex/ui`.
- Server components fetch data directly, client components utilize `@tanstack/react-query` to fetch from the Fastify API.
