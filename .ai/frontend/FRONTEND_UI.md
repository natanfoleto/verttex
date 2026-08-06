# Frontend & UI Architecture — Verttex

This document details the front-end layout structure, Next.js routing patterns, UI packages, authorization patterns, and state management guidelines.

## 1. Directory Layout

Applications `apps/manager` and `apps/marketplace` are Next.js App Router projects:

- `src/app/`: Core layout, routing paths, metadata configs.
- `src/features/`: Domain specific components, hooks, schemas.
- `src/lib/api/`: Base client setup for fetching API endpoint results.
- `src/providers/`: Root query-provider configs (TanStack Query).

### 1.1 Mandatory HTTP Client (`apiClient`)

- **Proibição de `fetch` Direto:** É estritamente proibido utilizar `fetch()` nativo diretamente em componentes ou páginas para chamadas à API da aplicação.
- **Uso de `apiClient`:** Todas as chamadas para a API backend devem ser realizadas com `apiClient` (`@/lib/api-client`).
- **Garantias do `apiClient`:**
  1. Envio automático de cookies HTTP-Only de sessão (`credentials: "include"`).
  2. Renovação automática de tokens via refresh token silencioso em respostas `401`.
  3. Formatação e lançamento de exceções `ApiError` padronizadas.

---

## 2. Server vs. Client Components

- **Server Components by default**: Any informational pages, initial layouts, static assets should be Server Components.
- **Client Components only when needed**: Use `"use client"` for dynamic form pages, button triggers, hooks usage (`useQuery`, `useForm`), and Radix primitives.

---

## 3. Style System

- **Tailwind CSS v4** styling properties.
- **Sintaxe de Classes Numéricas Diretas (Sem Colchetes `[...]` para Pixels)**: É proibido utilizar a sintaxe de colchetes arbitrários para valores em pixels (ex: `min-h-[420px]`, `w-[760px]`, `h-[400px]`, `p-[16px]`). Divida o valor em pixels por 4 e utilize a classe numérica nativa direta do Tailwind (ex: `min-h-105` para 420px, `min-w-190` para 760px, `h-100` para 400px, `h-185` para 740px, `max-w-160` para 640px). O Tailwind v4 resolve nativamente qualquer número em escala sem necessidade de escapar com `[]`.
- **Aesthetic Theme**: Standardized zinc color palette and New York design details.
- **Icons**: Resolved using `react-icons` package for UI consistency.
- **Global Elements**: Shared visuals must be imported from standard shadcn configurations in `@/components/ui/...`.

### 3.1 Regra Mandatória de Componentes Shadcn UI vs. Elementos Nativos

- **Prioridade Absoluta dos Componentes Shadcn UI:** Em todas as novas telas e implementações no frontend (`apps/manager` e `apps/marketplace`), é **estritamente obrigatório utilizar primeiramente os componentes do Shadcn UI** (`Button`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`) em vez de elementos HTML nativos (`<button>`, `<input>`, `<textarea>`).
- **Fluxo de Trabalho de Implementação e Teste:** Toda nova interface **DEVE ser obrigatoriamente criada e testada utilizando o componente `Button` do Shadcn UI**. Caso, durante o teste visual no browser, seja identificado que o componente `Button` do Shadcn causa desalinhamentos de layout/padding/ícone inviáveis que prejudicam a UX, a exceção pode ser concedida e mantida como elemento nativo após essa validação inicial.
- **Exceções Aprovadas no Projeto:**
  1. **Triggers do componente `HoverDropdown`** ([hover-dropdown.tsx](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/marketplace/src/components/ui/hover-dropdown.tsx), [marketplace-header.tsx](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/marketplace/src/components/layout/marketplace-header.tsx)): Mantêm `<button>` nativo (ou elemento trigger customizado) para servir como trigger limpo sem herdar estilos adicionais de botões ou paddings indesejados.
  2. **Botões de menu no Drawer Mobile** ([mobile-menu-drawer.tsx](file:///Users/natanfoleto/Desktop/prefeitura/verttex/apps/marketplace/src/components/layout/mobile-menu-drawer.tsx#L255)): Mantêm `<button>` nativo para garantir alinhamento pixel a pixel de paddings (`px-5 py-3`), tamanho de ícones (`h-5 w-5`) e espaçamento idêntico aos elementos `<Link>` da lista de navegação do menu mobile.

---

## 4. Forms and State

- **Form Validation**: Zod validators coupled with `react-hook-form` and `@hookform/resolvers/zod`.
- **Network Request Cache**: Managed via `@tanstack/react-query` to resolve state synchronization.

### 4.1 Regra Mandatória de Habilitação do Botão de Salvar (`isDirty`)

- **Habilitação Condicional do Botão de Salvar (Regra Não Negociável de UX)**: Em **TODOS** os formulários da aplicação (`apps/manager` e `apps/marketplace`), o botão de salvar/submeter alterações **DEVE obrigatoriamente** permanecer desabilitado (`disabled={!isDirty || isSubmitting}`) quando o formulário estiver pristine (sem nenhuma alteração nos campos em relação ao estado original).
- **Comportamento Esperado**:
  1. Ao abrir ou carregar o formulário (seja em modal ou página), o botão "Salvar / Salvar Alterações" nasce desabilitado (`disabled`).
  2. À medida que o usuário edita qualquer campo (texto, select, checkbox, upload de arquivo, etc.), o estado `isDirty` torna-se `true` e o botão é habilitado.
  3. Após a submissão bem-sucedida, o formulário faz `reset(newValues)` ou atualiza o snapshot de comparação, retornando o botão para o estado desabilitado até a próxima alteração.

### 4.2 Regra Mandatória de Exibição de Erros via `<ErrorDialog />` (Padrão de Sistema)

- **Uso Obrigatório do Componente `<ErrorDialog />` para Estados de Erro (Regra Arquitetural de UX):** Em formulários, modais, páginas e ações de mutação onde a submissão falhar ou houver retornos de erro da API (erros de validação Zod/Fastify, erros de campos aninhados, regra de negócio 400/422/500 ou falha de requisição), **DEVE-SE obrigatoriamente utilizar o componente `<ErrorDialog />`** via Provider central e hook `useErrorDialog()` (`const { showError } = useErrorDialog()`) em vez de Toasts temporários de 4 segundos.
- **Integração Centralizada:**
  1. A aplicação é envolvida pelo `<ErrorDialogProvider>` no `layout.tsx` raiz.
  2. Qualquer componente ou formulário invoca `showError(error, title?, description?)`.
- **Motivação e UX:**
  1. **Persistência Sem Auto-Dismiss:** O `<ErrorDialog />` fica aberto na tela até que o usuário leia a mensagem e clique explicitamente no botão _"Entendi"_.
  2. **Formatação de Erros de Campo:** Transforma chaves técnicas de API (ex: `variations.0.price`) em marcadores legíveis ao usuário final (ex: `Variação #1 (Preço): Preço deve ser maior que zero`).
  3. **Adaptação Dinâmica ao Tema:** O modal responde automaticamente aos temas Claro (Light) e Escuro (Dark) configurados no sistema através dos design tokens do Tailwind CSS (`bg-zinc-900`, `border-zinc-800`, `text-zinc-100`, `text-rose-500`).
  4. Botão de confirmação com texto _"Entendi"_ e classe Tailwind `cursor-pointer`.

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

### 10.1 Independent Frontend Shadcn UI Architecture & Mandatory Component Policy

> **MANDATORY POLICY & STRICT COMPONENT REUSE RULE**:
>
> 1. **Shadcn UI is the Primary Component Library**: Every new page, modal, layout, form element, data table, menu, drawer, tab group, badge, card, or visual component **MUST first seek and reuse official Shadcn UI / Radix UI components** (`@/components/ui/...`). Building custom HTML/CSS controls (such as custom `<div>` modals, custom tab systems, or ad-hoc dropdowns) is strictly prohibited whenever an equivalent Shadcn component exists. Custom component creation is reserved strictly for rare, complex edge cases not covered by Shadcn/Radix.
> 2. **Component Installation & Location**: Install and configure Shadcn components directly within the target frontend application (`apps/manager/src/components/ui/` or `apps/marketplace/src/components/ui/`).
> 3. **Import Pattern Standard**:
>    - Manager: `import { Button } from '@/components/ui/button'`
>    - Marketplace: `import { Button } from '@/components/ui/button'`
> 4. **Mandatory `cursor-pointer` Rule**: Whenever adding or using UI components, **always enforce `cursor-pointer` on ALL clickable elements** (Buttons, Close Icons, `DialogClose`, `SheetClose`, `TabsTrigger`, `SelectTrigger`, Checkboxes, Badges with click handlers, etc.). Disabled states must maintain `disabled:cursor-not-allowed`.

### 10.2 Modal & Dialog Standard (Shadcn UI Primitives)

> **MANDATORY POLICY & STRICT PROHIBITION**:
>
> 1. **Zero Native Browser Dialogs (`confirm()`, `alert()`, `prompt()`)**: Native browser popups are strictly forbidden throughout the entire application. All destructive or confirmation prompts (such as archiving, deleting, or status changes) **MUST use the Shadcn UI `AlertDialog` component** (`AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction` from `@/components/ui/alert-dialog`).
> 2. **Zero Custom `<div>` Modals**: It is strictly forbidden to build custom popups using raw `<div>` overlays (`fixed inset-0 flex...`). All creation, editing, detail, or confirmation popups **MUST reuse the official Shadcn UI / Radix UI dialog primitives** (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` from `@/components/ui/dialog`, or `Sheet` / `AlertDialog`).
> 3. **Mandatory `cursor-pointer`**: Every clickable element in modals, forms, tables, and dialog close/action/cancel buttons **MUST include `cursor-pointer`**.
> 4. **Click-Outside & Keyboard Accessibility**: By using Radix UI `Dialog` and `AlertDialog`, popups automatically support backdrop click-outside dismissal (`DialogOverlay`), ESC key closure, focus trap, and ARIA screen reader accessibility.

### 10.3 Mandatory Skeleton Loading Standard (Regra Mandatória de Skeleton Loading)

> **MANDATORY POLICY & VISUAL STANDARD**:
>
> 1. **Uso Obrigatório de Skeleton Loading**: Toda e qualquer página, aba, modal ou componente que realize carregamento assíncrono de dados (ex: Perfil do Cliente, Listagem do Catálogo, Cartões de Endereço, Tabelas de Gestão do Manager, etc.) **DEVE obrigatoriamente implementar componentes visuais de Skeleton Loading (`animate-pulse`)**.
> 2. **Fidelidade Visual do Skeleton**: O Skeleton Loading deve espelhar com precisão o layout, o tamanho de largura (`max-w-7xl`), os cartões, cabeçalhos, formulários e abas da interface final carregada, evitando sobressaltos ou saltos de layout (_Layout Shift / CLS_).
> 3. **Prevenção de Erros de Hidratação (SSR)**: Em componentes Client com Guards de Rota (ex: `CustomerAuthGuard`), é obrigatório utilizar o padrão de controle `mounted` exibindo o Skeleton Loading como fallback de carregamento inicial, garantindo 100% de paridade entre o HTML gerado pelo servidor (SSR) e a hidratação no cliente.

- **Form Display Standard**: All creation and editing forms for entities (`Cargos`, `Usuários`, `Lojas`, `Categorias`, `Marcas`) must be displayed inside `Dialog` modals directly on their listing pages, instead of using separate page routes (`/novo`, `/[id]/editar`). All legacy `/novo` and `/editar` subfolder routes must be completely removed.
- **Standalone Dialog Component Architecture**:
  - Form dialog modals must be isolated in standalone component files located inside a `components/` subdirectory adjacent to the target page (e.g., `app/(dashboard)/cargos/components/role-form-dialog.tsx`, `app/(dashboard)/usuarios/components/user-form-dialog.tsx`, `app/(dashboard)/lojas/components/store-form-dialog.tsx`).
  - The main listing page (`page.tsx`) controls simple boolean / item state (`isDialogOpen`, `editingItem`), rendering the action button with `onClick={openCreateModal}` and mounting the standalone dialog component (`<EntityFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} itemToEdit={editingItem} />`).
- **Standard Modal Primitives**:
  - `Dialog`: For standard form modals and popups (`DialogHeader`, `DialogContent`, `DialogFooter`, `DialogTitle`, `DialogDescription`).
  - `Sheet`: For extensive forms, side-drawer panels, or mobile navigation (`SheetContent`, `SheetHeader`, `SheetTitle`).
  - `AlertDialog`: For critical or destructive confirmation prompts (`AlertDialogAction`, `AlertDialogCancel`).
- **Canonical Form Dialog Design Pattern (Mandatory Standard for ALL Form Dialogs)**:
  Every form modal in `apps/manager` and `apps/marketplace` **MUST strictly adhere** to the following structural and visual rules:
  1. **Fixed Height & Viewport Control (`DialogContent`)**:
     - ClassName: `w-full flex flex-col overflow-hidden bg-zinc-950 p-0 text-zinc-100 sm:rounded-2xl`
     - Height MUST be fixed/bounded to prevent content/layout height jumps between tabs or states (e.g. `h-185 max-h-[90vh] min-h-150` for large multi-tab forms like Products, or `max-h-[90vh]` for standard forms).
     - Width MUST be wide enough so labels NEVER wrap into two lines (e.g. use `max-w-xl` ~576px or `max-w-2xl` ~672px when displaying 3-column field grids or long labels).
  2. **Header Without Border (`DialogHeader`)**:
     - ClassName: `px-6 pt-5 pb-2` (strictly NO `border-b` bottom border).
     - Title: `text-xl font-bold text-zinc-100`.
     - Description: `text-xs text-zinc-400`.
  3. **Scrollable Form Container**:
     - `<form onSubmit={...} className="flex flex-1 flex-col overflow-hidden">`
     - Scroll Area: `<div className="flex-1 flex flex-col overflow-y-auto px-6 pt-1 pb-6 space-y-4">`
  4. **Bordered Container Card (`TabsContent` ONLY)**:
     - The outer bordered card container (`rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5.5`) MUST ONLY be used when the dialog contains a `Tabs` component (wrapping `TabsContent`).
     - Standard forms WITHOUT tabs place form fields directly inside the scroll area (`px-6 pt-1 pb-6 space-y-4`) WITHOUT an extra outer bordered `div`.
  5. **Single-Line Form Labels (Strict Rule)**:
     - Form labels MUST NEVER wrap into 2 lines (e.g., `"Visível no Marketplace"` must render on a single line).
     - Always use `whitespace-nowrap` on labels and adjust grid column spans or dialog max-width (`max-w-xl` / `max-w-2xl`) to guarantee labels remain single-line across all viewports.
  6. **Footer Without Border (`DialogFooter`)**:
     - ClassName: `bg-zinc-950 px-6 py-4` (strictly NO `border-t` top border).
     - Submit button includes icon (`RiCheckLine className="h-4 w-4"`).
  7. **Zero Raw Emojis in Labels**: Form labels and checkboxes MUST NOT contain raw emoji characters (e.g., use `<span>Produto em Destaque</span>` without `⭐`).

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
  - `storeQueryKeys.all`, `storeQueryKeys.list(filters)`, `storeQueryKeys.detail(id)`, `storeQueryKeys.dropdown()`
  - `userQueryKeys.all`, `userQueryKeys.list(filters)`, `userQueryKeys.detail(id)`
  - `roleQueryKeys.all`, `roleQueryKeys.list(filters)`, `roleQueryKeys.detail(id)`, `roleQueryKeys.dropdown()`
  - `categoryQueryKeys.all`, `categoryQueryKeys.list(filters)`, `categoryQueryKeys.tree()`, `categoryQueryKeys.dropdown()`
  - `brandQueryKeys.all`, `brandQueryKeys.list(filters)`, `brandQueryKeys.dropdown()`
- **Invalidation Policy**: Mutations MUST call `await queryClient.invalidateQueries({ queryKey: entityKeys.all })` on success to ensure real-time UI updates without page reloads.

### 10.6.1 Regra Mandatória de Invalidação Cross-Módulo e Reatividade de Dados

> **MANDATORY POLICY — PLATAFORMA PROFISSIONAL**: Todo formulário com selects de dados de outros módulos (ex: seletor de Categoria no formulário de Produto) **DEVE reagir imediatamente** a mutations realizadas em outras telas, sem nenhum `window.location.reload()` ou refresh manual.

**Regras:**

1. **Hierarquia de QueryKeys por domínio**: Toda entidade possui uma chave raiz (`all`) e sub-chaves funcionais (`list`, `dropdown`, `tree`, `detail`). Invalidar a raiz (`entityKeys.all`) invalida todos os filhos automaticamente.

2. **Helpers Centralizados Obrigatórios**: Toda mutation **DEVE** usar os helpers centralizados em `src/lib/query-keys.ts`:
   - `invalidateCategories(queryClient)` — invalida list + tree + dropdown
   - `invalidateBrands(queryClient)` — invalida list + dropdown
   - `invalidateRoles(queryClient, roleId?)` — invalida list + detail + dropdown
   - `invalidateStores(queryClient, storeId?)` — invalida list + detail + dropdown

3. **`staleTime: 0` em Queries de Dropdown**: Toda `useQuery` que alimenta um `<select>`, `<NativeSelect>` ou `<Select>` de formulário **DEVE declarar `staleTime: 0`** para garantir refetch imediato ao montar/re-montar o componente.

4. **Proibição de Invalidação Parcial**: É **estritamente proibido** invalidar apenas a query de listagem local sem cobrir os dropdowns dependentes (ex: só invalidar `brands-list` sem invalidar `brands-dropdown`).

**Exemplo correto:**

```ts
// ✅ CORRETO — Cobre lista, tree e dropdown em um só helper
onSuccess: async () => {
  await invalidateCategories(queryClient);
};

// ❌ ERRADO — Não cobre o dropdown usado no formulário de produto
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["categories-list"] });
};
```

### 10.6.2 Regra Mandatória de Input de Preço — `<PriceInput>`

> **MANDATORY POLICY**: Nunca use `<Input type="number">` para campos monetários. Use **sempre** o `<PriceInput>`.

**Arquivos:**

- `src/lib/price.ts` — Funções utilitárias puras
- `src/components/ui/price-input.tsx` — Componente de UI

**Comportamento da máscara:**

| Usuário digita | Exibido        | Valor numérico retornado |
| -------------- | -------------- | ------------------------ |
| `1`            | `R$ 0,01`      | `0.01`                   |
| `105`          | `R$ 1,05`      | `1.05`                   |
| `10500`        | `R$ 105,00`    | `105.00`                 |
| `1050099`      | `R$ 10.500,99` | `10500.99`               |

**API do componente:**

```tsx
<PriceInput
  value={price} // number — valor numérico atual
  onValueChange={setPrice} // (value: number) => void
  placeholder="R$ 0,00"
  disabled={false}
  className="text-zinc-100"
/>
```

**Regras de implementação:**

1. Estado do formulário deve ser `number` (não `string`): `const [price, setPrice] = useState<number>(0)`
2. Ao inicializar a partir de dados do servidor: `setPrice(Number(data.price))`
3. No payload de envio, o valor já é `number` — não é necessário fazer `Number(price)` novamente
4. Para campos opcionais (preço promocional, custo): `payload.promotionalPrice = promotionalPrice || null`

**Utilitários disponíveis em `src/lib/price.ts`:**

- `formatPriceBRL(value: number)` — formata para exibição em tabelas/listas
- `parsePriceMask(formatted: string)` — extrai número de string formatada
- `maskPriceFromDigits(digits: string)` — aplica máscara a dígitos brutos
- `numericToDigits(value)` — converte número em dígitos acumulados (uso interno)

---

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
- **Navigation Sequence Standard**: Sidebar menu items must strictly follow this order, keeping security and governance modules at the bottom:
  1. **Painel Principal** (`/`)
  2. **Catálogo & Taxonomia** (`/categorias`, `/marcas`)
  3. **Lojas Parceiras** (`/lojas`)
  4. **Gestão de Acessos** (`/usuarios`, `/cargos`) — _Sempre no final_
  5. **Logs de Auditoria** (`/auditoria`) — _Sempre por último_

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

### 10.11 User Permissions UI & Visual Effective Status Standard

> **MANDATORY POLICY**: The User Permissions page (`/usuarios/:userId/permissoes`) **MUST** render explicit visual indicators for effective status (**🟢 Concedida** vs. **🔴 Bloqueada**) alongside the resolution source for every permission line, regardless of whether the current action is set to **Herdar**, **Permitir**, or **Negar**.

- **Effective Status Resolution**:
  - `Permitir`: Rendered as **🟢 Concedida (Exceção Individual: Permitido)**.
  - `Negar`: Rendered as **🔴 Bloqueada (Exceção Individual: Bloqueado)**.
  - `Herdar` + Role Has Permission: Rendered as **🟢 Concedida (Herdado do cargo [Nome])**.
  - `Herdar` + Role Lacks Permission: Rendered as **🔴 Bloqueada (Sem acesso no cargo [Nome])**.
- **Mandatory Permission Filters**:
  1. **Search**: Keyword search across key, description, or module.
  2. **Status**: Filter by Effective Status (`Todas`, `🟢 Concedidas`, `🔴 Bloqueadas`).
  3. **Action Override**: Filter by override mode (`Todas`, `🔄 Herdar`, `✅ Permitir`, `🚫 Negar`).
  4. **Operation Type**: Filter by action verb (`Todas`, `👁️ Ler/Listar`, `➕ Criar`, `✏️ Editar`, `🗑️ Excluir`, `⚙️ Gerenciar`).
  5. **Module**: Filter by target entity module (`Todos`, `User`, `Store`, `Role`, `Audit`, etc.).
- **Summary Metrics**: Page must display live counters for Total System Permissions, Granted Permissions, Denied Permissions, and Active Individual Overrides.

### 10.12 Infrastructure Abstraction in User-Facing Text

> **MANDATORY POLICY**: Technical infrastructure details **MUST NEVER appear in any text visible to the end user**. This includes labels, button text, form descriptions, toast notifications, error messages, tooltips, and any other UI element rendered to the user.

**Prohibited examples (never use):**

- ❌ `"Upload via Cloudflare R2"`
- ❌ `"Sincronizando com Redis"`
- ❌ `"Arquivo salvo no bucket S3"`
- ❌ `"Conectando ao PostgreSQL"`
- ❌ `"Enviando via Resend API"`
- ❌ `"Token JWT expirado"`
- ❌ `"Erro 500: Internal Server Error"`

**Correct substitutions (always use friendly language):**

- ✅ `"Imagem do Produto"` (instead of "Upload via Cloudflare R2 Direct")
- ✅ `"Imagem enviada com sucesso!"` (instead of "Arquivo salvo no bucket")
- ✅ `"Sua sessão expirou. Faça login novamente."` (instead of "Token JWT expirado")
- ✅ `"Erro ao processar a solicitação."` (instead of "Erro 500: Internal Server Error")

**Allowed locations for technical detail:**

- Code comments (for developer context)
- Internal logs and terminal output
- Technical documentation (`.ai/` docs, `README.md`)

### 10.13 Política Estrita de Componentes Shadcn UI e Proibição de HTML Nativo em Funcionalidades

> **MANDATORY POLICY & NON-NEGOTIABLE ARCHITECTURAL RULE**:
>
> 1. **Shadcn UI é a Única Fonte Principal de Componentes Visuais**: Todo e qualquer controle interativo, botão, campo de texto, caixa de seleção, menu dropdown, modal, popup de confirmação, painel lateral, tooltip, aba, badge, card ou elemento visual utilizado em páginas e componentes de funcionalidades de `apps/manager` e `apps/marketplace` **DEVE OBRIGATORIAMENTE utilizar os componentes do Shadcn UI / Radix UI** (`@/components/ui/...`).
> 2. **Proibição Estrita de Controles Nativos**: É expressamente proibido escrever elementos HTML nativos (`<button>`, `<input>`, `<select>`, `<textarea>`, `<dialog>`, etc.) ou modais/popups improvisados (como `div` com `fixed inset-0`) nas telas de funcionalidade do sistema.
> 3. **Organização Independente por App**: `apps/manager` possui seus próprios componentes shadcn (`apps/manager/src/components/ui/`) e `apps/marketplace` possui os seus (`apps/marketplace/src/components/ui/`). Não deve ser recriado pacote compartilhado de UI nem importados componentes entre apps.
> 4. **Proteção Automatizada via Lint**: O projeto utiliza a regra ESLint `react/forbid-elements` configurada no pacote `@verttex/eslint-config/react.js`, bloqueando a compilação caso elementos nativos como `<button>`, `<input>`, `<select>`, `<textarea>`, `<dialog>` sejam utilizados fora do diretório `components/ui/`.

#### Tabela de Equivalências Obrigatórias:

| Elemento Nativo Proibido ❌ | Componente Shadcn Obrigatório ✅ | Import Padrão                                                  |
| --------------------------- | -------------------------------- | -------------------------------------------------------------- |
| `<button onClick={...}>`    | `<Button onClick={...}>`         | `import { Button } from '@/components/ui/button'`              |
| `<input type="text">`       | `<Input type="text" />`          | `import { Input } from '@/components/ui/input'`                |
| `<textarea>`                | `<Textarea />`                   | `import { Textarea } from '@/components/ui/textarea'`          |
| `<select>`                  | `<Select>` / `<NativeSelect>`    | `import { NativeSelect } from '@/components/ui/native-select'` |
| `<input type="checkbox">`   | `<Checkbox />`                   | `import { Checkbox } from '@/components/ui/checkbox'`          |
| `<dialog>` / custom `div`   | `<Dialog>` / `<AlertDialog>`     | `import { Dialog } from '@/components/ui/dialog'`              |
| custom menu `div`           | `<DropdownMenu>`                 | `import { DropdownMenu } from '@/components/ui/dropdown-menu'` |
| custom drawer `div`         | `<Sheet>`                        | `import { Sheet } from '@/components/ui/sheet'`                |

#### Processo Obrigatório para Novos Componentes:

Antes de implementar qualquer elemento de interface:

1. **Verificar se já existe** na pasta `components/ui/` do aplicativo correspondente (`manager` ou `marketplace`).
2. **Verificar se existe componente equivalente no Shadcn UI / Radix UI**.
3. **Instalar o componente oficial do Shadcn** na aplicação correspondente quando necessário (`npx shadcn@latest add ...`).
4. **Customizar por composição, propriedades ou variantes Tailwind**, mantendo as primitivas acessíveis e com `cursor-pointer` em elementos clicáveis.
5. **Nunca criar abstrações artesanais ou tags HTML nativas** que concorram com componentes existentes.
6. **Exceções Legítimas**: Elementos semânticos e estruturais de layout (`<main>`, `<section>`, `<article>`, `<header>`, `<footer>`, `<nav>`, `<div>`, `<p>`, `<span>`, `<h1>-<h6>`, `<a>`, `<ul>`, `<ol>`, `<li>`, `<img>`) são permitidos quando não representam controles de formulário nem componentes de UI padronizados. Elements nativos dentro da pasta `components/ui/` são permitidos apenas para a implementação interna das primitivas do Shadcn.

### 10.14 Padrão Estrito de Tabelas, Estado Vazio e Paginação (`TableWrapper`)

> **REGRA MANDATÓRIA DE PADRONIZAÇÃO DE TABELAS**:
> Todas as tabelas e listagens do painel administrativo (`apps/manager`) **DEVEM OBRIGATORIAMENTE utilizar a `TableWrapper`** (ou seguir estritamente o seu padrão visual e de comportamento) para garantir consistência visual e de UX em toda a aplicação.

1. **Estado Vazio (Empty State)**:
   - Quando não existirem registros (ou quando os filtros não retornarem dados), o estado vazio **DEVE obrigatoriamente exibir um ícone contextual em container destacado** acima da mensagem.
   - **Ícone**: Renderizado dentro de um container centralizado `mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 shadow-xs` (ex: `RiShoppingBag3Line`, `RiStackLine`, `RiRefreshLine`, etc.).
   - **Título (`emptyTitle`)**: Texto principal destacado em `text-sm font-bold text-zinc-200` (ex: `"Nenhum lote encontrado"`).
   - **Subtítulo (`emptyDescription`)**: Descrição explicativa em `mt-1 max-w-sm text-xs text-zinc-500` com espaçamento reduzido (`mt-1`) em relação ao título.
2. **Exibição Contínua de Paginação**:
   - **Paginação Sempre Visível**: Os componentes e barra de controle de paginação (resumo `Mostrando 0 – 0 de 0 registros`, seletor de registros por página e botões de navegação) **DEVEM ser mantidos visíveis no rodapé da tabela mesmo quando não houver dados** (com os botões de navegação desabilitados).
3. **Componente Único de Referência**: `apps/manager/src/components/ui/table-wrapper.tsx`.

---

## 11. Marketplace Visual Identity & Design System (`apps/marketplace`)

### 11.1 Identity Concept

The Verttex Marketplace connects regional consumers with artisan producers, farm-to-table food makers, and authentic local products. The visual language balances:

- **Artesanal + Moderno**
- **Humano + Tecnológico**
- **Regional + Profissional**
- **Bonito + Funcional**

### 11.2 Palette & Color Tokens (Padrão Canônico)

- **Brand Primary (Emerald)**: `emerald-800` / `emerald-700` / `emerald-600` (`#059669` / `#047857`) — representa frescor, procedência regional, confiança e botões de ação primária (`bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs`). Badges de produto e produtor verificado usam `bg-emerald-50 text-emerald-800` ou `bg-emerald-700 text-white`.
- **Brand Secondary / Origin Highlights (Warm Amber / Terracota)**: `amber-700` / `amber-600` / `amber-500` (`#d97706` / `#b45309`) — representa tradição artesanal, estrelas de avaliação (`RiStarFill text-amber-500`), destaques de origem regional e tags de oferta.
- **Background Neutral**: Warm Off-White (`#faf8f5` / `bg-stone-50`) para fundo de páginas.
- **Surface Neutral**: Pure White (`#ffffff` / `bg-white`) com bordas sutis (`border-stone-200/80` ou `border-stone-200`) e sombras de alta definição (`shadow-2xs`, `shadow-xs`, `shadow-md`, `shadow-2xl`).
- **Text Neutral**: Deep Charcoal (`#1c1917` / `text-stone-900`, `text-stone-800`) para títulos e cabeçalhos, Muted Gray (`#78716c` / `text-stone-600`, `text-stone-500`) para subtítulos e metadados, e `text-stone-400` para ícone e placeholders.
- **Feedback States**: Success (`emerald-600`), Alert (`amber-600`), Error (`rose-600`).

### 11.2.1 Regras Mandatórias de Arquitetura de Cores (Non-Negotiable)

1. **Regra Mandatória de Fundo Padrão Branco (`bg-white`)**:
   - O layout raiz (`MarketplaceLayout`) e a folha de estilos global (`globals.css`) já definem o fundo da aplicação como branco (`bg-white` / `#ffffff`) por padrão.
   - É **estritamente proibido** passar a classe `bg-white` em contêineres raiz de páginas, seções ou componentes (ex: `MarketplaceCarousel`, wrappers de `page.tsx`).
   - A classe `bg-white` só deve ser utilizada de forma pontual em elementos flutuantes ou sobrepostos (cards, modais, dropdowns, popovers, badges) que precisem destacar sua superfície.

2. **Regra Mandatória de Redundância de Cor de Texto Escuro (`text-stone-900`) e Fundo Escuro (`bg-stone-900`)**:
   - A cor padrão do texto no marketplace já é o grafite escuro (`color: #1c1917` / `text-stone-900`).
   - É **estritamente proibido** aplicar `text-stone-900` de forma redundante em contêineres raiz ou wrappers de páginas quando a cor do texto herdada já é escura.
3. **Regra Mandatória de Contêiner de Página e Tipografia Padrão (Non-Negotiable)**:
   - **Largura do Contêiner Único**: Todas as páginas do marketplace (`/categorias`, `/lojas`, `/produtos`, etc.) **DEVEM utilizar um único contêiner de página raiz** com `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` para garantir alinhamento perfeito de 100% da largura com o Header (`MarketplaceHeader`).
   - **Espaçamento Vertical da Página**: O contêiner de página raiz deve utilizar `py-8 sm:py-12` e `space-y-8` entre seções.
   - **Título Principal de Página (`h1`)**: Deve seguir rigorosamente a escala `text-2xl font-bold tracking-tight sm:text-3xl` (ex: `Categorias para comprar e vender`, `Lojas e Produtores Parceiros`, `Catálogo de Produtos Artesanais`).
   - **Subtítulo / Descrição de Página**: Deve seguir o padrão `mt-2 text-xs text-stone-500`.
   - **Título de Seção (`h2`)**: Deve seguir o padrão `text-base sm:text-lg font-bold tracking-tight` ou `text-lg font-bold`.

### 11.3 Core Component Standards (Visuais Consolidados)

- **Border Radius Scale**: Moderated border radius across all marketplace components (`rounded-2xl` / `rounded-xl` para modais e cards principais, `rounded-md` / `rounded-lg` para inputs, botões e sub-containers, `rounded-xs` para badges de catálogo, `rounded-full` para botões circulares de ação e avatares).
- **Regra Mandatória Interativa (`cursor-pointer`)**: Todos os botões, links, ícones clicáveis, abas e triggers do marketplace **DEVEM conter obrigatoriamente a classe `cursor-pointer`**.
- **Header (`MarketplaceHeader`) — Arquitetura de 12 Colunas**:
  - **Tier 1 (Announcement Bar)**: Barra de comunicado em verde escuro (`bg-emerald-950 text-emerald-100 text-xs py-1.5 px-4`).
  - **Tier 2 (Main Row - 12 Colunas)**: Logo alinhada (Col 1-2), Barra de busca global em `bg-white shadow-md rounded-md border-none` (Col 3-8), Banner promocional de ofertas (Col 9-12).
  - **Tier 3 (Sub-Header Row)**: Seleção de CEP (Col 1-2), Navegação por categorias via `HoverDropdown` com submenu flyout (`bg-white border border-stone-200/80 shadow-2xl p-2 rounded-xs`) (Col 3-8), Controles de conta do cliente e carrinho de compras (Col 9-12).
- **Footer & Propostas de Valor**:
  - **Componente de Propostas de Valor (`MarketplaceValueProps`)**: Componente separado (`apps/marketplace/src/components/layout/marketplace-value-props.tsx`) contendo os 3 cards de benefícios (`Escolha como pagar`, `Frete e entrega na sua região`, `Segurança, do início ao fim`). Renderizado **exclusivamente na Home Page (`/`)**.
  - **Rodapé Compacto (`MarketplaceFooter`)**: Rodapé limpo (`bg-stone-50 py-8`) com links de navegação, termos, política de privacidade, suporte e dados de copyright. Renderizado em todas as páginas via layout raiz.
- **Product Card (`ProductCard`)**:
  - Container de imagem (proporção 4:3 ou 1:1, cantos `rounded-xl border border-stone-200/80 bg-white`).
  - Badges na imagem (`Destaque`, `Mais Vendido`, `Novo`, tag de localização de origem).
  - Link da loja parceira em `text-emerald-700 font-medium hover:underline`, título do produto em 2 linhas, estrelas de avaliação em `amber-500`, preços formatados em BRL e botão de ação ("Ver").
- **Store Card (`StoreCard`)**:
  - Imagem de capa/logo em proporção 4:3 `rounded-sm bg-stone-100`.
  - Nome do produtor com hover verde (`group-hover:text-emerald-700`), selo `RiShieldCheckLine text-emerald-600`, localização (`RiMapPinLine text-amber-600`), descrição em 2 linhas e badge `bg-emerald-50 text-emerald-800`.
- **Componente de Input (`Input`) — Estilo Canônico Padrão**:
  - **Uso Geral**: O componente Shadcn UI `<Input />` em `apps/marketplace/src/components/ui/input.tsx` possui por padrão a altura `h-10`, cantos arredondados `rounded-lg`, fundo `bg-white`, borda sutil `border-stone-200/80`, sombra `shadow-2xs`, tipografia `text-xs`, placeholder em `placeholder:text-stone-400` e foco elegante em borda verde emerald (`focus:border-emerald-600 focus-visible:border-emerald-600 focus-visible:ring-0`).
  - **Exceção**: O input de busca rápida dentro do `MarketplaceHeader` possui visual customizado transparente integrado à barra de navegação.

- **Diálogo de Autenticação (`AuthDialog`)**:
  - Estrutura em `Dialog` de 2 colunas (`sm:max-w-5xl rounded-2xl overflow-hidden border-0 shadow-2xl`).
  - Painel de Formulário (Coluna Esquerda): Fundo `bg-white`, logo Verttex com tile `bg-emerald-600 text-white rounded-lg`, subtítulo `text-stone-500`, botões de login social (`Button variant="outline"` com `hover:bg-stone-50 border-stone-200 text-stone-700 cursor-pointer`), inputs com ícones alinhados à esquerda e foco sutil em borda verde sem anel grosso (`focus:border-emerald-600 focus-visible:ring-0`), alternador de senha com `cursor-pointer`, e botão de envio em `bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 shadow-xs cursor-pointer`.
  - Painel Visual da Marca (Coluna Direita): Gradiente `bg-linear-to-br from-stone-900 via-stone-850 to-amber-950 text-white`, iluminação radial `bg-emerald-600/20` e `bg-amber-600/20`, badge `100% Produtores Verificados` em `bg-emerald-950/60 text-emerald-300 border-emerald-500/40`, e card glassmorphic em `bg-white/10 border-white/15 backdrop-blur-md`.

### 11.4 Padronização do Componente de Foto de Perfil da Loja (StoreLogoUpload)

- **Componente (`StoreLogoUpload`)**:
  - Exibe avatar quadrado com cantos arredondados (`rounded-2xl border-2 border-zinc-800 bg-zinc-900 w-24 h-24`).
  - Pré-visualização instantânea local via `FileReader` / `URL.createObjectURL`.
  - Botão de upload/troca com ícone `RiCameraLine` / `RiImageAddLine` e confirmação de remoção com `AlertDialog` do shadcn.
  - Exibe fallback com as iniciais da loja quando não houver imagem definida.
