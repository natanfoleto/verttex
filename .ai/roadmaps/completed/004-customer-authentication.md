# Roadmap 004 — Customer Authentication

## Metadata

- Status: `completed`
- Priority: critical
- Created at: 2026-07-21
- Started at: 2026-07-21
- Completed at: 2026-07-21
- Dependencies: `002-data-modeling`
- Related roadmaps: 008

## Objective

Implement the full authentication flow for marketplace customers: public registration, login, logout, refresh, password recovery, profile, and the `authenticateCustomer` middleware.

## Context

Customers are buyers who use `apps/marketplace`. Unlike management users, customers can register publicly. This roadmap implements the backend API for customer authentication.

## Expected Outcome

- [x] Complete authentication API for customer buyers
- [x] Public registration endpoint
- [x] JWT-based access + refresh tokens (separate from user tokens)
- [x] Cookie-based session management (`customer_access_token`, `customer_refresh_token`)
- [x] Password recovery flow
- [x] `authenticateCustomer` middleware ready for use

## Scope

- [x] `POST /auth/customers/register`
- [x] `POST /auth/customers/login`
- [x] `POST /auth/customers/logout`
- [x] `POST /auth/customers/refresh`
- [x] `POST /auth/customers/forgot-password`
- [x] `POST /auth/customers/reset-password`
- [x] `POST /auth/customers/change-password`
- [x] `GET /auth/customers/me`
- [x] `GET /customer/profile`
- [x] `PATCH /customer/profile`
- [x] `authenticateCustomer` middleware
- [x] `CustomerSession` management
- [x] `CustomerPasswordResetToken` management
- [x] Rate limiting & security headers

## Out of Scope

- Management user authentication (see Roadmap 003)
- Cart, checkout, orders, favorites (future roadmaps)
- Full address management
- CPF, CNPJ, fiscal data

## Business Rules

- Customer registration is public
- Tokens carry `actorType: "customer"`
- Customer tokens cannot access management user routes (`/auth/users/*`)
- Refresh tokens stored as SHA-256 hash only
- Password reset tokens: single-use, time-limited
- Public responses never reveal if an email exists
- `Customer.email` unique constraint enforced

## Architecture Decisions

- Separate cookie names for customer context (`customer_access_token`, `customer_refresh_token`)
- `CustomerSession` is completely independent from `UserSession`
- `CustomerPasswordResetToken` is independent from `UserPasswordResetToken`

## API Routes

### `POST /auth/customers/register`

- Authentication: public
- Body: `{ name, email, phone?, password }`

### `POST /auth/customers/login`

- Authentication: public
- Body: `{ email, password }`

### `POST /auth/customers/logout`

- Authentication: customer
- Action: revoke current session, clear cookies

### `POST /auth/customers/refresh`

- Authentication: public (reads refresh cookie)

### `POST /auth/customers/forgot-password`

- Authentication: public
- Body: `{ email }`

### `POST /auth/customers/reset-password`

- Authentication: public
- Body: `{ token, newPassword }`

### `POST /auth/customers/change-password`

- Authentication: customer
- Body: `{ currentPassword, newPassword }`

### `GET /auth/customers/me`

- Authentication: customer
- Response: authenticated customer data

### `GET /customer/profile`

- Authentication: customer

### `PATCH /customer/profile`

- Authentication: customer
- Body: `{ name?, phone? }`

## Implementation Steps

### Step 1 — Auth service

- [x] Implement `register`
- [x] Implement `login`
- [x] Implement `logout`
- [x] Implement `refresh`
- [x] Implement `forgotPassword`
- [x] Implement `resetPassword`
- [x] Implement `changePassword`
- [x] Implement `me` and profile endpoints

### Step 2 — Middleware

- [x] Implement `authenticateCustomer` middleware
- [x] Extract customer from JWT, populate `request.customerPayload`
- [x] Return 401 on invalid/expired token or session

### Step 3 — Routes

- [x] Register all routes in `src/modules/auth-customers/` and `src/modules/customer/`
- [x] Apply Zod schemas to all inputs
- [x] OpenAPI Swagger documentation tags and summaries

### Step 4 — Validate

- [x] `pnpm typecheck` passes
- [x] `pnpm build` passes
- [x] All routes appear in Swagger

## Tests

- [x] Schema validation for all customer auth inputs
- [x] Typechecking across all workspace packages
- [x] Compilation of build artifacts

## Acceptance Criteria

- [x] All customer auth routes respond correctly
- [x] Registration is public
- [x] Customer tokens are not accepted on user routes
- [x] Sessions are revocable
- [x] `authenticateCustomer` middleware is ready
- [x] `pnpm typecheck` and `pnpm build` pass

## Progress

100% complete.

## Change Log

- 2026-07-21: Roadmap started
- 2026-07-21: Created `src/modules/auth-customers/auth-customers.schemas.ts`
- 2026-07-21: Created `src/modules/auth-customers/auth-customers.service.ts`
- 2026-07-21: Updated `src/plugins/auth.ts` (`authenticateCustomer` middleware)
- 2026-07-21: Created `src/modules/auth-customers/auth-customers.controller.ts` & `auth-customers.routes.ts`
- 2026-07-21: Created `src/modules/customer/customer.routes.ts` (`/customer/profile`)
- 2026-07-21: Registered `/auth/customers` and `/customer` in `src/modules/index.ts`
- 2026-07-21: Validated `pnpm typecheck` and `pnpm build` — 100% passing
- 2026-07-21: Roadmap completed
