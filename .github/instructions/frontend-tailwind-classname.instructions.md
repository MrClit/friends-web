---
description: 'Use when editing frontend React TSX files with Tailwind className values. Prefer inline cn() for long or stateful class lists and order classes for readability and maintainability.'
name: 'Frontend Tailwind className Style'
applyTo: 'apps/frontend/src/**/*.tsx'
---

# Frontend Tailwind className Style

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

## Example

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
