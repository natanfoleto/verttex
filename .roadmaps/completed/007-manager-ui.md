# Roadmap 007 — Manager UI

## Metadata

- Status: `completed`
- Priority: high
- Created at: 2026-07-21
- Started at: 2026-07-21
- Completed at: 2026-07-21
- Dependencies: `003-user-authentication`, `005-roles-and-permissions`, `006-stores-management`
- Related roadmaps: 005, 006

## Objective

Implement all initial screens for the `apps/manager` admin panel: authentication flows, user management, role management, permission management, store management, store members, and authenticated user profile.

## Context

The manager app currently has only a placeholder page. This roadmap implements all Phase 1 screens using the CASL authorization system (from `@verttex/auth`) to protect routes and hide unauthorized actions.

## Expected Outcome

- Fully functional admin panel for Phase 1
- All auth screens (login, forgot/reset password, access denied)
- User, role, permission, and store management screens
- CASL-based route guards and `<Can>` components
- All states: loading, empty, error, access denied

## Scope

### Authentication Screens

| Route                  | Description              |
| ---------------------- | ------------------------ |
| `/login`               | Login form               |
| `/esqueci-minha-senha` | Request password reset   |
| `/redefinir-senha`     | Reset password via token |
| `/alterar-senha`       | Change own password      |
| `/sessao-expirada`     | Expired session message  |
| `/acesso-negado`       | Access denied screen     |

### Users

| Route                          | Permission         | Description              |
| ------------------------------ | ------------------ | ------------------------ |
| `/usuarios`                    | `users.read`       | User listing with search |
| `/usuarios/novo`               | `users.create`     | Create user form         |
| `/usuarios/:userId`            | `users.read`       | User detail              |
| `/usuarios/:userId/editar`     | `users.update`     | Edit user                |
| `/usuarios/:userId/permissoes` | `permissions.read` | Individual permissions   |
| `/usuarios/:userId/lojas`      | `users.read`       | Linked stores            |

### Roles

| Route                        | Permission           | Description                |
| ---------------------------- | -------------------- | -------------------------- |
| `/cargos`                    | `roles.read`         | Role listing               |
| `/cargos/novo`               | `roles.create`       | Create role                |
| `/cargos/:roleId`            | `roles.read`         | Role detail                |
| `/cargos/:roleId/editar`     | `roles.update`       | Edit role                  |
| `/cargos/:roleId/permissoes` | `permissions.manage` | Configure role permissions |

### Stores

| Route                     | Permission              | Description        |
| ------------------------- | ----------------------- | ------------------ |
| `/lojas`                  | `stores.read`           | Store listing      |
| `/lojas/nova`             | `stores.create`         | Create store       |
| `/lojas/:storeId`         | `stores.read`           | Store detail       |
| `/lojas/:storeId/editar`  | `stores.update`         | Edit store         |
| `/lojas/:storeId/membros` | `stores.manage-members` | Manage store users |

### Profile

| Route     | Auth          | Description                                |
| --------- | ------------- | ------------------------------------------ |
| `/perfil` | Authenticated | View and edit own profile, change password |

## Out of Scope

- Any marketplace screens (Roadmap 008)
- Real-time features, WebSockets
- File upload (logo, cover) — Phase 2

## Authentication Flow

- Unauthenticated requests redirect to `/login`
- After login, redirect to `/` (dashboard placeholder)
- After logout, redirect to `/login`
- Expired session shows `/sessao-expirada`

## Authorization in Frontend

- Use `<Can>` component from `@verttex/auth` to hide unauthorized UI elements
- Use route guards in Next.js App Router (via server components or middleware)
- Unauthorized page access redirects to `/acesso-negado`
- Never rely solely on frontend for security — backend always re-validates

## Implementation Steps

### Step 1 — Auth setup

- [x] Configure `@tanstack/react-query` auth state
- [x] Implement `useUser()` hook (fetch `/auth/users/me`)
- [x] Implement `useLogout()` mutation
- [x] Implement session expiry detection and redirect

### Step 2 — Auth screens

- [x] Login page with form (email + password)
- [x] Forgot password page
- [x] Reset password page
- [x] Change password page
- [x] Session expired page
- [x] Access denied page

### Step 3 — Route guards

- [x] Implement `AuthGuard` wrapper for authenticated routes
- [x] Implement `PermissionGuard` wrapper for permission-protected routes

### Step 4 — User management screens

- [x] Users listing with search
- [x] Create user form
- [x] User detail with role and permissions display
- [x] Edit user form
- [x] Individual permissions management (allow/deny overrides)
- [x] User stores listing

### Step 5 — Role management screens

- [x] Roles listing
- [x] Create role form
- [x] Role detail
- [x] Edit role form
- [x] Role permissions configuration (grouped by module)

### Step 6 — Store management screens

- [x] Stores listing with status filter
- [x] Create store form with slug input
- [x] Store detail with status and members
- [x] Edit store form
- [x] Store members management (add/remove users)

### Step 7 — Profile screen

- [x] Profile view with name, email, role display
- [x] Edit name form
- [x] Change password form

### Step 8 — Validate

- [x] `pnpm typecheck` and `pnpm build` pass
- [x] All screens render correctly
- [x] Authorization is enforced visually and via API

## Tests

- [x] Unauthenticated access redirects to login
- [x] Access without permission redirects to `/acesso-negado`
- [x] `<Can>` hides buttons for users without permission
- [x] Login form submits correctly
- [x] Forms show validation errors
- [x] Loading, empty, and error states render correctly

## Acceptance Criteria

- [x] All auth screens work
- [x] All management screens work with correct permission guards
- [x] No screen allows unauthorized action
- [x] All states (loading, empty, error, access denied) implemented
- [x] `pnpm typecheck` and `pnpm build` pass

## Blockers

None.

## Progress

100% completed.

## Change Log

- 2026-07-21: Roadmap created
- 2026-07-21: Roadmap activated
- 2026-07-21: Roadmap completed successfully
