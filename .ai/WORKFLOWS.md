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
  pnpm --filter @verttex/storefront dev
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

## 4. UI Library Tasks

- **Adding a component to `@verttex/ui`**:
  - Create component under `packages/ui/src/components/`.
  - Export component from `packages/ui/src/index.ts`.
