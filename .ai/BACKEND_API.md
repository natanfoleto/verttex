# Backend API Architecture — Verttex

This document specifies the technical design, routing schemas, modules pattern, and API contracts for the Fastify backend app.

## 1. Modules Pattern

Every feature domain is defined flat inside `src/modules/<domain>/`:

- `<domain>.routes.ts`: Binds route methods, path, and maps validation schemas to the controller.
- `<domain>.controller.ts`: Decodes input, calls logic, formats HTTP response.
- `<domain>.schemas.ts`: Contains Zod schemas for query/body/params and API outputs.

## 2. API Response Contracts

All HTTP responses must use the contracts defined in `@verttex/types`.

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Success Response

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Os dados enviados são inválidos",
    "details": null,
    "fieldErrors": {
      "email": ["Informe um e-mail válido"]
    },
    "requestId": "req_123"
  }
}
```

## 3. Global Plugins & Configurations

The API boots via `app.ts` and runs via `server.ts` implementing:

1.  **Zod Type Provider**: Automatic input validation and Swagger mapping.
2.  **Request ID Context**: Request-scoped tracking utilizing `AsyncLocalStorage`.
3.  **Swagger UI**: Available at `/docs` mapping OpenAPIs structure automatically.
4.  **Security**: Configures `@fastify/jwt`, `@fastify/cookie`, `@fastify/cors`.

## 4. Cloudflare R2 Integration Wrapper

Storage functions must be decoupled in `apps/api/src/infrastructure/storage/r2.ts`:

- Implements actions: `uploadFile`, `getFileUrl`, `deleteFile`.
- Uses client wrapper compatible with AWS S3 SDK.
- Resolves configuration details using environment values.
