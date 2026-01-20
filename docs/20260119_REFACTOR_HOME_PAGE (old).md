# Refactorización Home Page: Rediseño UI según home.html

## Tabla de Contenidos

1. [Motivación y Objetivos](#motivación-y-objetivos)
2. [Resumen del Sistema y Requisitos](#resumen-del-sistema-y-requisitos)
3. [Diseño de la Solución](#diseño-de-la-solución)
   3.1. [Flujo Detallado y Pseudocódigo](#flujo-detallado-y-pseudocódigo)
   3.2. [Estructura de Carpetas/Archivos y Áreas Afectadas](#estructura-de-carpetasarchivos-y-áreas-afectadas)
   3.3. [Modelos de Datos](#modelos-de-datos)
   3.4. [Contratos de Componentes](#contratos-de-componentes)
   3.5. [Accesibilidad, Roles y Validaciones](#accesibilidad-roles-y-validaciones)
   3.6. [Gestión de Errores y Logging](#gestión-de-errores-y-logging)
4. [Configuración Externa y Prerrequisitos](#configuración-externa-y-prerrequisitos)
5. [Plan de Implementación Paso a Paso](#plan-de-implementación-paso-a-paso)
6. [Checklist Detallado](#checklist-detallado)
7. [Testing y Validación](#testing-y-validación)
8. [Notas de Despliegue y Variables de Entorno](#notas-de-despliegue-y-variables-de-entorno)
9. [Referencias y Recursos](#referencias-y-recursos)
10. [Mejoras y Lecciones Aprendidas](#mejoras-y-lecciones-aprendidas)

---

## 1. Motivación y Objetivos

- **Motivación:** Mejorar la experiencia visual y de usuario de la página principal de eventos, alineando la UI con el diseño de referencia (home.html).
- **Objetivos:**
  - Replicar la estructura visual, jerarquía y estilos del diseño HTML en el componente React.
  - Mantener patrones de arquitectura y buenas prácticas del monorepo (feature-based, atomic components, hooks, i18n, Tailwind, etc).
  - Garantizar responsividad, accesibilidad y consistencia con el resto de la app.

## 2. Resumen del Sistema y Requisitos

- **Stack:** React 19, TypeScript, TailwindCSS v4, TanStack Query, i18n, Zustand (tema), feature-based.
- **Requisitos:**
  - El rediseño debe ser funcional, responsivo y accesible.
  - No romper integración con API ni hooks existentes.
  - Reutilizar componentes existentes cuando sea posible.
  - Seguir la estructura de carpetas y patrones del workspace.

## 3. Diseño de la Solución

### 3.1. Flujo Detallado y Pseudocódigo

- Estructura general:
  - **Header:** Logo, nombre app, selector idioma, toggle tema, avatar usuario. (No duplicar NavBar, solo Header)
  - **HeaderSection:** Componente nuevo en Home.tsx, props: title (t('home.title')), subtitle (t('home.subtitle')), onNewEvent (abre EventFormModal)
  - **Listado de eventos:** Grid responsivo, cards con info, estado, participantes, última modificación. Iconos: MdFlightTakeoff, MdRestaurant, MdHandshake, MdDirectionsCar, MdEvent
  - **Card "Crear nuevo evento":** Card especial al final del grid, icono MdAddCircle
  - **FAB móvil:** Botón flotante visible solo en mobile (lg:hidden), icono MdAdd
- Pseudocódigo:
  - `HomePage = <Layout><Header/><HeaderSection/><EventsGrid/><FAB/></Layout>`
  - `EventsGrid = events.map(e => <EventCard ... />) + <CreateEventCard />`

### 3.2. Estructura de Carpetas/Archivos y Áreas Afectadas

**Componentes usados:**

- `Header` (barra de navegación superior, ubicada fuera de Home.tsx):
  - Props: ninguno (usa subcomponentes internos).
  - Composición: Logo, LanguageSelector, ThemeToggle, UserMenu.
  - Accesibilidad: role="banner", aria-label.
  - Layout responsivo con Tailwind.
  - El centro está vacío (puede usarse para título de página si se desea).

- `Logo`: Props: showText (boolean, por defecto false), size (number, por defecto 40). Renderiza el icono € y opcionalmente el texto "FRI€NDS". Accesible, enlaza a la home.
- `ThemeToggle`: Wrapper de DarkModeToggle. Gestiona el cambio de tema.
- `LanguageSelector`: Wrapper de LanguageMenu. Gestiona el cambio de idioma.
- `UserMenu`: Props: ninguno (usa useAuth internamente). Muestra avatar (img o inicial), nombre/email, menú con opciones (logout, email). Accesibilidad: aria-label, focus visible. Fallback de avatar: inicial del nombre/email si no hay imagen.

**Puntos de refactorización:**
- Todos los subcomponentes ya están desacoplados y listos para ser usados/reajustados.
- El UserAvatar como componente independiente no existe, pero la lógica está en UserMenu (puede extraerse si se requiere).
- LanguageSelector y ThemeToggle pueden recibir props si se quiere personalizar el comportamiento.
- El centro del Header está libre para añadir título si el diseño lo requiere.

- `HeaderSection`: Componente nuevo en Home.tsx, props: title, subtitle, onNewEvent. Textos con i18n.
- `ProtectedLayout`: Mantener, puede ajustarse para integración fluida con Header.
- `EventsList`: Refactorizar para renderizar grid de EventCard y CreateEventCard. Recibe eventos por props, obtiene datos vía hook externo.
- `FloatingActionButton`: Visible solo en móvil (lg:hidden), icono MdAdd, onClick abre EventFormModal.
- `EventFormModal`: Mantener, integra triggers desde HeaderSection y CreateEventCard.

**Recomendaciones:**

- **Reutilizar:**
  - `Header` (ajustar solo si el diseño lo requiere)
  - `ProtectedLayout` (ajustar solo si el diseño lo requiere)
  - `EventFormModal` (ajustar integración)
  - `FloatingActionButton` (ajustar visibilidad y estilos)
- **Refactorizar:**
  - `EventsList` → grid de `EventCard` y añadir `CreateEventCard` al final.
- **Crear nuevos:**
  - `EventCard` (card individual de evento)
  - `CreateEventCard` (card especial para crear evento)
  - `HeaderSection`, `LanguageSelector`, `ThemeToggle`, `UserAvatar` (si no existen)

**Iconos:**

- Usar `react-icons` (ya instalado) para todos los iconos en cards, botones y nav. Ejemplos: MdFlightTakeoff, MdRestaurant, MdHandshake, MdDirectionsCar, MdAddCircle, MdAdd, MdPerson, MdEvent.

**Actualización de estructura:**

- Mantener componentes existentes cuando aporten valor y refactorizar su presentación/lógica según el nuevo diseño.

### 3.3. Modelos de Datos

- Las cards deben recibir:
  - title, description, status, participants (array de {avatarUrl, name}), lastModified (fecha), icon.
  - Si falta algún campo, usar valores por defecto:
    - description: 'Sin descripción'
    - participants: []
    - lastModified: null (no mostrar)
    - icon: MdEvent

### 3.4. Contratos de Componentes

**EventCard** (nuevo):

- Props: event (id, title, description, status, participants, lastModified, icon)
- Iconos: Usar react-icons según tipo de evento (ver ejemplos arriba).

**CreateEventCard** (nuevo):

- Props: onClick
- Icono: MdAddCircle

**EventsList** (refactor):

- Props: events (array)
- Renderiza grid de EventCard y CreateEventCard
- Obtención de datos vía hook externo (useEvents)

**FloatingActionButton** (reutilizar/ajustar):

- Props: onClick, icon (MdAdd), visible solo en móvil (lg:hidden)

**EventFormModal** (reutilizar):

- Props: open, onClose
- Trigger desde HeaderSection y CreateEventCard

**HeaderSection** (nuevo):

- Props: title (t('home.title')), subtitle (t('home.subtitle')), onNewEvent
- Botón destacado para crear evento (icono MdAdd)

**UserAvatar** (nuevo o reutilizar):

- Props: user (avatarUrl, name)
- Fallback: avatarUrl vacío muestra icono MdPerson

**LanguageSelector** (reutilizar):

- Props: currentLanguage, onChange
- Idiomas: es, en, ca

**ThemeToggle** (nuevo):

- Props: theme, onToggle
- Sincroniza con Zustand

**Header** (ya implementado fuera de Home.tsx):

- Props: ninguno obligatorio, puede aceptar children, variantes de estilo, etc.
- Incluye logo (react-icons), selector idioma (LanguageSelector), toggle tema, menú de usuario.
- Composición: `Logo`, `LanguageSelector`, `ThemeToggle`, `UserMenu`.
- Accesibilidad: role="banner", aria-label, focus visible.
- Reutilizar y ajustar solo si el diseño lo requiere.

Todos los iconos deben implementarse con react-icons para mantener consistencia y aprovechar la dependencia instalada.

### 3.5. Accesibilidad, Roles y Validaciones

- Todos los botones con role="button" y aria-label.
- Navegación por teclado (tabIndex, focus visible).
- Contraste mínimo AA.
- Alt en imágenes de avatar.

### 3.6. Gestión de Errores y Logging

- Mantener manejo de errores en hooks de datos.
- Errores de red: mostrar mensaje de error y estado vacío con texto 'No hay eventos'.
- Logging solo en consola para debug.

## 4. Configuración Externa y Prerrequisitos

- TailwindCSS v4 y clases extendidas (ver home.html).
- Iconos react-icons (MdFlightTakeoff, MdRestaurant, MdHandshake, MdDirectionsCar, MdAddCircle, MdAdd, MdPerson, MdEvent).
- Imágenes de avatar: usar URLs reales o fallback MdPerson.
- i18n: Añadir keys para textos nuevos. Ejemplo de keys: home.title, home.subtitle, home.newEvent, event.status.active, event.status.archived, event.card.descriptionFallback

## 5. Plan de Implementación Paso a Paso

1. **Preparación y análisis**
   - Revisar dependencias de iconos y clases Tailwind.
   - Auditar componentes reutilizables existentes, incluyendo el estado actual de `Header` y sus subcomponentes.
2. **Crear/ajustar componentes atómicos**
   - Header (ajustar solo si el diseño lo requiere), HeaderSection, EventCard, CreateEventCard, UserAvatar, LanguageSelector, ThemeToggle.
3. **Refactorizar Home.tsx**
   - Reemplazar estructura por layout modular, asegurando que la barra de navegación superior (`Header`) no se duplique y se integre correctamente.
   - Integrar HeaderSection, EventsGrid, FAB.
4. **Refactorizar EventsList a grid de EventCard**
   - Mapear eventos a cards, añadir CreateEventCard al final.
5. **Ajustar estilos y responsividad**
   - Aplicar clases Tailwind y helpers cn().
   - Asegurar grid y cards responsivos.
6. **Integrar i18n y accesibilidad**
   - Añadir/ajustar keys y roles.
   - Verificar roles ARIA y accesibilidad en Header y subcomponentes.
7. **Testing y validación visual**
   - Pruebas de snapshot, visuales y de interacción.
   - Cobertura mínima: 80% en nuevos componentes. Framework: Vitest + Testing Library.
8. **QA y revisión cruzada**
   - Validar con diseño y checklist. Criterios de aceptación: todos los componentes renderizan correctamente con datos reales y de prueba, accesibilidad validada con axe y Lighthouse, textos traducidos y visibles en los tres idiomas, no hay duplicidad de nav, pruebas visuales y de interacción superadas.

## 6. Checklist Detallado

- [ ] Header (barra de navegación superior) funcional, accesible y responsivo (ajustar solo si el diseño lo requiere)
- [ ] HeaderSection con título, subtítulo y botón (i18n)
- [ ] Grid de EventCard y CreateEventCard (iconos react-icons, valores por defecto)
- [ ] FAB visible solo en móvil (lg:hidden, MdAdd)
- [ ] Accesibilidad y roles ARIA en todos los componentes, incluyendo Header
- [ ] i18n para todos los textos y keys de ejemplo
- [ ] Pruebas visuales y de interacción
- [ ] Sin breaking changes en hooks/API
- [ ] Cobertura mínima 80% en tests
- [ ] Validación de criterios de aceptación y QA

## 7. Testing y Validación

- Unit tests de nuevos componentes
- Pruebas de integración Home + EventsList
- Pruebas visuales (manuales y/o con Storybook)
- Validación de responsividad (mobile/desktop)
- Validación de accesibilidad (axe, Lighthouse)

## 8. Notas de Despliegue y Variables de Entorno

- No se prevén cambios en variables de entorno.
- Verificar que los iconos y fuentes estén disponibles en producción.

## 9. Referencias y Recursos

- [home.html](../designs/home.html)
- [TailwindCSS v4 Docs](https://tailwindcss.com/docs)
- [React Icons](https://react-icons.github.io/react-icons/)
- [Material Symbols](https://fonts.google.com/icons)
- [i18next](https://www.i18next.com/)

## 10. Mejoras y Lecciones Aprendidas

- Modularizar UI facilita futuros rediseños.
- Separar lógica de presentación y datos.
- Usar helpers de clases y patrones de diseño atómico.

---

**Motivación de la estructura:**
Este plan sigue el estándar de documentación del monorepo para maximizar claridad, reproducibilidad y navegabilidad, tanto para humanos como para LLMs. Cada sección permite implementar el rediseño de forma incremental, segura y alineada con las mejores prácticas del workspace.

---

**Última actualización:** 2026-01-19
