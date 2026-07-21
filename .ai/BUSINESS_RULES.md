# Business Rules — Verttex

This document tracks the product guidelines, business rules, and constraints for the Verttex platform.

## 1. Product Slogan & Purpose

> Na Verttex, conectamos você ao melhor dos cantos onde a internet não alcança, com produtos artesanais que carregam histórias e sabores únicos.

Verttex is a **centralized marketplace** that connects regional and artisanal producers/suppliers to consumers and businesses.

### 1.1 Official Domain

The official public domain of the Verttex marketplace is:

```
https://www.verttexloja.com.br
```

All public URLs, metadata, documentation, configurations, and references must use `verttexloja.com.br`.  
**Do NOT use** `verttex.com.br`.

---

## 2. Access Contexts

The system has **two distinct authentication contexts** that must remain separated in both modeling and middleware:

### 2.1 Management Users (`User`)

- Access the admin panel: `apps/manager`
- The term `User` represents **exclusively** management/admin users
- **Do NOT use `User` to represent customer buyers**
- Users are created only via the admin panel or a secure bootstrap process (no public registration)

### 2.2 Customer Buyers (`Customer`)

- Access the marketplace: `apps/marketplace`
- The term `Customer` represents **exclusively** marketplace buyers
- Customers can register publicly

---

## 3. Initial Roles

The system starts with three roles, persisted in the database and created by seed:

| Key | Name | Description |
|---|---|---|
| `admin` | Administrator | Full access to the platform |
| `employee` | Employee | Assists in managing supplier stores |
| `supplier` | Supplier | Responsible for one or more partner stores |

Roles are **not rigid enums** in code. The system must support new roles in the future (e.g., `manager`, `operator`, `stockist`, `analyst`).

### 3.1 Administrator

- Full access (`manage all` in CASL)
- Can manage users, roles, permissions, all stores, and all data
- **Must not** be represented as `if (user.role === 'admin')` inline — authorization must go through the CASL ability system
- System role protections: cannot delete the `admin` role, cannot remove all admin permissions, cannot deactivate the last active admin

### 3.2 Employee

- Can view and edit store data
- Can assist suppliers
- Access scope: **TBD** — either global across all stores, or limited to linked stores
  > ⚠️ **Pending decision**: must be confirmed before definitive implementation

### 3.3 Supplier

- Can view their linked stores only
- **Cannot** view stores they are not linked to
- Can be linked to one or more stores
- One store can have one or more linked suppliers

---

## 4. Permissions System

### 4.1 General Principle

Roles provide default permissions, but each user can have individual exceptions.

Effective access is determined by:
1. Role default permissions
2. Explicit user-level grant (allow)
3. Explicit user-level denial (deny)
4. Store-level scope (which stores the user can access)

### 4.2 Permission Naming

All permissions follow the `resource.action` pattern. See `.ai/PERMISSIONS.md` for the full reference.

### 4.3 Permission Precedence Order

1. Administrator with `manage all`
2. Explicit denial assigned to the user
3. Explicit grant assigned to the user
4. Permission granted by the role
5. Access denied by default (no rule = no access)

> ⚠️ **Pending decision**: final precedence order must be confirmed before implementation.

### 4.4 Store-Level Scope

Holding a functional permission is **not sufficient**. The system must also verify whether the user can access that specific store.

Authorization is composed of: **Functional permission + Store scope**

- **Admin**: global scope across all stores
- **Employee**: TBD (global or store-linked) — pending decision
- **Supplier**: limited to linked stores only

---

## 5. User–Store Relationship

The relationship between users and stores is many-to-many:
- A store can have multiple users
- A user can be linked to multiple stores

The role and the store link are **different concepts**:
- Role determines **what** the user can do
- Store link determines **where** they can do it

---

## 6. Store Rules

### 6.1 Store Status

| Status | Description |
|---|---|
| `draft` | Created but not yet published |
| `active` | Published and available |
| `inactive` | Deactivated voluntarily or not operational |
| `suspended` | Blocked by admin |

### 6.2 Store Slug

Each store has a unique slug (e.g., `engenho-jaborandi`). The official URL will be:

```
https://www.verttexloja.com.br/lojas/:storeSlug
```

The slug must be unique, normalized, URL-safe, and validated against a list of reserved words (e.g., `produtos`, `categorias`, `carrinho`, `checkout`, `api`, `login`, `cadastro`).

### 6.3 Custom Domain Strategy

A store can optionally register a custom domain (e.g., `engenhojaborandi.com.br`) that permanently redirects to the official Verttex page.

- Phase 1: field can be registered, basic validation only
- No DNS automation, SSL certificates, or live redirects in Phase 1
- The official canonical URL always remains under `verttexloja.com.br`

---

## 7. Authentication Rules

- Tokens of users and customers are **not interchangeable**
- A customer token cannot access administrative routes
- Tokens must identify the actor type (`actorType: user` | `actorType: customer`)
- Access tokens: short-lived
- Refresh tokens: rotated, stored as hash only
- Cookies: `httpOnly`, `secure` in production, appropriate `sameSite`
- Sessions must be revocable
- Inactive accounts cannot authenticate
- Rate limiting and brute-force protection must be applied

---

## 8. In-Scope for Phase 1

- User and customer authentication (login, logout, refresh, password recovery)
- Role and permission management (CRUD + individual overrides)
- Store management (CRUD, slug, custom domain field, user linking)
- CASL shared permissions package (`@verttex/auth`)
- Admin panel initial screens (`apps/manager`)
- Marketplace customer auth screens (`apps/marketplace`)
- Audit log foundation

## 9. Out-of-Scope for Phase 1

Do NOT implement without a confirmed follow-up specification:

- Products, Categories, Inventory
- Cart, Checkout, Orders, Payments, Shipping
- Promotions, Coupons, Ratings, Reviews
- CMS, Full custom store pages
- DNS automation, SSL, Cloudflare for SaaS
- Payment gateways, Fiscal documents, Real shipping

---

## 10. Strict Rules (For AI Agents)

- **DO NOT INVENT** any business rules, models, or tables not explicitly specified
- Do not add domain-specific seed data (products, producers, orders)
- Use `User` only for management users, `Customer` only for buyers
- All authorization must pass through the CASL ability system — never inline role checks
- The backend is always the authoritative source of security
- Soft-delete (logical deactivation) is preferred over hard delete for Users, Customers, and Stores
- All permissions must follow the `resource.action` naming convention
- See `.ai/PERMISSIONS.md` for the full permissions reference
