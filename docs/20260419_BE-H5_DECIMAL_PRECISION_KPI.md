# [BE-H5] Pérdida de precisión decimal en KPIs financieros — Spec

**Date:** 2026-04-19
**Status:** In Progress
**Scope:** Backend
**Author:** Víctor Sales
**Issue:** [#24](https://github.com/MrClit/friends-web/issues/24)

---

## 1. Motivation

TypeORM devuelve los campos `decimal(10,2)` como `string` en runtime. `EventKPIsService` los convierte con `Number(amount)` antes de operar, lo que introduce errores de punto flotante de IEEE 754. En eventos con muchas transacciones pequeñas (p.ej. muchos importes de 0.10 €) el error se acumula y los KPIs muestran diferencias de un céntimo o más.

Ejemplo concreto: `0.1 + 0.2 === 0.30000000000000004` en JavaScript.

---

## 2. Behavior Contract

### Happy path

- Dado un evento con transacciones cuyo importe tiene decimales, cuando se calculan los KPIs, entonces todos los valores retornados son exactos al céntimo (2 decimales, redondeo HALF_EVEN).
- El contrato del DTO de respuesta no cambia: los campos siguen siendo `number` de JavaScript.

### Edge cases & error states

| Scenario | Expected behavior |
|---|---|
| Muchas transacciones de 0.10 € | La suma es exacta, sin `0.30000000000000004` |
| Importe inválido / NaN | Se sigue ignorando la transacción (comportamiento actual) |
| Importe `0` | Se procesa sin errores |
| Tolerancia de reconciliación | Se reduce de `0.000001` a `0` (aritmética exacta) |

---

## 3. API Contract (if backend is in scope)

Sin cambios en endpoints ni DTOs. La corrección es interna al servicio.

---

## 4. Shared Types (if cross-stack)

No aplica.

---

## 5. Data Model (if DB changes)

Sin cambios en BD ni migraciones. Los importes siguen como `decimal(10,2)`.

---

## 6. Frontend

No aplica.

---

## 7. Implementation Order

- [ ] 1. Instalar `decimal.js` en `apps/backend`
- [ ] 2. Refactorizar `EventKPIsService.getKPIs()` para usar `Decimal` en toda la aritmética
- [ ] 3. Añadir casos de test de precisión decimal en `event-kpis.service.spec.ts`

---

## 8. Test Cases

### Casos nuevos a añadir en `event-kpis.service.spec.ts`

```ts
it('calculates exact totals with floating-point-prone amounts (0.10 + 0.20 = 0.30)')
// Arrange: dos transacciones de 0.10 y 0.20 para el mismo participante
// Assert: totalContributions === 0.30 (no 0.30000000000000004)

it('accumulates many small amounts without rounding drift')
// Arrange: 10 transacciones de 0.10 € para el mismo participante
// Assert: totalContributions === 1.00 exacto
```

### Casos existentes

Todos los tests existentes deben seguir pasando sin modificación (los valores esperados son enteros, por lo que no cambian).

---

## 9. Design Decisions

### ¿`Decimal.js` o enteros (céntimos)?

Se elige **`Decimal.js`** porque:

1. No requiere migración de BD.
2. No requiere cambios en la API ni en el frontend.
3. El cambio queda aislado en un único servicio.
4. Es la solución estándar para aritmética financiera en Node.js.

### Conversión de tipos

- **Entrada:** `Number(amount)` → `new Decimal(String(amount))` (se usa `String` para evitar el propio error de `Number()` antes de crear el `Decimal`).
- **Salida:** `.toNumber()` al construir el objeto retornado, ya que el DTO espera `number`.

### Tolerancia de reconciliación

`RECONCILIATION_TOLERANCE` pasa de `0.000001` a `0`. Con `Decimal`, la ecuación `inflows - outflows === potBalance` es algebraicamente exacta y no necesita tolerancia.

### Redondeo

Se usa `Decimal.ROUND_HALF_EVEN` (redondeo bancario) al serializar a `number` para evitar sesgos acumulativos.

---

## 10. Environment Variables

Ninguna.

---

## 11. Out of Scope

- Cambios en el DTO `EventKPIsDto` o en el frontend.
- Migración de la columna `amount` a `integer` (céntimos).
- Refactorizar otros servicios (p.ej. `TransactionsService`); el problema de precisión solo se manifiesta en los KPIs agregados.
