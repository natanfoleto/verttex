# Developer Workflows — Verttex

This guide outlines common tasks and terminal commands to run within the monorepo workspace.

## 1. Environment Startup

- **Install dependencies**:
  ```bash
  pnpm install
  ```
- **Run all applications simultaneously (in dev mode)**:
  ```bash
  pnpm dev
  ```
- **Run a specific application**:
  ```bash
  pnpm --filter @verttex/api dev
  pnpm --filter @verttex/manager dev
  pnpm --filter @verttex/marketplace dev
  ```

## 2. Code Quality Tasks

- **Format codebase**:
  ```bash
  pnpm format
  ```
- **Check code formatting**:
  ```bash
  pnpm format:check
  ```
- **Run lint rules check**:
  ```bash
  pnpm lint
  ```
- **Run typecheck**:
  ```bash
  pnpm typecheck
  ```
- **Build all projects**:
  ```bash
  pnpm build
  ```

## 3. Database Operations

- **Generate Prisma Client**:
  ```bash
  pnpm db:generate
  ```
- **Create and Apply Migration**:
  ```bash
  pnpm db:migrate
  ```
- **Open Prisma Studio GUI**:
  ```bash
  pnpm db:studio
  ```

## 4. UI Component Installation & Customization Workflow

- **Installing a new shadcn component in an app**:
  1. Install or add the component file directly in the target app (`apps/manager` or `apps/marketplace`) under `src/components/ui/`.
  2. **Mandatory Post-Installation Step**: Review all clickable elements (`button`, close buttons `DialogPrimitive.Close` / `SheetClose`, triggers `TabsTrigger` / `SelectTrigger`, menu items `DropdownMenuSubTrigger` / `DropdownMenuCheckboxItem` / `DropdownMenuRadioItem`, scroll buttons, checkboxes, radio inputs) and ensure `cursor-pointer` is added to their class definitions. Disabled states must preserve `disabled:cursor-not-allowed`.
