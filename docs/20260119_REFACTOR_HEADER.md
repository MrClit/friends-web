# Refactorización Header: Mejora de la Barra de Navegación

## Tabla de Contenidos

1. [Motivación y Objetivos](#motivación-y-objetivos)
2. [Resumen del Sistema y Requisitos](#resumen-del-sistema-y-requisitos)
3. [Diseño de la Solución](#diseño-de-la-solución)
   3.1. [Flujo Detallado y Pseudocódigo](#flujo-detallado-y-pseudocódigo)
   3.2. [Estructura de Carpetas/Archivos y Áreas Afectadas](#estructura-de-carpetasarchivos-y-áreas-afectadas)
   3.3. [Contratos de Componentes](#contratos-de-componentes)
   3.4. [Accesibilidad, Roles y Validaciones](#accesibilidad-roles-y-validaciones)
   3.5. [Gestión de Errores y Logging](#gestión-de-errores-y-logging)
4. [Configuración Externa y Prerrequisitos](#configuración-externa-y-prerrequisitos)
5. [Plan de Implementación Paso a Paso](#plan-de-implementación-paso-a-paso)
6. [Checklist Detallado](#checklist-detallado)
7. [Testing y Validación](#testing-y-validación)
8. [Notas de Despliegue y Variables de Entorno](#notas-de-despliegue-y-variables-de-entorno)
9. [Referencias y Recursos](#referencias-y-recursos)
10. [Mejoras y Lecciones Aprendidas](#mejoras-y-lecciones-aprendidas)

---

## 1. Motivación y Objetivos

- **Motivación:** Mejorar la experiencia visual, accesibilidad y responsividad de la barra de navegación principal (Header), alineando su estructura y subcomponentes con el diseño y buenas prácticas del monorepo.
- **Objetivos:**
  - Refactorizar el componente `Header` y sus subcomponentes (`Logo`, `LanguageSelector`, `ThemeToggle`, `UserMenu`).
  - Garantizar accesibilidad, responsividad y consistencia visual.
  - Permitir futura extensibilidad (título central, variantes, etc).

## 2. Resumen del Sistema y Requisitos

- **Stack:** React 19, TypeScript, TailwindCSS v4, i18n, Zustand (tema), feature-based.
- **Requisitos:**
  - El Header debe ser funcional, accesible y responsivo.
  - No duplicar lógica de navegación ni romper integración con layouts existentes.
  - Reutilizar subcomponentes y patrones del workspace.

## 3. Diseño de la Solución

### 3.1. Flujo Detallado y Pseudocódigo

- Estructura general:
  - `Header` contiene: Logo (izquierda), LanguageSelector, ThemeToggle, UserMenu (derecha), centro opcional para título.
  - Subcomponentes desacoplados y reutilizables.
  - Accesibilidad: roles ARIA, navegación por teclado, contraste.

- Pseudocódigo:
  - `Header = <header><Logo/><LanguageSelector/><ThemeToggle/><UserMenu/></header>`

### 3.2. Estructura de Carpetas/Archivos y Áreas Afectadas

- `src/shared/components/Header/`
  - `Header.tsx` (principal)
  - `Logo.tsx`, `LanguageSelector.tsx`, `ThemeToggle.tsx`, `UserMenu.tsx`
- Ajustes menores en estilos y props si es necesario.

### 3.3. Contratos de Componentes

- **Header:**
  - Props: ninguno obligatorio, puede aceptar children o variantes.
  - Composición: Logo, LanguageSelector, ThemeToggle, UserMenu.
- **Logo:**
  - Props: showText (boolean), size (number).
- **LanguageSelector:**
  - Props: currentLanguage, onChange.
- **ThemeToggle:**
  - Props: theme, onToggle.
- **UserMenu:**
  - Props: ninguno (usa useAuth internamente).

### 3.4. Accesibilidad, Roles y Validaciones

- `role="banner"`, `aria-label` descriptivo.
- Navegación por teclado, focus visible.
- Contraste mínimo AA.
- Alt en imágenes de avatar.

### 3.5. Gestión de Errores y Logging

- Manejo de errores en subcomponentes (ej: carga de avatar).
- Logging solo en consola para debug.

## 4. Configuración Externa y Prerrequisitos

- TailwindCSS v4.
- i18n: keys para textos de Header y subcomponentes.
- Iconos: react-icons (ej: MdPerson para avatar).

## 5. Plan de Implementación Paso a Paso

1. **Auditoría y análisis**
   - Revisar el estado actual de los siguientes componentes en `src/shared/components/Header/`:
     - `Header.tsx`
     - `Logo.tsx`
     - `LanguageSelector.tsx`
     - `ThemeToggle.tsx`
     - `UserMenu.tsx`
   - Identificar dependencias y props actuales, así como posibles mejoras de accesibilidad y responsividad.

2. **Refactorizar o crear componentes atómicos**
   - `Header.tsx`:
     - Revisar estructura general, asegurar layout flexible y responsivo.
     - Permitir slot para título central (opcional).
     - Añadir/ajustar roles ARIA y aria-label.
   - `Logo.tsx`:
     - Revisar props (`showText`, `size`).
     - Asegurar accesibilidad (alt, aria-label, focus visible si es link).
   - `LanguageSelector.tsx`:
     - Revisar props (`currentLanguage`, `onChange`).
     - Asegurar navegación por teclado y roles ARIA.
   - `ThemeToggle.tsx`:
     - Revisar props (`theme`, `onToggle`).
     - Sincronizar con Zustand.
     - Asegurar accesibilidad (aria-label, focus visible).
   - `UserMenu.tsx`:
     - Revisar integración con `useAuth`.
     - Mejorar menú accesible (aria-label, roles, tabIndex).
     - Extraer `UserAvatar.tsx` si la lógica de avatar es compleja o reutilizable.
   - **(Opcional)** Crear `UserAvatar.tsx` si no existe:
     - Props: `avatarUrl`, `name`.
     - Fallback a icono MdPerson si no hay imagen.

3. **Ajustar estilos y clases Tailwind**
   - Unificar clases para responsividad y contraste.
   - Usar helpers como `cn()` para clases condicionales.

4. **Integración y validación**
   - Validar integración de `Header` en layouts y páginas principales.
   - Asegurar que no se duplique la barra de navegación.

5. **Internacionalización (i18n)**
   - Añadir o ajustar keys de i18n para textos de Header y subcomponentes:
     - `header.ariaLabel`, `header.logoAlt`, `header.language`, `header.theme`, `header.userMenu`, etc.

6. **Testing y validación visual**
   - Crear o actualizar tests unitarios para cada componente:
     - `Header.test.tsx`, `Logo.test.tsx`, `LanguageSelector.test.tsx`, `ThemeToggle.test.tsx`, `UserMenu.test.tsx`, `UserAvatar.test.tsx` (si aplica).
   - Pruebas de integración con layouts.
   - Validación de accesibilidad (axe, Lighthouse).

7. **QA y revisión cruzada**
   - Validar criterios de aceptación y checklist.
   - Revisar visualmente en mobile y desktop.

## 6. Checklist Detallado

- [ ] `Header.tsx` funcional, accesible y responsivo
- [ ] `Logo.tsx` revisado/refactorizado (props, accesibilidad)
- [ ] `LanguageSelector.tsx` revisado/refactorizado (props, accesibilidad)
- [ ] `ThemeToggle.tsx` revisado/refactorizado (props, accesibilidad, Zustand)
- [ ] `UserMenu.tsx` revisado/refactorizado (accesibilidad, integración auth)
- [ ] `UserAvatar.tsx` creado o extraído si aplica (fallback MdPerson, alt)
- [ ] Subcomponentes desacoplados y reutilizables
- [ ] Roles ARIA y navegación por teclado en todos los subcomponentes
- [ ] i18n para todos los textos y keys de ejemplo
- [ ] Pruebas visuales y de interacción (unitarias e integración)
- [ ] Validación de accesibilidad (axe, Lighthouse)
- [ ] Sin breaking changes en layouts ni navegación

## 7. Testing y Validación

- Unit tests de Header y subcomponentes
- Pruebas de integración con layouts
- Validación de accesibilidad (axe, Lighthouse)

## 8. Notas de Despliegue y Variables de Entorno

- Sin cambios en variables de entorno.
- Verificar iconos y fuentes en producción.

## 9. Referencias y Recursos

- [TailwindCSS v4 Docs](https://tailwindcss.com/docs)
- [React Icons](https://react-icons.github.io/react-icons/)
- [i18next](https://www.i18next.com/)

## 10. Mejoras y Lecciones Aprendidas

- Modularizar Header facilita rediseños futuros.
- Separar lógica de presentación y datos.
- Usar helpers de clases y patrones atómicos.

---

**Motivación de la estructura:**
Este plan sigue el estándar de documentación del monorepo para maximizar claridad, reproducibilidad y navegabilidad, tanto para humanos como para LLMs. Permite abordar el refactor del Header de forma incremental y segura.

---

**Última actualización:** 2026-01-19
