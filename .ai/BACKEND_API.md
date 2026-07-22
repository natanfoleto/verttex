# Backend API Architecture — Verttex

This document specifies the technical design, routing schemas, modules pattern, authentication contexts, and API contracts for the Fastify backend app.

## 1. Modules Pattern

Every feature domain is defined flat inside `src/modules/<domain>/`:

- `<domain>.routes.ts`: Binds route methods, path, and maps validation schemas to the controller.
- `<domain>.controller.ts`: Decodes input, calls logic, formats HTTP response.
- `<domain>.schemas.ts`: Contains Zod schemas for query/body/params and API outputs.

---

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

### 2.1 Mandatory Pagination Standard for List Endpoints

> **MANDATORY POLICY**: Every collection or list endpoint (e.g. `/users`, `/roles`, `/stores`, `/auditoria`, etc.) **MUST implement pagination and optional search filtering by default**. Never return unpaginated arrays for list endpoints.

- **Query Schema Standard**:
  - `page`: `z.coerce.number().optional().default(1)`
  - `perPage`: `z.coerce.number().optional().default(20)`
  - `search`: `z.string().optional()`
- **Paginated Response Structure**:
  - `data`: Array of items.
  - `meta`: Object containing `page`, `perPage`, `total`, `totalPages`, `hasNextPage`, `hasPreviousPage`.

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

---

## 3. Authentication Contexts

The API has two distinct authentication contexts. Tokens are **not interchangeable**.

### 3.1 User Context (management)

- Authenticated via `authenticateUser` middleware
- Token payload includes `actorType: "user"`
- Grants access to administrative routes only

### 3.2 Customer Context (marketplace)

- Authenticated via `authenticateCustomer` middleware
- Token payload includes `actorType: "customer"`
- Grants access to customer-facing routes only

### 3.3 Token Strategy

- **Access token**: short-lived JWT
- **Refresh token**: rotated on each use, stored as hash in database only
- **Cookies**: `httpOnly`, `secure` in production, appropriate `sameSite`
- Different cookie names and audiences for user vs customer contexts

---

## 4. Middlewares

| Middleware                           | Description                                                            |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `authenticateUser`                   | Validates management user JWT and populates `request.user`             |
| `authenticateCustomer`               | Validates customer JWT and populates `request.customer`                |
| `requirePermission(action, subject)` | Validates functional permission via CASL ability                       |
| `requireStoreAccess(storeIdParam)`   | Validates that the authenticated user is linked to the requested store |

Authorization is always **double-validated**: frontend for UX, backend for security.

---

## 5. API Routes

### 5.1 Authentication — Management Users

| Method | Path                          | Auth   | Description                    |
| ------ | ----------------------------- | ------ | ------------------------------ |
| POST   | `/auth/users/login`           | Public | Authenticate a management user |
| POST   | `/auth/users/logout`          | User   | Revoke the current session     |
| POST   | `/auth/users/refresh`         | Public | Rotate refresh token           |
| POST   | `/auth/users/forgot-password` | Public | Request password reset email   |
| POST   | `/auth/users/reset-password`  | Public | Reset password via token       |
| POST   | `/auth/users/change-password` | User   | Change own password            |
| GET    | `/auth/users/me`              | User   | Return authenticated user data |

### 5.2 Authentication — Customer Buyers

| Method | Path                              | Auth     | Description                        |
| ------ | --------------------------------- | -------- | ---------------------------------- |
| POST   | `/auth/customers/register`        | Public   | Create a customer account          |
| POST   | `/auth/customers/login`           | Public   | Authenticate a customer            |
| POST   | `/auth/customers/logout`          | Customer | Revoke the current session         |
| POST   | `/auth/customers/refresh`         | Public   | Rotate refresh token               |
| POST   | `/auth/customers/forgot-password` | Public   | Request password reset email       |
| POST   | `/auth/customers/reset-password`  | Public   | Reset password via token           |
| POST   | `/auth/customers/change-password` | Customer | Change own password                |
| GET    | `/auth/customers/me`              | Customer | Return authenticated customer data |

### 5.3 Users

| Method | Path                         | Auth | Permission           | Description                     |
| ------ | ---------------------------- | ---- | -------------------- | ------------------------------- |
| GET    | `/users`                     | User | `users.read`         | List management users           |
| POST   | `/users`                     | User | `users.create`       | Create a user                   |
| GET    | `/users/:userId`             | User | `users.read`         | Get a user                      |
| PATCH  | `/users/:userId`             | User | `users.update`       | Update a user                   |
| DELETE | `/users/:userId`             | User | `users.delete`       | Deactivate a user               |
| GET    | `/users/:userId/stores`      | User | `users.read`         | List stores linked to a user    |
| GET    | `/users/:userId/permissions` | User | `permissions.read`   | Get user individual permissions |
| PUT    | `/users/:userId/permissions` | User | `permissions.manage` | Set user individual permissions |

### 5.4 Roles

| Method | Path                         | Auth | Permission           | Description                  |
| ------ | ---------------------------- | ---- | -------------------- | ---------------------------- |
| GET    | `/roles`                     | User | `roles.read`         | List all roles               |
| POST   | `/roles`                     | User | `roles.create`       | Create a new role            |
| GET    | `/roles/:roleId`             | User | `roles.read`         | Get a role                   |
| PATCH  | `/roles/:roleId`             | User | `roles.update`       | Update a role                |
| DELETE | `/roles/:roleId`             | User | `roles.delete`       | Delete a non-system role     |
| GET    | `/roles/:roleId/permissions` | User | `permissions.read`   | Get role default permissions |
| PUT    | `/roles/:roleId/permissions` | User | `permissions.manage` | Set role default permissions |

### 5.5 Permissions

| Method | Path           | Auth | Permission         | Description                    |
| ------ | -------------- | ---- | ------------------ | ------------------------------ |
| GET    | `/permissions` | User | `permissions.read` | List all available permissions |

### 5.6 Stores

| Method | Path               | Auth | Permission                     | Description                    |
| ------ | ------------------ | ---- | ------------------------------ | ------------------------------ |
| GET    | `/stores`          | User | `stores.read`                  | List stores (scoped by access) |
| POST   | `/stores`          | User | `stores.create`                | Create a store                 |
| GET    | `/stores/:storeId` | User | `stores.read` + store access   | Get a store                    |
| PATCH  | `/stores/:storeId` | User | `stores.update` + store access | Update a store                 |
| DELETE | `/stores/:storeId` | User | `stores.delete`                | Deactivate a store             |

### 5.7 Store Members

| Method | Path                             | Auth | Permission                             | Description                |
| ------ | -------------------------------- | ---- | -------------------------------------- | -------------------------- |
| GET    | `/stores/:storeId/users`         | User | `stores.manage-members` + store access | List store members         |
| POST   | `/stores/:storeId/users`         | User | `stores.manage-members`                | Link a user to a store     |
| DELETE | `/stores/:storeId/users/:userId` | User | `stores.manage-members`                | Remove a user from a store |

### 5.8 Customer Profile

| Method | Path                | Auth     | Description        |
| ------ | ------------------- | -------- | ------------------ |
| GET    | `/customer/profile` | Customer | Return own profile |
| PATCH  | `/customer/profile` | Customer | Update own profile |

### 5.9 Health

| Method | Path      | Auth   | Description                |
| ------ | --------- | ------ | -------------------------- |
| GET    | `/health` | Public | Return API liveness status |

---

## 6. Global Plugins & Configurations

The API boots via `app.ts` and runs via `server.ts` implementing:

1. **Zod Type Provider**: Automatic input validation and Swagger mapping.
2. **Request ID Context**: Request-scoped tracking utilizing `AsyncLocalStorage`.
3. **Swagger UI**: Available at `/docs` mapping OpenAPI structure automatically.
4. **Security**: Configures `@fastify/jwt`, `@fastify/cookie`, `@fastify/cors`.
5. **Rate Limiting**: Applied on all auth routes.
6. **Global Error Handler**: Catches all uncaught errors and returns standardized error response.

---

## 7. Cloudflare R2 Integration Wrapper

Storage functions must be decoupled in `apps/api/src/infrastructure/storage/r2.ts`:

- Implements actions: `uploadFile`, `getFileUrl`, `deleteFile`.
- Uses client wrapper compatible with AWS S3 SDK.
- Resolves configuration details using environment values.

---

## 8. Sessions & Tokens

Conceptual entities to be created as Prisma models:

```
UserSession
CustomerSession
UserPasswordResetToken
CustomerPasswordResetToken
```

- Refresh tokens stored as **hash only** — never plain text
- Session revocation must be supported
- After password change: sessions must be invalidated (pending decision on policy)
- Password reset tokens: single-use, time-limited, invalidated after use or new request
- Public response for unknown email: always generic (never reveal if email exists)
