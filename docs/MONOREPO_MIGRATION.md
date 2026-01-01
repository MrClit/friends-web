# Migración a Monorepo con pnpm

## 📋 Resumen

Este documento describe la migración del proyecto **Friends Web** de una aplicación standalone a una arquitectura de monorepo usando **pnpm workspaces**. El objetivo es facilitar el desarrollo del backend en NestJS manteniendo el frontend React existente y compartiendo tipos TypeScript entre ambos.

---

## ✅ Trabajo Completado

### 1. Migración de npm a pnpm (Commits: `7fd16fe`, `bb491ab`)

#### Cambios realizados:
- ✅ Instalación global de pnpm v10.27.0
- ✅ Eliminación de `package-lock.json` y `node_modules`
- ✅ Configuración de `packageManager: "pnpm@10.27.0"` en package.json
- ✅ Generación de `pnpm-lock.yaml` (3,950 líneas vs 6,333 de npm)
- ✅ Actualización de [README.md](../README.md) con instrucciones de pnpm
- ✅ Actualización de [.github/copilot-instructions.md](../.github/copilot-instructions.md)

#### Verificaciones:
- ✅ Tests: 58/58 pasados
- ✅ Build: Exitoso
- ✅ Lint: Sin errores
- ✅ Dev server: Funcional

**Ventajas obtenidas:**
- 🚀 Instalaciones más rápidas
- 💾 Menor uso de espacio en disco
- 🔒 Mejor gestión de dependencias
- 📦 Soporte nativo para workspaces

---

### 2. Reestructuración como Monorepo (Commit: `2a6ad70`)

#### Estructura creada:
```
friends-web/
├── apps/
│   └── frontend/           # Aplicación React existente
│       ├── src/
│       ├── public/
│       ├── index.html
│       ├── package.json    # @friends/frontend
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── ...
├── packages/               # Paquetes compartidos (vacío por ahora)
├── docs/                   # Documentación del proyecto
├── .github/
│   └── workflows/
│       └── deploy.yml      # Actualizado para monorepo
├── package.json            # Root (friends-monorepo)
├── pnpm-workspace.yaml     # Configuración de workspaces
└── pnpm-lock.yaml
```

#### Cambios en archivos clave:

**`pnpm-workspace.yaml`** (nuevo):
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**`package.json` root**:
```json
{
  "name": "friends-monorepo",
  "scripts": {
    "dev": "pnpm --filter @friends/frontend dev",
    "build": "pnpm --filter @friends/frontend build",
    "lint": "pnpm --filter @friends/frontend lint",
    "test": "pnpm --filter @friends/frontend test"
  }
}
```

**`apps/frontend/package.json`**:
```json
{
  "name": "@friends/frontend",
  "private": true,
  "version": "0.0.0"
}
```

#### Archivos movidos:
- ✅ 75 archivos migrados de raíz a `apps/frontend/`
- ✅ Todo el código fuente (`src/`)
- ✅ Archivos públicos (`public/`)
- ✅ Configuraciones (vite, tsconfig, eslint, tailwind)
- ✅ Tests existentes funcionando

---

### 3. Actualización del Workflow de Deploy

#### Cambios en `.github/workflows/deploy.yml`:

**Antes (npm):**
```yaml
- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'

- name: Install dependencies
  run: npm ci

- name: Build project
  run: npm run build

- name: Upload artifact
  with:
    path: ./dist
```

**Después (pnpm + monorepo):**
```yaml
- name: Install pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 10.27.0

- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'

- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Build project
  run: pnpm build

- name: Upload artifact
  with:
    path: ./apps/frontend/dist
```

#### Mejoras:
- ✅ Usa pnpm action para instalación
- ✅ Cache de dependencias de pnpm
- ✅ `--frozen-lockfile` para builds determinísticos
- ✅ Path correcto del build (`apps/frontend/dist`)

---

## 🚧 Trabajo Pendiente

### Fase 1: Backend con NestJS

#### 1.1 Crear aplicación NestJS
```bash
cd apps/
npx @nestjs/cli new backend
# Seleccionar pnpm como package manager
```

#### 1.2 Configurar `apps/backend/package.json`
```json
{
  "name": "@friends/backend",
  "private": true,
  "version": "0.0.0"
}
```

#### 1.3 Scripts del monorepo para backend
Añadir en `package.json` root:
```json
{
  "scripts": {
    "dev:backend": "pnpm --filter @friends/backend start:dev",
    "build:backend": "pnpm --filter @friends/backend build",
    "dev:all": "concurrently \"pnpm dev\" \"pnpm dev:backend\""
  }
}
```

#### 1.4 Estructura esperada:
```
apps/backend/
├── src/
│   ├── modules/
│   │   ├── events/
│   │   ├── transactions/
│   │   └── participants/
│   ├── main.ts
│   └── app.module.ts
├── test/
├── package.json
└── tsconfig.json
```

---

### Fase 2: Paquete de Tipos Compartidos

#### 2.1 Crear `packages/shared-types/`
```bash
mkdir -p packages/shared-types/src
```

#### 2.2 Estructura de tipos compartidos:
```
packages/shared-types/
├── src/
│   ├── event.types.ts      # Event, EventParticipant
│   ├── transaction.types.ts # Transaction, PaymentType
│   ├── kpi.types.ts        # KPIType, KPIConfig
│   └── index.ts            # Barrel export
├── package.json
└── tsconfig.json
```

#### 2.3 `packages/shared-types/package.json`:
```json
{
  "name": "@friends/shared-types",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "private": true
}
```

#### 2.4 Migrar tipos existentes:
Mover desde `apps/frontend/src/features/*/types.ts` a shared-types:
- `Event`, `EventParticipant` de `events/types.ts`
- `Transaction`, `PaymentType` de `transactions/types.ts`
- `KPIType`, `KPIConfig`, `KPIParticipantItem` de `kpi/types.ts`

#### 2.5 Actualizar dependencias:
```json
// apps/frontend/package.json
{
  "dependencies": {
    "@friends/shared-types": "workspace:*"
  }
}

// apps/backend/package.json
{
  "dependencies": {
    "@friends/shared-types": "workspace:*"
  }
}
```

#### 2.6 Actualizar imports en frontend:
```typescript
// Antes
import { Event, EventParticipant } from '@/features/events/types'

// Después
import { Event, EventParticipant } from '@friends/shared-types'
```

---

### Fase 3: Paquete de Utilidades Compartidas (Opcional)

#### 3.1 Crear `packages/shared-utils/`
Para funciones que usen tanto frontend como backend:
- `formatAmount()` - Si el backend necesita formatear monedas
- `formatDateLong()` - Si el backend necesita fechas formateadas
- Validaciones de negocio compartidas

#### 3.2 Estructura:
```
packages/shared-utils/
├── src/
│   ├── currency.ts
│   ├── date.ts
│   ├── validators.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

### Fase 4: Integración Frontend-Backend

#### 4.1 Configurar CORS en backend
```typescript
// apps/backend/src/main.ts
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
});
```

#### 4.2 Configurar proxy en Vite (desarrollo)
```typescript
// apps/frontend/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

#### 4.3 Crear cliente API en frontend
```typescript
// apps/frontend/src/shared/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  events: {
    getAll: () => fetch(`${API_BASE_URL}/events`),
    create: (data: CreateEventDto) => fetch(...),
    // ...
  },
  transactions: {
    // ...
  },
};
```

#### 4.4 Migrar de Zustand + localStorage a API
- Reemplazar stores locales por llamadas a API
- Mantener Zustand para estado UI y cache optimista
- Implementar sincronización con backend

---

### Fase 5: Testing y CI/CD

#### 5.1 Tests del backend
```bash
pnpm --filter @friends/backend test
pnpm --filter @friends/backend test:e2e
```

#### 5.2 Actualizar GitHub Actions
Añadir job para backend en `.github/workflows/`:
```yaml
test-backend:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 10.27.0
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: pnpm --filter @friends/backend test
```

#### 5.3 Scripts de testing global
```json
{
  "scripts": {
    "test:all": "pnpm -r test:run",
    "test:frontend": "pnpm --filter @friends/frontend test:run",
    "test:backend": "pnpm --filter @friends/backend test"
  }
}
```

---

## 🔧 Comandos Útiles

### Desarrollo
```bash
# Frontend solo
pnpm dev

# Backend solo (cuando esté creado)
pnpm dev:backend

# Ambos simultáneamente
pnpm dev:all

# Instalar dependencia en frontend
pnpm --filter @friends/frontend add <package>

# Instalar dependencia en backend
pnpm --filter @friends/backend add <package>

# Instalar dependencia en root (devDependencies globales)
pnpm add -D -w <package>
```

### Testing
```bash
# Tests del frontend
pnpm test

# Tests de todos los workspaces
pnpm -r test:run

# Coverage del frontend
pnpm test:coverage
```

### Build
```bash
# Build del frontend
pnpm build

# Build de todo el monorepo
pnpm -r build
```

### Limpieza
```bash
# Limpiar node_modules de todos los workspaces
pnpm -r exec rm -rf node_modules

# Reinstalar todo
pnpm install
```

---

## 📚 Documentación de Referencia

### pnpm Workspaces
- [pnpm Workspace](https://pnpm.io/workspaces)
- [Filtering packages](https://pnpm.io/filtering)

### NestJS
- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS CLI](https://docs.nestjs.com/cli/overview)

### Monorepo Patterns
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Turborepo (alternativa avanzada)](https://turbo.build/)

---

## 🎯 Decisiones de Arquitectura

### ¿Por qué Monorepo?

**Ventajas:**
- ✅ Compartir tipos TypeScript sin duplicación
- ✅ Refactorings atómicos (cambio en un lugar, se refleja en todo)
- ✅ Un solo repositorio, un solo versionado
- ✅ Simplifica desarrollo local (un `git clone`)
- ✅ CI/CD unificado

**Consideraciones:**
- Proyecto acoplado (frontend y backend son parte de la misma aplicación)
- Equipo pequeño/individual
- Deployment puede ser conjunto o separado según necesidad

### ¿Por qué pnpm?

**Ventajas sobre npm:**
- ⚡ ~2x más rápido en instalaciones
- 💾 Ahorra espacio en disco (hard links)
- 🔒 Mejor aislamiento de dependencias (phantom dependencies)
- 📦 Workspaces nativos y eficientes
- 🎯 Comando `--filter` potente para monorepos

---

## ⚠️ Notas Importantes

### 1. **Mantener compatibilidad con GitHub Pages**
- El frontend seguirá desplegándose en GitHub Pages
- Base path configurada: `/friends-web/`
- HashRouter mantenido para compatibilidad

### 2. **Backend separado**
- Backend se desplegará independientemente (Railway, Render, Vercel, etc.)
- Frontend hará llamadas a API externa en producción
- Variables de entorno para API URL

### 3. **Migración gradual**
- No es necesario migrar todo el estado a API de golpe
- Puede coexistir localStorage + API durante la transición
- Priorizar features críticas primero

### 4. **Path aliases en el monorepo**
- `@` sigue funcionando en frontend (alias a `apps/frontend/src`)
- Backend tendrá sus propios aliases si es necesario
- `@friends/*` para imports entre workspaces

---

## 📝 Checklist de Implementación

### Inmediato (Ya completado ✅)
- [x] Migrar de npm a pnpm
- [x] Crear estructura de monorepo
- [x] Mover frontend a `apps/frontend/`
- [x] Configurar pnpm workspaces
- [x] Actualizar CI/CD workflow
- [x] Actualizar documentación

### Próximos pasos (Pendiente 🚧)
- [ ] Crear `apps/backend/` con NestJS
- [ ] Crear `packages/shared-types/`
- [ ] Migrar tipos comunes a shared-types
- [ ] Configurar imports de shared-types en ambos apps
- [ ] Implementar primeros endpoints en backend
- [ ] Configurar proxy de desarrollo
- [ ] Implementar cliente API en frontend
- [ ] Migrar primer feature de localStorage a API
- [ ] Añadir tests E2E integrados
- [ ] Documentar API con Swagger/OpenAPI

### Futuro (Opcional ⭐)
- [ ] Crear `packages/shared-utils/`
- [ ] Implementar autenticación (JWT)
- [ ] Añadir base de datos (PostgreSQL/MongoDB)
- [ ] Implementar WebSockets para tiempo real
- [ ] Configurar Turborepo para builds más rápidos
- [ ] Añadir Docker Compose para desarrollo
- [ ] Implementar monitoreo (Sentry, LogRocket)

---

## 🔗 Enlaces Útiles

- [Repositorio](https://github.com/MrClit/friends-web)
- [Demo en vivo](https://mrclit.github.io/friends-web/)
- [Copilot Instructions](../.github/copilot-instructions.md)
- [README](../README.md)

---

**Última actualización**: 1 de enero de 2026
**Estado**: Monorepo configurado, listo para backend
