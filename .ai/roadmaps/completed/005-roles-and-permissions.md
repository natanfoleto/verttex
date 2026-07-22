# Roadmap 005 — Roles and Permissions

## Metadata

- Status: `completed`
- Priority: critical
- Created at: 2026-07-21
- Started at: 2026-07-21
- Completed at: 2026-07-21
- Dependencies: `002-data-modeling`, `003-user-authentication`
- Related roadmaps: 006, 007

## Objective

Implement the full roles and permissions system: CASL shared package refactoring, role and permission CRUD, individual user overrides, and authorization middleware. This is the backbone of all access control in Phase 1.

## Context

The current `@verttex/auth` package contains placeholder roles (`ADMIN`, `USER`) that are incompatible with the Phase 1 specification. This roadmap refactors the package and implements the complete authorization system.

## Expected Outcome

- `@verttex/auth` refactored with `admin`, `employee`, `supplier` roles and full permission subjects
- CRUD for roles and permissions
- Individual user permission overrides (allow/deny)
- `requirePermission` middleware
- `requireStoreAccess` middleware
- CASL abilities usable in both backend and frontend

## Scope

### `@verttex/auth` Refactoring

- Update `roles.ts`: replace `ADMIN`/`USER` with `admin`, `employee`, `supplier`
- Update `permissions.ts`: full `resource.action` permission subjects
- Update `subjects/`: add User, Role, Permission, Store, Customer subjects
- Update `index.ts`: export `defineAbilityFor(user)` with dynamic permission loading
- Add helpers: `can()`, `cannot()`, type-safe action/subject constants

### API Routes

- `GET /roles` — list roles
- `POST /roles` — create role
- `GET /roles/:roleId` — get role
- `PATCH /roles/:roleId` — update role
- `DELETE /roles/:roleId` — delete role (non-system only)
- `GET /roles/:roleId/permissions` — get default permissions
- `PUT /roles/:roleId/permissions` — set default permissions
- `GET /permissions` — list all permissions
- `GET /users/:userId/permissions` — get user overrides
- `PUT /users/:userId/permissions` — set user overrides

### Middlewares

- `requirePermission(action, subject)` — validates CASL ability
- `requireStoreAccess(storeIdParam)` — validates user is linked to the requested store

### User CRUD (in scope here as it requires permissions)

- `GET /users`
- `POST /users`
- `GET /users/:userId`
- `PATCH /users/:userId`
- `DELETE /users/:userId`
- `GET /users/:userId/stores`
- `GET /users/:userId/permissions`
- `PUT /users/:userId/permissions`

## Out of Scope

- Store CRUD (see Roadmap 006)
- Frontend screens (see Roadmap 007)
- Customer permissions (customers do not have roles)

## Business Rules

- See `.ai/PERMISSIONS.md` for full permissions list and precedence
- System roles (`admin`, `employee`, `supplier`) cannot be deleted
- Last active admin cannot be deactivated
- Permission precedence: admin > explicit deny > explicit allow > role default > deny
- Supplier scope is always limited to linked stores
- Employee scope: TBD (pending decision)

## Architecture Decisions

- `defineAbilityFor(user)` receives user with role key and individual permission overrides
- Permission overrides are loaded dynamically from database
- Frontend uses the same `@verttex/auth` package for `<Can>` components
- Avoid all inline role checks — always use CASL ability

## Permissions Involved

All permissions from `.ai/PERMISSIONS.md` are seeded and managed in this roadmap.

## Implementation Steps

### Step 1 — Refactor `@verttex/auth`

- [x] Update `roles.ts` with `admin`, `employee`, `supplier`
- [x] Update `subjects/` with Phase 1 subjects
- [x] Update `permissions.ts` with dynamic ability building (load from DB overrides)
- [x] Update exports in `index.ts`
- [x] Verify frontend and backend can import without breaking changes

### Step 2 — Middleware

- [x] Implement `requirePermission(action, subject)` using CASL ability
- [x] Implement `requireStoreAccess(storeIdParam)` using StoreUser table lookup

### Step 3 — Role CRUD API

- [x] Implement role service (list, create, get, update, delete)
- [x] Protect system roles from deletion
- [x] Register routes in `src/modules/roles/`

### Step 4 — Permission management API

- [x] Implement permission listing
- [x] Implement role permission assignment (`PUT /roles/:roleId/permissions`)
- [x] Implement user permission override (`PUT /users/:userId/permissions`)
- [x] Register routes

### Step 5 — User CRUD API

- [x] Implement user service (list, create, get, update, deactivate)
- [x] Register routes in `src/modules/users/`
- [x] Apply `requirePermission` to all protected routes

### Step 6 — Validate

- [x] `pnpm typecheck` and `pnpm build` pass
- [x] All routes in Swagger

## Tests

- [x] Admin has `manage all`
- [x] Employee has default permissions
- [x] Supplier limited to linked stores
- [x] User permission override (allow) grants access
- [x] User permission override (deny) blocks access even if role allows
- [x] Cannot delete system roles
- [x] Cannot deactivate last admin
- [x] `requirePermission` blocks unauthorized access
- [x] `requireStoreAccess` blocks supplier from other stores

## Acceptance Criteria

- [x] `@verttex/auth` refactored and compatible with Phase 1 spec
- [x] All role and permission routes work
- [x] User CRUD works with permission protection
- [x] Both middlewares implemented and tested
- [x] `pnpm typecheck` and `pnpm build` pass

## Blockers

None.

## Pending Decisions

- #1: Will employees have global or store-linked access?
- #3: Can admins create new roles via the panel?
- #4: Can system role permissions be changed?
- #5: Does individual denial always override role?

## Progress

100% completed.

## Change Log

- 2026-07-21: Roadmap created
- 2026-07-21: Roadmap activated (moved from planned to active)
- 2026-07-21: Roadmap completed successfully
