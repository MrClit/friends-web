# Implementation Plan: Refactor `EventFormModal` to match `modal-new-event.html`

Fecha: 2026-01-25
Autor: Copilot (asistente)

## Table of Contents

1. Motivation and Objectives
2. System Overview and Requirements
3. Solution Design
   3.1 Layout mapping
   3.2 Component responsibilities
   3.3 Accessibility and behavior
4. Folder/file changes
5. Step-by-step Implementation Plan
6. Detailed Checklist
7. Testing and Validation
8. Internationalization
9. Notes for PR and Review
10. Improvements and follow-ups

## 1. Motivation and Objectives

- Motivo: Alinear el modal de creación/edición de eventos en la UI React con el diseño visual contenido en `docs/designs/modal-new-event.html`.
- Objetivos:
  - Reproducir estructura visual (cabecera, icon picker, campos, participantes, footer).
  - Mantener la lógica existente (`useEventFormModal`, `EventForm`, `ConfirmDialog`) reutilizable.
  - Cumplir accesibilidad básica (roles ARIA, focus trap en modal) y mantener testabilidad.
  - Evitar cambios rompientes en la API interna de eventos.

## 2. System Overview and Requirements

- Frontend: `apps/frontend` usando React + TypeScript + TailwindCSS v4.
- Componentes relevantes:
  - [apps/frontend/src/features/events/components/EventFormModal.tsx](apps/frontend/src/features/events/components/EventFormModal.tsx)
  - [apps/frontend/src/features/events/components/EventForm.tsx](apps/frontend/src/features/events/components/EventForm.tsx) (ya existente)
  - `ConfirmDialog` y primitives `Dialog`, `DialogBottomSheet`, `DialogTitle` en `shared/components/ui`.
  - Diseño de referencia: `docs/designs/modal-new-event.html`.

Requisitos no funcionales:

- Mantener mobile-first y comportamiento responsivo.
- No introducir dependencias nuevas sin permiso.

## 3. Solution Design

### 3.1 Layout mapping (HTML → React)

- Header (title + close button) → `DialogTitle` + button aligned right.
- Icon Picker (fila de iconos seleccionables) → pequeño `IconPicker` subcomponente dentro de `EventForm` o `EventFormModal`.
- Inputs: `title` (text), `description` (textarea), participants area (input + list). Mapear `EventForm` props to presentar estos campos con el mismo markup/estilos.
- Participants list: tarjeta por participante con avatar, nombre, acciones (delete). Reusar markup de `EventForm` o extraer `ParticipantRow`.
- Footer: acciones `Cancelar` y `Crear Evento` con estilos prominentes (botón primario grande a la derecha).

### 3.2 Component responsibilities

- `EventFormModal`:
  - Mantener control de apertura/cierre (`Dialog` wrapper).
  - Gestionar overlay interactions (evitar cierre si `ConfirmDialog` visible) — ya implementado.
  - Renderizar `DialogBottomSheet` con estructura visual alineada al diseño.
- `EventForm`:
  - Renderizar inputs y la lista de participantes; exponer callbacks (`onAddParticipant`, `onRemoveParticipant`) si no existen.
  - Contener `IconPicker` y `ParticipantRow` subcomponentes opcionales.
  - Observación: actualmente `ParticipantsList` ya implementa la entrada, add/delete y manejo de refs; por tanto evitar duplicar esa lógica.
  - Observación: no existe en el hook actual (`useEventFormModal`) un estado para la selección de `icon`. Si queremos paridad visual con el diseño, habrá que añadir `icon` al estado y al `EventForm`/`EventFormModal`.
- `ConfirmDialog`: sin cambios funcionales, sólo asegurar estilos y que no rompa escape/overlay.

### 3.3 Accessibility and behavior

- Asegurar que el botón close tenga `aria-label` y que use i18n (`t('common.close')`) en lugar de texto literal, para consistencia y traducción.
- Focus order: título → primer input → icon picker → participants input → footer buttons.
- Keyboard: Escape debe cerrar el modal excepto cuando `ConfirmDialog` está abierto (ya soportado en `EventFormModal`).

## 4. Folder/file changes

- Modificar: [apps/frontend/src/features/events/components/EventFormModal.tsx](apps/frontend/src/features/events/components/EventFormModal.tsx)
- Posible cambios mínimos en: [apps/frontend/src/features/events/components/EventForm.tsx](apps/frontend/src/features/events/components/EventForm.tsx)
- Revisar/usar: [apps/frontend/src/features/events/components/ParticipantsList.tsx](apps/frontend/src/features/events/components/ParticipantsList.tsx) (ya implementa add/delete y refs).
- Añadir/Modificar: `IconPicker.tsx` y añadir `icon` en [apps/frontend/src/features/events/hooks/useEventFormModal.ts](apps/frontend/src/features/events/hooks/useEventFormModal.ts) si se decide soportar selección de icono.
- (Este documento ya es el plan, no es necesario crear otro archivo docs).
- (Opcional) Extraer `IconPicker.tsx` y `ParticipantRow.tsx` en la carpeta `components/` solo si la lógica lo justifica y mejora la legibilidad.

## 5. Step-by-step Implementation Plan

Nota: cada paso debe implementarse en un commit independiente y con tests/preview cuando proceda.

1. Análisis del estado actual (1-2h)
   - Revisar `EventFormModal.tsx`, `EventForm.tsx`, `useEventFormModal` hook y el HTML de diseño.
   - Analizar los estilos y clases Tailwind en el HTML de referencia.
   - Resultado: mapeo de props, lista de diferencias y necesidades de refactor.
   - Observaciones clave del análisis inicial:
     - `ParticipantsList` ya implementa la gestión de participantes (add/delete, refs, validación básica), por lo que `EventForm` debería reusar ese componente.
     - No existe actualmente un estado `icon` en `useEventFormModal` ni en `EventForm` — si se quiere reproducir el `Icon Picker` del diseño, hay que añadir `icon` al hook y propagarlo al formulario.
     - El botón de cierre en `EventFormModal` usa `aria-label="Close"` como literal; recomendamos usar i18n para mantener consistencia (`t('common.close')`).
     - Los estilos actuales están en línea con las utilidades Tailwind del proyecto, pero requerirán ajustes de paddings/rounding para coincidir exactamente con el diseño `modal-new-event.html`.

2. Crear subcomponentes (30–90m)
   - `IconPicker` (opcional): recibe `icons[]`, `selected`, `onSelect`.
   - `ParticipantRow` (opcional): avatar, name, actions.

3. Refactor de `EventForm` (1–2h)
   - Adaptar el markup para incluir las clases Tailwind visuales del diseño (rounded, paddings, backgrounds).
   - Añadir `IconPicker` dentro del formulario.
   - Asegurar que `EventForm` siga exponiendo `onSubmit` y props actuales, sin romper la API pública ni la integración con hooks existentes.

4. Refactor de `EventFormModal` (1h)
   - Reestructurar encabezado, error banner, cuerpo y footer para coincidir con el diseño.
   - Alinear clases del `DialogBottomSheet` contenedor para tamaño, borde y sombras.
   - Preservar la lógica de bloqueo de cierre cuando `ConfirmDialog` está abierto.
   - Los cambios visuales no deben afectar la lógica de negocio.

5. Accesibilidad (15–30m)
   - Revisar roles ARIA, focus trap y navegación por teclado.
   - Verificar orden de tabulación y que el modal no se cierra con Escape si `ConfirmDialog` está abierto.

6. Estilos y tokens (30–60m)
   - Usar utilidades `cn()` si procede y las clases Tailwind del proyecto.
   - Evitar estilos inline; preferir clases existentes.

7. i18n (15–30m)
   - Añadir o actualizar claves: `eventFormModal.newTitle`, `eventFormModal.editTitle`, `discard*`, `cancel`, `createEvent`, labels de inputs.
   - Verificar que las nuevas claves existen en los tres idiomas y que no hay claves huérfanas.
   - Revisar que los labels de los inputs coincidan con el diseño y la i18n.

8. Tests y QA (1–2h)
   - Añadir una prueba de render para `EventFormModal` (Vitest + Testing Library) que verifica la estructura básica y botones.
   - Añadir test de accesibilidad básico (por ejemplo, con Testing Library y axe).
   - Revisiones visuales en entorno `pnpm dev`.

9. PR y revisión (30–60m)
   - Crear PR con descripción del diseño, capturas y checklist.
   - Incluir referencia visual al diseño original (`modal-new-event.html`) en la descripción del PR.

## 6. Detailed Checklist

- [ ] Mantener props y callbacks existentes de `EventFormModal` y `EventForm`.
- [ ] No romper integración con hooks (`useEventFormModal`).
- [ ] Añadir `icon` al estado del modal y formulario si se incorpora `IconPicker`.
- [ ] Usar i18n para el `aria-label` del botón de cierre (`common.close`).
- [ ] Header con título dinámico (nuevo/editar).
- [ ] Close button con `aria-label` y estado `disabled` cuando `isLoading || showConfirm`.
- [ ] Error banner mostrable y estético.
- [ ] Icon picker horizontal, seleccionable y con estado visual `selected`.
- [ ] Inputs `title`, `description`, participants input y listado con acciones.
- [ ] Footer con botones `Cancelar` y `Crear Evento` con estilos adecuados.
- [ ] ConfirmDialog bloqueando cierre del modal por overlay/Escape.
- [ ] i18n keys añadidas/actualizadas y presentes en los tres idiomas.
- [ ] Pruebas unitarias básicas añadidas.
- [ ] Verificar responsividad en mobile y desktop.
- [ ] Asegurar focus trap y orden de tabulación correcto.

## 7. Testing and Validation

Unit tests:

- Render básico del modal con `open=true` y `event` undefined (modo creación).
- Verificar que `DialogTitle` muestre `eventFormModal.newTitle`.
- Simular submit y comprobar `onSubmit` llamado con datos correctos (mock).
- Test de accesibilidad básico (por ejemplo, con Testing Library y axe).
- Verificar que el modal no se cierra con Escape si `ConfirmDialog` está abierto.

Manual QA:

- Correr `pnpm dev` y abrir modal en varios tamaños.
- Revisar foco y navegación por teclado.

Comandos útiles:

```bash
pnpm --filter @friends/frontend dev
pnpm --filter @friends/frontend test
pnpm --filter @friends/frontend test:coverage
```

## 8. Internationalization

Asegurarse de añadir/actualizar claves en `src/i18n/locales/{es,en,ca}/translation.json` para:

- `eventFormModal.newTitle`
- `eventFormModal.editTitle`
- `eventFormModal.discardNewTitle` / `discardEditTitle`
- `eventFormModal.discardNewMessage` / `discardEditMessage`
- `eventFormModal.discard` / `cancel` / `createEvent`
- Labels: `eventForm.title`, `eventForm.description`, `eventForm.participants`

Verificar que las nuevas claves existen en los tres idiomas y que no hay claves huérfanas. Revisar que los labels de los inputs coincidan con el diseño y la i18n.

Pequeño snippet (ES) a añadir:

```json
"eventFormModal": {
  "newTitle": "Crear Nuevo Evento",
  "editTitle": "Editar Evento",
  "discardNewTitle": "Descartar nuevo evento",
  "discardEditTitle": "Descartar cambios",
  "discardNewMessage": "¿Estás seguro que quieres descartar el nuevo evento?",
  "discardEditMessage": "¿Estás seguro que quieres descartar los cambios?",
  "discard": "Descartar",
  "cancel": "Cancelar",
  "createEvent": "Crear Evento"
}
```

## 9. Notes for PR and Review

- Incluir capturas de pantalla: mobile and desktop.
- Especificar qué archivos fueron modificados y si se añadieron nuevos componentes.
- Indicar cualquier compromiso o decision de diseño (p. ej. extracción de `IconPicker`).
- Incluir referencia visual al diseño original (`modal-new-event.html`) en la descripción del PR.

## 10. Improvements and follow-ups

- Extraer `IconPicker` a `shared/components` para reutilizarlo en otras UIs.
- Añadir test visual (Storybook / Chromatic) para detectar regresiones de UI.
- Considerar animaciones ligeras en la selección de iconos si el equipo lo acepta.
- Considerar migrar los tests visuales a Storybook si se adopta en el futuro.

---

Fin del documento.
