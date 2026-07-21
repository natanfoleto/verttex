# Roadmap 006 — Stores Management

## Metadata

- Status: `planned`
- Priority: high
- Created at: 2026-07-21
- Started at:
- Completed at:
- Dependencies: `002-data-modeling`, `003-user-authentication`, `005-roles-and-permissions`
- Related roadmaps: 007

## Objective

Implement the Store CRUD API with status management, slug validation, optional custom domain field, and user-store member linking.

## Context

Stores are the core business entity of the Verttex marketplace. Each store represents a producer or supplier. This roadmap implements the backend API for managing stores and their user memberships. Frontend screens are in Roadmap 007.

## Expected Outcome

- Full Store CRUD API
- Store status transitions (draft → active, active → inactive, suspended)
- Unique slug generation and validation
- Optional custom domain field (stored but not activated)
- User-store member management
- Access control enforced by `requirePermission` + `requireStoreAccess`

## Scope

- `GET /stores`
- `POST /stores`
- `GET /stores/:storeId`
- `PATCH /stores/:storeId`
- `DELETE /stores/:storeId` (deactivate)
- `GET /stores/:storeId/users`
- `POST /stores/:storeId/users`
- `DELETE /stores/:storeId/users/:userId`
- `GET /users/:userId/stores`

## Out of Scope

- Products, catalog, inventory (future)
- DNS automation, SSL, live custom domain redirect
- Store analytics or sales reports
- Custom store pages (future)
- Frontend screens (Roadmap 007)

## Business Rules

- See `.ai/BUSINESS_RULES.md` for store status rules, slug rules, and domain strategy
- Slug must be: unique, URL-safe, normalized, validated against reserved words list
- `customDomain` field is optional — stored but not functionally activated in Phase 1
- Status transitions: `draft` → `active`; `active` → `inactive`; any → `suspended` (admin only)
- Suppliers can only access their linked stores
- Admins have global store access
- Employees: TBD (pending decision #1)

## Reserved Slugs

The following words must be blocked as store slugs:

```
produtos, categorias, carrinho, checkout, conta, pedidos
admin, api, login, cadastro, lojas, perfil, busca, ajuda
```

List must be centralized (e.g., `src/modules/stores/reserved-slugs.ts`).

## Architecture Decisions

- Slug changes must be controlled and logged
- `StoreUser` manages the many-to-many relationship — no direct `userId` column in `Store`
- `customDomain` field exists in Phase 1 for future use, no DNS logic
- Store deactivation is soft (status update), not hard delete

## API Routes

### `POST /stores`
- Auth: user
- Permission: `stores.create`
- Body: `{ name, slug, description?, logoUrl?, coverUrl?, customDomain? }`

### `GET /stores`
- Auth: user
- Permission: `stores.read`
- Scoped: admin sees all; employee TBD; supplier sees only linked stores

### `GET /stores/:storeId`
- Auth: user
- Permission: `stores.read` + store access

### `PATCH /stores/:storeId`
- Auth: user
- Permission: `stores.update` + store access

### `DELETE /stores/:storeId`
- Auth: user
- Permission: `stores.delete`
- Action: sets status to `inactive` (soft delete)

### `GET /stores/:storeId/users`
- Auth: user
- Permission: `stores.manage-members` + store access

### `POST /stores/:storeId/users`
- Auth: user
- Permission: `stores.manage-members`
- Body: `{ userId }`

### `DELETE /stores/:storeId/users/:userId`
- Auth: user
- Permission: `stores.manage-members`

### `GET /users/:userId/stores`
- Auth: user
- Permission: `users.read`

## Implementation Steps

### Step 1 — Store service

- [ ] Implement create store (with slug validation)
- [ ] Implement list stores (scoped by user access)
- [ ] Implement get store
- [ ] Implement update store
- [ ] Implement deactivate store (status → inactive)
- [ ] Implement suspend store (status → suspended, admin only)
- [ ] Implement reserved slug validation

### Step 2 — Member management service

- [ ] Implement list store members
- [ ] Implement add user to store
- [ ] Implement remove user from store
- [ ] Implement get user stores

### Step 3 — Routes

- [ ] Register all store routes in `src/modules/stores/`
- [ ] Apply `requirePermission` and `requireStoreAccess` to all protected routes

### Step 4 — Validate

- [ ] `pnpm typecheck` and `pnpm build` pass
- [ ] All routes in Swagger

## Tests

- [ ] Create store with valid slug
- [ ] Create store with reserved slug — must fail
- [ ] Create store with duplicate slug — must fail
- [ ] Supplier cannot access non-linked store
- [ ] Admin can access all stores
- [ ] Add user to store
- [ ] Remove user from store
- [ ] Deactivate store sets status to inactive
- [ ] Suspended store blocks supplier access

## Acceptance Criteria

- [ ] All store routes work
- [ ] Slug validation blocks reserved words and duplicates
- [ ] Access control enforced by role + store membership
- [ ] `pnpm typecheck` and `pnpm build` pass

## Blockers

- Pending decision #1: employee scope
- Pending decision #11: soft-delete vs hard-delete

## Pending Decisions

- #1: Employee global or store-linked access?
- #11: Soft-delete or hard-delete for stores?
- #12: Is custom domain only informational in Phase 1?
- #18: Do slug changes need to be audited from the start?

## Progress

Not started.

## Change Log

- 2026-07-21: Roadmap created
