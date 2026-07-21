# Frontend & UI Architecture — Verttex

This document details the front-end layout structure, Next.js routing patterns, UI packages, authorization patterns, and state management guidelines.

## 1. Directory Layout

Applications `apps/manager` and `apps/marketplace` are Next.js App Router projects:

- `src/app/`: Core layout, routing paths, metadata configs.
- `src/features/`: Domain specific components, hooks, schemas.
- `src/lib/api/`: Base client setup for fetching API endpoint results.
- `src/providers/`: Root query-provider configs (TanStack Query).

---

## 2. Server vs. Client Components

- **Server Components by default**: Any informational pages, initial layouts, static assets should be Server Components.
- **Client Components only when needed**: Use `"use client"` for dynamic form pages, button triggers, hooks usage (`useQuery`, `useForm`), and Radix primitives.

---

## 3. Style System

- **Tailwind CSS v4** styling properties.
- **Aesthetic Theme**: Standardized zinc color palette and New York design details.
- **Icons**: Resolved using `react-icons` package for UI consistency.
- **Global Elements**: Shared visuals must be imported from the workspace package `@verttex/ui` (which encapsulates standard shadcn configurations).

---

## 4. Forms and State

- **Form Validation**: Zod validators coupled with `react-hook-form` and `@hookform/resolvers/zod`.
- **Network Request Cache**: Managed via `@tanstack/react-query` to resolve state synchronization.

---

## 5. Authorization in the Frontend

The frontend uses CASL abilities (from `@verttex/auth`) to control the user experience. The **backend is always the authoritative source of security** — frontend guards are for UX only.

### 5.1 Authorization Principles

- Hide buttons and links the user has no permission to use
- Protect pages and routes
- Display an "Access Denied" state when navigating to unauthorized pages
- Prevent submission of actions the user cannot perform

### 5.2 Route Guards

Management routes in `apps/manager` must:

1. Check if the user is authenticated (redirect to `/login` otherwise)
2. Check if the user has the required permission (redirect to `/acesso-negado` otherwise)

Customer routes in `apps/marketplace` must:

1. Check if the customer is authenticated (redirect to `/login` otherwise)

### 5.3 Authorization Components

Use composable authorization primitives:

```tsx
// Show children only if user can perform action on subject
<Can I="create" a="users">
  <Button>Cadastrar usuário</Button>
</Can>
```

```tsx
// Protect a full page
<RequirePermission action="stores.read">
  <StorePage />
</RequirePermission>
```

### 5.4 Access Denied Page

A dedicated `/acesso-negado` page must be shown when:

- The user is authenticated but lacks the required permission
- A store-scoped resource is accessed by a user without store access

---

## 6. Manager Screens (`apps/manager`)

### 6.1 Authentication

| Route                  | Auth          | Description              |
| ---------------------- | ------------- | ------------------------ |
| `/login`               | Public        | Login form               |
| `/esqueci-minha-senha` | Public        | Request password reset   |
| `/redefinir-senha`     | Public        | Reset password via token |
| `/alterar-senha`       | Authenticated | Change own password      |
| `/sessao-expirada`     | Public        | Expired session message  |
| `/acesso-negado`       | Public        | Access denied screen     |

### 6.2 Users

| Route                          | Permission         | Description            |
| ------------------------------ | ------------------ | ---------------------- |
| `/usuarios`                    | `users.read`       | User listing           |
| `/usuarios/novo`               | `users.create`     | Create user form       |
| `/usuarios/:userId`            | `users.read`       | User detail/view       |
| `/usuarios/:userId/editar`     | `users.update`     | Edit user              |
| `/usuarios/:userId/permissoes` | `permissions.read` | Individual permissions |
| `/usuarios/:userId/lojas`      | `users.read`       | Linked stores          |

### 6.3 Roles

| Route                        | Permission           | Description                |
| ---------------------------- | -------------------- | -------------------------- |
| `/cargos`                    | `roles.read`         | Role listing               |
| `/cargos/novo`               | `roles.create`       | Create role                |
| `/cargos/:roleId`            | `roles.read`         | Role detail                |
| `/cargos/:roleId/editar`     | `roles.update`       | Edit role                  |
| `/cargos/:roleId/permissoes` | `permissions.manage` | Configure role permissions |

### 6.4 Stores

| Route                     | Permission              | Description        |
| ------------------------- | ----------------------- | ------------------ |
| `/lojas`                  | `stores.read`           | Store listing      |
| `/lojas/nova`             | `stores.create`         | Create store       |
| `/lojas/:storeId`         | `stores.read`           | Store detail       |
| `/lojas/:storeId/editar`  | `stores.update`         | Edit store         |
| `/lojas/:storeId/membros` | `stores.manage-members` | Manage store users |

### 6.5 Authenticated User Profile

| Route     | Auth          | Description               |
| --------- | ------------- | ------------------------- |
| `/perfil` | Authenticated | View and edit own profile |

---

## 7. Marketplace Screens (`apps/marketplace`)

### 7.1 Customer Authentication

| Route                   | Auth     | Description              |
| ----------------------- | -------- | ------------------------ |
| `/cadastro`             | Public   | Customer registration    |
| `/login`                | Public   | Customer login           |
| `/esqueci-minha-senha`  | Public   | Request password reset   |
| `/redefinir-senha`      | Public   | Reset password via token |
| `/perfil`               | Customer | Basic profile            |
| `/perfil/alterar-senha` | Customer | Change password          |

### 7.2 Public Pages (planned, not implemented in Phase 1)

```
/produtos                               — General product catalog
/categorias/:categorySlug              — Category listing
/lojas                                  — Store listing
/lojas/:storeSlug                      — Store main page
/lojas/:storeSlug/produtos             — Store product catalog
/lojas/:storeSlug/:pageSlug            — Custom store page
```

These routes must be **architecturally prepared** (folder structure and routing skeleton) but do not need fully functional implementations in Phase 1.

---

## 8. Shared Components and Authorization Hooks

All reusable authorization logic must live in `src/features/auth/` or be exported from `@verttex/auth`:

- `useAbility()` — returns the current user's CASL ability instance
- `useCan(action, subject)` — returns boolean for a specific permission check
- `<Can>` — component that renders children conditionally
- `<RequirePermission>` — component that protects a full page/section

---

## 9. Loading, Empty, and Error States

Every feature screen must implement:

- **Loading state**: Skeleton or spinner while data is fetched
- **Empty state**: Illustrated empty feedback when no data exists
- **Error state**: User-friendly error message with retry option
- **Access denied state**: Clear message and navigation option back to a safe page

---

## 10. UI Standards & Shared Components (`@verttex/ui`)

### 10.1 Full-Width Page Container Layout

- All pages in `apps/manager` must occupy 100% of the available content area width (`w-full flex-1`).
- Avoid restrictive `max-w-*` wrappers on page containers, dashboards, tables, and form sections.
- Maintain consistent internal padding (`p-6 lg:p-8`).

### 10.2 Modal & Dialog Standard (shadcn/ui Primitives)

- Use standard modal primitives exported from `@verttex/ui`:
  - `Dialog`: For standard form modals and popups (`DialogHeader`, `DialogContent`, `DialogFooter`, `DialogTitle`, `DialogDescription`).
  - `Sheet`: For extensive forms, side-drawer panels, or mobile navigation (`SheetContent`, `SheetHeader`, `SheetTitle`).
  - `AlertDialog`: For critical or destructive confirmation prompts (`AlertDialogAction`, `AlertDialogCancel`).
- Modals must standardize titles, descriptions, scrollable body area, cancel/save buttons, loading states, and automatic closure on success.

### 10.3 Top Header & User Profile Menu

- The text `"Gestão Monorepo"` must **not** be used in top headers.
- The top header must display the current page title / breadcrumbs on the left and the authenticated user's profile dropdown on the right.
- The user profile trigger includes the user avatar/initials, name, role badge, and a `RiArrowDownSLine` icon.
- Clicking the trigger opens a `DropdownMenu` (`@verttex/ui`) with options for:
  - **Meu perfil** (`/perfil`)
  - **Alterar senha** (`/perfil#senha`)
  - **Encerrar sessão** (styled with rose/destructive highlight)

### 10.4 Select Standardization

- **Native Selects (`NativeSelect`)**:
  - `appearance-none` to strip default browser arrows.
  - Enclosed in a `relative` container.
  - Custom `RiArrowDownSLine` icon positioned absolutely at `right-3 top-1/2 -translate-y-1/2 pointer-events-none`.
  - Right padding `pr-10` on the `<select>` element.
- **Radix/shadcn Selects (`Select`)**:
  - `SelectTrigger` uses horizontal padding `px-3` to ensure proper text and icon alignment without clipping.

### 10.5 Collapsible Sidebar & Submenu Architecture

- Sidebar supports two width states: Expanded (`w-64`) and Collapsed (`w-16`).
- Toggled via a dedicated header button (`RiMenuFoldLine` / `RiMenuUnfoldLine`) and persisted in `localStorage` (`verttex:sidebar-collapsed`).
- When collapsed, menu items display icon-only buttons with floating `Tooltip` overlays on hover.
- Navigation structure supports submenus (`children` array on `NavItem`):
  ```ts
  interface NavItem {
    label: string;
    href?: string;
    icon: IconType;
    show?: boolean;
    children?: {
      label: string;
      href: string;
      icon?: IconType;
      show?: boolean;
    }[];
  }
  ```
- Active route highlighting applies automatically to both parent and child routes.
- Mobile screens (< `lg`) render the sidebar inside a slide-over `Sheet` drawer.

### 10.6 Category Tabs (`Tabs`)

- When a page contains extensive information divided by categories, use `Tabs` (`TabsList`, `TabsTrigger`, `TabsContent`) from `@verttex/ui`.

### 10.7 Vertical Profile Page Layout

- Profile sections are organized vertically in sequence or tabbed sections:
  1. Dados Pessoais
  2. Segurança & Credenciais
  3. Cargo & Direitos de Acesso
  4. Lojas Vinculadas
  5. Sessões Ativas
- Cards take 100% available width without horizontal side-by-side splitting.
