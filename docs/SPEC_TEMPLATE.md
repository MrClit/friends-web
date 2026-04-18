# [Feature Name] — Spec

**Date:** YYYY-MM-DD
**Status:** Draft | Review | Approved | In Progress | Done
**Scope:** Backend | Frontend | Full-stack | Shared types
**Author:** [name]

---

## 1. Motivation

> Why does this feature exist? What problem does it solve?
> Include the user-facing pain point or the technical constraint that drives this work.

---

## 2. Behavior Contract

> What is the observable behavior once this is done?
> Write from the perspective of a user or API consumer — not implementation details.

### Happy path

- Given [context], when [action], then [outcome].
- ...

### Edge cases & error states

| Scenario | Expected behavior |
|---|---|
| ... | ... |
| ... | ... |

---

## 3. API Contract (if backend is in scope)

### New / modified endpoints

```
METHOD /api/path
Auth: Bearer JWT | Public
Roles: USER | ADMIN | any

Request body (DTO):
{
  field: type   // description
}

Response 200 { data: T }:
{
  field: type
}

Errors:
  400 — validation failed
  404 — resource not found
  403 — insufficient role
```

---

## 4. Shared Types (if cross-stack)

> Types that must land in `packages/shared-types/` before backend or frontend work starts.

```ts
// packages/shared-types/src/feature.ts
export type Foo = {
  id: string
  // ...
}
```

---

## 5. Data Model (if DB changes)

```
Table: table_name
  new_column  type  nullable?  default  — why
```

Migration required: yes | no

---

## 6. Frontend

### Components

| Component | Location | Responsibility |
|---|---|---|
| `FooModal` | `features/foo/components/` | ... |

### State

- Server state: TanStack Query hook `useFoo()` in `hooks/api/`
- UI state: Zustand store `useFooStore` (if needed)
- New query key: `foo.list`, `foo.detail`

### i18n keys needed

```json
{
  "foo": {
    "context": {
      "key": "Translation"
    }
  }
}
```

---

## 7. Implementation Order

> Ordered task list. Each task should be independently reviewable.
> Do NOT start a task until the previous one is merged/approved.

- [ ] 1. Shared types (`packages/shared-types/`)
- [ ] 2. DB migration + entity update
- [ ] 3. Backend: DTO + service unit tests
- [ ] 4. Backend: service implementation
- [ ] 5. Backend: controller + integration tests
- [ ] 6. Frontend: API method (`src/api/foo.api.ts`)
- [ ] 7. Frontend: TanStack Query hook (`src/hooks/api/useFoo.ts`)
- [ ] 8. Frontend: UI components
- [ ] 9. Frontend: wire up + e2e smoke test

---

## 8. Test Cases

> Concrete scenarios Claude must make pass. Written before implementation.

### Backend unit

```ts
// describe('FooService')
it('throws NotFoundException when foo does not exist')
it('returns foo when found')
it('creates foo with correct defaults')
```

### Backend integration

```ts
// describe('FooController /api/foo')
it('GET /api/foo returns 200 with list')
it('POST /api/foo returns 400 on missing required field')
it('DELETE /api/foo/:id returns 403 for non-owner')
```

### Frontend

```ts
// describe('FooComponent')
it('renders loading state while fetching')
it('renders error message on API failure')
it('submits form and invalidates query cache')
```

---

## 9. Out of Scope

> Explicitly list what this spec does NOT cover. Prevents scope creep.

- ...
- ...

---

## 10. Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_FOO_URL` | frontend | ... |
| `FOO_SECRET` | backend | ... |

---

## 11. Open Questions

> Unresolved decisions that must be answered before implementation starts.

- [ ] ...
- [ ] ...
