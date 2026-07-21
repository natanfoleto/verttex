# Roadmap 004 — Customer Authentication

## Metadata

- Status: `planned`
- Priority: critical
- Created at: 2026-07-21
- Started at:
- Completed at:
- Dependencies: `002-data-modeling`
- Related roadmaps: 008

## Objective

Implement the full authentication flow for marketplace customers: public registration, login, logout, refresh, password recovery, profile, and the `authenticateCustomer` middleware.

## Context

Customers are buyers who use `apps/marketplace`. Unlike management users, customers can register publicly. This roadmap covers the backend API only. Frontend customer auth screens are covered in Roadmap 008.

## Expected Outcome

- Complete authentication API for customer buyers
- Public registration endpoint
- JWT-based access + refresh tokens (separate from user tokens)
- Cookie-based session management (separate cookies from user sessions)
- Password recovery flow
- `authenticateCustomer` middleware ready for use

## Scope

- `POST /auth/customers/register`
- `POST /auth/customers/login`
- `POST /auth/customers/logout`
- `POST /auth/customers/refresh`
- `POST /auth/customers/forgot-password`
- `POST /auth/customers/reset-password`
- `POST /auth/customers/change-password`
- `GET /auth/customers/me`
- `GET /customer/profile`
- `PATCH /customer/profile`
- `authenticateCustomer` middleware
- `CustomerSession` management
- `CustomerPasswordResetToken` management
- Rate limiting on auth routes

## Out of Scope

- Management user authentication (see Roadmap 003)
- Cart, checkout, orders, favorites (future roadmaps)
- Full address management
- CPF, CNPJ, fiscal data

## Business Rules

- Customer registration is public
- Tokens must carry `actorType: "customer"`
- Customer token cannot access administrative routes
- Refresh tokens stored as hash only
- Password reset tokens: single-use, time-limited
- Public responses must never reveal if an email exists or not
- `Customer.email` unique constraint

## Architecture Decisions

- Separate cookie names from user context (`customer-access`, `customer-refresh` vs `user-access`, `user-refresh`)
- Separate audiences in JWT payload
- `CustomerSession` is independent from `UserSession`
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
- Body: `{ name?, phone? }` (limited fields in Phase 1)

## Implementation Steps

### Step 1 — Auth service

- [ ] Implement `register`
- [ ] Implement `login`
- [ ] Implement `logout`
- [ ] Implement `refresh`
- [ ] Implement `forgotPassword`
- [ ] Implement `resetPassword`
- [ ] Implement `changePassword`
- [ ] Implement `me` and profile endpoints

### Step 2 — Middleware

- [ ] Implement `authenticateCustomer` middleware
- [ ] Extract customer from JWT, populate `request.customer`
- [ ] Return 401 on invalid/expired token

### Step 3 — Routes

- [ ] Register all routes in `src/modules/auth-customers/` and `src/modules/customer/`
- [ ] Apply Zod schemas to all inputs
- [ ] Apply rate limiting

### Step 4 — Validate

- [ ] `pnpm typecheck` and `pnpm build` pass
- [ ] All routes appear in Swagger

## Tests

- [ ] Customer registration with valid data
- [ ] Registration with duplicate email
- [ ] Login with valid credentials
- [ ] Login with invalid password
- [ ] Login with inactive customer
- [ ] Logout clears session
- [ ] Refresh token rotation
- [ ] Forgot/reset password flow
- [ ] Customer token cannot access `/auth/users/me`
- [ ] `GET /customer/profile` with valid token
- [ ] `GET /customer/profile` with no token returns 401

## Acceptance Criteria

- [ ] All customer auth routes respond correctly
- [ ] Registration is public
- [ ] Customer tokens are not accepted on user routes
- [ ] Sessions are revocable
- [ ] `authenticateCustomer` middleware is ready
- [ ] `pnpm typecheck` and `pnpm build` pass

## Pending Decisions

- #9: Can customers register freely?
- #10: Can the same person be customer and supplier with the same email?
- #11: Soft-delete or hard-delete for customers?

## Progress

Not started.

## Change Log

- 2026-07-21: Roadmap created
