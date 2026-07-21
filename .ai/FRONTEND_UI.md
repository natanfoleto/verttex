# Frontend & UI Architecture — Verttex

This document details the front-end layout structure, Next.js routing patterns, UI packages, and state management guidelines.

## 1. Directory Layout

Applications `apps/manager` and `apps/marketplace` are Next.js App Router projects:

- `src/app/`: Core layout, routing paths, metadata configs.
- `src/features/`: Domain specific components, hooks, schemas.
- `src/lib/api/`: Base client setup for fetching API endpoint results.
- `src/providers/`: Root query-provider configs (TanStack Query).

## 2. Server vs. Client Components

- **Server Components by default**: Any informational pages, initial layouts, static assets should be Server Components.
- **Client Components only when needed**: Use `"use client"` for dynamic form pages, button triggers, hooks usage (`useQuery`, `useForm`), and Radix primitives.

## 3. Style System

- **Tailwind CSS v4** styling properties.
- **Aesthetic Theme**: Standardized zinc color palette and New York design details.
- **Icons**: Resolved using `react-icons` package for UI consistency.
- **Global Elements**: Shared visuals must be imported from the workspace package `@verttex/ui` (which encapsulates standard shadcn configurations).

## 4. Forms and State

- **Form Validation**: Zod validators coupled with `react-hook-form` and `@hookform/resolvers/zod`.
- **Network Request Cache**: Managed via `@tanstack/react-query` to resolve state synchronization.
