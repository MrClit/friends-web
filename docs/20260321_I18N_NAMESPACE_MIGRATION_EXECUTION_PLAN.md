# I18n Namespace and Lazy-Loading Migration — Execution-Ready Plan

## 1. Table of Contents

- 1. Table of Contents
- 2. Motivation and Objectives
- 3. System Overview and Requirements
- 4. Solution Design
- 5. External Configuration and Prerequisites
- 6. Step-by-Step Implementation Plan (Execution Phases)
- 7. Detailed Checklist
- 8. Testing and Validation
- 9. Deployment Notes and Environment Variables
- 10. References and Resources
- 11. Improvements and Lessons Learned

---

## 2. Motivation and Objectives

### Why this change

The frontend currently stores all UI strings for each language in one monolithic file:

- `apps/frontend/src/i18n/locales/es/translation.json`
- `apps/frontend/src/i18n/locales/en/translation.json`
- `apps/frontend/src/i18n/locales/ca/translation.json`

Current characteristics:

- ~306 lines per locale file.
- All locales are imported eagerly at startup from `apps/frontend/src/i18n/index.ts`.
- Translation ownership is shared across many features, increasing merge conflicts.

### Goals

1. Improve maintainability by splitting translations by domain/feature namespace.
2. Preserve existing UI text and behavior during migration.
3. Enable lazy-loading of non-core namespaces to reduce startup payload growth.
4. Keep migration incremental and safe (no big-bang refactor).

### Non-goals (for this migration)

1. Rewriting copy/wording.
2. Adding new languages.
3. Introducing backend-served translations.
4. Reworking unrelated app architecture.

---

## 3. System Overview and Requirements

### Existing i18n anchors

- `apps/frontend/src/i18n/index.ts`
- `apps/frontend/src/i18n/constants.ts`
- `apps/frontend/src/main.tsx`
- `apps/frontend/src/i18n/locales/{es,en,ca}/translation.json`

### Functional requirements

1. Existing translation keys must continue to resolve during migration.
2. Language detection and persistence must remain unchanged.
3. `es`, `en`, and `ca` must remain fully supported.
4. Missing namespace loads must fail safely (fallback language + graceful UI).

### Non-functional requirements

1. Small, reviewable PRs.
2. Low regression risk for routes and shared UI.
3. Explicit ownership by namespace to reduce conflicts.
4. Future-friendly structure for adding feature modules.

### Constraints

1. Keep existing frontend stack (React 19 + Vite + react-i18next + i18next).
2. Keep current language detector behavior.
3. Keep existing route protection and rendering behavior.

---

## 4. Solution Design

### 4.1 Target architecture and flow

Target behavior:

1. App bootstraps with a minimal core namespace set (at least `common`).
2. Feature pages request their namespace(s) when mounted or when route loads.
3. If a namespace is unavailable for active language, fallback language is used.
4. If both fail, key fallback appears and an error is logged in dev.

Execution model:

- Phase A: Split into namespaces while still eagerly bundled (safest).
- Phase B: Activate lazy-loading for non-core namespaces.
- Phase C: Remove legacy `translation.json` files.

### 4.2 Folder/file structure and affected areas

#### New i18n structure (target)

```text
apps/frontend/src/i18n/
  index.ts
  constants.ts
  namespaces.ts                      # New: namespace registry and typing
  locale-loaders.ts                  # New: dynamic namespace loading helpers
  locales/
    es/
      common.json
      auth.json
      home.json
      events.json
      eventDetail.json
      transactions.json
      kpiDetail.json
      adminUsers.json
      profile.json
      user.json
      header.json
      notFound.json
      errorBoundary.json
      confirmDialog.json
    en/
      ...same namespace set...
    ca/
      ...same namespace set...
```

#### Existing files to update

- `apps/frontend/src/i18n/index.ts`
- `apps/frontend/src/main.tsx` (only if initialization changes require sequencing)
- `apps/frontend/src/pages/**/*.tsx` (incremental namespace adoption)
- `apps/frontend/src/features/**/*.tsx` (incremental namespace adoption)
- `apps/frontend/src/shared/components/**/*.tsx` (incremental namespace adoption)

### 4.3 Data models and migration schema

#### Namespace contract

Each namespace JSON remains an object map of key/value, allowing nested groups.

Example (`profile.json`):

```json
{
  "title": "Profile",
  "subtitle": "Update your profile information and avatar.",
  "avatar": {
    "title": "Profile photo",
    "camera": "Take photo"
  }
}
```

#### Ownership contract

- `common`: shared generic UI actions/messages.
- `auth`: login/callback/auth-specific texts.
- `adminUsers`: admin users feature.
- `profile`: profile feature.
- `events`, `eventDetail`, `transactions`, `kpiDetail`: domain screens/components.
- `header`, `user`, `language`, `theme`: global shell.

#### Type contract

Create a typed namespace list in `namespaces.ts`:

```ts
export const NAMESPACES = [
  'common',
  'auth',
  'home',
  'events',
  'eventDetail',
  'transactions',
  'kpiDetail',
  'adminUsers',
  'profile',
  'user',
  'header',
  'notFound',
  'errorBoundary',
  'confirmDialog',
] as const;

export type I18nNamespace = (typeof NAMESPACES)[number];
```

### 4.4 API contracts (internal frontend contracts)

No backend API changes are needed.

Frontend i18n internal contract additions:

1. `ensureNamespacesLoaded(lng: string, namespaces: I18nNamespace[]): Promise<void>`
2. Optional hook wrapper for feature pages/components:
   - `useFeatureTranslation(namespaces: I18nNamespace[])`

Contract behavior:

- Idempotent: calling load twice is safe.
- Fallback-aware: when `lng` resource missing, load `fallbackLng`.
- Non-blocking in production UI: no crashes on load failure.

### 4.5 Security and safety considerations

1. Keep `escapeValue: false` in i18next because React escapes by default.
2. Do not render user-supplied translation keys.
3. Do not allow dynamic namespace names from user input.
4. Avoid `dangerouslySetInnerHTML` with translated strings unless explicitly sanitized.

### 4.6 Error handling and observability

1. In development:
   - Log missing keys and namespace load failures with context (language + namespace).
2. In production:
   - Fail gracefully to key fallback and `fallbackLng` where available.
3. Add optional diagnostic helper (dev-only):
   - `reportMissingTranslation(lng, ns, key)`.

---

## 5. External Configuration and Prerequisites

### Prerequisites

1. Clean branch from `main`.
2. Baseline checks passing:
   - `pnpm --filter @friends/frontend test:run`
   - `pnpm --filter @friends/frontend lint`
   - `pnpm --filter @friends/frontend build`

### Dependency strategy

Two valid implementation options:

1. **No extra dependency (recommended first):**
   - Use Vite dynamic imports via `import.meta.glob` in `locale-loaders.ts`.
2. **Optional library-based backend loader:**
   - Add `i18next-resources-to-backend` and configure backend plugin.

Recommendation for this repo: start with option 1 to minimize moving parts.

### Environment variables

No new environment variables required.

---

## 6. Step-by-Step Implementation Plan (Execution Phases)

## Phase 0 — Baseline and inventory (30–60 min)

1. Create branch for migration.
2. Freeze baseline by running frontend lint, tests, and build.
3. Export current key inventory from existing translation files for tracking.

Deliverable:

- Baseline validated.
- Key inventory snapshot committed to migration notes.

## Phase 1 — Namespace scaffolding (2–4 h)

1. Create `namespaces.ts` with typed namespace registry.
2. Create `locale-loaders.ts` with `ensureNamespacesLoaded` helper.
3. Split locale files into namespace files for `es/en/ca`.
4. Keep `translation.json` temporarily untouched as compatibility fallback.

Deliverable:

- Namespace files exist and are complete.
- Loader utility compiles.

## Phase 2 — Compatibility mode in i18n init (2–3 h)

1. Update `i18n/index.ts` to understand namespace model.
2. Keep compatibility path so current `t('feature.key')` usage still works.
3. Ensure language detection and HTML lang synchronization stay unchanged.
4. Add safe fallback behavior for missing namespace loads.

Deliverable:

- App behavior unchanged from user perspective.
- Namespace infrastructure active.

## Phase 3 — Pilot migration (Profile + Admin) (2–4 h)

Scope:

- `apps/frontend/src/pages/Profile.tsx`
- `apps/frontend/src/pages/AdminUsersPage.tsx`
- Related feature components using profile/admin keys.

Tasks:

1. Use explicit namespace consumption in pilot modules.
2. Keep shared strings in `common` namespace.
3. Validate all 3 languages manually in pilot routes.
4. Update/add unit tests as needed.

Deliverable:

- First two modules fully namespace-driven.
- No regressions.

## Phase 4 — Full feature rollout (4–8 h)

1. Migrate remaining modules by bounded PR batches:
   - Batch A: auth + shell (`header`, `user`, `language`, `theme`, `home`).
   - Batch B: events + event detail + transactions.
   - Batch C: KPI + shared fallback pages (`notFound`, `errorBoundary`, `confirmDialog`).
2. Keep each PR focused and independently releasable.

Deliverable:

- All active UI translations served from namespaces.

## Phase 5 — Activate lazy loading for non-core namespaces (2–4 h)

1. Configure runtime loading for non-core namespaces.
2. Keep `common` eagerly available.
3. Add route/module preloading for high-frequency namespaces if needed.
4. Measure startup bundle impact before/after.

Deliverable:

- Lazy-loading enabled with stable UX.

## Phase 6 — Cleanup and hardening (1–2 h)

1. Remove legacy monolithic `translation.json` files.
2. Remove temporary compatibility code paths.
3. Document namespace ownership and contribution rules.

Deliverable:

- Final clean architecture without deprecated artifacts.

### Suggested PR sequence

1. `refactor(frontend): scaffold i18n namespaces and loaders`
2. `refactor(frontend): enable namespace-compatible i18n init`
3. `refactor(frontend): migrate profile and admin namespaces`
4. `refactor(frontend): migrate events and transactions namespaces`
5. `refactor(frontend): migrate kpi and shared namespaces`
6. `perf(frontend): enable lazy-loading for non-core translation namespaces`
7. `chore(frontend): remove legacy translation monolith files`

### Estimated total effort

- 11.5 to 25 hours, depending on test updates and rollout granularity.

---

## 7. Detailed Checklist

### Architecture and structure

- [ ] Namespace registry file exists and is typed.
- [ ] Locale files are split by namespace for `es/en/ca`.
- [ ] Namespace ownership map is documented.
- [ ] Legacy monolithic files retained only during compatibility phase.

### i18n runtime

- [ ] i18n init supports namespace loading.
- [ ] Fallback language behavior verified.
- [ ] Missing namespace/key handling is logged in dev.
- [ ] HTML lang synchronization remains correct.

### Feature migration

- [ ] Profile namespace migration complete.
- [ ] Admin users namespace migration complete.
- [ ] Home/auth/header/user migration complete.
- [ ] Events/transactions migration complete.
- [ ] KPI/shared fallback screens migration complete.

### Quality and regression

- [ ] All frontend tests pass.
- [ ] All lint checks pass.
- [ ] Build passes.
- [ ] Manual language switch verification done in main routes.

### Cleanup

- [ ] Legacy `translation.json` files removed.
- [ ] Compatibility code paths removed.
- [ ] Documentation updated.

---

## 8. Testing and Validation

### Automated testing

Run after each PR:

- `pnpm --filter @friends/frontend lint`
- `pnpm --filter @friends/frontend test:run`
- `pnpm --filter @friends/frontend build`

### Test cases (must pass)

1. Language switch updates translated labels in header and menu.
2. Profile page renders all translated strings in 3 languages.
3. Admin users page renders all translated strings in 3 languages.
4. Event detail and KPI detail keep previous translations and no key leaks.
5. NotFound and ErrorBoundary still resolve strings.

### Mocking strategy (unit tests)

1. Keep current i18n test setup behavior where applicable.
2. For namespace-specific tests, mock loaded namespaces explicitly.
3. Add regression tests for fallback to `common` and fallback language.

### Acceptance criteria

1. No visible raw translation keys in normal usage.
2. No language-specific route regressions.
3. Build, lint, and test pipelines green.
4. Translation maintenance is easier (feature-limited diffs).

---

## 9. Deployment Notes and Environment Variables

1. No environment variable changes are required.
2. Rollout can be done as normal frontend deploys.
3. Recommended release order:
   - Deploy compatibility and partial migration first.
   - Deploy lazy-loading switch after namespace migration is complete.
4. Rollback plan:
   - Re-enable compatibility path and legacy monolith files if issues appear.

---

## 10. References and Resources

### Internal code references

- `apps/frontend/src/i18n/index.ts`
- `apps/frontend/src/i18n/constants.ts`
- `apps/frontend/src/main.tsx`
- `apps/frontend/src/pages/Profile.tsx`
- `apps/frontend/src/pages/AdminUsersPage.tsx`
- `apps/frontend/src/pages/Home.tsx`
- `apps/frontend/src/pages/EventDetail.tsx`
- `apps/frontend/src/pages/KPIDetail.tsx`
- `apps/frontend/src/shared/components/Header/Header.tsx`
- `apps/frontend/src/shared/components/Header/UserMenu.tsx`

### Documentation references

- `docs/20260117_FRONTEND_ARCHITECTURE_REFACTOR.md`
- `docs/FRONTEND_API_INTEGRATION.md`
- `docs/FRONTEND_TESTING_STRATEGY.md`

---

## 11. Improvements and Lessons Learned

### Planned improvements after migration

1. Add script to validate key parity across `es/en/ca` in CI.
2. Add optional lint rule for namespace ownership boundaries.
3. Add contributor guideline for adding new keys by namespace.
4. Add bundle-size threshold check to prevent translation regressions.

### Expected lessons

1. Namespace ownership reduces team merge conflicts.
2. Incremental migration lowers risk compared to one-shot refactors.
3. Keeping `common` eagerly loaded balances UX and performance.
4. Typed namespace contracts reduce i18n drift over time.
