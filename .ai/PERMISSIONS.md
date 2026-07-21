# Permissions — Verttex

This document is the authoritative reference for all permissions, naming conventions, and the authorization model used in the Verttex platform.

## 1. Naming Convention

All permissions follow the `resource.action` pattern:

```
resource.action
```

Examples: `users.read`, `stores.create`, `permissions.manage`

---

## 2. Permissions by Module

### Users

| Permission | Description |
|---|---|
| `users.read` | View user list and user details |
| `users.create` | Create new management users |
| `users.update` | Edit user data |
| `users.delete` | Deactivate users |

### Roles

| Permission | Description |
|---|---|
| `roles.read` | View role list and role details |
| `roles.create` | Create new roles |
| `roles.update` | Edit role data |
| `roles.delete` | Delete non-system roles |

### Permissions

| Permission | Description |
|---|---|
| `permissions.read` | View available permissions and their assignment |
| `permissions.manage` | Configure role permissions and user overrides |

### Stores

| Permission | Description |
|---|---|
| `stores.read` | View store list and store details |
| `stores.create` | Create new stores |
| `stores.update` | Edit store data |
| `stores.delete` | Deactivate stores |
| `stores.manage-members` | Link/unlink users to stores |

### Products (future)

| Permission | Description |
|---|---|
| `products.read` | View products |
| `products.create` | Create products |
| `products.update` | Edit products |
| `products.delete` | Delete products |

### Inventory (future)

| Permission | Description |
|---|---|
| `inventory.read` | View inventory |
| `inventory.update` | Update inventory levels |

### Sales & Reports (future)

| Permission | Description |
|---|---|
| `sales.read` | View sales data |
| `reports.read` | View reports |

---

## 3. Data Model

The permission system relies on four main entities:

### `Role`

Represents a named group of default permissions.

```
Role
- id
- name        (e.g., "Administrador")
- key         (e.g., "admin") — unique
- description
- isSystem    (system roles cannot be deleted)
- isActive
- createdAt
- updatedAt
```

### `Permission`

Represents a single functional permission.

```
Permission
- id
- key         (e.g., "users.read") — unique
- module      (e.g., "users") — for grouping in UI
- description
- createdAt
```

### `RolePermission`

Associates a default permission to a role.

```
RolePermission
- id
- roleId
- permissionId
- createdAt
```

### `UserPermission`

Represents an individual override for a specific user.

```
UserPermission
- id
- userId
- permissionId
- effect       ("allow" | "deny")
- createdAt
- updatedAt
```

---

## 4. Permission Precedence

The effective access for a user is calculated in this order:

1. **Admin with `manage all`**: always granted
2. **Explicit user-level denial** (`UserPermission.effect = "deny"`): blocks access
3. **Explicit user-level grant** (`UserPermission.effect = "allow"`): grants access
4. **Role default permission** (`RolePermission`): grants access if assigned
5. **Default deny**: no rule = no access

> ⚠️ **Pending decision**: the final precedence order must be confirmed before implementation (see `.ai/AGENT.md` — Pending Decisions #5).

---

## 5. Store-Level Scope

Having a functional permission is not enough for store-scoped resources. The system must also validate:

```
Functional permission (e.g., stores.read) AND store-level access (user is linked to the store)
```

### Scope by Role

| Role | Store Scope |
|---|---|
| `admin` | Global — all stores |
| `employee` | TBD — global or store-linked (pending decision) |
| `supplier` | Limited — linked stores only |

### StoreUser

The link between users and stores is managed through the `StoreUser` entity:

```
StoreUser
- id
- storeId
- userId
- isActive
- createdAt
- updatedAt
```

---

## 6. Default Permissions by Role (Initial Seed)

### admin
- All permissions (via CASL `manage all`)

### employee (suggested, pending confirmation)
- `stores.read`
- `stores.update`
- `users.read`
- `inventory.read`
- `sales.read`
- `reports.read`

### supplier (suggested, pending confirmation)
- `stores.read`
- `inventory.read`
- `sales.read`
- `reports.read`

> ⚠️ Default permissions for `employee` and `supplier` must be confirmed before the seed implementation.

---

## 7. CASL Integration (`@verttex/auth`)

The `@verttex/auth` package provides:

- `Actions`: CASL action strings (`manage`, `read`, `create`, `update`, `delete`)
- `Subjects`: CASL subject types (`User`, `Role`, `Permission`, `Store`, `all`)
- `AppAbility`: typed CASL ability for the application
- `defineAbilityFor(user)`: builds the ability object from a user token
- Frontend: `<Can>` component, `useAbility()` hook

> **Current state**: `@verttex/auth` contains placeholder roles (`ADMIN`, `USER`) that are incompatible with the Phase 1 specification. This will be fully refactored in **Roadmap 005**.
