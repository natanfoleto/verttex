# Roadmap 008 — Marketplace UI

## Metadata

- Status: `planned`
- Priority: high
- Created at: 2026-07-21
- Started at:
- Completed at:
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

| Route | Auth | Description |
|---|---|---|
| `/cadastro` | Public | Customer registration form |
| `/login` | Public | Customer login form |
| `/esqueci-minha-senha` | Public | Request password reset |
| `/redefinir-senha` | Public | Reset password via token |

### Customer Profile

| Route | Auth | Description |
|---|---|---|
| `/perfil` | Customer | View basic profile |
| `/perfil/alterar-senha` | Customer | Change password |

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

- [ ] Implement `useCustomer()` hook (fetch `/auth/customers/me`)
- [ ] Implement `useCustomerLogout()` mutation
- [ ] Implement session expiry detection

### Step 2 — Auth screens

- [ ] Registration form (`name`, `email`, `phone?`, `password`, `confirmPassword`)
- [ ] Login form (`email`, `password`)
- [ ] Forgot password form
- [ ] Reset password form

### Step 3 — Route guard

- [ ] Implement `CustomerAuthGuard` for protected customer routes

### Step 4 — Profile screens

- [ ] Profile view (name, email, phone)
- [ ] Edit profile form
- [ ] Change password form

### Step 5 — Routing skeleton

- [ ] Create `app/lojas/page.tsx` (placeholder: "Em breve")
- [ ] Create `app/lojas/[storeSlug]/page.tsx` (placeholder)
- [ ] Create `app/lojas/[storeSlug]/produtos/page.tsx` (placeholder)
- [ ] Create `app/produtos/page.tsx` (placeholder)
- [ ] Create `app/categorias/[categorySlug]/page.tsx` (placeholder)

### Step 6 — Validate

- [ ] `pnpm typecheck` and `pnpm build` pass
- [ ] All auth screens work end-to-end
- [ ] Profile screens work for authenticated customers

## Tests

- [ ] Registration with valid data creates account
- [ ] Registration with duplicate email shows error
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials shows error
- [ ] Forgot/reset password flow works
- [ ] Profile requires authentication
- [ ] Logout clears session and redirects

## Acceptance Criteria

- [ ] All customer auth flows work end-to-end
- [ ] Profile is accessible only to authenticated customers
- [ ] Routing skeleton created for future public pages
- [ ] All states (loading, error, auth-required) implemented
- [ ] `pnpm typecheck` and `pnpm build` pass

## Pending Decisions

- #9: Can customers register freely? (expected: yes)
- #10: Same email for customer and supplier?

## Progress

Not started.

## Change Log

- 2026-07-21: Roadmap created
