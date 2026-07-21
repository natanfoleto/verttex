# Roadmap 002 — Data Modeling

## Metadata

- Status: `planned`
- Priority: critical
- Created at: 2026-07-21
- Started at:
- Completed at:
- Dependencies: `001-foundation`
- Related roadmaps: 003, 004, 005, 006

## Objective

Design and create all Prisma models for Phase 1: User, Customer, Role, Permission, Store, sessions, and reset tokens. Generate the initial migration and seeds.

## Context

The Prisma schema is currently empty (only datasource and generator). All Phase 1 entities must be modeled before any authentication or authorization work can begin. This roadmap must be completed before all other Phase 1 roadmaps.

## Expected Outcome

- All Phase 1 Prisma models created and migrated
- Database seed for initial roles, permissions, and default role permissions
- Schema fully documented and coherent with `.ai/ARCHITECTURE.md`

## Scope

- Prisma model: `User`
- Prisma model: `Role`
- Prisma model: `Permission`
- Prisma model: `RolePermission`
- Prisma model: `UserPermission`
- Prisma model: `Store`
- Prisma model: `StoreUser`
- Prisma model: `Customer`
- Prisma model: `UserSession`
- Prisma model: `CustomerSession`
- Prisma model: `UserPasswordResetToken`
- Prisma model: `CustomerPasswordResetToken`
- (Optional) `AuditLog`
- Initial migration via `pnpm db:migrate`
- Seeds: roles (`admin`, `employee`, `supplier`), permissions, role default permissions, first admin user

## Out of Scope

- Any API routes or controllers
- Any frontend screens
- Product, Category, Order, or any future-phase models
- DNS, payment, or delivery-related fields

## Business Rules

- See `.ai/BUSINESS_RULES.md` for all entity and role rules
- See `.ai/PERMISSIONS.md` for the full permission list and data model
- `User.email` must be unique across management users
- `Customer.email` must be unique across customers
- `Role.key` must be unique
- `Permission.key` must be unique
- Soft-delete preferred over hard-delete for User, Customer, Store (via `status` field or `deletedAt`)
- Refresh tokens must be stored as hash only — never plain text

## Architecture Decisions

- Roles are persisted in the database, not hardcoded as enums
- The three system roles (`admin`, `employee`, `supplier`) are seeds — they are not the only future roles possible
- System roles are protected: cannot be deleted, cannot remove all admin permissions
- `StoreUser` is a join table — do not add a direct `userId` column to `Store`

## Database Changes

### New Models

```
User, Role, Permission, RolePermission, UserPermission
Store, StoreUser
Customer
UserSession, CustomerSession
UserPasswordResetToken, CustomerPasswordResetToken
```

### Key Constraints

- `User.email` — unique
- `Customer.email` — unique
- `Role.key` — unique
- `Permission.key` — unique
- `StoreUser(storeId, userId)` — unique composite

### Migration Command

```bash
pnpm db:migrate
```

**Never run**: `prisma db push` or `prisma db reset`

## Implementation Steps

### Step 1 — Resolve pending decisions

- [ ] Confirm all 18 pending decisions (see Blockers below)
- [ ] Update this roadmap with confirmed answers

### Step 2 — Design Prisma schema

- [ ] Write all models in `apps/api/prisma/schema.prisma`
- [ ] Add all relationships, constraints, and indexes
- [ ] Peer-review schema against business rules

### Step 3 — Create migration

- [ ] Run `pnpm db:migrate` to generate the migration
- [ ] Verify migration SQL is correct

### Step 4 — Create seeds

- [ ] Seed roles: `admin`, `employee`, `supplier`
- [ ] Seed permissions (all `resource.action` entries from `.ai/PERMISSIONS.md`)
- [ ] Seed `RolePermission` default assignments
- [ ] Seed first admin user (secure strategy — env variable or CLI prompt)

### Step 5 — Validate

- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
- [ ] Database reflects the expected schema
- [ ] All seeds run without error

## Tests

- [ ] Schema integrity (relations, constraints)
- [ ] Unique constraint violation behavior
- [ ] Seed idempotency (running seeds twice does not duplicate data)

## Acceptance Criteria

- [ ] All models exist in Prisma schema
- [ ] Migration was generated with `pnpm db:migrate`
- [ ] Seeds run successfully
- [ ] No business data beyond technical seeds
- [ ] `pnpm typecheck` and `pnpm build` pass

## Risks

- Pending decisions may force schema redesign if resolved late
- Soft-delete strategy adds complexity to all queries — must define a consistent pattern

## Blockers

> ⚠️ **18 decisions from the Phase 1 overview document must be answered before implementation.**

See `.ai/AGENT.md` — Pending Decisions Registry for the full list.

Critical ones that directly affect schema:

1. Will employees have global or store-linked access? (affects StoreUser design)
5. Does individual denial always override role? (affects permission calculation logic)
10. Can same person be both customer and supplier with same email? (affects User/Customer separation)
11. Will entities be soft-deleted or hard-deleted?
13. Must all sessions be recorded? (affects UserSession/CustomerSession design)
17. Will there be a primary store owner in the future? (affects StoreUser fields)

## Pending Decisions

See `.ai/AGENT.md` — Pending Decisions Registry.

## Progress

Not started.

## Change Log

- 2026-07-21: Roadmap created
