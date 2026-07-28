---
name: tailwind-inline-cn
description: 'Frontend Tailwind className style rules and refactors — when to use inline cn(...) instead of a plain className string, how to group and order utility classes, and how to clean up long or stateful class lists in React TSX. Use when writing or reviewing className values in apps/frontend/src/**/*.tsx, or when asked to make a component''s Tailwind classes more readable.'
argument-hint: 'Target path(s), optional scope, and whether to run tests'
user-invocable: true
---

# Frontend Tailwind className Style

Applies to `apps/frontend/src/**/*.tsx`.

## Rules

- Import `cn` from `@/shared/utils` when class composition benefits readability.
- Keep direct `className="..."` for short static lists (up to 7 utilities) without variants.
- Prefer `className={cn(...)}` when a class list has 8 or more utilities.
- Prefer `className={cn(...)}` inline on the JSX element by default.
- Avoid extracting style-only constants like `const buttonClassName = cn(...)` when they are used once.
- Extract a class constant only when it is reused, shared across conditional branches, or inline composition would significantly hurt readability.
- Prefer `className={cn(...)}` when variants are present, even with fewer classes:
  - Interaction: `hover:`, `focus:`, `active:`
  - State selectors: `data-*`, `aria-*`
  - Theme and responsive: `dark:`, `sm:`, `md:`, `lg:`
- Split `cn(...)` into grouped strings by concern and keep this order:
  1. Layout and positioning
  2. Size and spacing
  3. Typography
  4. Visual surface (`bg`, `border`, `ring`, `shadow`)
  5. Interaction and transitions
  6. State and theme variants
  7. Responsive variants
- Avoid `transition-all` unless there is a clear need to animate many properties. Prefer targeted transitions such as `transition-colors`.

### Example

```tsx
className={cn(
  'group flex items-center rounded-full border p-1 sm:pr-2.5',
  'border-slate-200/80 bg-white/80 shadow-sm',
  'hover:bg-white hover:border-teal-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60',
  'dark:border-emerald-800/70 dark:bg-emerald-950/40',
  'dark:hover:bg-emerald-900/50 dark:hover:border-emerald-700/80',
  'data-[state=open]:bg-white data-[state=open]:border-teal-200',
  'dark:data-[state=open]:bg-emerald-900/50 dark:data-[state=open]:border-emerald-700/80',
)}
```

## Refactor Procedure

Use this when asked to clean up existing components (one file, a folder, or a list of files).

1. Inspect target TSX files and identify `className` candidates against the rules above.
2. Refactor class lists using inline `cn(...)` directly on the JSX element by default.
3. Group utility strings inside `cn(...)` using the order above.
4. Avoid extracting style-only constants when used once; extract only when reused or when
   inline composition becomes materially harder to understand.
5. Preserve behavior:
   - Do not change component logic, props, handlers, routes, or translations.
   - Do not alter semantics or accessibility attributes.
   - Avoid unrelated formatting or refactors.
6. Validate changed files for TypeScript and lint errors, and fix anything the refactor introduced.
7. Summarize changes with file links and a short list of what improved.

## Done Criteria

- Refactored `className` values are easier to scan and consistent with the rules above.
- `cn(...)` is explicit inline in JSX where required.
- No new compile or lint errors in edited files.
