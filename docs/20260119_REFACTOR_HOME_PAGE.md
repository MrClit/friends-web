# Refactorización Home Page: Rediseño UI (sin Header)

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

- **Motivación:** Mejorar la experiencia visual y de usuario de la página principal de eventos, alineando la UI con el diseño de referencia (home.html), excluyendo el Header.
- **Objetivos:**
  - Refactorizar el componente `Home.tsx` y su estructura interna, sin modificar el Header ni sus subcomponentes.
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
  - **HeaderSection:** Componente nuevo en Home.tsx, props: title (t('home.title')), subtitle (t('home.subtitle')), onNewEvent (abre EventFormModal)
  - **Listado de eventos:** Grid responsivo, cards con info, estado, participantes, última modificación. Iconos: MdFlightTakeoff, MdRestaurant, MdHandshake, MdDirectionsCar, MdEvent
  - **Card "Crear nuevo evento":** Card especial al final del grid, icono MdAddCircle
  - **FAB móvil:** Botón flotante visible solo en mobile (lg:hidden), icono MdAdd
- Pseudocódigo:
  - `HomePage = <Layout><HeaderSection/><EventsGrid/><FAB/></Layout>`
  - `EventsGrid = events.map(e => <EventCard ... />) + <CreateEventCard />`

### 3.2. Estructura de Carpetas/Archivos y Áreas Afectadas

- `src/pages/Home.tsx` (principal)
- `src/features/events/components/EventsList.tsx` (refactor a grid)
- Nuevos componentes:
  - `HeaderSection` (en `src/pages/` o `src/shared/components/`)
  - `EventCard`, `CreateEventCard` (en `src/features/events/components/`)
- Reutilizar:
  - `FloatingActionButton`, `EventFormModal`, hooks de eventos

### 3.3. Modelos de Datos

- Las cards deben recibir:
  - title, description, status, participants (array de {avatarUrl, name}), lastModified (fecha), icon.
  - Si falta algún campo, usar valores por defecto:
    - description: 'Sin descripción'
    - participants: []
    - lastModified: null (no mostrar)
    - icon: MdEvent

### 3.4. Contratos de Componentes

- **EventCard** (nuevo):
  - Props: event (id, title, description, status, participants, lastModified, icon)
- **CreateEventCard** (nuevo):
  - Props: onClick
- **EventsList** (refactor):
  - Props: events (array)
  - Renderiza grid de EventCard y CreateEventCard
- **FloatingActionButton** (reutilizar/ajustar):
  - Props: onClick, icon (MdAdd), visible solo en móvil (lg:hidden)
- **EventFormModal** (reutilizar):
  - Props: open, onClose
  - Trigger desde HeaderSection y CreateEventCard
- **HeaderSection** (nuevo):
  - Props: title (t('home.title')), subtitle (t('home.subtitle')), onNewEvent

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

1. Auditar dependencias y componentes reutilizables.
2. Crear/ajustar componentes atómicos: HeaderSection, EventCard, CreateEventCard.
3. Refactorizar Home.tsx: layout modular, integración de HeaderSection, EventsGrid, FAB.
4. Refactorizar EventsList a grid de EventCard y CreateEventCard.
5. Ajustar estilos y responsividad.
6. Integrar i18n y accesibilidad.
7. Testing y validación visual.
8. QA y revisión cruzada.

## 6. Checklist Detallado

- [ ] HeaderSection con título, subtítulo y botón (i18n)
- [ ] Grid de EventCard y CreateEventCard (iconos react-icons, valores por defecto)
- [ ] FAB visible solo en móvil (lg:hidden, MdAdd)
- [ ] Accesibilidad y roles ARIA en todos los componentes
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
Este plan sigue el estándar de documentación del monorepo para maximizar claridad, reproducibilidad y navegabilidad, tanto para humanos como para LLMs. Permite abordar el refactor de la Home Page de forma incremental y segura, sin afectar la barra de navegación.

---

**Última actualización:** 2026-01-19
