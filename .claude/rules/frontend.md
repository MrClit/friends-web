---
paths:
  - "apps/frontend/**"
---

## Frontend Architecture

**Stack:** React 19 · TypeScript · Vite · TanStack Query · Zustand · TailwindCSS v4 · React Router 7 (HashRouter) · i18next

### Feature structure

```
src/features/{feature}/   components/, types.ts, constants.ts, index.ts (hooks/ optional)
src/api/                  client.ts, types.ts + per-entity modules (events.api.ts, transactions.api.ts, users.api.ts, admin-users.api.ts)
src/hooks/api/            TanStack Query hooks + centralized keys.ts
src/shared/store/         Zustand stores (theme, modals, toast, delete state)
src/pages/                Route-level components
src/providers/            QueryProvider (wraps the app in App.tsx)
src/lib/queryClient.ts    The single QueryClient instance and its defaults
src/shared/components/ui/ Radix primitives wrapped for this design system (dialog, dropdown-menu)
src/i18n/locales/         es/ (default), en/, ca/
src/config/env.ts         Validated env vars via VITE_ prefix
```

Features: `events`, `transactions`, `kpi`, `shopping`, `calendar`, `auth`, `admin-users`, `profile`

### State management layers

1. **Server state:** TanStack Query hooks in `src/hooks/api/` with keys from `keys.ts`
2. **UI/modal state:** Zustand stores (`useEventFormModalStore`, `useTransactionModalStore`, etc.)
3. **Global state:** `useThemeStore` (dark mode only)

### API client and the token model

`src/api/client.ts` — custom fetch wrapper that auto-unwraps `{ data: T }` responses, handles JWT refresh, and throws `ApiError` with status info.

The token split is deliberate and easy to break:

- **Access token lives in a module-level variable, never in storage** — a persistent XSS cannot read it. It is
  lost on reload and re-obtained from the refresh token. Do not "fix" this by persisting it.
- **Refresh token lives in `localStorage`** under `REFRESH_TOKEN_KEY`, and is rotated on every refresh.
- On a `401` the client refreshes once and replays the request (`_retried` guard); a failed refresh dispatches
  a global `auth:logout` event, which `AuthContext` listens for. Concurrent 401s share one `refreshPromise`.

### Key conventions

- **Named exports only** — never `export default`. Barrel files use `export { X } from './X'`
- `React.memo` → `export const Foo = memo(function Foo() { ... })`
- `React.lazy` → `lazy(() => import('./Foo').then(m => ({ default: m.Foo })))`
- `cn()` helper from `@/shared/utils` for conditional Tailwind classes (clsx + tailwind-merge); use when a `className` has 8+ utilities or mixes state/theme/responsive variants
- Tailwind class order: layout → spacing → typography → visual → interaction → state/theme → responsive
- Full className rules and the refactor procedure live in the `tailwind-inline-cn` skill
- Semantic colors: blue=contributions, rose=expenses, emerald=compensations, amber=pot

### Routes

Vite `base` is `/friends-web/` (GitHub Pages subpath) and routing is a `HashRouter`, so production URLs look
like `/friends-web/#/event/:id`. That is why `FRONTEND_URL` on the backend carries a trailing `#` — the OAuth
redirect has to land inside the hash router. Every route below is lazy-loaded in [App.tsx](../../apps/frontend/src/App.tsx).

- `/login`, `/auth/callback` — OAuth flow
- `/` — Home (event list, protected)
- `/event/:id` — Event hub, money section (protected)
- `/event/:id/shopping` — Shopping list section (protected)
- `/event/:id/calendar` — Meal calendar and attendance planning (protected)
- `/event/:id/kpi/:kpi` — KPI drill-down (protected)
- `/profile` — User profile (protected)
- `/settings` → redirects to `/profile` (protected alias)
- `/admin/users` — Admin user management (protected, ADMIN role)
- `*` — 404 Not Found

### Testing

Vitest + Testing Library. Tests are **co-located** with the source (`Foo.test.ts` next to `Foo.ts`), not in a
separate tree. Global setup: `src/test/setup.ts`.

### i18n

- Languages: `es` (default), `en`, `ca`
- Key pattern: `feature.context.key` (e.g., `events.form.title`)
- Helpers: `formatAmount(amount, 'EUR')`, `formatDateLong(date)`

### Environment

Frontend env vars are `VITE_`-prefixed and validated at module load in `src/config/env.ts`
(`VITE_API_URL` and `VITE_APP_NAME` are required; a missing or malformed one throws at startup).

### Adding a feature

1. Create `src/features/{feature}/` with components, types, constants, `index.ts`
2. Add API methods in `src/api/`, hooks in `src/hooks/api/`, query keys in `keys.ts`
3. Add translations to `src/i18n/locales/{en,es,ca}/translation.json`

### Skill caveats

- **`vercel-react-best-practices`** — ignore its `server-*` rules (React Server Components, `use server`,
  Next.js data fetching). This frontend is a Vite SPA; those rules do not apply. Everything else
  (waterfalls, memoization, bundle size) does.
- **`tailwind-css-patterns`** is generic. Where it disagrees with **`tailwind-inline-cn`** — this repo's
  own `cn()` and class-ordering rules — `tailwind-inline-cn` wins.
