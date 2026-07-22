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

## 10. UI Architecture & Independent Frontend Component Standards

### 10.1 Independent Frontend shadcn/ui Architecture

> **MANDATORY POLICY**: Always install and configure shadcn components directly within the frontend application (`apps/manager` or `apps/marketplace`) that uses them. Do NOT install components prematurely without active usage, and do NOT add basic shadcn components to a shared package. The legacy `@verttex/ui` shared package has been completely removed to avoid tight coupling and broken Radix UI imports.

- **Frontend Component Locations**:
  - `apps/manager`: `src/components/ui/` (`dialog.tsx`, `dropdown-menu.tsx`, `button.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `table.tsx`, `tabs.tsx`, `sheet.tsx`, `tooltip.tsx`, `native-select.tsx`).
  - `apps/marketplace`: `src/components/ui/` (`dialog.tsx`, `dropdown-menu.tsx`, `button.tsx`, `product-card.tsx`, `store-card.tsx`, etc.).
- **Import Pattern Standard**:
  - Manager: `import { Button } from '@/components/ui/button'`
  - Marketplace: `import { Button } from '@/components/ui/button'`
- **Customization & Mandatory `cursor-pointer` Rule**:
  - Do NOT rewrite or alter standard shadcn base component logic unless technically justified. Use Radix UI primitives and utility classes (`cn` helper via `clsx` + `tailwind-merge`).
  - **MANDATORY ACTION ON INSTALLATION**: Whenever installing or adding a new shadcn component, **always add `cursor-pointer` to all clickable elements** (Buttons, `DialogPrimitive.Close`, `SheetClose`, `TabsTrigger`, `SelectTrigger`, `SelectScrollUpButton`, `SelectScrollDownButton`, `DropdownMenuSubTrigger`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, Checkboxes, etc.). Disabled states must maintain `disabled:cursor-not-allowed`.

### 10.2 Modal & Dialog Standard (shadcn/ui Primitives)

- **Form Display Standard**: All creation and editing forms for entities (`Cargos`, `Usuários`, `Lojas`) must be displayed inside `Dialog` modals directly on their listing pages, instead of using separate page routes (`/novo`, `/[id]/editar`). All legacy `/novo` and `/editar` subfolder routes must be completely removed.
- **Standalone Dialog Component Architecture**:
  - Form dialog modals must be isolated in standalone component files located inside a `components/` subdirectory adjacent to the target page (e.g., `app/(dashboard)/cargos/components/role-form-dialog.tsx`, `app/(dashboard)/usuarios/components/user-form-dialog.tsx`, `app/(dashboard)/lojas/components/store-form-dialog.tsx`).
  - The main listing page (`page.tsx`) controls simple boolean / item state (`isDialogOpen`, `editingItem`), rendering the action button with `onClick={openCreateModal}` and mounting the standalone dialog component (`<EntityFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} itemToEdit={editingItem} />`).
- **Standard Modal Primitives**:
  - `Dialog`: For standard form modals and popups (`DialogHeader`, `DialogContent`, `DialogFooter`, `DialogTitle`, `DialogDescription`).
  - `Sheet`: For extensive forms, side-drawer panels, or mobile navigation (`SheetContent`, `SheetHeader`, `SheetTitle`).
  - `AlertDialog`: For critical or destructive confirmation prompts (`AlertDialogAction`, `AlertDialogCancel`).
- **Centering & Layering Standard**: Overlay backdrops use `fixed inset-0 z-50 bg-black/80 backdrop-blur-xs` and modal contents use `fixed z-50 top-1/2 left-1/2` with `style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}` to ensure bulletproof viewport centering regardless of Tailwind v4 transform layer resets.
- Modals must standardize titles, descriptions, scrollable body area, cancel/save buttons, loading states, error alerts, and automatic query invalidation + closure on success.

### 10.3 Top Header & User Profile Menu

- The text `"Gestão Monorepo"` must **not** be used in top headers.
- The top header must display the current page title / breadcrumbs on the left and the authenticated user's profile dropdown on the right.
- **Profile Trigger Button**: Clean inline trigger without outer box border and without hover background color (`cursor-pointer` only). Encloses circle avatar, user name, role badge, and chevron.
- **Dropdown Menu Header**:
  - Displays user name and email in original mixed/lowercase formatting (`normal-case`). Never force `UPPERCASE`.
  - Expanded dropdown menu width (`w-64`) with single-line non-wrapping text (`whitespace-nowrap`) for the user name.
- **Dropdown Options**:
  - **Meu perfil** (`/perfil`)
  - **Alterar senha** (`/perfil#senha`)
  - **Encerrar sessão** (styled with rose/destructive highlight)

### 10.4 Select Standardization

- **Native Selects (`NativeSelect`)**:
  - `appearance-none` to strip default browser arrows.
  - Enclosed in a `relative` container.
  - Custom `RiChevronDownLine` icon positioned absolutely at `right-3 top-1/2 -translate-y-1/2 pointer-events-none`.
  - Mandatory `pr-10` padding right so option text never overlaps the chevron.
- **shadcn `Select` (`SelectTrigger`)**:
  - Padding horizontal strictly set to `px-3`.

### 10.5 Slug Generation Standard (`sanitizeSlug`)

- **Location**: `src/lib/slug.ts`.
- **Rules**:
  1. `normalize('NFD')` + remove diacritics (`[\u0300-\u036f]`).
  2. Lowercase and trim spaces.
  3. Remove non-alphanumeric chars except spaces and hyphens (`[^a-z0-9\s-]`).
  4. Replace spaces with single hyphens (`\s+` -> `-`).
  5. Condense hyphens (`-+` -> `-`) and strip leading/trailing hyphens.
- **Form Auto-Sync Behavior**: Automatically populates `slug` field from `name` field input UNTIL the user manually edits `slug`. Once manually edited, auto-sync pauses to preserve custom input, but sanitization is still applied.

### 10.6 React Query Reactivity & Query Keys Standard

- **Location**: `src/lib/query-keys.ts`.
- **Rule**: Never use ad-hoc string arrays or `window.location.reload()`. Use query key factories:
  - `storeQueryKeys.all`, `storeQueryKeys.list(filters)`, `storeQueryKeys.detail(id)`.
  - `userQueryKeys.all`, `userQueryKeys.list(filters)`, `userQueryKeys.detail(id)`.
  - `roleQueryKeys.all`, `roleQueryKeys.list(filters)`, `roleQueryKeys.detail(id)`.
- **Invalidation Policy**: Mutations MUST call `await queryClient.invalidateQueries({ queryKey: entityKeys.all })` on success to ensure real-time UI updates without page reloads.

### 10.7 Skeleton Loadings & Empty States

- **Table Skeleton**: Use `DataTableSkeleton` (`src/components/skeletons/data-table-skeleton.tsx`) during list loading states. Never show generic spinners for tabular data.
- **Differentiated Empty States**:
  - When no records exist at all: `"Nenhum [item] cadastrado"`.
  - When search/filter is active: `"Nenhum [item] encontrado para os filtros selecionados"`.
  - Right padding `pr-10` on the `<select>` element.
- **Radix/shadcn Selects (`Select`)**:
  - `SelectTrigger` uses horizontal padding `px-3` to ensure proper text and icon alignment without clipping.

### 10.5 Collapsible Sidebar & Submenu Architecture

- Sidebar supports two width states: Expanded (`w-72`) and Collapsed (`w-16`).
- Menu items and submenus must strictly render on a single line (`whitespace-nowrap`). Labels never break into two lines.
- Toggled via dedicated header arrows (`RiArrowLeftSLine` `<` when expanded / `RiArrowRightSLine` `>` when collapsed) and persisted in `localStorage` (`verttex:sidebar-collapsed`).
- When collapsed, the logo is hidden completely, leaving only the centered collapse arrow button. Menu items render as icon-only buttons with floating `Tooltip` overlays on hover.
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

### 10.8 Mandatory Pagination Standard for UI Lists & Tables

> **MANDATORY POLICY**: Every table, grid, or list component in `apps/manager` and `apps/marketplace` **MUST include full pagination controls and pagination state management**.

- **Manager Tables**: Must wrap table content with `<TableWrapper>` passing `meta={data?.meta}`, `onPageChange={setPage}`, `perPageValue={perPage}`, and `onPerPageChange={(newPerPage) => { setPerPage(newPerPage); setPage(1); }}`.
- **Mandatory Pagination Controls (Default)**:
  1. **Direct Page Input & Readonly Total Input**: Editable input for current page and readonly input for total pages (e.g. `Página [ 1 ] de [ 5 ]`), allowing direct typing, Enter submission, or blur navigation to any valid page number.
  2. **First & Last Page Navigation**: First Page (`<<`) and Last Page (`>>`) buttons alongside Previous (`<`) and Next (`>`) buttons.
  3. **Items Per Page Select**: Native select component permitting immediate switching of records displayed per page (10, 20, 50, 100).
- **Query Key Standard**: React Query keys for listing endpoints must include `page`, `perPage`, and `search` states (e.g. `entityKeys.list({ page, perPage, search })`).

### 10.9 Toast Notification Standard (`sonner`)

> **MANDATORY POLICY**: All asynchronous actions, form submissions, permission changes, and CRUD feedback MUST use `sonner` (`import { toast } from 'sonner'`) for user notification toasts.

- **Toaster Registration**: `<Toaster position="bottom-right" theme="dark" richColors />` is configured in `RootLayout` (`layout.tsx`) of both `apps/manager` and `apps/marketplace`.
- **Toast Methods**:
  - `toast.success('Mensagem de sucesso')`: For successful mutations, updates, creations, and permission changes.
  - `toast.error('Mensagem de erro', { description: err.message })`: For failed operations or API validation errors.
  - `toast.info(...)` / `toast.warning(...)`: For informational or warning messages.
- **Prohibited Practice**: NEVER use inline fixed alert banners, native `alert()`, or custom timeout states for user action feedback. Always import and trigger `toast` from `sonner`.

---

## 11. Marketplace Visual Identity & Design System (`apps/marketplace`)

### 11.1 Identity Concept
The Verttex Marketplace connects regional consumers with artisan producers, farm-to-table food makers, and authentic local products. The visual language balances:
- **Artesanal + Moderno**
- **Humano + Tecnológico**
- **Regional + Profissional**
- **Bonito + Funcional**

### 11.2 Palette & Color Tokens
- **Brand Primary**: Emerald (`#065f46` / `emerald-800`) — represents freshness, regional origin, and trust.
- **Brand Secondary / Origin Highlights**: Warm Amber/Terracotta (`#b45309` / `amber-700`, `bg-amber-50`, `border-amber-200`) — represents craft, passion, and local heritage.
- **Background Neutral**: Warm Off-White (`#faf8f5` / `stone-50`).
- **Surface Neutral**: Pure White (`#ffffff` / `bg-white`) with subtle borders (`border-stone-200/80`) and soft shadows (`shadow-xs` / `shadow-sm`).
- **Text Neutral**: Deep Charcoal (`#1c1917` / `stone-900`) for headers, Muted Gray (`#78716c` / `stone-500`) for metadata.
- **Feedback States**: Success (`emerald-700`), Alert (`amber-600`), Error (`rose-600`).

### 11.3 Core Component Standards
- **Border Radius Scale**: Moderated border radius across all marketplace components (`rounded-xl` for cards/containers, `rounded-lg` for inputs, buttons, and inner elements, `rounded-full` for badges and avatar circles). Avoid overly rounded `rounded-3xl` radii.
- **Micro-Interactions**: Clean color transitions (`hover:border-emerald-300`, `hover:bg-emerald-700`) without intrusive `scale-105`/`scale-110` transform shifts.
- **Header (`MarketplaceHeader`) — Double-Tier Architecture**:
  - **Tier 1 (Announcement Bar)**: Slim dark utility bar (`bg-stone-900 text-stone-200 text-xs py-1.5`).
  - **Tier 2 (Main Header Row)**: Brand logo, wide global search input (center), and customer account / wishlist buttons (`rounded-lg`).
  - **Tier 3 (Secondary Sub-Header Bar)**: Secondary navigation bar (`bg-stone-50/90 border-t border-stone-200/80`) featuring hover dropdown submenus (*"Todas as Categorias"*, *"Queijos Artesanais"*, *"Vinhos & Bebidas"*, *"Produtores & Lojas"*, *"Ofertas Regionais"*). Hovering any menu item displays a clean floating dropdown (`rounded-lg bg-white border border-stone-200 shadow-xl p-2`).
- **Footer (`MarketplaceFooter`) — Mercado Livre Style**:
  - **Top Value Props**: Clean white section with 3 centered value columns (`Escolha como pagar`, `Frete e entrega na sua região`, `Segurança, do início ao fim`) with clean icons (`RiBankCardLine`, `RiTruckLine`, `RiShieldCheckLine`) and action links.
  - **Bottom Compact Bar**: Light gray background (`bg-stone-50`) featuring inline navigation links, copyright notice (`Copyright © 2026 Verttex Mercado Regional Ltda.`), and CNPJ / location info.
- **Product Card (`ProductCard`)**:
  - Image container (4:3 aspect ratio, rounded corners `rounded-xl`).
  - Badges on image overlay (`Selo de Origem`, `Produtor Local`, `Mais Vendido`, discount badge).
  - Store link, product title (2-line clamp), rating stars, formatted prices (bold current + line-through original price).
  - CTA button ("Ver Loja").
- **Store Card (`StoreCard`)**:
  - Cover header image preview, overlapping store logo avatar.
  - Location badge (`Serra Gaúcha, RS`), bio snippet, total products count badge.
  - Action button ("Visitar Loja").
- **Category Components (`CategoryCircleCard`, `CategoryPill`)**:
  - Circular category cards with high-impact images for home page exploration.
  - Pill badges with item counts for catalog filtering.
- **Filter Sidebar (`FilterSidebar`)**:
  - Category list accordion with counts, sorting selector, active filter chips with quick remove buttons.
- **Empty States & Skeletons (`EmptyState`, `SkeletonLoader`)**:
  - Clean illustrated empty states and pulse loading skeletons for grids.

