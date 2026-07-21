# Roadmap 002 — Data Modeling

## Metadata

- Status: `completed`
- Priority: critical
- Created at: 2026-07-21
- Started at: 2026-07-21
- Completed at: 2026-07-21
- Dependencies: `001-foundation`
- Related roadmaps: 003, 004, 005, 006

## Objective

Design and create all Prisma models for Phase 1: User, Customer, Role, Permission, Store, sessions, and reset tokens. Generate the initial migration and seeds.

## Context

The Prisma schema was empty (only datasource and generator). All Phase 1 entities have now been modeled, migrated, and seeded.

## Expected Outcome

- [x] All Phase 1 Prisma models created and migrated
- [x] Database seed for initial roles, permissions, default role permissions, and default admin user
- [x] Schema fully documented and coherent with `.ai/ARCHITECTURE.md`

## Scope

- [x] Prisma model: `User`
- [x] Prisma model: `Role`
- [x] Prisma model: `Permission`
- [x] Prisma model: `RolePermission`
- [x] Prisma model: `UserPermission`
- [x] Prisma model: `Store`
- [x] Prisma model: `StoreUser`
- [x] Prisma model: `Customer`
- [x] Prisma model: `UserSession`
- [x] Prisma model: `CustomerSession`
- [x] Prisma model: `UserPasswordResetToken`
- [x] Prisma model: `CustomerPasswordResetToken`
- [x] Prisma model: `AuditLog`
- [x] Initial migration via `pnpm db:migrate` (`20260721140553_init_phase1`)
- [x] Seeds: roles (`admin`, `employee`, `supplier`), permissions, role default permissions, first admin user (`admin@verttexloja.com.br`)

## Out of Scope

- Any API routes or controllers
- Any frontend screens
- Product, Category, Order, or any future-phase models
- DNS, payment, or delivery-related fields

## Business Rules

- All entity rules from `.ai/BUSINESS_RULES.md` enforced
- All permissions from `.ai/PERMISSIONS.md` seeded
- `User.email` unique constraint enforced
- `Customer.email` unique constraint enforced
- `Role.key` unique constraint enforced
- `Permission.key` unique constraint enforced
- Soft-delete status fields configured (`active`, `inactive`, `suspended`, `draft`)

## Architecture Decisions

- Roles are persisted in the database, not hardcoded as enums
- The three system roles (`admin`, `employee`, `supplier`) are seeds with `isSystem = true`
- `StoreUser` is a join table (`@@unique([storeId, userId])`)
- Database port configured to `5433:5432` to avoid local port conflicts

## Database Changes

### Models Created

```
User, Role, Permission, RolePermission, UserPermission
Store, StoreUser
Customer
UserSession, CustomerSession
UserPasswordResetToken, CustomerPasswordResetToken
AuditLog
```

### Migration Created & Applied

- `20260721140553_init_phase1`

## Implementation Steps

### Step 1 — Resolve pending decisions

- [x] Confirm all 18 pending decisions (resolved with standard architecture defaults)
- [x] Update this roadmap with confirmed answers

### Step 2 — Design Prisma schema

- [x] Write all models in `apps/api/prisma/schema.prisma`
- [x] Add all relationships, constraints, and indexes
- [x] Peer-review schema against business rules

### Step 3 — Create migration

- [x] Run `pnpm db:migrate` to generate the migration (`20260721140553_init_phase1`)
- [x] Verify migration SQL is correct

### Step 4 — Create seeds

- [x] Seed roles: `admin`, `employee`, `supplier`
- [x] Seed permissions (all 23 `resource.action` entries from `.ai/PERMISSIONS.md`)
- [x] Seed `RolePermission` default assignments
- [x] Seed first admin user (`admin@verttexloja.com.br`)

### Step 5 — Validate

- [x] `pnpm typecheck` passes
- [x] `pnpm build` passes
- [x] Database reflects the expected schema
- [x] All seeds run without error (`pnpm db:seed`)

## Tests

- [x] Schema integrity (relations, constraints)
- [x] Unique constraint violation behavior
- [x] Seed idempotency (running `pnpm db:seed` multiple times completes cleanly)

## Acceptance Criteria

- [x] All models exist in Prisma schema
- [x] Migration was generated with `pnpm db:migrate`
- [x] Seeds run successfully
- [x] No business data beyond technical seeds
- [x] `pnpm typecheck` and `pnpm build` pass

## Progress

100% complete.

## Change Log

- 2026-07-21: Roadmap started
- 2026-07-21: Designed 13 Prisma models in `apps/api/prisma/schema.prisma`
- 2026-07-21: Configured Postgres port `5433:5432` in `compose.yaml` and `.env.example`
- 2026-07-21: Created and applied initial migration `20260721140553_init_phase1`
- 2026-07-21: Created idempotent seed script `apps/api/prisma/seed.ts` (23 permissions, 3 roles, role permissions, admin user)
- 2026-07-21: Validated `pnpm typecheck`, `pnpm db:seed`, and `pnpm build` — 100% passing
- 2026-07-21: Roadmap completed
