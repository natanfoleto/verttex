# Ecokids Reference — Technical Adaptations

This document logs the specific ideas and architectures that were adapted from the `ecokids` project to serve as the foundation for the `verttex` workspace.

## 1. Fastify & Zod Integration

- The structure of registering Zod validation compilers on the Fastify instance has been preserved.
- The `fastify-type-provider-zod` model was analyzed to ensure high performance runtime schemas validation.

## 2. Request context via AsyncLocalStorage

- The setup of a middleware hook registering request IP and User Agent inside Node's native `AsyncLocalStorage` has been adapted to ensure context propagation throughout the call chain.

## 3. Swagger Docs configuration

- The initialization patterns for `@fastify/swagger` and `@fastify/swagger-ui` (available at `/docs`) were adapted to automatically translate Zod type routes metadata into OpenAPI specifications.

## 4. CASL engine

- The structure of checking authorization permissions dynamically via MongoDB-style rule definitions (`AbilityBuilder` / `createMongoAbility`) has been modeled after Ecokids to maintain a scalable permission system.
