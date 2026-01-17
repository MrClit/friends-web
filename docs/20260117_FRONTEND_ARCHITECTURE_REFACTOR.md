# Implementation Plan: Frontend Architecture Refactor & Improvements

## Table of Contents

1. [Motivation and Objectives](#motivation-and-objectives)
2. [System Overview and Requirements](#system-overview-and-requirements)
3. [Solution Design](#solution-design)
   3.1. [Detailed Flow](#detailed-flow)
   3.2. [Folder/File Structure and Affected Areas](#folderfile-structure-and-affected-areas)
   3.3. [Data Models and Migrations](#data-models-and-migrations)
   3.4. [API Contracts](#api-contracts)
   3.5. [Security, Roles, and Validations](#security-roles-and-validations)
   3.6. [Error Handling and Logging](#error-handling-and-logging)
4. [External Configuration and Prerequisites](#external-configuration-and-prerequisites)
5. [Step-by-Step Implementation Plan](#step-by-step-implementation-plan)
6. [Detailed Checklist](#detailed-checklist)
7. [Testing and Validation](#testing-and-validation)
8. [Deployment Notes and Environment Variables](#deployment-notes-and-environment-variables)
9. [References and Resources](#references-and-resources)
10. [Improvements and Lessons Learned](#improvements-and-lessons-learned)

---

## 1. Motivation and Objectives

- **Motivation:**
  - Mejorar la escalabilidad, mantenibilidad y claridad de la arquitectura frontend.
  - Eliminar duplicidades, inconsistencias y carpetas obsoletas.
  - Facilitar la colaboración y la incorporación de nuevas features.
- **Objetivos:**
  - Unificar la estructura de features y shared.
  - Centralizar hooks y utilidades según su ámbito de uso.
  - Mejorar la organización de componentes y helpers.
  - Preparar el frontend para la futura integración de tipos compartidos.

## 2. System Overview and Requirements

- **Stack:** React 19, TypeScript, Vite, TanStack Query, Zustand, TailwindCSS, i18next.
- **Dominio:** Expense sharing app.
- **Requisitos:**
  - Mantener compatibilidad con la API y el sistema de rutas actual.
  - No romper la integración con TanStack Query ni Zustand.
  - Mantener la estructura de tests y setup global.

## 3. Solution Design

### 3.1. Detailed Flow

- Analizar la estructura actual y detectar duplicidades o inconsistencias.
- Reorganizar carpetas y archivos según el siguiente criterio:
  - Cada feature debe contener sus propios `components/`, `hooks/`, `types.ts`, `constants.ts`, `index.ts`.
  - Los hooks y utilidades globales deben estar en `shared/` o `hooks/common/`.
  - Los componentes UI genéricos deben estar en `shared/components/ui/`.
  - Los helpers de formato y utilidades en `shared/utils/format/`.
  - Los tests deben estar junto al código que prueban.
- Eliminar carpetas vacías o no utilizadas.
- Añadir barrel files (`index.ts`) donde falten.
- Añadir README.md breves en features y shared.

### 3.1.1 Auditoría Detallada de la Estructura (Enero 2026)

#### features/

- **auth/**: Lógica y contexto de autenticación. Bien encapsulado, pero hooks (`useAuth`, `useAuthContext`) podrían ir en subcarpeta `hooks/` para consistencia.
- **events/**: Estructura correcta (`components/`, `hooks/`, `types.ts`). Los hooks de dominio están bien ubicados. Componentes bien divididos.
- **transactions/**: Estructura correcta. `components/`, `constants.ts`, `types.ts`, `utils/`. El helper `isPotExpense.ts` está bien en `utils/`.
- **kpi/**: Estructura correcta. `components/`, `constants.ts`, `types.ts`, `utils.ts`. No hay subcarpeta `utils/` (solo un archivo suelto).

#### shared/

- **components/**: Muchos componentes reutilizables (AppHeader, ConfirmDialog, etc.).
  - No hay subcarpetas por tipo (`ui/`, `layout/`, etc.), lo que puede dificultar la escalabilidad.
  - Algunos componentes UI genéricos (Dialog, DropdownMenu) están en `components/ui/` fuera de `shared/`.
- **constants/**: Solo `pot.ts`. Correcto.
- **demo/**: Solo `demoData.ts`. Correcto.
- **store/**: Zustand stores (`useDeletingStore`, `useThemeStore`). Correcto.
- **utils/**: Helpers de formato (`formatAmount`, `formatDateLong`), limpieza de localStorage. No hay subcarpeta `format/`.

#### hooks/

- **api/**: Hooks de React Query para cada recurso. Correcto.
- **common/**: Hooks de UI genéricos (`useModalState`, `useConfirmDialog`, `useInfiniteScroll`). Correcto.
- **domain/**: Solo `useEventDetail`. Correcto, pero si crecen, considerar moverlos a cada feature.

#### components/ui/

- Contiene wrappers de Radix UI (`dialog.tsx`, `dropdown-menu.tsx`).
- Deberían estar en `shared/components/ui/` para unificar todos los componentes UI genéricos.

#### api/

- `events.api.ts`, `transactions.api.ts`, `client.ts`, `types.ts`. Correcto y modular.

#### test/

- Solo `setup.ts`. Los tests están co-localizados junto al código fuente, lo cual es correcto.

#### Duplicidades/Inconsistencias Detectadas

- Componentes UI genéricos están tanto en `components/ui/` como en `shared/components/`.
- Falta de subcarpetas por tipo en `shared/components/`.
- Algunos hooks de features (`auth/`) no están en subcarpeta `hooks/`.
- Helpers de formato no están en `shared/utils/format/`.
- `kpi/utils.ts` debería estar en `kpi/utils/` para consistencia.

#### Carpetas Vacías o Redundantes

- No se detectan carpetas vacías, pero sí dispersión de helpers y UI wrappers.

---

> Siguiente paso: reorganizar hooks de dominio y unificar componentes UI genéricos.

### 3.2. Folder/File Structure and Affected Areas

**Propuesta de estructura:**

```
src/
  features/
    events/
      components/
      hooks/
      types.ts
      constants.ts
      index.ts
    transactions/
    ...
  shared/
    components/
      ui/
      layout/
      feedback/
    utils/
      format/
    store/
    constants/
    ...
  hooks/
    common/
      useModalState.ts
      ...
  api/
    events.api.ts
    ...
  pages/
    Home.tsx
    ...
  i18n/
  config/
  lib/
  test/
```

**Áreas afectadas:**

- `features/`, `shared/`, `hooks/`, `components/ui/`, `api/`, `test/`.

### 3.3. Data Models and Migrations

- No se requieren migraciones de datos, pero sí mover tipos a `@friends/shared-types` cuando esté listo.

### 3.4. API Contracts

- No se modifican endpoints ni contratos API.

### 3.5. Security, Roles, and Validations

- Sin cambios en seguridad o validaciones.

### 3.6. Error Handling and Logging

- Sin cambios funcionales, pero se recomienda documentar patrones de manejo de errores en los README de features y shared.

## 4. External Configuration and Prerequisites

- No se requieren cambios en configuración externa.
- Mantener `.env` y configuración de Vite/Tailwind.

## 5. Step-by-Step Implementation Plan

1. **Auditar la estructura actual y listar duplicidades/inconsistencias.**
2. **Reorganizar carpetas y archivos:**
   - Mover hooks de dominio a su feature correspondiente.
   - Unificar componentes UI genéricos en `shared/components/ui/`.
   - Mover helpers de formato a `shared/utils/format/`.
   - Eliminar carpetas vacías o no usadas.
3. **Añadir barrel files (`index.ts`) donde falten.**
4. **Actualizar imports en todo el código para reflejar la nueva estructura.**
5. **Añadir README.md en features y shared.**
6. **Verificar que los tests siguen funcionando y están bien ubicados.**
7. **Preparar la migración de tipos a `@friends/shared-types` (cuando esté listo).**

## 6. Detailed Checklist

- [x] Auditar estructura y listar problemas
- [x] Reubicar hooks de dominio
- [x] Unificar componentes UI genéricos
- [x] Mover helpers de formato
- [x] Eliminar carpetas vacías/no usadas
- [x] Añadir barrel files
- [x] Actualizar imports
- [x] Añadir README.md
- [x] Verificar tests
- [ ] Planificar migración de tipos

## 7. Testing and Validation

- Ejecutar todos los tests (`pnpm test`)
- Validar que la app funciona en desarrollo y build
- Revisar imports rotos y warnings de TypeScript
- Validar que los componentes y hooks se importan correctamente

## 8. Deployment Notes and Environment Variables

- No se requieren cambios en despliegue ni variables de entorno.
- Mantener configuración actual de Vite y Tailwind.

## 9. References and Resources

- [Feature Sliced Design](https://feature-sliced.design/)
- [React Folder Structure Best Practices](https://react.dev/learn/project-structure)
- [TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)

## 10. Improvements and Lessons Learned

- Esta estructura facilita la escalabilidad y el onboarding.
- Permite localizar rápidamente lógica, componentes y tipos por dominio.
- La separación clara entre features y shared reduce el acoplamiento.
- La documentación y los barrel files mejoran la DX y la mantenibilidad.

---

**Motivación de la estructura:**

Esta estructura sigue patrones modernos de arquitectura frontend (inspirados en Feature Sliced Design y la experiencia de grandes proyectos React). Permite escalar el código, facilita la colaboración y reduce la deuda técnica. La claridad en la separación de dominios y la centralización de utilidades/shared son clave para mantener la calidad a largo plazo.
