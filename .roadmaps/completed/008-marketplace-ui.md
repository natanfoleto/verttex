# Roadmap 008 — Marketplace UI

## Metadata

- Status: `completed`
- Priority: high
- Created at: 2026-07-21
- Started at: 2026-07-21
- Completed at: 2026-07-21
- Dependencies: `004-customer-authentication`
- Related roadmaps: 004

## Objective

Implement the initial customer-facing screens for `apps/marketplace`: account creation, login, logout, password recovery, and basic profile. Prepare the routing architecture for future public pages (stores, products, catalog) without implementing them yet.

## Context

The marketplace currently has only a placeholder page. This roadmap implements Phase 1 customer auth screens and prepares the App Router structure for future public pages. No product or store listing pages are built yet — only the auth and profile flows.

## Expected Outcome

- Customer registration, login, logout, and password recovery working in the marketplace
- Basic profile screen for authenticated customers
- App Router folder structure prepared for future routes (`/lojas`, `/produtos`, `/categorias`)
- All states: loading, error, auth-required

## Scope

### Customer Auth Screens

| Route                  | Auth   | Description                |
| ---------------------- | ------ | -------------------------- |
| `/cadastro`            | Public | Customer registration form |
| `/login`               | Public | Customer login form        |
| `/esqueci-minha-senha` | Public | Request password reset     |
| `/redefinir-senha`     | Public | Reset password via token   |

### Customer Profile

| Route                   | Auth     | Description        |
| ----------------------- | -------- | ------------------ |
| `/perfil`               | Customer | View basic profile |
| `/perfil/alterar-senha` | Customer | Change password    |

### Routing Skeleton (structure only, no content)

```
/lojas                         — future store listing
/lojas/[storeSlug]            — future store main page
/lojas/[storeSlug]/produtos   — future store catalog
/produtos                      — future global product catalog
/categorias/[categorySlug]    — future category listing
```

These routes must have folder structure created with a simple placeholder page component that says "Em breve" — they must NOT have any real implementation.

## Out of Scope

- Product listing, store listing, catalog
- Cart, checkout, orders, payments
- Favorites, ratings, reviews
- Custom store pages
- Any admin panel screens (Roadmap 007)

## Business Rules

- Customer registration is public
- Unauthenticated customers can browse public pages (future)
- Authenticated customers can access `/perfil` and related protected routes
- Customer session is managed via `httpOnly` cookies (separate from user session)

## Authentication Flow

- Unauthenticated access to `/perfil` redirects to `/login`
- After login, redirect to `/` (home placeholder)
- After logout, redirect to `/login`

## Implementation Steps

### Step 1 — Auth setup

- [x] Implement `useCustomer()` hook (fetch `/auth/customers/me`)
- [x] Implement `useCustomerLogout()` mutation
- [x] Implement session expiry detection

### Step 2 — Auth screens

- [x] Registration form (`name`, `email`, `phone?`, `password`, `confirmPassword`)
- [x] Login form (`email`, `password`)
- [x] Forgot password form
- [x] Reset password form

### Step 3 — Route guard

- [x] Implement `CustomerAuthGuard` for protected customer routes

### Step 4 — Profile screens

- [x] Profile view (name, email, phone)
- [x] Edit profile form
- [x] Change password form

### Step 5 — Routing skeleton

- [x] Create `app/lojas/page.tsx` (placeholder: "Em breve")
- [x] Create `app/lojas/[storeSlug]/page.tsx` (placeholder)
- [x] Create `app/lojas/[storeSlug]/produtos/page.tsx` (placeholder)
- [x] Create `app/produtos/page.tsx` (placeholder)
- [x] Create `app/categorias/[categorySlug]/page.tsx` (placeholder)

### Step 6 — Validate

- [x] `pnpm typecheck` and `pnpm build` pass
- [x] All auth screens work end-to-end
- [x] Profile screens work for authenticated customers

## Tests

- [x] Registration with valid data creates account
- [x] Registration with duplicate email shows error
- [x] Login with valid credentials succeeds
- [x] Login with invalid credentials shows error
- [x] Forgot/reset password flow works
- [x] Profile requires authentication
- [x] Logout clears session and redirects

## Acceptance Criteria

- [x] All customer auth flows work end-to-end
- [x] Profile is accessible only to authenticated customers
- [x] Routing skeleton created for future public pages
- [x] All states (loading, error, auth-required) implemented
- [x] `pnpm typecheck` and `pnpm build` pass

## Pending Decisions

- #9: Can customers register freely? (expected: yes)
- #10: Same email for customer and supplier?

## Progress

Completed: Roadmap 008 (Marketplace UI) implemented and verified.

## Change Log

- 2026-07-21: Roadmap created
- 2026-07-21: Roadmap activated
- 2026-07-21: Roadmap completed
