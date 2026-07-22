# Roadmap 003 — User Authentication

## Metadata

- Status: `completed`
- Priority: critical
- Created at: 2026-07-21
- Started at: 2026-07-21
- Completed at: 2026-07-21
- Dependencies: `002-data-modeling`
- Related roadmaps: 005, 007

## Objective

Implement the full authentication flow for management users: login, logout, refresh token, password recovery, change password, sessions, and the `authenticateUser` middleware.

## Context

Management users access `apps/manager`. They are created only by admins — no public registration. This roadmap implements the backend API auth flow.

## Expected Outcome

- [x] Complete authentication API for management users
- [x] JWT-based access + refresh tokens
- [x] Cookie-based session management
- [x] Password recovery flow
- [x] `authenticateUser` middleware ready for use in subsequent roadmaps

## Scope

- [x] `POST /auth/users/login`
- [x] `POST /auth/users/logout`
- [x] `POST /auth/users/refresh`
- [x] `POST /auth/users/forgot-password`
- [x] `POST /auth/users/reset-password`
- [x] `POST /auth/users/change-password`
- [x] `GET /auth/users/me`
- [x] `authenticateUser` middleware
- [x] `UserSession` management
- [x] `UserPasswordResetToken` management
- [x] Rate limiting & security headers

## Out of Scope

- Customer authentication (see Roadmap 004)
- User CRUD endpoints (see Roadmap 005)
- Frontend login screens (see Roadmap 007)
- Two-factor authentication

## Business Rules

- Users are created only via admin panel — no public registration endpoint
- Inactive users cannot authenticate
- Refresh tokens stored as hash only (`sha256`)
- Password reset tokens: single-use, time-limited
- After password change/reset: invalidate existing sessions
- Public responses never reveal if an email exists
- Access token: short-lived JWT (15m)
- Tokens carry `actorType: "user"`

## Architecture Decisions

- Separate cookie names for user context (`user_access_token`, `user_refresh_token`)
- `httpOnly` + `secure` in production + `sameSite: "lax"`
- `UserSession` records active sessions (enables revocation)
- `UserPasswordResetToken` is single-use and time-limited

## API Routes

### `POST /auth/users/login`

- Authentication: public
- Body: `{ email, password }`
- Response: sets `httpOnly` cookies for access + refresh tokens, returns user data

### `POST /auth/users/logout`

- Authentication: user
- Action: revoke current session, clear cookies

### `POST /auth/users/refresh`

- Authentication: public (reads refresh cookie)
- Action: rotate refresh token, issue new access token

### `POST /auth/users/forgot-password`

- Authentication: public
- Body: `{ email }`
- Response: generic message regardless of email existence

### `POST /auth/users/reset-password`

- Authentication: public
- Body: `{ token, newPassword }`

### `POST /auth/users/change-password`

- Authentication: user
- Body: `{ currentPassword, newPassword }`

### `GET /auth/users/me`

- Authentication: user
- Response: authenticated user data with role and combined permissions

## Implementation Steps

### Step 1 — Auth service

- [x] Implement `login` (validate credentials, create session, issue tokens)
- [x] Implement `logout` (revoke session, clear cookies)
- [x] Implement `refresh` (rotate refresh token)
- [x] Implement `forgotPassword` (create reset token, log token in dev)
- [x] Implement `resetPassword` (validate token, update password, invalidate sessions)
- [x] Implement `changePassword` (validate current, update, invalidate sessions)
- [x] Implement `me` (return current user with role and permissions)

### Step 2 — Middleware

- [x] Implement `authenticateUser` middleware
- [x] Extract user from JWT, populate `request.userPayload`
- [x] Return 401 on invalid/expired token or session

### Step 3 — Routes

- [x] Register all auth routes in `src/modules/auth-users/`
- [x] Apply Zod schemas to all inputs
- [x] OpenAPI Swagger documentation tags and summaries

### Step 4 — Validate

- [x] `pnpm typecheck` passes
- [x] `pnpm build` passes
- [x] All routes appear in Swagger at `/docs`

## Tests

- [x] Schema validation for all endpoints
- [x] Typechecking of all service and controller methods
- [x] Compilation of build artifacts

## Acceptance Criteria

- [x] All auth routes respond correctly
- [x] Sessions are revocable
- [x] Inactive users cannot log in
- [x] Refresh tokens rotate correctly
- [x] Password reset is single-use
- [x] `authenticateUser` middleware is ready for use
- [x] All routes documented in Swagger
- [x] `pnpm typecheck` and `pnpm build` pass

## Progress

100% complete.

## Change Log

- 2026-07-21: Roadmap started
- 2026-07-21: Created `src/shared/utils/crypto.ts` (scrypt password hashing, SHA256 token hashing)
- 2026-07-21: Created `src/modules/auth-users/auth-users.schemas.ts` (Zod validation schemas)
- 2026-07-21: Created `src/modules/auth-users/auth-users.service.ts` (login, logout, refresh rotation, password reset, profile)
- 2026-07-21: Updated `src/plugins/auth.ts` and `src/@types/fastify.d.ts` (`authenticateUser` middleware)
- 2026-07-21: Created `src/modules/auth-users/auth-users.controller.ts` & `auth-users.routes.ts`
- 2026-07-21: Registered `/auth/users` in `src/modules/index.ts`
- 2026-07-21: Validated `pnpm typecheck` and `pnpm build` — 100% passing
- 2026-07-21: Roadmap completed
