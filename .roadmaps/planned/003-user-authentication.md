# Roadmap 003 — User Authentication

## Metadata

- Status: `planned`
- Priority: critical
- Created at: 2026-07-21
- Started at:
- Completed at:
- Dependencies: `002-data-modeling`
- Related roadmaps: 005, 007

## Objective

Implement the full authentication flow for management users: login, logout, refresh token, password recovery, change password, sessions, and the `authenticateUser` middleware.

## Context

Management users access `apps/manager`. They are created only by admins — no public registration. This roadmap covers only the backend API auth flow. Frontend screens for the manager are covered in Roadmap 007.

## Expected Outcome

- Complete authentication API for management users
- JWT-based access + refresh tokens
- Cookie-based session management
- Password recovery flow
- `authenticateUser` middleware ready for use in subsequent roadmaps

## Scope

- `POST /auth/users/login`
- `POST /auth/users/logout`
- `POST /auth/users/refresh`
- `POST /auth/users/forgot-password`
- `POST /auth/users/reset-password`
- `POST /auth/users/change-password`
- `GET /auth/users/me`
- `authenticateUser` middleware
- `UserSession` management
- `UserPasswordResetToken` management
- Rate limiting on auth routes

## Out of Scope

- Customer authentication (see Roadmap 004)
- User CRUD endpoints (see Roadmap 005)
- Frontend login screens (see Roadmap 007)
- Two-factor authentication

## Business Rules

- Users are created only via admin panel — no public registration endpoint
- Inactive users cannot authenticate
- Refresh tokens stored as hash only
- Password reset tokens: single-use, time-limited
- After password change: invalidate existing sessions
- Public responses must never reveal if an email exists or not
- Access token: short-lived JWT
- Tokens must carry `actorType: "user"`

## Architecture Decisions

- Separate cookie names/audiences for user vs customer contexts
- `httpOnly` + `secure` cookies in production
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
- Response: always same message regardless of email existence

### `POST /auth/users/reset-password`
- Authentication: public
- Body: `{ token, newPassword }`

### `POST /auth/users/change-password`
- Authentication: user
- Body: `{ currentPassword, newPassword }`

### `GET /auth/users/me`
- Authentication: user
- Response: authenticated user data with role and permissions

## Permissions Involved

- No functional permissions required (authentication-only routes)
- `authenticateUser` middleware must be used on protected routes from this point forward

## Implementation Steps

### Step 1 — Auth service

- [ ] Implement `login` (validate credentials, create session, issue tokens)
- [ ] Implement `logout` (revoke session, clear cookies)
- [ ] Implement `refresh` (rotate refresh token)
- [ ] Implement `forgotPassword` (create reset token, send email — or stub email)
- [ ] Implement `resetPassword` (validate token, update password, invalidate token)
- [ ] Implement `changePassword` (validate current, update, invalidate sessions)
- [ ] Implement `me` (return current user with role)

### Step 2 — Middleware

- [ ] Implement `authenticateUser` middleware
- [ ] Extract user from JWT, populate `request.user`
- [ ] Return 401 on invalid/expired token

### Step 3 — Routes

- [ ] Register all auth routes in `src/modules/auth-users/`
- [ ] Apply Zod schemas to all inputs
- [ ] Apply rate limiting to login and forgot-password

### Step 4 — Validate

- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
- [ ] All routes appear in Swagger at `/docs`

## Tests

- [ ] Login with valid credentials
- [ ] Login with invalid password
- [ ] Login with inactive user
- [ ] Logout clears session
- [ ] Refresh with valid token
- [ ] Refresh with expired token
- [ ] Refresh with revoked token
- [ ] Forgot password (valid and unknown email)
- [ ] Reset password with valid token
- [ ] Reset password with expired/used token
- [ ] Change password invalidates old sessions
- [ ] `GET /me` returns authenticated user
- [ ] `GET /me` with no token returns 401

## Acceptance Criteria

- [ ] All auth routes respond correctly
- [ ] Sessions are revocable
- [ ] Inactive users cannot log in
- [ ] Refresh tokens rotate correctly
- [ ] Password reset is single-use
- [ ] `authenticateUser` middleware is ready for use
- [ ] All routes documented in Swagger
- [ ] `pnpm typecheck` and `pnpm build` pass

## Risks

- Email sending not implemented in Phase 1 — stub or log the reset token to console

## Pending Decisions

- #6: Will login be only by email? (impacts login body schema)
- #11: Soft-delete or hard-delete? (impacts inactive user check)
- #13: Must all sessions be recorded?
- #14: Can a user terminate other sessions?

## Progress

Not started.

## Change Log

- 2026-07-21: Roadmap created
