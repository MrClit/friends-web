# [FE-M1] Re-renders innecesarios en EventsList — Spec

**Date:** 2026-04-26
**Status:** Approved
**Scope:** Frontend
**Author:** Víctor Sales

---

## 1. Motivation

`EventCard` ya tiene `React.memo` aplicado, pero es completamente inefectivo porque `EventsList` pasa props que se recrean en cada render del padre:

- `event={{...}}` — objeto literal nuevo en cada render.
- `icon: <EventIcon iconKey={event.icon} />` — nodo JSX nuevo aunque el icono no haya cambiado.
- `onClick={() => navigate(...)}` — función nueva en cada render.

La comparación referencial de `memo` siempre detecta cambios → todos los `EventCard` se re-renderizan cada vez que el padre se actualiza (cambio de filtro, re-fetch de TanStack Query, etc.).

Adicionalmente, la lista no está virtualizada: para N eventos se montan N nodos en el DOM, sin importar cuántos sean visibles.

---

## 2. Behavior Contract

### Happy path

- Dado un listado de eventos activos, cuando TanStack Query hace un re-fetch en background, entonces los `EventCard` cuyo evento no cambió **no** se re-renderizan.
- Dado un listado de eventos activos, cuando el usuario navega a la home, entonces se renderiza el grid estático.

### Edge cases & error states

| Scenario | Expected behavior |
|---|---|
| Lista con 0 eventos | Empty state sin cambios de comportamiento |
| `event.icon` es `undefined` | `EventCard` muestra `MdEvent` por defecto (comportamiento actual) |

---

## 3. API Contract (if backend is in scope)

No aplica.

---

## 4. Shared Types (if cross-stack)

No aplica.

---

## 5. Data Model (if DB changes)

No aplica.

---

## 6. Frontend

### Cambios principales

#### 6.1 Refactor de `EventCard` — eliminar `icon?: React.ReactNode`, añadir `iconKey?: string`

El problema de raíz es que `icon` es un nodo JSX opaco que cambia por referencia en cada render. La solución limpia es pasar un dato primitivo (`iconKey`) y dejar que `EventCard` resuelva el componente internamente.

**Props antes:**
```ts
event: {
  id: string
  title: string
  // ...
  icon?: React.ReactNode  // ← JSX node, referencia nueva cada render
}
```

**Props después:**
```ts
event: {
  id: string
  title: string
  // ...
  iconKey?: string  // ← string primitivo, referencia estable si el valor no cambia
}
```

`EventCard` importa `getEventIconComponent` y resuelve el icono internamente. Así `memo` puede comparar `iconKey` por valor.

#### 6.2 Estabilizar `onClick` en `EventsList`

```ts
// Antes (función nueva por render por card)
onClick={() => navigate(`/event/${event.id}`)

// Después (función estable; id es primitivo y se compara por valor en memo)
const handleCardClick = useCallback((id: string) => navigate(`/event/${id}`), [navigate])
```

### Components

| Component | Location | Responsibility |
|---|---|---|
| `EventCard` | `features/events/components/EventCard.tsx` | Acepta `iconKey` en lugar de `icon`; resuelve el icono internamente |
| `EventsList` | `features/events/components/EventsList.tsx` | Estabiliza `onClick`; pasa `iconKey` en lugar de nodo JSX |

### State

Sin cambios en server state ni stores de Zustand.

### i18n keys needed

Sin nuevas claves.

---

## 7. Implementation Order

- [ ] 1. Refactor `EventCard`: cambiar prop `icon?: React.ReactNode` → `iconKey?: string`; mover resolución del icono dentro del componente; actualizar test `EventCard.test.tsx`
- [ ] 2. Actualizar `EventsList`: pasar `iconKey` en lugar de `icon`; añadir `useCallback` para `handleCardClick`; eliminar el componente local `EventIcon`

---

## 8. Test Cases

### Frontend

```ts
// describe('EventCard')
it('renders the icon resolved from iconKey')
it('renders MdEvent fallback when iconKey is undefined')
it('does not re-render when parent re-renders with same event data')  // vi.fn spy en el render
```

---

## 9. Out of Scope

- Virtualización para la lista de transacciones dentro de un evento.
- Cambios en el diseño visual de `EventCard`.
- Virtualización: el número de eventos por usuario no superará nunca el umbral donde tenga sentido.
- Infinite scroll (cubierto en `docs/IMPLEMENT_INFINITE_SCROLL.md`).
- Optimizaciones de bundle size o code splitting.

---

## 10. Environment Variables

Sin cambios.

---

## 11. Open Questions

Sin preguntas abiertas. Virtualización descartada: el número de eventos por usuario no superará el umbral donde tenga sentido.
