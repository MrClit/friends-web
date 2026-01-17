# Implementation Plan: Header Redesign with User Identity, Language, and Theme Controls

## Table of Contents

1. [Motivation and Objectives](#motivation-and-objectives)
2. [System Overview and Requirements](#system-overview-and-requirements)
3. [Solution Design](#solution-design)
   3.1. [User Flow and UI Layout](#user-flow-and-ui-layout)
   3.2. [Folder/File Structure and Affected Areas](#folderfile-structure-and-affected-areas)
   3.3. [Component Structure](#component-structure)
   3.4. [State Management](#state-management)
   3.5. [Accessibility and Responsiveness](#accessibility-and-responsiveness)
4. [External Configuration and Prerequisites](#external-configuration-and-prerequisites)
5. [Step-by-Step Implementation Plan](#step-by-step-implementation-plan)
6. [Detailed Checklist](#detailed-checklist)
7. [Testing and Validation](#testing-and-validation)
8. [Deployment Notes and Environment Variables](#deployment-notes-and-environment-variables)
9. [References and Resources](#references-and-resources)
10. [Improvements and Lessons Learned](#improvements-and-lessons-learned)

---

## 1. Motivation and Objectives

- Mejorar la experiencia de usuario mostrando claramente el estado de sesión y acceso a opciones personales.
- Unificar y optimizar la ubicación de controles globales (idioma, tema, usuario).
- Facilitar futuras extensiones (perfil, preferencias, etc.).

## 2. System Overview and Requirements

- Stack: React 19, TailwindCSS 4, Zustand (theme), i18next (idioma), TanStack Query (auth info).
- El header debe ser persistente y visible en todas las páginas tras login.
- Debe integrarse con el sistema de autenticación y el store de tema/idioma.

## 3. Solution Design

### 3.1. User Flow and UI Layout

```
[Logo] [Selector de idioma]        [Título de página]        [Modo claro/oscuro] [Avatar usuario]
```

- **Izquierda:** Logo de la app y selector de idioma.
- **Centro:** Título de la página actual (opcional).
- **Derecha:** Botón de modo claro/oscuro y avatar de usuario (con menú desplegable).

#### Menú del avatar:

- Ver perfil (futuro)
- Logout
- (Opcional: Preferencias, cambiar idioma/tema)

### 3.2. Folder/File Structure and Affected Areas

- `src/shared/components/Header/`
  - `Header.tsx` (componente principal)
  - `UserMenu.tsx` (menú desplegable del avatar)
  - `LanguageSelector.tsx` (selector de idioma)
  - `ThemeToggle.tsx` (botón claro/oscuro)
  - `Logo.tsx` (logo de la app)
- `src/shared/store/useThemeStore.ts` (ya existe)
- `src/i18n/` (ya existe)
- `src/api/auth.api.ts` (para logout y datos de usuario)
- `src/pages/` (para integrar el header en todas las páginas)

### 3.3. Component Structure and Integration of Existing Components

#### Componentes existentes a reaprovechar/rediseñar

- **AppHeader.tsx**: Actualmente implementa un header simple con Logo, DarkModeToggle y LanguageMenu usando grid. Será la base para el nuevo header persistente, pero se rediseñará para:
  - Añadir el nuevo UserMenu (avatar, menú de usuario, logout).
  - Reubicar los controles según el layout propuesto ([Logo][Idioma] ... [Tema][Avatar]).
  - Adaptar el grid/flex para responsividad y accesibilidad.

- **Logo.tsx**: Se mantiene como logo principal, pero se revisará el tamaño y espaciado para integrarse bien con el resto de controles en el header.

- **LanguageMenu.tsx**: Se reutiliza como selector de idioma, pero se integrará en la zona izquierda del header, junto al logo. Se revisará el diseño para asegurar contraste y accesibilidad.

- **DarkModeToggle.tsx**: Se reutiliza como control de tema, pero se moverá a la zona derecha, justo antes del avatar de usuario. Se revisará el icono y el feedback visual para mayor claridad.

#### Nuevos componentes a crear/adaptar

- **UserMenu.tsx**: Nuevo componente para mostrar el avatar, nombre/email y menú desplegable con opciones (logout, perfil futuro). Se integrará en la esquina superior derecha.

- **HeaderLayout**: (opcional) Wrapper para organizar el layout y responsividad del header.

#### Integración y adaptación

1. Refactorizar AppHeader para usar el layout propuesto:

- [Logo] [LanguageMenu] [PageTitle (opcional)] [DarkModeToggle] [UserMenu]
- Usar flex/grid para asegurar alineación y responsividad.

2. Reutilizar Logo, LanguageMenu y DarkModeToggle, adaptando estilos y props si es necesario.
3. Implementar UserMenu y conectarlo al contexto de autenticación.
4. Asegurar que todos los controles sean accesibles y navegables por teclado.
5. Eliminar duplicidad de controles en otras zonas de la UI.
6. Documentar en cada componente los cambios y motivos de adaptación.

### 3.4. State Management

- **Auth:**
  - Obtener datos de usuario (nombre, email, foto) desde el contexto de autenticación o TanStack Query.
  - Logout: borra token, limpia estado y redirige a login.
- **Idioma:**
  - Selector conectado a i18next, persistencia en localStorage.
- **Tema:**
  - Toggle conectado a Zustand, persistencia en localStorage.

### 3.5. Accessibility and Responsiveness

- Navegación por teclado en todos los controles.
- Contraste adecuado y focus visible.
- Responsive: header colapsa en móvil, menú del avatar adaptativo.

## 4. External Configuration and Prerequisites

- Tener implementado el sistema de autenticación y obtención de datos de usuario.
- i18next y Zustand configurados.
- TailwindCSS y helpers de utilidades (`cn`).

## 5. Step-by-Step Implementation Plan

1. Crear carpeta `src/shared/components/Header/` y mover/crear los componentes base (Header, Logo, LanguageSelector, ThemeToggle, UserMenu).
2. Implementar el nuevo componente `UserMenu`:

- Mostrar avatar, nombre/email.
- Menú desplegable con opción de logout (y perfil futuro).
- Conectar al contexto de autenticación y lógica de logout (borrar token, limpiar estado, redirigir).

3. Refactorizar `AppHeader` para adoptar el layout propuesto:

- [Logo] [LanguageMenu] [PageTitle (opcional)] [DarkModeToggle] [UserMenu]
- Usar flex/grid para alineación y responsividad.

4. Integrar y adaptar los controles existentes:

- Reutilizar y adaptar `Logo`, `LanguageMenu` y `DarkModeToggle` según el nuevo diseño y ubicación.
- Eliminar duplicidad de controles en otras zonas de la UI.

5. Añadir feedback visual (snackbar/toast) tras logout y otras acciones relevantes.
6. Asegurar accesibilidad (teclado, focus, contraste) y responsividad en todos los controles.
7. Refactorizar páginas para usar el nuevo header globalmente.

## 6. Detailed Checklist

- [x] Carpeta y componentes creados en `src/shared/components/Header/`
- [x] Layout del header implementado con Tailwind
- [x] Selector de idioma funcional y accesible
- [x] Toggle de tema funcional y accesible
- [x] Avatar de usuario visible tras login
- [x] Menú desplegable con logout
- [x] Logout borra token y redirige
- [x] Feedback visual tras logout
- [x] Accesibilidad (teclado, focus, contraste)
- [x] Responsive en móvil y desktop
- [x] Refactor de páginas para usar el header

## 7. Testing and Validation

- Test unitarios de componentes (Vitest + Testing Library)
- Test de integración: flujo de login/logout, cambio de idioma/tema
- Validar accesibilidad (tab, screen reader)
- Validar responsividad en diferentes dispositivos

## 8. Deployment Notes and Environment Variables

- No se requieren nuevas variables de entorno.
- Asegurar que las rutas de login/logout estén correctamente configuradas.

## 9. References and Resources

- [React 19 Docs](https://react.dev/)
- [TailwindCSS 4 Docs](https://tailwindcss.com/)
- [i18next Docs](https://www.i18next.com/)
- [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [TanStack Query Docs](https://tanstack.com/query/latest)

## 10. Improvements and Lessons Learned

- El diseño modular permite añadir futuras opciones (perfil, preferencias, notificaciones) fácilmente.
- Unificar controles globales en el header mejora la experiencia y reduce fricción.
- La accesibilidad y responsividad deben validarse en cada fase.

---

**Motivación de la estructura:**
Este plan sigue el estándar de documentación del proyecto para asegurar claridad, reproducibilidad y facilitar la implementación incremental por fases, tanto para humanos como para LLMs.
