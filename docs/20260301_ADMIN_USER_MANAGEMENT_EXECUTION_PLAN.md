# Admin User Management — Execution-Ready Plan

## 1. Table of Contents

- 1. Table of Contents
- 2. Motivation and Objectives
- 3. System Overview and Requirements
- 4. Solution Design
  - 4.1 Detailed flow
  - 4.2 Folder/file structure and affected areas
  - 4.3 Data models and migrations (with examples)
  - 4.4 API contracts (endpoints, request/response, errors)
  - 4.5 Security, roles, and validations
  - 4.6 Error handling and logging
- 5. External Configuration and Prerequisites
- 6. Step-by-Step Implementation Plan (Execution Phases)
- 7. Detailed Checklist
- 8. Testing and Validation
- 9. Deployment Notes and Environment Variables
- 10. References and Resources
- 11. Improvements and Lessons Learned
- Why this structure

---

## 2. Motivation and Objectives

### Why this change

The app already has auth and roles (`admin` / `user`) but no dedicated admin experience for user lifecycle management.

### Goals (MVP)

- Create an admin-only user management page.
- Allow admin to:
  - Create user with `email` + `role`.
  - Edit `email`, `name`, `avatar`, `role`.
  - Delete users with **soft delete**.
- Add access from user menu, visible only to admins.
- Protect backend endpoints for admin-only access.
- Keep existing `/api/users` endpoint behavior for participant selection.

### Safety rules (mandatory)

- Block self-delete.
- Block self-demotion from `admin` to `user`.
- Ensure at least one active admin always remains.

---

## 3. System Overview and Requirements

### Existing backend anchors

- `apps/backend/src/modules/users/user.entity.ts`
- `apps/backend/src/modules/users/users.service.ts`
- `apps/backend/src/modules/users/users.controller.ts`
- `apps/backend/src/modules/auth/roles.decorator.ts`
- `apps/backend/src/modules/auth/roles.guard.ts`
- `apps/backend/src/modules/auth/jwt.strategy.ts`
- `apps/backend/src/app.module.ts`
- `apps/backend/src/migrations/1705100000000-CreateUsersTable.ts`

### Existing frontend anchors

- `apps/frontend/src/App.tsx`
- `apps/frontend/src/shared/components/Header/UserMenu.tsx`
- `apps/frontend/src/features/auth/RequireAuth.tsx`
- `apps/frontend/src/features/auth/AuthContext.tsx`
- `apps/frontend/src/features/auth/types.ts`
- `apps/frontend/src/api/users.api.ts`
- `apps/frontend/src/hooks/api/useUsers.ts`
- `apps/frontend/src/hooks/api/keys.ts`
- `apps/frontend/src/shared/components/HeaderSection.tsx`
- `apps/frontend/src/i18n/locales/{es,en,ca}/translation.json`

### Constraints

- Keep response envelope `{ data: T }`.
- Keep existing users endpoint for non-admin authenticated users (`/api/users`, participant flows).
- Add admin endpoints separately under `/api/admin/users`.
- Follow current module/controller/service patterns (NestJS) and named exports (frontend).
- Keep UX aligned with current design tokens/components and responsive behavior.

---

## 4. Solution Design

### 4.1 Detailed flow

1. Admin opens user dropdown menu.
2. If `user.role === 'admin'`, show “User Management”.
3. Clicking it navigates to `/admin/users`.
4. Frontend role guard validates admin; non-admin is redirected to `/` and sees access denied toast.
5. Admin page calls `GET /api/admin/users` and renders user list.
6. Admin can create/edit/delete users.
7. Backend validates role access + business safety rules.
8. Frontend invalidates query cache and shows success/error feedback.

### 4.2 Folder/file structure and affected areas

#### Backend

**Create**

- `apps/backend/src/modules/admin/admin.module.ts`
- `apps/backend/src/modules/admin/admin-users.controller.ts`
- `apps/backend/src/modules/admin/dto/create-admin-user.dto.ts`
- `apps/backend/src/modules/admin/dto/update-admin-user.dto.ts`
- `apps/backend/src/migrations/YYYYMMDDHHMMSS-AddSoftDeleteToUsers.ts`

**Update**

- `apps/backend/src/modules/users/user.entity.ts`
- `apps/backend/src/modules/users/users.service.ts`
- `apps/backend/src/app.module.ts`

#### Frontend

**Create**

- `apps/frontend/src/pages/AdminUsersPage.tsx`
- `apps/frontend/src/features/auth/RequireRole.tsx`
- `apps/frontend/src/api/admin-users.api.ts`
- `apps/frontend/src/hooks/api/useAdminUsers.ts`

**Update**

- `apps/frontend/src/App.tsx`
- `apps/frontend/src/shared/components/Header/UserMenu.tsx`
- `apps/frontend/src/hooks/api/keys.ts`
- `apps/frontend/src/i18n/locales/es/translation.json`
- `apps/frontend/src/i18n/locales/en/translation.json`
- `apps/frontend/src/i18n/locales/ca/translation.json`

### 4.3 Data models and migrations (with examples)

#### Entity change (users)

Add soft-delete field:

```ts
@Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
deletedAt: Date | null;
```

#### Migration SQL sketch

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at
ON users (deleted_at);
```

#### Query behavior

- Active user: `deleted_at IS NULL`.
- Auth lookup (`findByEmail`) must filter active users only.
- Existing `/api/users` and `/api/users/search` should only return active users.

### 4.4 API contracts (endpoints, request/response, errors)

#### Base path

`/api/admin/users`

#### Endpoints

- `GET /api/admin/users`
  - Response: `{ data: AdminUserDto[] }`

- `POST /api/admin/users`
  - Body:
    ```json
    {
      "email": "new.user@example.com",
      "role": "user"
    }
    ```
  - Response: `{ data: AdminUserDto }`

- `PATCH /api/admin/users/:id`
  - Body:
    ```json
    {
      "email": "updated@example.com",
      "name": "Updated Name",
      "avatar": "https://...",
      "role": "admin"
    }
    ```
  - Response: `{ data: AdminUserDto }`

- `DELETE /api/admin/users/:id`
  - Soft delete only.
  - Response:
    ```json
    {
      "data": { "success": true }
    }
    ```

#### Error map

- `400` invalid DTO payload
- `403` role unauthorized
- `404` target user not found
- `409` duplicate email
- `422` safety rule violations (self-delete, self-demotion, last-admin)

### 4.5 Security, roles, and validations

#### Backend authorization

Apply at controller level:

```ts
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
```

#### Business validations

- On delete:
  - Reject if current user deleting self.
  - Reject if target is last active admin.
- On role update:
  - Reject if current user demoting self.
  - Reject if operation removes last active admin.

#### Frontend authorization

- `RequireRole` checks `user.role === 'admin'`.
- If unauthorized:
  - show toast `adminUsers.accessDenied`
  - redirect to `/`

### 4.6 Error handling and logging

#### Backend

- Throw typed Nest exceptions: `ForbiddenException`, `ConflictException`, `NotFoundException`, `UnprocessableEntityException`.
- Add logger context in admin operations (`AdminUsersController` / service branch).

#### Frontend

- Handle API errors and map to i18n toast keys.
- Keep list state stable during mutation errors.

---

## 5. External Configuration and Prerequisites

- No new required environment variables for MVP.
- Ensure existing variables are correctly configured:
  - Backend DB/JWT/CORS
  - Frontend `VITE_API_URL`
- Migration execution required in each target environment.

---

## 6. Step-by-Step Implementation Plan (Execution Phases)

## Phase 0 — Branching and baseline (15–30 min)

1. Create feature branch.
2. Run baseline checks:
   - `pnpm --filter @friends/backend test`
   - `pnpm --filter @friends/frontend test`
3. Confirm no pre-existing blockers.

**Deliverable**: clean baseline and branch ready.

## Phase 1 — Backend foundation: soft delete + service filtering (1.5–2.5 h)

1. Add `deletedAt` to user entity.
2. Create migration to add `deleted_at` column and optional index.
3. Update `UsersService.findByEmail`, `findAll`, and `search` to return active users only.
4. Validate `/auth/me` behavior remains correct for active users.

**Deliverable**: soft delete model live and existing flows preserved.

## Phase 2 — Backend admin module and endpoints (2.5–4 h)

1. Create `AdminModule` and register in `AppModule`.
2. Add admin users controller with:
   - `GET /api/admin/users`
   - `POST /api/admin/users`
   - `PATCH /api/admin/users/:id`
   - `DELETE /api/admin/users/:id` (soft)
3. Add DTOs and class-validator rules.
4. Implement business rules:
   - no self-delete
   - no self-demotion
   - keep at least one active admin
5. Keep response envelope shape via existing interceptor.

**Deliverable**: secure admin CRUD API complete.

## Phase 3 — Frontend API/hooks + role guard + route (1.5–3 h)

1. Add `admin-users.api.ts`.
2. Add `useAdminUsers.ts` with queries/mutations + cache invalidation.
3. Extend query keys with admin users keyspace.
4. Create `RequireRole` component.
5. Add `/admin/users` route in `App.tsx` protected by auth + role.

**Deliverable**: protected frontend data layer and navigation route ready.

## Phase 4 — Admin page UI + menu integration (3–5 h)

1. Create `AdminUsersPage.tsx` responsive UI.
2. Include list and actions for create/edit/delete.
3. Integrate toasts for success/failure.
4. Add menu entry in `UserMenu.tsx` only for admin.
5. Ensure mobile and desktop usability with existing design style.

**Deliverable**: complete end-user admin management flow.

## Phase 5 — i18n + polish + hardening (1–2 h)

1. Add translation keys in `es`, `en`, `ca`.
2. Verify unauthorized redirect + toast behavior.
3. Validate edge cases and empty/error states.

**Deliverable**: production-like UX consistency and localization coverage.

## Phase 6 — Tests and final validation (2–4 h)

1. Add/update backend tests for permissions and safety rules.
2. Add/update frontend tests for menu visibility, role route guard, CRUD interactions.
3. Run targeted and full checks.
4. Prepare release notes.

**Deliverable**: validated feature ready for merge.

### Estimated total effort

- **10.5 to 20.5 hours** (depending on test depth and UI refinements).

### Suggested commit sequence

1. `feat(backend): add soft-delete support for users`
2. `feat(backend): add admin users module and protected CRUD endpoints`
3. `feat(frontend): add role guard and admin users API hooks`
4. `feat(frontend): add admin users page and user menu entry`
5. `feat(frontend): add i18n keys for admin users`
6. `test(fullstack): add admin users permissions and CRUD tests`

---

## 7. Detailed Checklist

### Backend

- [x] `deleted_at` migration added and reversible.
- [x] User entity updated with `deletedAt`.
- [x] Auth lookup excludes soft-deleted users.
- [x] Existing `/api/users` still available for authenticated users.
- [x] `/api/admin/users` endpoints implemented.
- [x] `@Roles('admin')` protection enabled.
- [x] self-delete blocked.
- [x] self-demotion blocked.
- [x] last-admin protection enforced.

### Frontend

- [x] Admin menu entry visible only to admin users.
- [x] `/admin/users` route added and protected.
- [x] Unauthorized users redirected to Home with toast.
- [x] Admin page supports create/edit/delete/list.
- [x] Query cache invalidation works after mutations.
- [x] Responsive behavior verified on mobile and desktop.
- [x] i18n keys added in `es/en/ca`.

### Regression

- [x] Participant selection still works using `/api/users`.
- [x] Event and transaction views remain stable.
- [x] Login/session behavior remains stable for active users.

---

## 8. Testing and Validation

### Backend tests

- Authorization test: admin allowed, non-admin rejected.
- Safety tests: self-delete/self-demotion/last-admin constraints.
- Soft-delete auth test: deleted user cannot be resolved by auth lookup.

### Frontend tests

- Menu visibility test by role.
- Route guard test with redirect and toast.
- CRUD mutation tests with success/error handling.

### Suggested commands

- `pnpm --filter @friends/backend test`
- `pnpm --filter @friends/frontend test:run`
- `pnpm -r build`

---

## 9. Deployment Notes and Environment Variables

- Apply migration before backend rollout.
- Deploy backend before frontend route/menu update.
- Validate in staging:
  - admin CRUD works,
  - non-admin access is blocked,
  - participant flows are unchanged.
- No new env vars needed for MVP.

---

## 10. References and Resources

### Backend references

- `apps/backend/src/modules/users/user.entity.ts`
- `apps/backend/src/modules/users/users.service.ts`
- `apps/backend/src/modules/users/users.controller.ts`
- `apps/backend/src/modules/auth/roles.decorator.ts`
- `apps/backend/src/modules/auth/roles.guard.ts`
- `apps/backend/src/modules/auth/jwt.strategy.ts`

### Frontend references

- `apps/frontend/src/App.tsx`
- `apps/frontend/src/shared/components/Header/UserMenu.tsx`
- `apps/frontend/src/features/auth/RequireAuth.tsx`
- `apps/frontend/src/features/auth/AuthContext.tsx`
- `apps/frontend/src/api/client.ts`
- `apps/frontend/src/hooks/api/keys.ts`

---

## 11. Improvements and Lessons Learned

### Post-MVP opportunities

- Add pagination and search for large user sets.
- Add “restore soft-deleted user”.
- Add audit trail (`deletedBy`, `updatedBy`) and admin action logging.
- Move auth identity resolution from email-based lookup to immutable ID strategy.

### Lessons

- Soft delete is the best fit for this app’s current event/participant data model.
- Isolated admin endpoints reduce regression risk.
- Last-admin protection is essential for operational safety.

---

## Why this structure

This structure is designed to be reproducible by any developer or LLM across sessions: it moves from goals and constraints to design, then to atomic execution phases with estimations, checklists, and validation/deployment criteria. It minimizes ambiguity, keeps scope focused on MVP, and reduces context switching during implementation.
