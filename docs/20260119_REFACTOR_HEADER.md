# Refactorización Header: Adaptación al diseño home.html (Instrucciones Claras y Ejecutables)

## Tabla de Contenidos

1. [Motivación y Objetivos](#1-motivación-y-objetivos)
2. [Resumen del Sistema y Requisitos](#2-resumen-del-sistema-y-requisitos)
3. [Diseño de la Solución](#3-diseño-de-la-solución)
   3.1. [Mapeo Visual: Diseño → Componentes React](#31-mapeo-visual-diseño--componentes-react)
   3.2. [Ejemplo de estructura JSX esperada](#32-ejemplo-de-estructura-jsx-esperada)
   3.3. [Detalle de clases y microinteracciones](#33-detalle-de-clases-y-microinteracciones)
   3.4. [Archivos a modificar y criterios de aceptación](#34-archivos-a-modificar-y-criterios-de-aceptación)
   3.5. [Accesibilidad y validaciones](#35-accesibilidad-y-validaciones)
4. [Configuración Externa y Prerrequisitos](#4-configuración-externa-y-prerrequisitos)
5. [Plan de Implementación Paso a Paso](#5-plan-de-implementación-paso-a-paso-sin-ambigüedad)
6. [Checklist Actionable y Criterios de Aceptación](#6-checklist-actionable-y-criterios-de-aceptación)
7. [Tabla de Props/Contratos de Componentes](#7-tabla-de-propscontratos-de-componentes)
8. [Testing y Validación](#8-testing-y-validación)
9. [Notas de Despliegue y Variables de Entorno](#9-notas-de-despliegue-y-variables-de-entorno)
10. [Referencias y Recursos](#10-referencias-y-recursos)
11. [Mejoras y Lecciones Aprendidas](#11-mejoras-y-lecciones-aprendidas)

---

## 1. Motivación y Objetivos

**Motivación:** Adaptar la barra de navegación principal (Header) para que refleje fielmente el diseño visual y de interacción mostrado en el archivo `docs/designs/home.html`, asegurando máxima coherencia visual, accesibilidad y responsividad.
**Objetivo principal:** Que cualquier desarrollador o LLM pueda implementar el refactor sin ambigüedad, siguiendo instrucciones precisas y ejemplos claros.

**Objetivos concretos:**

1. Replicar el layout, fondo glass, iconografía, tipografía, separación y microinteracciones (hover, border, avatar, etc) del diseño de la cabecera en `home.html`.
2. Mantener la estructura modular y desacoplada de los subcomponentes.
3. Garantizar integración con i18n, Zustand y patrones de UI actuales.
4. Facilitar futuras extensiones (título central, variantes, etc).

## 2. Resumen del Sistema y Requisitos

- **Stack:** React 19, TypeScript, TailwindCSS v4, i18n, Zustand.
- **Requisitos:**
  - Header funcional, accesible y responsivo.
  - Subcomponentes desacoplados y reutilizables.
  - Integración con hooks y utilidades actuales.

## 3. Diseño de la Solución

### 3.1. Mapeo Visual: Diseño → Componentes React

| Elemento visual en home.html     | Componente React destino        | Notas de implementación                                         |
| -------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| Fondo glass-nav, sticky, border  | Header.tsx (header/nav wrapper) | Usar clases glass-nav, border-b, sticky, z-30, px-6, py-4, etc. |
| Logo icono + texto               | Logo.tsx                        | Icono (div), texto (h1), tipografía y colores según diseño      |
| Selector de idioma (icono+label) | LanguageSelector.tsx            | Botón con icono y label, clases de borde, hover, etc.           |
| Botón de tema (icono)            | ThemeToggle.tsx                 | Botón con icono, borde, hover, animación de icono               |
| Separador vertical               | Header.tsx (inline div)         | `<div className="h-8 w-[1px] ..."></div>`                       |
| Avatar, nombre, expand_more      | UserMenu.tsx                    | Botón con img, nombre, icono expand_more, clases hover, border  |

### 3.2. Ejemplo de estructura JSX esperada

```tsx
<header className="sticky top-0 z-50 px-6 py-4 glass-nav border-b border-emerald-100 dark:border-emerald-800/50">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Logo showText />
    </div>
    <div className="flex items-center gap-2 md:gap-4">
      <LanguageSelector />
      <ThemeToggle />
      <div className="h-8 w-[1px] bg-emerald-100 dark:bg-emerald-800 mx-2" />
      <UserMenu />
    </div>
  </div>
</header>
```

### 3.3. Detalle de clases y microinteracciones

- Usar clases glass-nav, border, shadow, backdrop-filter, rounded, etc. según el diseño.
- Botones: border, hover:bg-white, dark:hover:bg-emerald-900/50, transición, focus-visible:ring.
- Avatar: img con ring, fallback a inicial si no hay imagen.
- Iconos: usar react-icons o Material Symbols, tamaño y color según diseño.
- Tipografía: font-extrabold, tracking-tight, colores según modo claro/oscuro.

### 3.4. Archivos a modificar y criterios de aceptación

- `src/shared/components/Header/Header.tsx`
  - Debe envolver todo en un `<header>` sticky, fondo glass, border-b, padding y layout flex como en el diseño.
  - Debe contener el Logo a la izquierda y el bloque de acciones a la derecha.
  - Debe incluir el separador vertical entre ThemeToggle y UserMenu.
  - Criterio de aceptación: El layout y fondo deben ser indistinguibles del diseño home.html.

- `src/shared/components/Logo.tsx`
  - Debe mostrar el icono y el texto "SplitEvent" (o el nombre de la app) con la tipografía y colores del diseño.
  - El icono debe ser un div circular con fondo primario y el símbolo adecuado.
  - Criterio de aceptación: El logo debe lucir igual que en el diseño, tanto icono como texto.

- `src/shared/components/Header/LanguageSelector.tsx`
  - Botón con icono de idioma y label (ES, EN, etc), borde, hover, transición.
  - Criterio de aceptación: El selector debe verse y comportarse igual que en el diseño.

- `src/shared/components/Header/ThemeToggle.tsx`
  - Botón con icono de modo claro/oscuro, borde, hover, animación de icono.
  - Criterio de aceptación: El cambio de tema y la animación deben ser suaves y visualmente idénticas al diseño.

- `src/shared/components/Header/UserMenu.tsx`
  - Botón con avatar (img o inicial), nombre y expand_more, borde, hover, transición.
  - Fallback a inicial si no hay imagen.
  - Criterio de aceptación: El menú de usuario debe lucir y comportarse igual que en el diseño.

- `src/shared/components/Header/index.ts`
  - Barrel export, sin lógica visual.

### 3.5. Accesibilidad y validaciones

- Todos los botones deben tener aria-label y ser navegables por teclado.
- El avatar debe tener alt descriptivo.
- Contraste AA en todos los modos.

### 3.3. Contratos de Componentes

- **Header:** Sin props obligatorios. Composición y layout fija según diseño, slot central opcional.
- **Logo:** Props: `showText?: boolean`, `size?: number`. Accesible, link a `/`. Adaptar icono y tipografía.
- **LanguageSelector:** Sin props, usa i18n internamente. Icono y label como en diseño.
- **ThemeToggle:** Sin props, sincroniza con Zustand. Iconos y animación como en diseño.
- **UserMenu:** Sin props, usa `useAuth` internamente. Avatar, nombre y expand_more, con fallback a inicial.
- **Separador:** Añadir separador vertical (`div.h-8.w-[1px]`) entre ThemeToggle y UserMenu como en diseño.

### 3.4. Accesibilidad, Roles y Validaciones

- `role="banner"`, `aria-label` con i18n.
- Navegación por teclado, focus visible.
- Contraste AA.
- Alt en imágenes de avatar, fallback a inicial.
- Botones y elementos interactivos con feedback visual (hover, focus) como en el diseño.

### 3.5. Gestión de Errores y Logging

- Manejo de errores en carga de avatar (fallback a inicial).
- Logging solo para debug en consola si es necesario.

## 4. Configuración Externa y Prerrequisitos

- TailwindCSS v4.
- i18n: keys para textos de Header y subcomponentes.
- Iconos: react-icons (MdPerson, MdLanguage, etc) o Material Symbols si se decide igualar exactamente el diseño.
- Clases utilitarias y estilos glass-nav según el diseño de home.html.

## 5. Plan de Implementación Paso a Paso (sin ambigüedad)

1. **Auditoría y análisis**

- Lee y documenta los props y dependencias reales de cada subcomponente.
- Haz una tabla comparativa entre el Header actual y el diseño home.html, anotando cada diferencia visual y de interacción.

2. **Refactor atómico por archivo**

- Modifica `Header.tsx` para que el layout, fondo, border y sticky sean idénticos al diseño (ver ejemplo JSX y tabla de mapeo).
- Modifica `Logo.tsx` para que el icono y el texto sean visualmente idénticos al diseño (colores, tipografía, tamaño, espaciado).
- Modifica `LanguageSelector.tsx` para que el botón, icono y label sean iguales al diseño (borde, hover, transición, tamaño).
- Modifica `ThemeToggle.tsx` para que el botón, icono y animación sean iguales al diseño (borde, hover, transición, tamaño).
- Añade el separador vertical entre ThemeToggle y UserMenu en el layout.
- Modifica `UserMenu.tsx` para que el avatar, nombre y expand_more sean iguales al diseño (img, fallback, borde, hover, transición).
- Asegura que todos los botones tengan aria-label y sean navegables por teclado.
- Usa helpers como `cn()` para clases condicionales si es necesario.

3. **Testing y validación visual**

- Crea o actualiza tests unitarios para cada subcomponente.
- Haz pruebas visuales en mobile y desktop, comparando con home.html.
- Valida accesibilidad (axe, Lighthouse).

4. **QA y checklist**

- Marca cada punto del checklist solo si el resultado es visualmente indistinguible del diseño home.html.
- Haz revisión cruzada con otro dev o LLM si es posible.

## 6. Checklist Actionable y Criterios de Aceptación

### Checklist Actionable Paso a Paso

1. [ ] Auditar el estado actual de cada archivo (`Header.tsx`, `Logo.tsx`, `LanguageSelector.tsx`, `ThemeToggle.tsx`, `UserMenu.tsx`).
2. [ ] Comparar visualmente cada elemento con el diseño de `home.html` y anotar diferencias.
3. [ ] Modificar `Header.tsx` para fondo glass, layout sticky, border, paddings, y estructura flex exacta.
4. [ ] Modificar `Logo.tsx` para icono y texto, colores, tipografía y espaciado igual al diseño.
5. [ ] Modificar `LanguageSelector.tsx` para icono, label, borde, hover, transición y accesibilidad.
6. [ ] Modificar `ThemeToggle.tsx` para icono, animación, borde, hover y accesibilidad.
7. [ ] Añadir separador vertical entre ThemeToggle y UserMenu.
8. [ ] Modificar `UserMenu.tsx` para avatar, nombre, expand_more, borde, hover, fallback y accesibilidad.
9. [ ] Añadir/ajustar aria-labels y navegación por teclado en todos los botones.
10. [ ] Unificar clases Tailwind y helpers (`cn()`) para responsividad y consistencia.
11. [ ] Añadir/ajustar keys de i18n para textos y tooltips.
12. [ ] Crear/actualizar tests unitarios y de integración.
13. [ ] Validar visualmente en mobile y desktop, comparando con home.html.
14. [ ] Validar accesibilidad (axe, Lighthouse).
15. [ ] Revisar con otro dev o LLM y marcar checklist de criterios de aceptación.

### Criterios de aceptación por archivo

- [ ] `Header.tsx` funcional, accesible y responsivo, con fondo glass y layout idéntico a home.html
- [ ] `Logo.tsx` visualmente igual al diseño (icono, texto, colores, tipografía)
- [ ] `LanguageSelector.tsx` igual al diseño (icono, label, borde, hover, accesibilidad)
- [ ] `ThemeToggle.tsx` igual al diseño (iconos, animación, borde, hover, accesibilidad)
- [ ] Separador vertical añadido y visualmente igual al diseño
- [ ] `UserMenu.tsx` igual al diseño (avatar, nombre, expand_more, borde, hover, accesibilidad, fallback)
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
Este plan está redactado para que cualquier LLM o desarrollador pueda ejecutar el refactor sin ambigüedad, con instrucciones paso a paso, ejemplos, criterios de aceptación, mapeo visual-código, tabla de props/contratos y checklist actionable.

---

**Última actualización:** 2026-01-19
