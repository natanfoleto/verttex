# Roadmaps — Verttex

This folder contains the planning documents and implementation history for the Verttex platform development.

---

## Purpose

`.roadmaps/` tracks **what was built, what is being built, and what will be built** — in a way that provides historical context, clear scope boundaries, and implementation guidance.

It is **separate** from `.ai/` by design:

| Folder | Responsibility |
|---|---|
| `.ai/` | Permanent project documentation: architecture, rules, patterns, conventions |
| `.roadmaps/` | Implementation history: phases, scope, progress, blockers, decisions |

---

## Folder Structure

```
.roadmaps/
├── README.md          — This file
├── INDEX.md           — Consolidated index of all roadmaps
├── active/            — Roadmaps currently in progress
├── planned/           — Roadmaps planned but not yet started
├── completed/         — Finished and validated roadmaps
└── archived/          — Cancelled, replaced, or obsolete roadmaps
```

---

## Naming Convention

Files use sequential three-digit numbering:

```
001-foundation.md
002-data-modeling.md
003-user-authentication.md
```

Rules:
- Lowercase letters
- English technical names
- Hyphens between words
- Numbers are never reused or renumbered
- Keep archived roadmap numbers intact

---

## Status Values

| Status | Description |
|---|---|
| `draft` | Document still being written |
| `planned` | Ready to start, but not yet in progress |
| `active` | Currently being developed |
| `blocked` | Waiting on a dependency, decision, or technical problem |
| `completed` | Done and validated |
| `cancelled` | Stopped with no planned restart |
| `archived` | Kept for history only |

The status inside the document must match the folder it is located in.  
Exception: a `blocked` roadmap may remain in `active/` as long as the blocker is clearly documented.

---

## How to Create a New Roadmap

1. Determine the next available number from `INDEX.md`
2. Create the file in `planned/` using the template below
3. Add it to `INDEX.md`
4. Fill in all required sections
5. When starting: move to `active/`, set `Started at`, update `INDEX.md`
6. During development: update `Progress` and `Implementation steps` checkboxes
7. On completion: move to `completed/`, set `Completed at`, update `INDEX.md`

---

## Required Sections Template

```md
# Roadmap NNN — Name

## Metadata

- Status:
- Priority:
- Created at:
- Started at:
- Completed at:
- Dependencies:
- Related roadmaps:

## Objective
## Context
## Expected outcome
## Scope
## Out of scope
## Business rules
## Architecture decisions
## Database changes
## API routes
## Frontend screens
## Components and packages
## Authentication and authorization
## Permissions involved
## Implementation steps
## Tests
## Acceptance criteria
## Risks
## Blockers
## Pending decisions
## Progress
## Change log
```

---

## Priority Values

```
critical — blocking other work
high     — important for the current phase
medium   — scheduled for the near future
low      — planned but not urgent
```

---

## Updating the Index

Update `INDEX.md` whenever a roadmap:
- Is created
- Changes status
- Is started, completed, blocked, cancelled, or archived
- Has a relevant scope change
