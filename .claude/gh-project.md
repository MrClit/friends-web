# Coordenadas de GitHub — Fri€nds

Datos concretos de este repo para la skill `gh-workflow` y el agente `gh-ops`.
El *cómo* es genérico y vive a nivel de usuario; aquí solo está el *dónde*.

## Repo

| | |
|---|---|
| Owner / repo | `MrClit` / `friends-web` |
| Visibilidad | pública |
| Organización | no (repo personal → **no hay issue types**, las labels son la categorización canónica) |

## Ramas

| | |
|---|---|
| Integración (base de los PRs) | `develop` |
| Producción | `main` |
| Por defecto en GitHub | `main` |

> `develop` **no** es la rama por defecto: `Closes #N` en un PR hacia `develop` **no** autocierra la
> issue. Hay que cerrarla explícitamente y moverla a **Done**.

Despliegue: push a `main` dispara `.github/workflows/deploy.yml` → build del monorepo y publicación
del frontend en **GitHub Pages**. El backend se despliega en **Render** desde `main` (build, migraciones
y start descritos en [`DEPLOYMENT.md`](../DEPLOYMENT.md)).

## Tablero

| | |
|---|---|
| Proyecto | **Fri€nds** — número `1`, node id `PVT_kwHOCaelWs4BQfhd` |
| Owner | `MrClit` |
| Campo Status | `PVTSSF_lAHOCaelWs4BQfhdzg-mGw8` |

| Estado | option-id |
|---|---|
| Todo | `f75ad846` |
| In Progress | `47fc9ee4` |
| Done | `98236657` |

> El tablero tiene **tres** estados, no los cinco del flujo genérico. Mapeo:
> `Ready` → **Todo**, `In progress` → **In Progress**, `In review` → se queda en **In Progress**
> (no hay estado de revisión), `Done` → **Done**.

## Labels

- **Tipo:** `bug`, `enhancement`, `documentation`, `duplicate`, `invalid`, `question`, `wontfix`
- **Ayuda:** `good first issue`, `help wanted`
- **Estado (legado):** `in progress`, `done` — restos de cuando el estado se marcaba con labels.
  El estado canónico es el **campo Status del tablero**; no usar estas labels en issues nuevas.

No hay labels de área. El área se expresa en el **scope del título** (`feat(backend): …`).

## Convenciones de commits y títulos

Conventional Commits en **inglés**, con scope:

```
feat(frontend): add participant autocomplete to the event form
fix(backend): return 403 instead of 500 on unauthorized event access
```

Scopes habituales del repo: `frontend`, `backend`, `shared-types`, `ci`, `docs`, `a11y`.

Los **títulos de issue** siguen el mismo formato que el commit que las resolverá
(p. ej. `fix(a11y): add skip navigation link to index.html`).

## Validaciones antes de abrir PR

```bash
pnpm lint && pnpm test && pnpm build
```

Cubre frontend, backend y `shared-types`. La CI (`deploy.yml`) solo valida el frontend, así que
**este comando es más estricto que la CI a propósito**: es lo que evita romper el backend.

Los tests del backend que necesitan PostgreSQL requieren la base levantada:
`cd apps/backend && docker-compose up -d`.

Nunca `--no-verify`.

## Release a producción

Versionado en el **`package.json` raíz** únicamente (una sola versión para todo el producto). Los
manifiestos de `apps/*` y `packages/*` son privados y se quedan en `0.0.0`.

Estado actual: **sin tags publicados** y root en `0.0.0` → el primer release es `v0.1.0`.

No existe `CHANGELOG.md`: el primer release debe crearlo.

Alternativa scriptada al paso «PR de integración a producción»: `pnpm release:prod`
(`scripts/release-to-prod.mjs`) hace el merge `develop` → `main` en local. La skill `release` prefiere
la coreografía vía PR; usar el script solo si el usuario lo pide.

### Pre-vuelo del release

- [ ] `pnpm lint && pnpm test && pnpm build` en verde en local sobre `develop`
- [ ] Los checks de infraestructura de [`DEPLOYMENT.md`](../DEPLOYMENT.md) §8 — **es la lista
      canónica, no la copies aquí**: migraciones, build del backend, env vars de Render, backup.
- [ ] *(usuario)* Lo que dependa de un panel externo (Render, Neon, consolas de OAuth) lo verifica
      **el usuario**, no el agente.

> **Excepción a la regla genérica de la skill `release`.** La skill dice que las migraciones van
> aplicadas antes del merge. Aquí **no se puede**: corren en el arranque del backend
> (`start:prod:migrate` = `migration:run:prod && node dist/main`), o sea después de que el push a
> `main` dispare el redeploy de Render. Lo que aplica aquí es **verificar** que la migración es
> correcta y reversible antes de mergear; una que falle deja la API caída.

Post-deploy: checklist de validación en `DEPLOYMENT.md` §9. Rollback: §10.

## Idioma

- **Issues, PRs, commits, comentarios y código:** inglés.
- **Documentos de `/docs`:** inglés.
- **Conversación con el usuario:** español.
