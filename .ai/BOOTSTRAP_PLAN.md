# Bootstrap Plan — Verttex Monorepo

This document details the initial setup plan for the Verttex monorepo workspace.

## 1. Structure to be Created

The workspace is structured as a pnpm workspaces monorepo using Turborepo:

- `apps/api`: Fastify backend API.
- `apps/manager`: Next.js App Router administrative front-end.
- `apps/storefront`: Next.js App Router consumer front-end.
- `packages/auth`: CASL-based rule system.
- `packages/env`: Zod environment variables check wrapper.
- `packages/types`: Shared Zod request/response/error contracts.
- `packages/ui`: Shared Tailwind CSS v4 styling primitives & components.
- `config/eslint`: Shared ESLint configs.
- `config/prettier`: Shared Prettier config rules.
- `config/typescript`: Shared strict TS configurations.

## 2. Patterns Adapted from Ecokids

- **Monorepo architecture**: Turborepo task pipeline and pnpm package separation.
- **API Framework**: Fastify + fastify-type-provider-zod + Swagger OpenAPI documentation.
- **Request isolation**: AsyncLocalStorage for keeping request context.
- **Authentication foundation**: `@fastify/jwt` and `@fastify/cookie` bindings.
- **Database**: Prisma client singleton database provider.

## 3. Patterns Discarded / Adapted

- **Frontend Routing**: Ecokids manager used Vite + React Router DOM (`createBrowserRouter`). For Verttex, we enforce Next.js App Router for all frontend applications.
- **Tailwind CSS**: Upgrading Tailwind to modern v4 architecture (`4.3.x` or latest stable standard integration).
- **UI Icons**: Standardizing on `react-icons` instead of `lucide-react` for the UI package libraries.

## 4. Specific Decisions for Verttex

- **Monolith Modular API**: Domains under `apps/api/src/modules/` contain all files needed (schemas, routes, controllers) in a flat layout to prevent layers bloat.
- **Env entrypoints**: Expose environment configuration for individual scopes `@verttex/env/api`, `@verttex/env/manager`, and `@verttex/env/storefront` to cleanly divide server-side and client-side definitions.

## 5. Risks and Observations

- **TypeScript configuration resolution**: Explicit subpath exports require robust tsconfig options (`moduleResolution: "bundler"`) to make sure aliases resolve correctly across nested packages.
- **Prisma build checks**: Ensuring that Prisma generation occurs prior to build/typecheck tasks.
