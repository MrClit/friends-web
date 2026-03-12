---
name: frontend-tailwind-inline-cn-refactor
description: 'Refactor React TSX className values using inline cn(...) with grouped Tailwind utilities. Use for component-level readability cleanups that keep behavior unchanged and follow project Tailwind rules.'
argument-hint: 'Target path(s), optional scope, and whether to run tests'
user-invocable: true
---

# Frontend Tailwind Inline cn Refactor

Use this skill to refactor frontend TSX components so Tailwind className values are easier to read and maintain.

## When to Use
- A component has long or hard-to-scan Tailwind class lists.
- A className includes variants such as hover/focus/data/aria/dark/responsive.
- A component uses single-use style constants and you want explicit inline cn(...) in JSX.
- You want a safe readability refactor without behavior changes.

## Inputs
- Target scope: one file, a folder, or a list of files.
- Optional constraints: preserve current visual output exactly, run tests, or skip tests.

## Procedure
1. Read and apply project instructions from [frontend-tailwind-classname.instructions.md](../../instructions/frontend-tailwind-classname.instructions.md).
2. Inspect target TSX files and identify className candidates:
   - Keep direct className="..." only for short static lists (up to 7 utilities) without variants.
   - Use className={cn(...)} for long lists or when variants are present.
3. Refactor class lists using inline cn(...) directly on the JSX element by default.
4. Group utility strings inside cn(...) using this order:
   - Layout and positioning
   - Size and spacing
   - Typography
   - Visual surface (bg, border, ring, shadow)
   - Interaction and transitions
   - State and theme variants
   - Responsive variants
5. Avoid extracting style-only constants when used once.
6. Extract class constants only when reused or when inline composition becomes materially harder to understand.
7. Preserve behavior:
   - Do not change component logic, props, handlers, routes, or translations.
   - Avoid unrelated formatting or refactors.
8. Validate changed files for TypeScript/lint errors and fix issues introduced by the refactor.
9. Summarize changes with file links and a short list of what was improved.

## Guardrails
- Prefer transition-colors over transition-all unless there is a clear reason.
- Keep edits minimal and local to readability goals.
- Do not alter semantics or accessibility attributes.

## Done Criteria
- Refactored className values are easier to scan and consistent with project rules.
- cn(...) is explicit inline in JSX where required.
- No new compile or lint errors in edited files.
