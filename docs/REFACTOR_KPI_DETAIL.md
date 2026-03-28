# Propuesta de Refactor: KPIDetail.tsx

**Fecha**: 24 de diciembre de 2025  
**Objetivo**: Solucionar el problema de gastos del Bote en KPI de Expenses y mejorar la componentización de la página KPIDetail

---

## 📋 Análisis del Problema Actual

### 1. **Gastos del Bote no se muestran en KPI de Expenses**

**Situación actual:**

```typescript
// En KPIDetail.tsx línea ~52
const participantAmounts = KPI_CONFIG[kpi].participantFn(event).map(p => ({
  name: p.participant.name,
  value: formatAmount(p.total)
}));

// Luego se mapea sobre event.participants (línea ~75)
{event.participants?.map((p, idx) => (
  <li key={p.name}...>
    <div className="font-semibold">{p.name}</div>
    <div className="font-bold">{participantAmounts[idx].value}</div>
  </li>
))}
```

**Problema:**

- El KPI "Gastos Totales" (expenses) solo muestra gastos de participantes regulares
- **El Bote puede tener gastos** (con `participantId: '0'`), pero estos NO se muestran
- El método `getTotalExpensesByParticipant()` del store solo itera sobre `event.participants`, excluyendo al Bote

### 2. **Falta de componentización**

La página `KPIDetail.tsx` es un componente monolítico de ~88 líneas que mezcla:

- Lógica de routing y navegación
- Configuración de KPIs
- Cálculos de valores
- Renderizado de header
- Renderizado de KPI box
- Renderizado de lista de participantes
- Renderizado de notas explicativas

**Problemas:**

- Difícil de mantener y testear
- Lógica y presentación mezcladas
- Repetición de código en rendering
- No sigue el principio de responsabilidad única

---

## 🎯 Solución Propuesta

### Arquitectura de Componentes

```
src/features/kpi/                      [CREAR NUEVA FEATURE]
  ├── components/                      [CREAR DIRECTORIO]
  │   ├── KPIDetailHeader.tsx          [NUEVO - Header con navegación]
  │   ├── KPIParticipantsList.tsx      [NUEVO - Lista de participantes + Bote]
  │   ├── KPIExplanation.tsx           [NUEVO - Notas explicativas]
  │   └── index.ts                     [NUEVO - Barrel export de componentes]
  ├── types.ts                         [NUEVO - Tipos TypeScript para KPIs]
  └── index.ts                         [NUEVO - Public API de la feature]

src/pages/
  └── KPIDetail.tsx                    [REFACTORIZAR - Componente contenedor]
```

**Justificación de la Feature `kpi`:**

- ✅ **Reutilización**: Los componentes de KPI son lógica de negocio, no solo presentación de página
- ✅ **Escalabilidad**: La feature puede crecer con utils, hooks, store si fuera necesario
- ✅ **Consistencia**: Sigue el patrón feature-based del proyecto (events, transactions)
- ✅ **Separación de responsabilidades**: KPI es un concepto de dominio independiente
- ✅ **Testabilidad**: Facilita testing unitario de componentes aislados

### Principios de Diseño

1. **Separación de responsabilidades**: Cada componente tiene una única responsabilidad
2. **Componentes reutilizables**: Diseño genérico para futura extensibilidad
3. **Props explícitas**: Interfaces TypeScript claras
4. **Accesibilidad**: ARIA labels y semántica HTML correcta
5. **Internacionalización**: Soporte completo para i18n

---

## 📐 Diseño Detallado de Componentes

### Ubicación: `src/features/kpi/components/`

Todos los componentes se crean dentro de la nueva feature `kpi`, siguiendo el patrón establecido en el proyecto.

---

### 1. **KPIDetailHeader.tsx**

**Archivo**: `src/features/kpi/components/KPIDetailHeader.tsx`

**Responsabilidad**: Mostrar header con navegación y título del evento

**Props:**

```typescript
interface KPIDetailHeaderProps {
  eventId: string;
  eventTitle: string;
}
```

**Estructura:**

```tsx
export default function KPIDetailHeader({ eventId, eventTitle }: KPIDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between w-full max-w-2xl mt-8 mb-4 gap-2">
      <button
        onClick={() => navigate(`/event/${eventId}`)}
        className="p-2 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-800"
        aria-label="Volver"
      >
        <MdArrowBack />
      </button>
      <h1 className="text-2xl md:text-3xl font-bold text-center flex-1 truncate">{eventTitle}</h1>
      <div className="w-10" /> {/* Spacer for centering */}
    </div>
  );
}
```

---

### 2. **KPIParticipantsList.tsx** ⭐ (Componente clave)

**Archivo**: `src/features/kpi/components/KPIParticipantsList.tsx`

**Responsabilidad**: Mostrar lista de participantes Y el Bote (si aplica), con sus valores

**Props:**

```typescript
interface KPIParticipantsListProps {
  items: Array<{
    id: string; // ID único (participantId o POT_PARTICIPANT_ID)
    name: string; // Nombre a mostrar
    value: string; // Valor formateado (formatAmount ya aplicado)
    isPot?: boolean; // Indica si es el Bote
  }>;
  title: string; // Título de la sección (traducción de "Participantes")
}
```

**Estructura:**

```tsx
import { FaPiggyBank } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export default function KPIParticipantsList({ items, title }: KPIParticipantsListProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-lg font-semibold mb-4 text-teal-700 dark:text-teal-100">{title}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-center gap-3 bg-white dark:bg-teal-950 rounded-lg px-4 py-3 shadow-sm 
              ${
                item.isPot
                  ? 'border-2 border-orange-300 dark:border-orange-700'
                  : 'hover:bg-teal-50 dark:hover:bg-teal-900'
              } transition-colors`}
          >
            {item.isPot && <FaPiggyBank className="text-orange-600 dark:text-orange-400 text-xl shrink-0" />}
            <div className="flex-1">
              <div
                className={`font-semibold text-base ${
                  item.isPot ? 'text-orange-800 dark:text-orange-200' : 'text-teal-900 dark:text-teal-100'
                }`}
              >
                {item.name}
              </div>
            </div>
            <div
              className={`font-bold text-lg tabular-nums ${
                item.isPot ? 'text-orange-800 dark:text-orange-200' : 'text-teal-700 dark:text-teal-200'
              }`}
            >
              {item.value}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Características:**

- ✅ Maneja tanto participantes como el Bote
- ✅ Estilo diferenciado para el Bote (borde naranja, icono de hucha)
- ✅ Responsive y accesible
- ✅ Soporte dark mode

---

### 3. **KPIExplanation.tsx**

**Archivo**: `src/features/kpi/components/KPIExplanation.tsx`

**Responsabilidad**: Mostrar notas explicativas de los KPIs

**Props:**

```typescript
interface KPIExplanationProps {
  kpiType: 'balance' | 'contributions' | 'expenses' | 'pending';
}
```

**Estructura:**

```tsx
import { useTranslation } from 'react-i18next';

export default function KPIExplanation({ kpiType }: KPIExplanationProps) {
  const { t } = useTranslation();

  const explanations = {
    balance: t('kpiDetail.noteBalance'),
    contributions: t('kpiDetail.noteContributions'),
    expenses: t('kpiDetail.noteExpenses'),
    pending: t('kpiDetail.notePending'),
  };

  return (
    <div className="mt-6 text-xs text-teal-700 dark:text-teal-200 opacity-80">
      <strong>{t('kpiDetail.noteTitle')}</strong> <br />
      <span className="block mt-1">
        <span className="font-semibold">{t(`kpiDetail.kpi.${kpiType}`)}</span>: {explanations[kpiType]}
      </span>
    </div>
  );
}
```

---

### 4. **types.ts** (Tipos de la feature)

**Archivo**: `src/features/kpi/types.ts`

```typescript
/**
 * Available KPI types in the application
 */
export type KPIType = 'balance' | 'contributions' | 'expenses' | 'pending';

/**
 * Item data for participant or pot display
 */
export interface KPIParticipantItem {
  id: string; // Unique ID (participantId or POT_PARTICIPANT_ID)
  name: string; // Display name
  value: string; // Formatted amount (formatAmount already applied)
  isPot?: boolean; // Indicates if this is the Pot
}

/**
 * Configuration for each KPI type
 */
export interface KPIConfig {
  label: string;
  colorClass: string;
  includePot: boolean; // Whether to show Pot in the list
}
```

---

### 5. **Barrel Exports**

**Archivo**: `src/features/kpi/components/index.ts`

```typescript
export { default as KPIDetailHeader } from './KPIDetailHeader';
export { default as KPIParticipantsList } from './KPIParticipantsList';
export { default as KPIExplanation } from './KPIExplanation';
```

**Archivo**: `src/features/kpi/index.ts`

```typescript
// Components
export * from './components';

// Types
export type { KPIType, KPIParticipantItem, KPIConfig } from './types';
```

---

### 6. **KPIDetail.tsx (Refactorizado)**

**Responsabilidad**: Orquestar componentes hijos, gestionar lógica de negocio y estado

**Cambios principales:**

1. ✅ Extraer rendering a componentes hijos
2. ✅ **Añadir lógica para incluir gastos del Bote**
3. ✅ Simplificar componente contenedor
4. ✅ Mejorar legibilidad y mantenibilidad

**Estructura propuesta:**

```tsx
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEventsStore } from '../features/events/store/useEventsStore';
import { useTransactionsStore } from '../features/transactions/store/useTransactionsStore';
import { formatAmount } from '../shared/utils/formatAmount';
import { POT_PARTICIPANT_ID } from '@/shared/constants/pot';

// Import from new kpi feature
import { KPIDetailHeader, KPIParticipantsList, KPIExplanation } from '@/features/kpi';
import type { KPIType } from '@/features/kpi';

import KPIBox from '../features/events/components/KPIBox';

export default function KPIDetail() {
  const { id, kpi } = useParams<{ id: string; kpi: KPIType }>();
  const { t } = useTranslation();

  const event = useEventsStore((state) => state.events.find((e) => e.id === id));

  // Store methods
  const getTotalExpensesByEvent = useTransactionsStore((state) => state.getTotalExpensesByEvent);
  const getTotalContributionsByEvent = useTransactionsStore((state) => state.getTotalContributionsByEvent);
  const getPotBalanceByEvent = useTransactionsStore((state) => state.getPotBalanceByEvent);
  const getPendingToCompensateByEvent = useTransactionsStore((state) => state.getPendingToCompensateByEvent);

  const getTotalExpensesByParticipant = useTransactionsStore((state) => state.getTotalExpensesByParticipant);
  const getTotalContributionsByParticipant = useTransactionsStore((state) => state.getTotalContributionsByParticipant);
  const getPendingToCompensateByParticipant = useTransactionsStore(
    (state) => state.getPendingToCompensateByParticipant,
  );
  const getBalanceByParticipant = useTransactionsStore((state) => state.getBalanceByParticipant);
  const getPotExpensesData = useTransactionsStore((state) => state.getPotExpensesData);

  // KPI Configuration
  const KPI_CONFIG = {
    balance: {
      label: t('kpiDetail.kpi.balance'),
      colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      participantFn: getBalanceByParticipant,
      includePot: false, // El bote no se lista en su propio balance
    },
    contributions: {
      label: t('kpiDetail.kpi.contributions'),
      colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      participantFn: getTotalContributionsByParticipant,
      includePot: false, // El bote no recibe contribuciones
    },
    expenses: {
      label: t('kpiDetail.kpi.expenses'),
      colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      participantFn: getTotalExpensesByParticipant,
      includePot: true, // ⭐ EL BOTE PUEDE TENER GASTOS
    },
    pending: {
      label: t('kpiDetail.kpi.pending'),
      colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      participantFn: getPendingToCompensateByParticipant,
      includePot: false, // El bote no tiene pendientes
    },
  } as const;

  if (!event || !kpi || !(kpi in KPI_CONFIG)) {
    return <div className="text-center mt-10">{t('kpiDetail.notFound')}</div>;
  }

  // Calculate KPI value
  const totalExpenses = getTotalExpensesByEvent(event.id);
  const totalContributions = getTotalContributionsByEvent(event.id);
  const potBalance = getPotBalanceByEvent(event.id);
  const pendingToCompensate = getPendingToCompensateByEvent(event.id);

  let kpiValue = 0;
  if (kpi === 'balance') kpiValue = potBalance;
  if (kpi === 'contributions') kpiValue = totalContributions;
  if (kpi === 'expenses') kpiValue = totalExpenses;
  if (kpi === 'pending') kpiValue = pendingToCompensate;

  // Build participants list
  const participantsData = KPI_CONFIG[kpi].participantFn(event);
  const items = participantsData.map((p) => ({
    id: p.participant.id,
    name: p.participant.name,
    value: formatAmount(p.total),
    isPot: false,
  }));

  // ⭐ Add Pot item if needed (only for expenses KPI)
  if (KPI_CONFIG[kpi].includePot) {
    const potData = getPotExpensesData(event.id);
    if (potData) {
      items.push({
        id: potData.participantId,
        name: t('transactionsList.potLabel'), // "El Bote"
        value: formatAmount(potData.total),
        isPot: true,
      });
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-linear-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
      <KPIDetailHeader eventId={event.id} eventTitle={event.title} />

      <div className="w-full max-w-2xl mb-8">
        <KPIBox
          label={KPI_CONFIG[kpi].label}
          value={kpiValue}
          colorClass={KPI_CONFIG[kpi].colorClass + ' py-8'}
          labelClassName="!text-lg"
          valueClassName="!text-4xl"
        />
      </div>

      <KPIParticipantsList items={items} title={t('kpiDetail.participants')} />

      <KPIExplanation kpiType={kpi} />
    </div>
  );
}
```

---

## 🔄 Cambios en el Store

### Nuevo Método Helper: getPotExpensesData

Para mantener la consistencia con el patrón del store y facilitar la reutilización, se añade un método helper que devuelve los datos del Bote estructurados.

**Añadir en `useTransactionsStore.ts`:**

```typescript
interface TransactionsState {
  // ... métodos existentes ...

  // Nuevo método helper para obtener gastos del bote estructurados
  getPotExpensesData: (eventId: string) => {
    participantId: string;
    total: number
  } | null;
}

// Implementación
getPotExpensesData: (eventId) => {
  const total = get().getTotalPotExpensesByEvent(eventId);
  if (total === 0) return null;
  return {
    participantId: POT_PARTICIPANT_ID,
    total
  };
},
```

**Ventajas de este enfoque:**

- ✅ **Centraliza la lógica del Bote** en el store
- ✅ **Facilita reutilización** si otros componentes necesitan datos del Bote
- ✅ **Mantiene consistencia** con el patrón de datos del store (similar a `getTotalExpensesByParticipant`)
- ✅ **Reduce acoplamiento** entre componente y estructura de datos
- ✅ **Type safety** mejorado con retorno estructurado

**Uso en el componente:**

```tsx
// En KPIDetail.tsx
if (KPI_CONFIG[kpi].includePot) {
  const potData = getPotExpensesData(event.id);
  if (potData) {
    items.push({
      id: potData.participantId,
      name: t('transactionsList.potLabel'),
      value: formatAmount(potData.total),
      isPot: true,
    });
  }
}
```

---

## 🌍 Cambios en Traducciones

### Archivos a modificar:

- `src/i18n/locales/es/translation.json`
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/ca/translation.json`

### Claves a modificar:

#### 1. Renombrar clave existente `kpiDetail.kpi.pot` a `kpiDetail.kpi.balance`

**Español:**

```json
{
  "kpiDetail": {
    "kpi": {
      "balance": "Saldo del Bote" // Antes: "pot"
    }
  }
}
```

**Inglés:**

```json
{
  "kpiDetail": {
    "kpi": {
      "balance": "Pot Balance" // Antes: "pot"
    }
  }
}
```

**Catalán:**

```json
{
  "kpiDetail": {
    "kpi": {
      "balance": "Saldo del Bot" // Antes: "pot"
    }
  }
}
```

#### 2. Renombrar clave explicativa `kpiDetail.notePot` a `kpiDetail.noteBalance`

**Español:**

```json
{
  "kpiDetail": {
    "noteBalance": "Dinero disponible en el fondo común." // Antes: "notePot"
  }
}
```

**Inglés:**

```json
{
  "kpiDetail": {
    "noteBalance": "Money available in the common fund." // Antes: "notePot"
  }
}
```

**Catalán:**

```json
{
  "kpiDetail": {
    "noteBalance": "Diners disponibles al fons comú." // Antes: "notePot"
  }
}
```

#### 3. Nuevas claves necesarias:

**Español:**

```json
{
  "kpiDetail": {
    "participantsAndPot": "Participantes y Bote",
    "noteExpenses": "Total gastado por cada participante y por el bote común."
  }
}
```

**Inglés:**

```json
{
  "kpiDetail": {
    "participantsAndPot": "Participants and Pot",
    "noteExpenses": "Total spent by each participant and the common pot."
  }
}
```

**Catalán:**

```json
{
  "kpiDetail": {
    "participantsAndPot": "Participants i Bot",
    "noteExpenses": "Total gastat per cada participant i pel bot comú."
  }
}
```

**Nota:** La clave `participantsAndPot` se usaría opcionalmente si queremos un título diferente cuando el KPI es "expenses" y hay gastos del Bote.

---

## 📊 Comparativa: Antes vs Después

### Antes (Problema)

```tsx
// Solo muestra participantes, el Bote se ignora
{
  event.participants?.map((p, idx) => (
    <li key={p.name}>
      <div>{p.name}</div>
      <div>{participantAmounts[idx].value}</div>
    </li>
  ));
}
```

**Resultado:** Gastos del Bote no aparecen en el KPI de Expenses

### Después (Solución)

```tsx
// Componente reutilizable que maneja participantes + Bote
<KPIParticipantsList
  items={[
    ...participantsData, // Participantes regulares
    potData, // El Bote (si aplica)
  ]}
  title={t('kpiDetail.participants')}
/>
```

**Resultado:**

- ✅ Gastos del Bote aparecen con estilo diferenciado
- ✅ Icono de hucha naranja
- ✅ Borde destacado
- ✅ Componente reutilizable

---

## 🧪 Casos de Prueba

### Test 1: KPI Expenses sin gastos del Bote

1. Navegar a KPI de "Gastos Totales" de un evento
2. ✅ Verificar que solo aparecen participantes regulares
3. ✅ Verificar que no hay ítems con icono de hucha

### Test 2: KPI Expenses con gastos del Bote

1. Crear transacción de tipo "expense" con `participantId: '0'`
2. Navegar a KPI de "Gastos Totales"
3. ✅ Verificar que aparece ítem "El Bote" al final de la lista
4. ✅ Verificar icono de hucha naranja
5. ✅ Verificar borde naranja diferenciado
6. ✅ Verificar que el total del Bote es correcto

### Test 3: Otros KPIs (Contributions, Balance, Pending)

1. Navegar a KPI de "Contribución Total"
2. ✅ Verificar que NO aparece el Bote
3. Repetir para "Saldo del Bote" (Balance) y "Pendiente de Pagar"
4. ✅ Verificar que el Bote nunca aparece en estos KPIs

### Test 4: Multiidioma

1. Cambiar idioma a inglés
2. ✅ Verificar "The Pot" en lista de gastos
3. Cambiar a catalán
4. ✅ Verificar "El Bot" en lista de gastos

### Test 5: Dark Mode

1. Activar dark mode
2. ✅ Verificar que el Bote tiene colores naranja apropiados
3. ✅ Verificar contraste y legibilidad

---

## 📂 Estructura de Archivos Final

```
src/features/
  ├── events/
  ├── transactions/
  └── kpi/                             [NUEVA FEATURE]
      ├── components/
      │   ├── KPIDetailHeader.tsx      [NUEVO]
      │   ├── KPIParticipantsList.tsx  [NUEVO]
      │   ├── KPIExplanation.tsx       [NUEVO]
      │   └── index.ts                 [NUEVO - Barrel export]
      ├── types.ts                     [NUEVO - TypeScript types]
      └── index.ts                     [NUEVO - Public API]

src/pages/
  ├── KPIDetail.tsx                    [REFACTORIZADO]
  ├── EventDetail.tsx
  └── Home.tsx
```

**Ventajas de esta estructura:**

- ✅ Sigue el patrón feature-based del proyecto
- ✅ Los componentes de KPI son independientes y reutilizables
- ✅ Facilita testing unitario por feature
- ✅ Permite extensión futura (utils, hooks, store)
- ✅ Import limpio: `import { KPIDetailHeader } from '@/features/kpi'`
- ✅ Escalable: Si crece la lógica de KPIs, ya tiene su feature organizada

---

## 🚀 Plan de Implementación

### Fase 1: Crear feature base y tipos

1. Crear directorio `src/features/kpi/`
2. Crear `src/features/kpi/types.ts` con tipos `KPIType`, `KPIParticipantItem`, `KPIConfig`
3. Crear directorio `src/features/kpi/components/`

### Fase 2: Crear componentes base (Sin lógica del Bote)

1. Crear `src/features/kpi/components/KPIDetailHeader.tsx`
2. Crear `src/features/kpi/components/KPIParticipantsList.tsx` (versión básica)
3. Crear `src/features/kpi/components/KPIExplanation.tsx`
4. Crear barrel export `src/features/kpi/components/index.ts`
5. Crear public API `src/features/kpi/index.ts`

### Fase 3: Refactorizar KPIDetail.tsx

1. Importar componentes desde `@/features/kpi`
2. Importar tipo `KPIType` desde la feature
3. Extraer rendering a componentes hijos
4. Verificar que funciona igual que antes

### Fase 4: Añadir soporte para Bote (⭐ Feature principal)

1. Añadir prop `includePot` a `KPI_CONFIG`
2. Implementar lógica para añadir ítem del Bote en KPI expenses
3. Actualizar `KPIParticipantsList` con estilos para el Bote
4. Añadir icono `FaPiggyBank`

### Fase 5: Añadir método helper en store

1. Añadir método `getPotExpensesData` en `useTransactionsStore.ts`
2. Añadir interfaz del método en `TransactionsState`
3. Implementar lógica del método usando `getTotalPotExpensesByEvent`
4. Verificar TypeScript

### Fase 6: Traducciones y ajustes finales

1. Actualizar archivos de traducción (opcional)
2. Ajustar nota explicativa del KPI expenses
3. Testing manual en todos los idiomas
4. Testing en dark mode

---

## ✅ Beneficios del Refactor

### Técnicos

- ✅ **Modularización**: Componentes pequeños y enfocados en su responsabilidad
- ✅ **Feature-based architecture**: Nueva feature `kpi` siguiendo el patrón del proyecto
- ✅ **Reusabilidad**: Componentes reutilizables en otras vistas desde `@/features/kpi`
- ✅ **Testabilidad**: Componentes más fáciles de testear unitariamente por feature
- ✅ **Mantenibilidad**: Código más legible y fácil de modificar
- ✅ **Escalabilidad**: Fácil añadir nuevos KPIs, utils o hooks a la feature
- ✅ **Type safety**: Tipos compartidos y bien definidos en `types.ts`

### Funcionales

- ✅ **Bug fix**: Gastos del Bote ahora se muestran correctamente
- ✅ **UX mejorada**: Diferenciación visual clara del Bote
- ✅ **Consistencia**: Sigue el patrón visual del resto de la app
- ✅ **Accesibilidad**: Mejor estructura semántica y ARIA labels

### Adherencia a Principios

- ✅ **Single Responsibility**: Cada componente tiene una responsabilidad
- ✅ **DRY**: No repetición de código de rendering
- ✅ **Composition over Inheritance**: Composición de componentes
- ✅ **Feature-based organization**: Componentes en carpeta lógica

---

## 📝 Checklist de Implementación

### Feature Setup

- [ ] Crear directorio `src/features/kpi/`
- [ ] Crear directorio `src/features/kpi/components/`
- [ ] Crear `src/features/kpi/types.ts`
- [ ] Crear `src/features/kpi/index.ts` (Public API)

### Componentes

- [ ] Crear `src/features/kpi/components/KPIDetailHeader.tsx`
- [ ] Crear `src/features/kpi/components/KPIParticipantsList.tsx`
- [ ] Crear `src/features/kpi/components/KPIExplanation.tsx`
- [ ] Crear `src/features/kpi/components/index.ts` (Barrel export)

### Refactor Principal

- [ ] Refactorizar `src/pages/KPIDetail.tsx`
  - [ ] Importar nuevos componentes
  - [ ] Extraer header a `KPIDetailHeader`
  - [ ] Extraer lista a `KPIParticipantsList`
  - [ ] Extraer explicación a `KPIExplanation`
  - [ ] Añadir lógica para incluir Bote en expenses usando `getPotExpensesData`

### Store

- [ ] Añadir método `getPotExpensesData` en `src/features/transactions/store/useTransactionsStore.ts`
- [ ] Añadir tipo de retorno en interfaz `TransactionsState`
- [ ] Implementar lógica usando `getTotalPotExpensesByEvent` existente
- [ ] Verificar que devuelve `null` cuando no hay gastos del Bote

### Traducciones

- [ ] Renombrar `kpiDetail.kpi.pot` a `kpiDetail.kpi.balance` en `src/i18n/locales/es/translation.json`
- [ ] Renombrar `kpiDetail.kpi.pot` a `kpiDetail.kpi.balance` en `src/i18n/locales/en/translation.json`
- [ ] Renombrar `kpiDetail.kpi.pot` a `kpiDetail.kpi.balance` en `src/i18n/locales/ca/translation.json`
- [ ] Renombrar `kpiDetail.notePot` a `kpiDetail.noteBalance` en los 3 idiomas
- [ ] Añadir claves nuevas `participantsAndPot` y `noteExpenses` (opcional)

### Testing

- [ ] Test manual: KPI Expenses sin gastos del Bote
- [ ] Test manual: KPI Expenses con gastos del Bote
- [ ] Test manual: Otros KPIs (verificar que Bote no aparece)
- [ ] Test manual: Multiidioma
- [ ] Test manual: Dark mode
- [ ] Verificar TypeScript: `pnpm build`
- [ ] Ejecutar tests unitarios: `pnpm test`

---

## 🎨 Diseño Visual del Bote en Lista

### Mockup (texto)

```
┌─────────────────────────────────────────────┐
│  Participantes                              │
├─────────────────────────────────────────────┤
│  Ana                              €234.50   │
├─────────────────────────────────────────────┤
│  Luis                             €189.00   │
├─────────────────────────────────────────────┤
│  Marta                            €320.75   │
├─────────────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ 🐷 El Bote                    €730.00  ┃ │  ← Borde naranja
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└─────────────────────────────────────────────┘
```

**Características visuales:**

- 🐷 Icono de hucha (FaPiggyBank)
- 🟠 Color naranja (#f97316 / orange-600)
- 📦 Borde destacado naranja
- 📍 Aparece al final de la lista
- 🌙 Soporte dark mode (colores naranja ajustados)

---

**Fin del documento**
