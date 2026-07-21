# Roadmaps Index — Verttex

Consolidated view of all roadmaps across all phases.

Last updated: 2026-07-21

---

## Overview

| Nº | Roadmap | Status | Priority | Dependencies | File |
|---:|---|---|---|---|---|
| 001 | Foundation | `completed` | critical | None | [`completed/001-foundation.md`](./completed/001-foundation.md) |
| 002 | Data Modeling | `planned` | critical | 001 | [`planned/002-data-modeling.md`](./planned/002-data-modeling.md) |
| 003 | User Authentication | `planned` | critical | 002 | [`planned/003-user-authentication.md`](./planned/003-user-authentication.md) |
| 004 | Customer Authentication | `planned` | critical | 002 | [`planned/004-customer-authentication.md`](./planned/004-customer-authentication.md) |
| 005 | Roles and Permissions | `planned` | critical | 002, 003 | [`planned/005-roles-and-permissions.md`](./planned/005-roles-and-permissions.md) |
| 006 | Stores Management | `planned` | high | 002, 003, 005 | [`planned/006-stores-management.md`](./planned/006-stores-management.md) |
| 007 | Manager UI | `planned` | high | 003, 005, 006 | [`planned/007-manager-ui.md`](./planned/007-manager-ui.md) |
| 008 | Marketplace UI | `planned` | high | 004 | [`planned/008-marketplace-ui.md`](./planned/008-marketplace-ui.md) |

---

## Status Summary

| Status | Count |
|---|---|
| `completed` | 1 |
| `planned` | 7 |
| `active` | 0 |
| `blocked` | 0 |
| `archived` | 0 |
| `cancelled` | 0 |

---

## Notes

- Roadmaps 002 through 008 collectively represent **Phase 1** of the Verttex platform.
- Roadmap 002 has blockers: **18 pending decisions** must be resolved before migrations can be created (see `.ai/AGENT.md` — Pending Decisions Registry).
- Roadmaps 003 and 004 can be implemented in parallel once 002 is complete.
- Roadmaps 005, 006 depend on the auth infrastructure from 003.
