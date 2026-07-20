# Verttex Monorepo

Verttex connects regional and artisanal producers directly with online consumers and businesses.

## Tech Stack

- **Monorepo Tools**: Turborepo & pnpm workspaces
- **Backend**: Fastify API with Prisma ORM & Zod Type Provider
- **Database**: PostgreSQL
- **Frontends**: Next.js App Router & Tailwind CSS v4

## Getting Started

### 1. Requirements

Ensure you have Node.js LTS and `pnpm` installed:

```bash
node -v
pnpm -v
```

### 2. Installation

Run dependency installations from the root workspace:

```bash
pnpm install
```

### 3. Database Setup

Spin up the local database using docker-compose:

```bash
docker compose up -d
```

Generate Prisma client:

```bash
pnpm db:generate
```

Run initial database migrations:

```bash
pnpm db:migrate
```

### 4. Running the Development Servers

Run all applications in watch mode:

```bash
pnpm dev
```

Or run individual applications:

```bash
pnpm --filter @verttex/api dev
pnpm --filter @verttex/manager dev
pnpm --filter @verttex/storefront dev
```

For more scripts and helper guidelines, consult [.ai/WORKFLOWS.md](file:///Users/natanfoleto/Desktop/prefeitura/temp/verttex/.ai/WORKFLOWS.md).
