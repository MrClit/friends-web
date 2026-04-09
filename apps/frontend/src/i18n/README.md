# Frontend i18n Setup

This folder contains the namespace-based i18n configuration for the frontend (`react-i18next` + `i18next`).

## Current Architecture

- `namespaces.ts`: source of truth for all supported namespaces (`I18nNamespace`).
- `locale-loaders.ts`: lazy-loads locale JSON files with `import.meta.glob`.
- `index.ts`: i18n initialization, language detection, supported languages, fallbacks, and namespace preloading helpers.
- `constants.ts`: language selector metadata (`LANGUAGES`).
- `locales/<lng>/<namespace>.json`: translation files split by namespace and language.

### Runtime behavior

- `common` is warmed at startup to keep shell/common UI responsive.
- Other namespaces are loaded on demand.
- On language change, all namespaces are warmed for the new language to reduce key-flicker.
- Pages can preload required namespaces via `useI18nNamespacesReady`.

## Existing Languages

Current language codes:

- `es`
- `en`
- `ca`

Keep these values consistent across:

- `src/i18n/index.ts` -> `supportedLngs`, `fallbackLng`, `LOCALE_MAP`
- `src/i18n/constants.ts` -> `LANGUAGES`
- `src/i18n/locales/<lng>/...`

## How To Add a New Language

Example: add `fr`.

1. Update language metadata in `src/i18n/constants.ts`.
2. Update i18n config in `src/i18n/index.ts`:
   - Add the code to `supportedLngs`.
   - Add locale mapping in `LOCALE_MAP` (for date/number formatting).
   - Decide if `fallbackLng` stays `en` or changes.
3. Create folder `src/i18n/locales/fr/`.
4. Add one JSON file per namespace listed in `src/i18n/namespaces.ts`.
5. Ensure key parity with existing languages (same keys, translated values).
6. Run validation:
   - `pnpm --filter @friends/frontend lint`
   - `pnpm --filter @friends/frontend test:run`
   - `pnpm --filter @friends/frontend build`
7. Manual check:
   - Switch to the new language in UI.
   - Verify Home, Event detail, KPI detail, Profile, Admin, NotFound, and ErrorBoundary.

## How To Add a New Namespace

1. Add the namespace key to `src/i18n/namespaces.ts`.
2. Create translation files for all languages:
   - `src/i18n/locales/es/<newNamespace>.json`
   - `src/i18n/locales/en/<newNamespace>.json`
   - `src/i18n/locales/ca/<newNamespace>.json`
3. Move/define keys under the new namespace (keep a stable nested structure).
4. Use it in components/hooks:
   - `useTranslation('<newNamespace>')` for single-namespace usage.
   - `useTranslation(['<newNamespace>', 'common'])` for mixed usage.
   - Use `t('keyPath')` for local keys.
   - Use `t('keyPath', { ns: 'otherNamespace' })` for cross-namespace calls.
5. If route/page-level loading is sensitive to language switch, preload with:
   - `useI18nNamespacesReady(['<newNamespace>', ...])`
6. Remove old key usage from previous namespace to avoid duplication/drift.
7. Run lint/tests/build and do a manual language switch check.

## Conventions

- Keep namespace ownership clear and feature-oriented.
- Keep shared generic UI strings in `common`.
- Do not re-introduce monolithic `translation.json` files.
- Keep translation keys stable (avoid unnecessary churn).
- Use English for docs/comments; translations stay in their target language files.

## Troubleshooting

- Seeing raw keys in UI:
  - Confirm the namespace file exists for the active language.
  - Confirm the key path exists in that namespace.
  - Confirm component uses the correct namespace(s) in `useTranslation`.
- Language switch updates are incomplete:
  - Ensure page uses `useI18nNamespacesReady` when needed.
  - Confirm namespace is part of the preload array.
- Build warning about static + dynamic locale import:
  - Ensure locale JSONs are only loaded through `locale-loaders.ts`.

## i18n PR Checklist

Before merging an i18n-related change, verify:

- [ ] If a new namespace was added, it is declared in `src/i18n/namespaces.ts`.
- [ ] Namespace files exist for all supported languages (`es`, `en`, `ca`).
- [ ] New language codes (if any) are aligned in `constants.ts`, `index.ts` (`supportedLngs`), and `LOCALE_MAP`.
- [ ] Components/hooks use namespace-aware calls (`useTranslation('ns')`, `t('key')`, `t('key', { ns: 'other' })`).
- [ ] No accidental reintroduction of monolithic `translation.json`.
- [ ] `pnpm --filter @friends/frontend lint` passes.
- [ ] `pnpm --filter @friends/frontend test:run` passes.
- [ ] `pnpm --filter @friends/frontend build` passes.
- [ ] Manual language switch sanity check completed on key routes (Home, Event detail, KPI detail, Profile, Admin, NotFound).
