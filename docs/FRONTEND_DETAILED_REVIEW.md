# Frontend Detailed Review

Fecha: 10 de enero de 2026

Resumen ejecutivo

- **Alcance:** Revisión del frontend en `apps/frontend` — estructura, dependencias, rendimiento, accesibilidad, i18n, seguridad y pruebas.
- **Objetivo:** Enumerar hallazgos, riesgos y acciones recomendadas priorizadas (urgente, alto, medio, bajo).

**Metodología**

- Se revisaron archivos principales: `package.json`, `vite.config.ts`, `tailwind.config.js`, `src/main.tsx`, `src/App.tsx`, `src/api/client.ts`, `src/lib/queryClient.ts`, `src/lib/utils.ts`, hooks de TanStack Query y provider de QueryClient.
- Se comparó con patrones documentados en la monorepo y buenas prácticas actuales para React 19, Vite y TanStack Query v5.

Hallazgos importantes (resumen)

- Buen uso general de patrones: separación de provider (`QueryProvider`), hooks por recurso (`useEvents`, etc.), y un wrapper de API con `ApiError`.
- Algunas configuraciones y prácticas pueden mejorar rendimiento, robustez y seguridad.

Prioridad alta (recomiendo abordar primero)

- **Validación de ENV en `config/env`**: Asegurarse `ENV.API_URL` y `ENV.ENABLE_DEVTOOLS` estén correctamente validados y no expongan secretos. Evitar valores vacíos que causen peticiones a `undefined` o errores silenciosos.
  - Acción: agregar validaciones tempranas y fallbacks explícitos; lanzar errores en desarrollo si falta `API_URL`.

- **Manejo de errores en `apiRequest`**: Actualmente `apiRequest` intenta parsear JSON en respuestas no-ok y en 204, pero se asume que la respuesta correcta contiene `{ data }`.
  - Riesgo: endpoints que devuelven HTML o texto (errores proxied), o respuestas sin body rompen el parseo. Además, los errores del `fetch` (network) no están envueltos en `ApiError`.
  - Acción: envolver `fetch` en try/catch para convertir errores de red en `ApiError`; detectar `Content-Type` antes de parsear JSON; manejar respuestas text/plain.

- **Configuración de QueryClient (react-query)**: `refetchOnWindowFocus` y `refetchOnReconnect` están en `true` por defecto; para apps móviles/embedded puede generar muchas recargas.
  - Acción: considerar `false` o funciones condicionales; usar `onError` global y logs (Sentry) para capturar fallos.

Prioridad media

- **Devtools en producción**: `QueryProvider` muestra `ReactQueryDevtools` según `ENV.ENABLE_DEVTOOLS`. Asegurarse que `ENV` no active devtools en producción.
  - Acción: derivar `ENABLE_DEVTOOLS` de `import.meta.env.MODE === 'development'` o controlar por build-time env.

- **Bundle base y `base` en Vite**: `vite.config.ts` tiene `base: '/friends-web/'` (probable para GitHub Pages). Verificar rutas de assets y `publicPath` en deploys alternativos.
  - Acción: documentar y condicionar `base` con `process.env` si hay múltiples targets.

- **Tailwind content globs**: correctos, pero revisar que los componentes dinámicos (className construidos con `cn()` y `twMerge`) usen clases explícitas o safelist si aparecen dinámicamente en variables.
  - Acción: añadir `safelist` en `tailwind.config.js` para clases generadas dinámicamente si detectas pérdida de estilos.

Prioridad baja

- **ThemeInitializer y DemoInitializer**: inicializadores montados fuera de `App` en `main.tsx`. Esto es OK, pero documentar su orden relativo a `I18nextProvider` si alguno depende de traducciones.

- **Uso de `React.StrictMode` con React 19**: provoca doble-mount en development para detectar efectos. Está bien, sólo tener en cuenta efectos idempotentes en inicializadores y hooks.

Rendimiento

- Observaciones:
  - `staleTime` de 5 minutos es razonable; `gcTime` de 10 minutos puede limpiar cache agresivamente si la app cambia de pestaña con frecuencia. Ajustar según patrones de uso.
  - `refetchOnWindowFocus: true` puede generar picos. Para datos que no cambian frecuentemente (eventos pasados), considerar `false` o `refetchOnWindowFocus: (query) => /* cond */`.
  - Hacer `React.lazy`/`Suspense` en rutas con import dinámico para reducir bundle inicial si `Home` o `EventDetail` son pesados.

- Imágenes y recursos:
  - No se revisaron assets grandes pero revisar `public/` y optimizar imágenes (webp/avif, srcset), lazy-loading en `img` con `loading="lazy"`.

Accesibilidad (a11y)

- Recomendaciones:
  - Añadir `lang` en `index.html` y comprobar `i18n` sincronizado con `html` `lang` attribute en cambios de idioma.
  - Revisión de contrastes de color en el tema Tailwind (no inspeccionado aquí). Usar `axe` en tests o `@axe-core/react` en dev.
  - Formularios: asegurarse de usar `label` ligados a inputs y `aria-invalid` en validaciones.

Internacionalización (i18n)

- Observaciones:
  - `main.tsx` carga `./i18n` y envuelve con `I18nextProvider` correctamente.
  - Asegurarse de formateo de fechas/monedas usando APIs de internacionalización (`Intl.DateTimeFormat` y `Intl.NumberFormat`) con los locales mapeados en el README.

Pruebas y CI

- Observaciones:
  - Vitest está configurado en `vite.config.ts` con `setupFiles` y `jsdom`, cobertura con `v8` provider.
  - Incluir tests E2E o integración ligera para flujos críticos (crear evento, añadir transacción, ver KPIs), usando Playwright o Cypress en CI.

Seguridad

- Recomendaciones:
  - No incluir secretos en `ENV` del frontend; solo URLs y flags. Ver `config/env.ts` para confirmar.
  - Validar y sanitizar cualquier HTML que venga del backend antes de renderizar (dangerouslySetInnerHTML usage check).

Código y estilo

- `cn()` util y `twMerge` uso correcto; permite composición segura de clases.
- Consistencia en hooks de react-query: buenos patrones para invalidar caché.

Checklist de acciones recomendadas (ordenadas y con ejemplos)

1. Mejorar `apiRequest` (urgente)

- Wrap fetch errors and content-type check. Example:

```ts
try {
  const response = await fetch(url, opts);
} catch (e) {
  throw new ApiError(0, 'NetworkError', e.message);
}
const contentType = response.headers.get('content-type') || '';
if (contentType.includes('application/json')) {
  const json = await response.json();
} else {
  const text = await response.text();
}
```

2. Harden ENV handling (alto)

- Validate `ENV.API_URL` at startup and fail-fast in dev.

3. QueryClient tuning (medio)

- Consider `refetchOnWindowFocus: false` and using manual refetch for specific queries.

4. Lazy-load heavy routes (medio)

- Convert route imports to `React.lazy()` with `Suspense` for `EventDetail` and `KPIDetail`.

5. Accessibility checks (medio)

- Add `vitest` + `@axe-core/react` smoke tests; run axe in CI.

6. Tests e2e (medio)

- Add Playwright tests for critical user flows and run in CI.

7. Tailwind safelist (bajo)

- If classes are generated at runtime, add safelist to `tailwind.config.js`.

8. Assets optimization (bajo)

- Audit `public/` for large media; use compressed formats and `loading="lazy"`.

Anexos — cambios sugeridos (snippets)

- Robust `apiRequest` (suggested patch): ver sección "Checklist".

- Example lazy routes in `App.tsx`:

```tsx
const EventDetail = React.lazy(() => import('./pages/EventDetail'));
const KPIDetail = React.lazy(() => import('./pages/KPIDetail'));

// in JSX
<Suspense fallback={<div>Loading...</div>}>
  <Routes>...</Routes>
</Suspense>;
```

Conclusión

El frontend está bien estructurado y sigue patrones sólidos. Las mejoras propuestas se centran en robustez (manejo de errores y validación de env), rendimiento en producción (tuning de react-query y lazy-loading) y calidad (a11y y e2e). Puedo abrir PRs con cambios puntuales: 1) endurecer `apiRequest`, 2) añadir validaciones de `ENV`, 3) convertir rutas a lazy, 4) añadir un test axe-smoke y 5) recomendaciones de CI para Playwright. ¿Con cuáles te gustaría que empiece implementando PRs?
