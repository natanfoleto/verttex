# Roadmap 001 — Foundation

## Metadata

- Status: `completed`
- Priority: critical
- Created at: 2026-07-20
- Started at: 2026-07-20
- Completed at: 2026-07-21
- Dependencies: None
- Related roadmaps: 002

## Objective

Bootstrap the Verttex monorepo with a well-structured foundation: all apps, shared packages, tooling, and documentation in place and validated.

## Context

The project was bootstrapped from scratch using `pnpm workspaces` and `Turborepo`. A reference project (Ecokids) was used as a technical accelerator for Fastify, CASL, and Prisma patterns.

## Expected Outcome

A working monorepo where all apps and packages compile, pass lint, typecheck, and build — with no domain-specific data, no cross-app imports, and no hardcoded secrets.

## Scope

- Monorepo structure (`apps/`, `packages/`, `config/`)
- `apps/api`: Fastify API with health check, Swagger, error handler, request ID
- `apps/manager`: Next.js App Router admin portal (placeholder)
- `apps/marketplace`: Next.js App Router marketplace (placeholder)
- `packages/auth`: CASL placeholder structure
- `packages/env`: Zod-validated environment variables (api, manager, marketplace)
- `packages/types`: Shared contract types and response schemas
- `packages/ui`: Shared Tailwind CSS v4 + shadcn/ui component library
- `config/eslint`, `config/prettier`, `config/typescript`
- CI pipeline: GitHub Actions (lint, typecheck, build)
- Documentation: `.ai/` folder with all required docs

## Out of Scope

- Any domain entities (User, Customer, Store, Product, etc.)
- Authentication or authorization implementation
- Migrations
- Any real business logic

## Acceptance Criteria

- [x] `pnpm install` succeeds
- [x] `pnpm lint` passes
- [x] `pnpm typecheck` passes
- [x] `pnpm build` passes
- [x] All apps compile independently
- [x] API responds at `/health`
- [x] Swagger available at `/docs`
- [x] No cross-app imports
- [x] No hardcoded secrets
- [x] No business data or invented models
- [x] `.ai/` documentation complete and coherent

## Change Log

- 2026-07-21: `apps/storefront` renamed to `apps/marketplace` to align with product naming
- 2026-07-21: `PROMPT_VERTTEX_BOOTSTRAP.md` moved to `.ai/history/INITIAL_PROMPT.md`
- 2026-07-21: Phase 1 overview document ingested; `.ai/` documentation expanded; `.ai/roadmaps/` structure created
