# Roadmaps Index — Verttex

Consolidated view of all roadmaps across all phases.

Last updated: 2026-07-21

---

## Overview

|  Nº | Roadmap                 | Status      | Priority | Dependencies  | File                                                                                     |
| --: | ----------------------- | ----------- | -------- | ------------- | ---------------------------------------------------------------------------------------- |
| 001 | Foundation              | `completed` | critical | None          | [`completed/001-foundation.md`](./completed/001-foundation.md)                           |
| 002 | Data Modeling           | `completed` | critical | 001           | [`completed/002-data-modeling.md`](./completed/002-data-modeling.md)                     |
| 003 | User Authentication     | `completed` | critical | 002           | [`completed/003-user-authentication.md`](./completed/003-user-authentication.md)         |
| 004 | Customer Authentication | `completed` | critical | 002           | [`completed/004-customer-authentication.md`](./completed/004-customer-authentication.md) |
| 005 | Roles and Permissions   | `completed` | critical | 002, 003      | [`completed/005-roles-and-permissions.md`](./completed/005-roles-and-permissions.md)     |
| 006 | Stores Management       | `completed` | high     | 002, 003, 005 | [`completed/006-stores-management.md`](./completed/006-stores-management.md)             |
| 007 | Manager UI              | `completed` | high     | 003, 005, 006 | [`completed/007-manager-ui.md`](./completed/007-manager-ui.md)                           |
| 008 | Marketplace UI          | `completed` | high     | 004           | [`completed/008-marketplace-ui.md`](./completed/008-marketplace-ui.md)                   |

---

## Status Summary

| Status      | Count |
| ----------- | ----- |
| `completed` | 8     |
| `planned`   | 0     |
| `active`    | 0     |
| `blocked`   | 0     |
| `archived`  | 0     |
| `cancelled` | 0     |

---

## Notes

- Roadmaps 002 through 008 collectively represent **Phase 1** of the Verttex platform.
- Roadmap 002 has blockers: **18 pending decisions** must be resolved before migrations can be created (see `.ai/AGENT.md` — Pending Decisions Registry).
- Roadmaps 003 and 004 can be implemented in parallel once 002 is complete.
- Roadmaps 005, 006 depend on the auth infrastructure from 003.
