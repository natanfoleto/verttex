# Roadmap 005 — Roles and Permissions

## Metadata

- Status: `planned`
- Priority: critical
- Created at: 2026-07-21
- Started at:
- Completed at:
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

- [ ] Update `roles.ts` with `admin`, `employee`, `supplier`
- [ ] Update `subjects/` with Phase 1 subjects
- [ ] Update `permissions.ts` with dynamic ability building (load from DB overrides)
- [ ] Update exports in `index.ts`
- [ ] Verify frontend and backend can import without breaking changes

### Step 2 — Middleware

- [ ] Implement `requirePermission(action, subject)` using CASL ability
- [ ] Implement `requireStoreAccess(storeIdParam)` using StoreUser table lookup

### Step 3 — Role CRUD API

- [ ] Implement role service (list, create, get, update, delete)
- [ ] Protect system roles from deletion
- [ ] Register routes in `src/modules/roles/`

### Step 4 — Permission management API

- [ ] Implement permission listing
- [ ] Implement role permission assignment (`PUT /roles/:roleId/permissions`)
- [ ] Implement user permission override (`PUT /users/:userId/permissions`)
- [ ] Register routes

### Step 5 — User CRUD API

- [ ] Implement user service (list, create, get, update, deactivate)
- [ ] Register routes in `src/modules/users/`
- [ ] Apply `requirePermission` to all protected routes

### Step 6 — Validate

- [ ] `pnpm typecheck` and `pnpm build` pass
- [ ] All routes in Swagger

## Tests

- [ ] Admin has `manage all`
- [ ] Employee has default permissions
- [ ] Supplier limited to linked stores
- [ ] User permission override (allow) grants access
- [ ] User permission override (deny) blocks access even if role allows
- [ ] Cannot delete system roles
- [ ] Cannot deactivate last admin
- [ ] `requirePermission` blocks unauthorized access
- [ ] `requireStoreAccess` blocks supplier from other stores

## Acceptance Criteria

- [ ] `@verttex/auth` refactored and compatible with Phase 1 spec
- [ ] All role and permission routes work
- [ ] User CRUD works with permission protection
- [ ] Both middlewares implemented and tested
- [ ] `pnpm typecheck` and `pnpm build` pass

## Blockers

- Pending decision #1: employee scope (global vs store-linked)
- Pending decision #5: individual denial always overrides role?

## Pending Decisions

- #1: Will employees have global or store-linked access?
- #3: Can admins create new roles via the panel?
- #4: Can system role permissions be changed?
- #5: Does individual denial always override role?

## Progress

Not started.

## Change Log

- 2026-07-21: Roadmap created
