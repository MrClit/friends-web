# Plan de Implementación: Gastos del Bote (Pot Expenses)

**Fecha**: 23 de diciembre de 2025  
**Objetivo**: Permitir que el bote ejecute transacciones de tipo gasto, restando saldo del bote común.

---

## 📋 Resumen Ejecutivo

### Situación Actual
- **3 tipos de transacciones**: `contribution`, `expense`, `compensation`
- **Todas las transacciones** requieren un `participantId` (vinculadas a un participante)
- **No existe forma** de registrar gastos pagados directamente desde el bote común

### Solución Propuesta
- **NO se crea nuevo tipo de transacción** - se usa el tipo existente `expense`
- **Identificación mediante participantId especial**: `'0'` (string) identifica al Bote
- **Flujo**: Al seleccionar tipo "expense", el usuario puede elegir:
  - Un participante normal (gasto de participante)
  - **"BOTE"** (nueva opción) → se guarda con `participantId: '0'`
- Los gastos del bote **reducen el saldo del bote** igual que las compensaciones

### Cálculo del Saldo del Bote

**Fórmula actualizada:**
```
Saldo del Bote = Contribuciones - Compensaciones - Gastos del Bote (participantId='0')
```

---

## 📝 Plan de Cambios Detallado

### 1️⃣ CONSTANTE PARA EL ID DEL BOTE

**Crear archivo**: `src/shared/constants/pot.ts`

```typescript
/**
 * ID especial que identifica al Bote (fondo común) en transacciones de tipo expense
 */
export const POT_PARTICIPANT_ID = '0';
```

---

### 2️⃣ STORE DE TRANSACCIONES

**Archivo**: `src/features/transactions/store/useTransactionsStore.ts`

#### 2.1. Añadir import de la constante

```typescript
import { POT_PARTICIPANT_ID } from '@/shared/constants/pot';
```

#### 2.2. Actualizar la interfaz TransactionsState

Añadir dos nuevos métodos:

```typescript
interface TransactionsState {
  // ...métodos existentes...
  getTotalPotExpensesByEvent: (eventId: string) => number;
  isPotExpense: (transaction: Transaction) => boolean;
}
```

#### 2.3. Añadir método helper isPotExpense

Insertar al inicio de los métodos del store:

```typescript
isPotExpense: (transaction) => 
  transaction.paymentType === 'expense' && transaction.participantId === POT_PARTICIPANT_ID,
```

#### 2.4. Añadir método getTotalPotExpensesByEvent

Insertar después de `getTotalCompensationsByEvent`:

```typescript
getTotalPotExpensesByEvent: (eventId) =>
  get()
    .transactions.filter(
      (e) => e.eventId === eventId && 
            e.paymentType === 'expense' && 
            e.participantId === POT_PARTICIPANT_ID
    )
    .reduce((sum, e) => sum + e.amount, 0),
```

#### 2.5. Actualizar getPotBalanceByEvent

**ANTES:**
```typescript
getPotBalanceByEvent: (eventId) => {
  const totalContributions = get().getTotalContributionsByEvent(eventId);
  const totalCompensations = get().getTotalCompensationsByEvent(eventId);
  return totalContributions - totalCompensations;
},
```

**DESPUÉS:**
```typescript
getPotBalanceByEvent: (eventId) => {
  const totalContributions = get().getTotalContributionsByEvent(eventId);
  const totalCompensations = get().getTotalCompensationsByEvent(eventId);
  const totalPotExpenses = get().getTotalPotExpensesByEvent(eventId);
  return totalContributions - totalCompensations - totalPotExpenses;
},
```

#### 2.6. Actualizar clearParticipantFromEventTransactions

Añadir protección para no afectar transacciones del Bote:

**ANTES:**
```typescript
clearParticipantFromEventTransactions: (eventId, participantId) =>
  set((state) => ({
    transactions: state.transactions.map((tx) =>
      tx.eventId === eventId && tx.participantId === participantId
        ? { ...tx, participantId: "" }
        : tx
    ),
  })),
```

**DESPUÉS:**
```typescript
clearParticipantFromEventTransactions: (eventId, participantId) =>
  set((state) => ({
    transactions: state.transactions.map((tx) =>
      tx.eventId === eventId && 
      tx.participantId === participantId && 
      participantId !== POT_PARTICIPANT_ID
        ? { ...tx, participantId: "" }
        : tx
    ),
  })),
```

---

### 3️⃣ VALIDACIÓN EN EVENTOS (OPCIONAL)

**Archivo**: `src/features/events/components/ParticipantsInput.tsx`

Añadir comentario en generación de IDs. Localizar la línea donde se genera el UUID (aproximadamente línea 29):

**ANTES:**
```typescript
onClick={() => setParticipants((p: EventParticipant[]) => [...p, { id: crypto.randomUUID(), name: "" }])}
```

**DESPUÉS:**
```typescript
onClick={() => setParticipants((p: EventParticipant[]) => [...p, { id: crypto.randomUUID(), name: "" }])} // UUID nunca será '0' (reservado para el Bote)
```

> **Nota**: Este paso es opcional y puramente documentativo.

---

### 4️⃣ COMPONENTES DE UI

#### 4.1. TransactionForm

**Archivo**: `src/features/transactions/components/TransactionForm.tsx`

**A. Añadir import:**

```typescript
import { POT_PARTICIPANT_ID } from '@/shared/constants/pot';
```

**B. Añadir opción del Bote al selector**

Localizar el `<select>` del participante y añadir la opción del Bote:

```typescript
<select
  className="..."
  value={from}
  onChange={e => setParticipantId(e.target.value)}
  required
>
  <option value="" disabled>{t('transactionForm.participantPlaceholder')}</option>
  {type === 'expense' && (
    <option value={POT_PARTICIPANT_ID}>{t('transactionForm.potOption')}</option>
  )}
  {participants.map(p => (
    <option key={p.id} value={p.id}>{p.name}</option>
  ))}
</select>
```

#### 4.2. TransactionModal

**Archivo**: `src/features/transactions/components/TransactionModal.tsx`

✅ **NO REQUIERE CAMBIOS** - Funciona automáticamente con `participantId: '0'`

#### 4.3. TransactionsList

**Archivo**: `src/features/transactions/components/TransactionsList.tsx`

**A. Añadir import:**

```typescript
import { FaPiggyBank } from 'react-icons/fa';
```

**B. Importar helper del store**

```typescript
const isPotExpense = useTransactionsStore(state => state.isPotExpense);
```

**C. Actualizar icono dinámicamente**

Localizar el `<span>` con el icono:

**ANTES:**
```typescript
<span className={`text-xl ${TEXT_COLOR_CLASSES[trx.paymentType]}`}>
  {ICONS[trx.paymentType]}
</span>
```

**DESPUÉS:**
```typescript
<span className={`text-xl ${isPotExpense(trx) ? 'text-orange-800 dark:text-orange-200' : TEXT_COLOR_CLASSES[trx.paymentType]}`}>
  {isPotExpense(trx) ? <FaPiggyBank className="text-orange-800 dark:text-orange-200" /> : ICONS[trx.paymentType]}
</span>
```

**D. Mostrar "El Bote" como participante**

Localizar el `<div>` con el nombre del participante:

```typescript
<div className="text-sm text-teal-600 dark:text-teal-300">
  {t(`transactionsList.participantPrefix.${trx.paymentType}`)}{' '}
  {isPotExpense(trx)
    ? t('transactionsList.potLabel')
    : (event.participants.find(p => p.id === trx.participantId)?.name || t('transactionsList.unknownParticipant'))
  }
</div>
```

**E. Actualizar color del amount**

```typescript
<div className={`font-bold text-lg tabular-nums ${isPotExpense(trx) ? 'text-orange-800 dark:text-orange-200' : TEXT_COLOR_CLASSES[trx.paymentType]}`}>
  {formatAmount(trx.amount)}
</div>
```

---

### 5️⃣ INTERNACIONALIZACIÓN (i18n)

#### Español (`es/translation.json`)

Añadir en `transactionForm`:
```json
"potOption": "BOTE (Bote Común)"
```

Añadir en `transactionsList`:
```json
"potLabel": "El Bote"
```

#### Inglés (`en/translation.json`)

Añadir en `transactionForm`:
```json
"potOption": "POT (Common Fund)"
```

Añadir en `transactionsList`:
```json
"potLabel": "The Pot"
```

#### Catalán (`ca/translation.json`)

Añadir en `transactionForm`:
```json
"potOption": "POT (Bot Comú)"
```

Añadir en `transactionsList`:
```json
"potLabel": "El Bot"
```

---

### 6️⃣ DATOS DEMO (OPCIONAL)

**Archivo**: `src/shared/demo/demoData.ts`

**A. Añadir import:**

```typescript
import { POT_PARTICIPANT_ID } from '@/shared/constants/pot';
```

**B. Añadir transacciones de ejemplo:**

```typescript
// Ejemplo: Alquiler del local (día 1)
if (day === 1) {
  demoTransactions.push({
    paymentType: 'expense',
    amount: 500,
    participantId: POT_PARTICIPANT_ID,
    title: 'Alquiler del local para las fiestas',
    date: getDate(day),
  });
}

// Ejemplo: Seguro (día 2)
if (day === 2) {
  demoTransactions.push({
    paymentType: 'expense',
    amount: 150,
    participantId: POT_PARTICIPANT_ID,
    title: 'Seguro de responsabilidad civil del evento',
    date: getDate(day),
  });
}

// Ejemplo: Decoración (día 5)
if (day === 5) {
  demoTransactions.push({
    paymentType: 'expense',
    amount: 80,
    participantId: POT_PARTICIPANT_ID,
    title: 'Decoración y carteles del evento',
    date: getDate(day),
  });
}
```

---

### 7️⃣ TESTS (OPCIONAL)

**Crear**: `src/features/transactions/store/useTransactionsStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useTransactionsStore } from './useTransactionsStore';
import { POT_PARTICIPANT_ID } from '@/shared/constants/pot';

describe('useTransactionsStore - pot expenses', () => {
  beforeEach(() => {
    useTransactionsStore.setState({ transactions: [] });
    localStorage.clear();
  });

  describe('getTotalPotExpensesByEvent', () => {
    it('should calculate total pot expenses', () => {
      const eventId = 'event-1';
      
      useTransactionsStore.getState().addExpense({
        eventId,
        paymentType: 'expense',
        amount: 100,
        participantId: POT_PARTICIPANT_ID,
        date: '2025-01-01',
        title: 'Pot expense 1',
      });
      
      useTransactionsStore.getState().addExpense({
        eventId,
        paymentType: 'expense',
        amount: 50,
        participantId: POT_PARTICIPANT_ID,
        date: '2025-01-02',
        title: 'Pot expense 2',
      });
      
      const total = useTransactionsStore.getState().getTotalPotExpensesByEvent(eventId);
      expect(total).toBe(150);
    });

    it('should not include regular participant expenses', () => {
      const eventId = 'event-1';
      
      useTransactionsStore.getState().addExpense({
        eventId,
        paymentType: 'expense',
        amount: 100,
        participantId: 'participant-1',
        date: '2025-01-01',
        title: 'Regular expense',
      });
      
      const total = useTransactionsStore.getState().getTotalPotExpensesByEvent(eventId);
      expect(total).toBe(0);
    });
  });

  describe('getPotBalanceByEvent', () => {
    it('should subtract pot expenses from balance', () => {
      const eventId = 'event-1';
      
      // Contribution: +500
      useTransactionsStore.getState().addExpense({
        eventId,
        paymentType: 'contribution',
        amount: 500,
        participantId: 'participant-1',
        date: '2025-01-01',
        title: 'Contribution',
      });
      
      // Pot expense: -150
      useTransactionsStore.getState().addExpense({
        eventId,
        paymentType: 'expense',
        amount: 150,
        participantId: POT_PARTICIPANT_ID,
        date: '2025-01-02',
        title: 'Pot expense',
      });
      
      const balance = useTransactionsStore.getState().getPotBalanceByEvent(eventId);
      expect(balance).toBe(350); // 500 - 150
    });

    it('should handle contributions, compensations and pot expenses', () => {
      const eventId = 'event-1';
      
      // Contribution: +1000
      useTransactionsStore.getState().addExpense({
        eventId,
        paymentType: 'contribution',
        amount: 1000,
        participantId: 'participant-1',
        date: '2025-01-01',
        title: 'Contribution',
      });
      
      // Compensation: -200
      useTransactionsStore.getState().addExpense({
        eventId,
        paymentType: 'compensation',
        amount: 200,
        participantId: 'participant-2',
        date: '2025-01-02',
        title: 'Compensation',
      });
      
      // Pot expense: -150
      useTransactionsStore.getState().addExpense({
        eventId,
        paymentType: 'expense',
        amount: 150,
        participantId: POT_PARTICIPANT_ID,
        date: '2025-01-03',
        title: 'Pot expense',
      });
      
      const balance = useTransactionsStore.getState().getPotBalanceByEvent(eventId);
      expect(balance).toBe(650); // 1000 - 200 - 150
    });
  });
});
```

---

## 📊 Checklist de Implementación

- [x] **1. Constante del Bote**
  - [x] Crear archivo `src/shared/constants/pot.ts`
  - [x] Definir constante `POT_PARTICIPANT_ID = '0'`

- [x] **2. Store de transacciones**
  - [x] Añadir import de `POT_PARTICIPANT_ID`
  - [x] Añadir `isPotExpense` a interfaz y como método
  - [x] Añadir `getTotalPotExpensesByEvent` a interfaz e implementar
  - [x] Actualizar `getPotBalanceByEvent`
  - [x] Actualizar `clearParticipantFromEventTransactions` con protección

- [x] **3. Validación en eventos (opcional)**
  - [x] Añadir comentario en `ParticipantsInput.tsx`

- [x] **4. UI Components**
  - [x] Modificar `TransactionForm.tsx` (import + opción BOTE)
  - [x] Modificar `TransactionsList.tsx` (import + helper + iconos + colores)

- [x] **5. i18n**
  - [x] Añadir traducciones en `es/translation.json`
  - [x] Añadir traducciones en `en/translation.json`
  - [x] Añadir traducciones en `ca/translation.json`

- [x] **6. Datos demo (opcional)**
  - [x] Añadir import de `POT_PARTICIPANT_ID`
  - [x] Añadir 3 transacciones de ejemplo

- [ ] **7. Tests (opcional)**
  - [ ] Crear `useTransactionsStore.test.ts`
  - [ ] Tests para `getTotalPotExpensesByEvent`
  - [ ] Tests para `getPotBalanceByEvent`

---

## 🧪 Casos de Prueba Manual

### Test 1: Crear gasto del bote
1. Abrir evento existente
2. Click en "Añadir Transacción"
3. Seleccionar tipo "Gasto"
4. En selector de participantes, elegir **"BOTE"**
5. Completar título, importe, fecha y guardar
6. ✅ Verificar icono de hucha naranja
7. ✅ Verificar que "Saldo del Bote" disminuyó

### Test 2: Editar transacción del bote
1. Click en una transacción del bote (naranja)
2. Modificar título o importe y guardar
3. ✅ Verificar que sigue mostrando "El Bote"
4. ✅ Verificar que "BOTE" sigue seleccionado

### Test 3: Convertir gasto normal a gasto del bote
1. Click en un gasto normal de un participante
2. Cambiar selector a "BOTE" y guardar
3. ✅ Verificar cambio de icono a hucha naranja
4. ✅ Verificar que muestra "El Bote" como pagador
5. ✅ Verificar que el saldo del bote disminuyó

### Test 4: Conversión inversa (bote a participante)
1. Click en un gasto del bote
2. Cambiar selector de "BOTE" a un participante y guardar
3. ✅ Verificar cambio de icono a cartera roja
4. ✅ Verificar que muestra nombre del participante
5. ✅ Verificar que el saldo del bote aumentó

### Test 5: Multiidioma
1. Cambiar idioma a inglés
2. ✅ Verificar "POT (Common Fund)" en selector
3. ✅ Verificar "The Pot" en lista
4. Cambiar a catalán
5. ✅ Verificar "POT (Bot Comú)" en selector
6. ✅ Verificar "El Bot" en lista

---

## 🎨 Diseño Visual

### Color Scheme

- **Contributions** (Contribuciones): Azul 🔵
- **Expenses** (Gastos normales): Rojo 🔴
- **Pot Expenses** (Gastos del Bote): Naranja 🟠
- **Compensations** (Reembolsos): Verde 🟢

### Iconos

- **Contributions**: `FaHandHoldingUsd` (mano dando dinero)
- **Expenses**: `FaWallet` (cartera)
- **Pot Expenses**: `FaPiggyBank` (hucha) 🐷
- **Compensations**: `FaHandshake` (apretón de manos)

---

## 📚 Archivos Afectados

### Archivos Creados

```
src/shared/constants/
  └── pot.ts                                [CREAR]

src/features/transactions/store/
  └── useTransactionsStore.test.ts          [CREAR - opcional]
```

### Archivos Modificados

```
src/features/transactions/store/
  └── useTransactionsStore.ts               [MODIFICAR]

src/features/transactions/components/
  ├── TransactionForm.tsx                   [MODIFICAR]
  └── TransactionsList.tsx                  [MODIFICAR]

src/features/events/components/
  ├── EventForm.tsx                         [NO REQUIERE CAMBIOS]
  └── ParticipantsInput.tsx                 [MODIFICAR - solo comentario opcional]

src/i18n/locales/
  ├── es/translation.json                   [MODIFICAR]
  ├── en/translation.json                   [MODIFICAR]
  └── ca/translation.json                   [MODIFICAR]

src/shared/demo/
  └── demoData.ts                           [MODIFICAR - opcional]
```

---

## 🚀 Comando de Verificación

Después de implementar, ejecutar:

```bash
# Verificar tipos
pnpm build

# Ejecutar tests
pnpm test

# Ejecutar en dev
pnpm dev
```

---

**Fin del documento**
