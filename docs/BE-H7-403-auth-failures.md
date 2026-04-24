# [BE-H7] 403 para fallos de autorización — Spec

**Date:** 2026-04-24
**Status:** Draft
**Scope:** Backend
**Author:** Víctor Sales

---

## 1. Motivation

Los métodos `ensureCanAccessEvent()` y `ensureCanAccessTransaction()` lanzan `NotFoundException` (HTTP 404) cuando un usuario autenticado intenta acceder a un recurso que existe pero al que no tiene permiso. Esto es incorrecto semánticamente y tiene dos consecuencias negativas:

1. **Semántica HTTP incorrecta:** 404 significa "el recurso no existe"; 403 significa "el recurso existe pero no tienes acceso". Mezclarlos viola el contrato HTTP estándar.
2. **Auditoría degradada:** Los intentos de acceso no autorizado aparecen en los logs como 404, indistinguibles de rutas que genuinamente no existen, ocultando posibles ataques de reconocimiento.

La "fuga de información" del título no es que el 404 revele qué IDs existen — al contrario, usarlo para todo *oculta* esa información. El problema es la *inconsistencia* semántica: si alguna ruta devolviera 403 y otra 404 para el mismo tipo de fallo, un atacante podría usar la diferencia como oráculo. La solución correcta es usar 403 de forma sistemática para fallos de autorización.

**Trade-off aceptado:** Devolver 403 para un recurso existente revela que el ID es válido. Esto es aceptable dado que los IDs son UUIDs (difíciles de enumerar) y el control de acceso real no está en el secreto del ID.

---

## 2. Behavior Contract

### Happy path

- Given un usuario autenticado que es participante del evento, when accede a cualquier endpoint de ese evento o sus transacciones, then recibe 200 con los datos.
- Given un admin, when accede a cualquier evento o transacción, then recibe 200.

### Edge cases & error states

| Scenario | Expected behavior |
|---|---|
| Evento con ID no existente | 404 Not Found |
| Evento existente, usuario no participante | 403 Forbidden |
| Transacción con ID no existente | 404 Not Found |
| Transacción existente, usuario no participante del evento padre | 403 Forbidden |
| Transacción existente, evento padre no encontrado (integridad) | 404 (tratado como "no encontrado") |
| Admin accede a cualquier recurso | 200 (sin restricciones) |

---

## 3. API Contract (if backend is in scope)

Endpoints afectados — solo cambia el código de error en los casos de autorización:

```
GET    /api/events/:id
PUT    /api/events/:id
DELETE /api/events/:id
GET    /api/events/:id/kpis
GET    /api/events/:eventId/transactions
POST   /api/events/:eventId/transactions
GET    /api/transactions/:id
PATCH  /api/transactions/:id
DELETE /api/transactions/:id

Errors (change):
  403 — recurso existe pero el usuario no es participante  ← antes era 404
  404 — recurso genuinamente no existe                     ← sin cambio
```

---

## 7. Implementation Order

- [ ] 1. Corregir `transactions.service.ts`: import + métodos `ensureCanAccess*` + catch blocks
- [ ] 2. Corregir `events.service.ts`: import + método `ensureCanAccessEvent` + catch blocks
- [ ] 3. Actualizar tests unitarios `transactions.service.spec.ts`
- [ ] 4. Actualizar tests unitarios `events.service.spec.ts`
- [ ] 5. Actualizar tests e2e `events.e2e-spec.ts`
- [ ] 6. Actualizar tests e2e `transactions.e2e-spec.ts`

---

## 8. Test Cases

### Backend unit — cambios necesarios

```ts
// transactions.service.spec.ts
// Estas pruebas pasan de esperar NotFoundException → ForbiddenException:
it('throws ForbiddenException when user is not participant')       // findByEvent
it('throws ForbiddenException when user cannot access parent event') // findOne
it('throws ForbiddenException when user is not participant')       // create

// Estas NO cambian (recurso genuinamente no existe):
it('throws NotFoundException when event does not exist')           // findByEvent
it('throws NotFoundException when transaction does not exist')     // findOne / remove
it('throws NotFoundException when event does not exist')           // findByEventPaginated
```

```ts
// events.service.spec.ts
// Estas pruebas pasan de esperar NotFoundException → ForbiddenException:
it('throws ForbiddenException when user is not participant')  // findOne
it('throws ForbiddenException when user is not participant')  // update
it('throws ForbiddenException when user is not participant')  // remove
it('throws ForbiddenException when actor cannot access event') // getKPIs

// Estas NO cambian (recurso genuinamente no existe):
it('throws NotFoundException when event does not exist')      // findOne, getKPIs
```

### Backend e2e — cambios necesarios

```ts
// events.e2e-spec.ts
it('GET /api/events/:id returns 403 when user is not a participant')        // antes 404
it('GET /api/events/:id/kpis returns 403 when user is not a participant')   // antes 404

// transactions.e2e-spec.ts
it('returns 403 for user not participating in event transactions while admin keeps global access')
// los tres `.expect(404)` del outsider pasan a `.expect(403)`
```

---

## 9. Out of Scope

- Endpoints de `admin/` — ya usan `RolesGuard` que devuelve 403 correctamente.
- Frontend — no consume el código de error de estos casos (no hay manejo diferenciado de 403 vs 404 en la UI).
- Rate limiting o protección de enumeración de IDs — mejora independiente.

---

## 10. Environment Variables

Ninguna.

---

## 11. Open Questions

- [x] ¿Deberíamos devolver 404 para todo para no revelar existencia de recursos? → Descartado. Los IDs son UUIDs, el trade-off es aceptable, y la semántica correcta mejora la auditabilidad.
