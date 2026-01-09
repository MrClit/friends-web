# Estrategia de Testing para Frontend - Friends App

**Fecha**: 3 de enero de 2026  
**Estado**: 📋 PROPUESTA  
**Aplicación**: @friends/frontend (React 19 + TypeScript + Vite)

---

## ⚠️ DECISIÓN CRÍTICA: Timing de Implementación

**Contexto:** El proyecto planea migrar de LocalStorage a Backend (NestJS + PostgreSQL) en `apps/backend/`.

**Pregunta:** ¿Implementar tests ahora o después de la integración con backend?

👉 **[IR A RECOMENDACIÓN](#decisión-timing-de-implementación)** (Sección 0)

---

## 📊 Tabla de Contenidos

0. [⚠️ Decisión: Timing de Implementación](#decisión-timing-de-implementación)
1. [Análisis de Tipos de Testing Apropiados](#1-análisis-de-tipos-de-testing-apropiados)
2. [Estado Actual del Testing](#2-estado-actual-del-testing)
3. [Plan Detallado de Implementación](#3-plan-detallado-de-implementación)
4. [Recursos y Herramientas](#4-recursos-y-herramientas)

---

## Decisión: Timing de Implementación

### 🎯 Recomendación Final: **ESTRATEGIA HÍBRIDA** ⭐

**NO implementar el plan completo ahora, PERO sí hacer testing selectivo estratégico.**

---

### 📊 Análisis del Impacto de la Migración Backend

#### Cambios Arquitectónicos Esperados

**Antes (actual):**

```typescript
// Stores con LocalStorage
const useEventsStore = create<EventsState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (title, participants) => {
        // Lógica en cliente
        set((state) => ({
          events: [...state.events, newEvent],
        }));
      },
    }),
    { name: 'events-storage' },
  ),
);
```

**Después (con backend):**

```typescript
// Stores con API calls
const useEventsStore = create<EventsState>((set) => ({
  events: [],
  loading: false,
  error: null,

  fetchEvents: async () => {
    set({ loading: true });
    const response = await fetch('/api/events');
    const events = await response.json();
    set({ events, loading: false });
  },

  addEvent: async (title, participants) => {
    const response = await fetch('/api/events', {
      method: 'POST',
      body: JSON.stringify({ title, participants }),
    });
    const newEvent = await response.json();
    set((state) => ({
      events: [...state.events, newEvent],
    }));
  },
}));
```

#### Impacto en Tests por Tipo

| Tipo de Test                 | % Reutilizable | Impacto     | Esfuerzo de Adaptación                   |
| ---------------------------- | -------------- | ----------- | ---------------------------------------- |
| **Lógica de Negocio (KPIs)** | 95%            | ✅ Mínimo   | Ninguno - Son pure functions             |
| **Formatters/Utils**         | 100%           | ✅ Ninguno  | Ninguno - No cambian                     |
| **Componentes UI**           | 80%            | 🟡 Medio    | Actualizar mocks (localStorage → API)    |
| **Stores (CRUD)**            | 20%            | 🔴 Alto     | Reescribir con mocks de API              |
| **Integration Tests**        | 10%            | 🔴 Muy Alto | Reescribir completamente (MSW requerido) |
| **Pages**                    | 60%            | 🟡 Medio    | Ajustar mocks y loading states           |

---

### 🎯 Estrategia Recomendada: Testing Selectivo

#### ✅ FASE 0: Tests PRE-Migración (HACER AHORA)

**Duración:** 3-4 días  
**Objetivo:** Proteger lógica crítica que NO cambiará con backend

##### 1. Tests de Lógica de Negocio (KPIs) - **PRIORIDAD MÁXIMA**

Estos cálculos son **independientes del storage** y serán reutilizables 100%:

```typescript
// ✅ HACER AHORA - No cambiará con backend
describe('KPI Calculations (Pure Logic)', () => {
  describe('calculatePotBalance', () => {
    it('should calculate contributions - compensations - expenses', () => {
      const transactions = [
        { type: 'contribution', amount: 100 },
        { type: 'expense', amount: 30 },
        { type: 'compensation', amount: 20 },
      ];
      expect(calculatePotBalance(transactions)).toBe(50); // 100 - 30 - 20
    });
  });

  // ... más tests de cálculos puros
});
```

**Tests a crear:**

- ✅ `apps/frontend/src/shared/utils/kpiCalculations.test.ts` (NUEVO archivo)
  - Extraer lógica de cálculo a pure functions
  - Testear todos los cálculos de KPIs (balance, contributions, expenses, pending)
  - Tests de edge cases (valores negativos, arrays vacíos)

**Ventajas:**

- 🛡️ Protección contra regresiones durante migración
- 📚 Documentación de la lógica de negocio
- 🔄 100% reutilizable después de migración
- 🎯 Sirve como especificación para backend

##### 2. Tests de Formatters - **YA COMPLETADOS** ✅

Ya existen y no requieren cambios:

- ✅ `formatAmount.test.ts` (12 tests)
- ✅ `formatDateLong.test.ts` (12 tests)

##### 3. Tests de Componentes UI Puros - **SELECCIONAR CRÍTICOS**

Solo componentes que NO dependen de stores:

```typescript
// ✅ HACER AHORA - UI pura, no depende de storage
describe('KPIBox', () => {
  it('should display label and value', () => {
    render(<KPIBox label="Balance" value="€100.00" colorClass="bg-green-100" />);
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('€100.00')).toBeInTheDocument();
  });
});
```

**Tests a crear:**

- ✅ `KPIBox.test.tsx` (componente de presentación)
- ✅ `PaymentIcon.test.tsx` (componente de presentación)
- ❌ **NO hacer:** EventForm, TransactionForm (dependen de stores)

#### ❌ FASE X: Tests POST-Migración (HACER DESPUÉS)

**Esperar hasta tener backend integrado:**

##### 1. Tests de Stores con API - **RETRASAR**

Estos cambiarán completamente:

- ❌ `useEventsStore.crud.test.ts` - Requerirá MSW para mock de API
- ❌ `useTransactionsStore.crud.test.ts` - Requerirá MSW para mock de API

##### 2. Integration Tests - **RETRASAR**

Flujos completos cambiarán:

- ❌ Event creation flow (incluirá loading states, errores de red)
- ❌ Transaction management flow
- ❌ LocalStorage persistence → Reemplazado por API sync

##### 3. Tests de Componentes con Stores - **RETRASAR**

Requieren mocks de API:

- ❌ EventForm (submit → API call)
- ❌ TransactionForm (submit → API call)
- ❌ EventsList (fetch → API call)

---

### 📋 Plan de Acción Inmediato

#### Paso 1: Refactorizar Lógica de Negocio (1 día)

**Extraer cálculos a pure functions:**

```typescript
// apps/frontend/src/shared/utils/kpiCalculations.ts (NUEVO)
export function calculatePotBalance(transactions: Transaction[]): number {
  const contributions = transactions
    .filter((t) => t.paymentType === 'contribution')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions.filter((t) => t.paymentType === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const compensations = transactions
    .filter((t) => t.paymentType === 'compensation')
    .reduce((sum, t) => sum + t.amount, 0);

  return contributions - expenses - compensations;
}

export function calculateTotalExpensesByParticipant(transactions: Transaction[], participantId: string): number {
  return transactions
    .filter((t) => t.paymentType === 'expense' && t.participantId === participantId)
    .reduce((sum, t) => sum + t.amount, 0);
}

// ... más funciones puras
```

**Actualizar stores para usar estas funciones:**

```typescript
// useTransactionsStore.ts
import { calculatePotBalance, calculateTotalExpensesByParticipant } from '@/shared/utils/kpiCalculations';

const useTransactionsStore = create<TransactionsState>((set, get) => ({
  // ...
  getPotBalanceByEvent: (eventId: string) => {
    const transactions = get().getTransactionsByEvent(eventId);
    return calculatePotBalance(transactions); // ✅ Ahora usa pure function
  },

  getTotalExpensesByParticipant: (eventId: string, participantId: string) => {
    const transactions = get().getTransactionsByEvent(eventId);
    return calculateTotalExpensesByParticipant(transactions, participantId); // ✅ Pure function
  },
}));
```

#### Paso 2: Crear Tests de Pure Functions (2 días)

```typescript
// apps/frontend/src/shared/utils/kpiCalculations.test.ts
describe('KPI Calculations', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 't1',
      eventId: 'e1',
      participantId: 'p1',
      paymentType: 'contribution',
      amount: 100,
      title: 'Initial pot',
      date: '2026-01-01',
    },
    {
      id: 't2',
      eventId: 'e1',
      participantId: 'p2',
      paymentType: 'expense',
      amount: 30,
      title: 'Dinner',
      date: '2026-01-02',
    },
    {
      id: 't3',
      eventId: 'e1',
      participantId: 'p1',
      paymentType: 'compensation',
      amount: 15,
      title: 'Reimbursement',
      date: '2026-01-03',
    },
  ];

  describe('calculatePotBalance', () => {
    it('should calculate contributions - expenses - compensations', () => {
      const result = calculatePotBalance(mockTransactions);
      expect(result).toBe(55); // 100 - 30 - 15
    });

    it('should return 0 for empty transactions', () => {
      expect(calculatePotBalance([])).toBe(0);
    });

    it('should handle negative balances', () => {
      const transactions = [
        { ...mockTransactions[0], amount: 10 },
        { ...mockTransactions[1], amount: 50 },
      ];
      expect(calculatePotBalance(transactions)).toBe(-40);
    });
  });

  describe('calculateTotalExpensesByParticipant', () => {
    it('should sum expenses for specific participant', () => {
      const result = calculateTotalExpensesByParticipant(mockTransactions, 'p2');
      expect(result).toBe(30);
    });

    it('should return 0 for participant with no expenses', () => {
      const result = calculateTotalExpensesByParticipant(mockTransactions, 'p3');
      expect(result).toBe(0);
    });

    it('should exclude contributions and compensations', () => {
      const result = calculateTotalExpensesByParticipant(mockTransactions, 'p1');
      expect(result).toBe(0); // p1 solo tiene contribution y compensation
    });
  });

  describe('calculateBalanceByParticipant', () => {
    it('should calculate contributions - expenses + compensations', () => {
      // Implementar test
    });
  });

  describe('calculatePendingToCompensateByParticipant', () => {
    it('should calculate expenses - compensations paid', () => {
      // Implementar test
    });
  });

  describe('calculateTotalContributionsByParticipant', () => {
    it('should sum contributions for specific participant', () => {
      // Implementar test
    });
  });

  describe('Pot Expenses', () => {
    it('should identify pot expenses (participantId = POT_PARTICIPANT_ID)', () => {
      const potTransaction = {
        ...mockTransactions[1],
        participantId: POT_PARTICIPANT_ID,
      };
      expect(isPotExpense(potTransaction)).toBe(true);
    });

    it('should exclude pot expenses from participant calculations', () => {
      // Test que gastos del bote no afecten cálculos de participantes
    });
  });

  describe('Edge Cases', () => {
    it('should handle transactions with 0 amount', () => {
      const transactions = [{ ...mockTransactions[0], amount: 0 }];
      expect(calculatePotBalance(transactions)).toBe(0);
    });

    it('should handle very large numbers', () => {
      const transactions = [{ ...mockTransactions[0], amount: 999999.99 }];
      expect(calculatePotBalance(transactions)).toBe(999999.99);
    });

    it('should handle decimal precision correctly', () => {
      const transactions = [
        { ...mockTransactions[0], amount: 10.5 },
        { ...mockTransactions[1], amount: 3.75 },
      ];
      expect(calculatePotBalance(transactions)).toBeCloseTo(6.75, 2);
    });
  });
});
```

**Funciones a extraer y testear:**

1. ✅ `calculatePotBalance(transactions)`
2. ✅ `calculateTotalExpensesByEvent(transactions)`
3. ✅ `calculateTotalContributionsByEvent(transactions)`
4. ✅ `calculatePendingToCompensateByEvent(transactions)`
5. ✅ `calculateBalanceByParticipant(transactions, participantId)`
6. ✅ `calculateTotalExpensesByParticipant(transactions, participantId)`
7. ✅ `calculateTotalContributionsByParticipant(transactions, participantId)`
8. ✅ `calculatePendingToCompensateByParticipant(transactions, participantId)`
9. ✅ `getPotExpensesTotal(transactions)`
10. ✅ `isPotExpense(transaction)`

#### Paso 3: Tests Selectivos de UI (1 día)

Solo componentes de presentación pura:

```typescript
// KPIBox.test.tsx
describe('KPIBox', () => {
  it('should render label and value', () => {
    render(<KPIBox label="Balance" value="€100.00" colorClass="bg-green-100" />);
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });

  it('should handle click when provided', async () => {
    const onClick = vi.fn();
    render(<KPIBox label="Balance" value="€100.00" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});

// PaymentIcon.test.tsx
describe('PaymentIcon', () => {
  it('should render correct icon for contribution', () => {
    render(<PaymentIcon type="contribution" />);
    // Verificar que se renderiza FaHandHoldingUsd
  });

  it('should render correct icon for expense', () => {
    render(<PaymentIcon type="expense" />);
    // Verificar que se renderiza FaWallet
  });
});
```

---

### 🎯 Resumen de la Estrategia

#### ✅ HACER AHORA (3-4 días de trabajo)

| Tarea                                               | Esfuerzo   | Prioridad  | Reutilizable Post-Migración |
| --------------------------------------------------- | ---------- | ---------- | --------------------------- |
| Extraer lógica KPI a pure functions                 | 1 día      | 🔴 CRÍTICA | ✅ 100%                     |
| Testear pure functions (KPI calculations)           | 2 días     | 🔴 CRÍTICA | ✅ 100%                     |
| Tests de componentes UI puros (KPIBox, PaymentIcon) | 1 día      | 🟡 MEDIA   | ✅ 80%                      |
| **TOTAL**                                           | **4 días** |            |                             |

**Beneficios inmediatos:**

- 🛡️ **Protección**: Tests garantizan que la migración no rompe cálculos
- 📚 **Documentación**: Los tests sirven como especificación para backend
- 🔄 **Reutilización**: 100% de estos tests seguirán siendo válidos
- 🚀 **Confianza**: Migración más segura con red de seguridad

#### ❌ POSPONER (hasta después de migración backend)

- ❌ Tests de stores con CRUD (requerirá MSW)
- ❌ Tests de componentes con forms (submit → API)
- ❌ Integration tests (flujos completos)
- ❌ Tests de persistencia (LocalStorage → API sync)

**Razones:**

- 🔄 Se reescribirán completamente
- ⏱️ Trabajo duplicado
- 🛠️ Requerirán nuevas herramientas (MSW para mocking de API)

---

### 🗓️ Timeline Propuesto

```
Semana 1 (AHORA)
├─ Día 1: Refactorizar lógica KPI a pure functions
├─ Día 2-3: Tests de KPI calculations (10 funciones)
└─ Día 4: Tests de componentes UI puros

[PAUSA PARA MIGRACIÓN BACKEND]

Semana X (DESPUÉS DE BACKEND)
├─ Setup MSW para mocking de API
├─ Reescribir tests de stores con API calls
├─ Tests de componentes con API integration
└─ Integration tests con backend mockeado
```

---

### 📊 Comparativa: Test Ahora vs. Esperar

| Aspecto                         | Testing Ahora (Full Plan) | Testing Selectivo (Recomendado) | Esperar Totalmente        |
| ------------------------------- | ------------------------- | ------------------------------- | ------------------------- |
| **Esfuerzo inicial**            | 8 semanas                 | 3-4 días                        | 0                         |
| **Esfuerzo post-migración**     | 3-4 semanas (reescribir)  | 6-7 semanas (plan completo)     | 8 semanas (plan completo) |
| **Riesgo durante migración**    | Bajo (red de seguridad)   | Bajo (lógica protegida)         | Alto (sin tests)          |
| **Trabajo duplicado**           | Alto (40-60%)             | Bajo (5-10%)                    | Ninguno                   |
| **Documentación de lógica**     | ✅ Sí                     | ✅ Sí                           | ❌ No                     |
| **Especificación para backend** | ✅ Sí                     | ✅ Sí                           | ❌ No                     |
| **Confianza en migración**      | Alta                      | Alta                            | Baja                      |
| **ROI**                         | Medio                     | ⭐ Alto                         | Bajo                      |

---

### ✅ Decisión Final

**RECOMENDACIÓN: Estrategia Selectiva (Testing PRE-Migración Mínimo)**

1. ✅ **Hacer ahora**: Tests de lógica de negocio (KPIs) - 100% reutilizable
2. ✅ **Hacer ahora**: Tests de componentes UI puros - 80% reutilizable
3. ❌ **Posponer**: Todo lo relacionado con stores y API
4. ❌ **Posponer**: Integration tests

**Razón principal:** Obtener máximo beneficio con mínimo esfuerzo desperdiciado.

**Siguiente paso:** ¿Quieres que empiece con la extracción de pure functions y sus tests?

---

## 1. Análisis de Tipos de Testing Apropiados

### 1.1 Contexto de la Aplicación

**Características de Friends App:**

- ✅ **SPA (Single Page Application)** con React 19
- ✅ **State Management** con Zustand + LocalStorage persistence
- ✅ **Feature-based architecture** (events, transactions, kpi)
- ✅ **i18n** con react-i18next (3 idiomas: es, en, ca)
- ✅ **UI Components** con Radix UI + TailwindCSS
- ✅ **Client-side routing** con React Router DOM 7 (HashRouter)
- ✅ **No backend (yet)** - Toda la lógica en cliente
- ✅ **Cálculos complejos** - KPIs, balances, transacciones

**Riesgos identificados:**

- 🔴 **Alto**: Cálculos incorrectos en KPIs (afecta datos financieros)
- 🔴 **Alto**: Pérdida de datos en LocalStorage (sincronización Zustand)
- 🟡 **Medio**: Regresiones en UI (cambios en componentes visuales)
- 🟡 **Medio**: Rutas rotas (navegación entre páginas)
- 🟢 **Bajo**: Problemas de i18n (traducciones faltantes)

### 1.2 Tipos de Testing Recomendados

#### ✅ **1.2.1 Unit Testing (Prioridad: ALTA)**

**¿Qué testear?**

- ✅ Stores de Zustand (lógica de negocio)
- ✅ Utility functions (formatters, calculators)
- ✅ Hooks personalizados
- ✅ Pure functions (helpers, validators)

**Herramientas:**

- **Vitest** (ya configurado) - Compatible con Vite, rápido
- **@testing-library/react** (ya instalado) - Testing centrado en usuario

**Ventajas:**

- ⚡ Ejecución rápida
- 🎯 Feedback inmediato
- 🔍 Aislamiento de lógica
- 📈 Alta cobertura posible

**Ejemplo actual:**

```typescript
// ✅ Ya implementado
describe('useEventsStore', () => {
  it('should add a new event', () => {
    useEventsStore.getState().addEvent('Summer Trip', participants);
    const { events } = useEventsStore.getState();
    expect(events).toHaveLength(1);
  });
});
```

---

#### ✅ **1.2.2 Component Testing (Prioridad: ALTA)**

**¿Qué testear?**

- ✅ Componentes de UI (renderizado, props, eventos)
- ✅ Componentes con lógica (forms, modals, lists)
- ✅ Componentes que interactúan con stores
- ✅ Componentes de navegación

**Herramientas:**

- **Testing Library** - Queries accesibles (getByRole, getByText)
- **@testing-library/user-event** (ya instalado) - Simular interacciones reales

**Ventajas:**

- 👤 Testing desde la perspectiva del usuario
- 🔗 Detecta problemas de integración entre componentes
- ♿ Valida accesibilidad (aria-labels, roles)

**Ejemplo actual:**

```tsx
// ✅ Ya implementado
describe('TransactionItem', () => {
  it('should render a contribution transaction correctly', () => {
    render(<TransactionItem transaction={...} />);
    expect(screen.getByText('Monthly contribution')).toBeInTheDocument();
    expect(screen.getByText('€100.00')).toBeInTheDocument();
  });
});
```

---

#### ✅ **1.2.3 Integration Testing (Prioridad: MEDIA)**

**¿Qué testear?**

- ✅ Flujos completos de usuario (crear evento → añadir transacción → ver KPI)
- ✅ Integración entre múltiples stores
- ✅ Navegación entre páginas
- ✅ Sincronización con LocalStorage

**Herramientas:**

- **Testing Library** + **React Router** - Testear rutas
- **Vitest** con mocks de localStorage

**Ventajas:**

- 🔗 Valida flujos end-to-end
- 🐛 Detecta problemas de integración
- 💾 Verifica persistencia de datos

**Ejemplo propuesto:**

```tsx
// 🚧 Por implementar
describe('Event Creation Flow', () => {
  it('should create event, add transaction, and update KPI', () => {
    // 1. Crear evento
    // 2. Navegar a detalle
    // 3. Añadir transacción
    // 4. Verificar KPI actualizado
  });
});
```

---

#### ⚠️ **1.2.4 E2E Testing (Prioridad: BAJA - NO RECOMENDADO AHORA)**

**¿Por qué no priorizar E2E?**

- ❌ **Overkill** para app sin backend
- ❌ **Lento** y costoso de mantener
- ❌ **Mejor cobertura con Integration Tests** usando Testing Library
- ❌ **No aporta valor extra** vs. integration tests en esta fase

**Consideración futura:**

- ✅ Revisar cuando se integre backend (@friends/backend)
- ✅ Usar Playwright o Cypress para tests críticos de producción

---

#### ✅ **1.2.5 Visual Regression Testing (Prioridad: BAJA - OPCIONAL)**

**¿Qué testear?**

- ✅ UI de componentes (snapshots visuales)
- ✅ Dark mode vs. Light mode
- ✅ Responsive design (mobile, tablet, desktop)

**Herramientas:**

- **Chromatic** (Storybook + Visual Diff)
- **Percy** (Visual testing en CI)

**Ventajas:**

- 🎨 Detecta regresiones visuales
- 🌗 Valida temas (dark/light mode)

**Desventajas:**

- 💰 Requiere servicios de pago (versiones gratis limitadas)
- ⏱️ Configuración inicial compleja
- 🚫 **No recomendado ahora** - Mejor usar Snapshot Testing con Vitest

---

#### ✅ **1.2.6 Snapshot Testing (Prioridad: BAJA - COMPLEMENTARIO)**

**¿Qué testear?**

- ✅ Componentes de UI estables (no cambian frecuentemente)
- ✅ Outputs de funciones complejas

**Herramientas:**

- **Vitest** (soporte nativo de snapshots)

**Ventajas:**

- 📸 Rápido de implementar
- 🔍 Detecta cambios inesperados

**Desventajas:**

- ⚠️ Puede generar falsos positivos
- 📝 Requiere revisión manual de diffs

**Recomendación:**

- ✅ Usar **selectivamente** para componentes críticos
- ❌ Evitar snapshots de componentes que cambian frecuentemente

---

### 1.3 Pirámide de Testing Recomendada

```
                  🔺
                 /  \
                /    \
               / E2E  \  ← 0% (No implementar ahora)
              /________\
             /          \
            / Integration \ ← 20% (Flujos críticos)
           /______________\
          /                \
         /   Component      \ ← 40% (UI + interacciones)
        /____________________\
       /                      \
      /        Unit            \ ← 40% (Lógica de negocio)
     /__________________________\
```

**Distribución objetivo:**

- **40% Unit Tests** - Stores, utils, hooks
- **40% Component Tests** - UI, forms, lists
- **20% Integration Tests** - Flujos de usuario
- **0% E2E Tests** - No necesario en esta fase

---

## 2. Estado Actual del Testing

### 2.1 Resumen de Cobertura

**Tests existentes:** 5 archivos, 58 tests ✅

```bash
✓ src/features/events/store/useEventsStore.test.ts (8 tests)
✓ src/features/transactions/store/useTransactionsStore.pagination.test.ts (13 tests)
✓ src/shared/utils/formatAmount.test.ts (12 tests)
✓ src/shared/utils/formatDateLong.test.ts (12 tests)
✓ src/features/transactions/components/TransactionItem.test.tsx (13 tests)
```

**Cobertura estimada:**

- ✅ **Stores**: ~30% cubierto (2/6 stores)
- ✅ **Utils**: ~50% cubierto (2/4 utils críticas)
- ✅ **Componentes**: ~5% cubierto (1/30+ componentes)
- ❌ **Pages**: 0% cubierto (0/3 páginas)
- ❌ **Integration**: 0% cubierto

### 2.2 Configuración Existente

#### ✅ Vitest (Configurado en vite.config.ts)

```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
  css: true,
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules/',
      'src/test/',
      '**/*.d.ts',
      '**/*.config.*',
      '**/mockData.ts',
      'src/main.tsx',
    ],
  },
}
```

✅ **Configuración sólida** - jsdom, setup file, coverage con v8

#### ✅ Test Setup (src/test/setup.ts)

```typescript
// ✅ Jest-dom matchers
expect.extend(matchers);

// ✅ Cleanup after each test
afterEach(() => cleanup());

// ✅ Mock localStorage
global.localStorage = localStorageMock;

// ✅ Mock crypto.randomUUID
global.crypto.randomUUID = () => `test-uuid-${++uuidCounter}`;
```

✅ **Setup completo** - localStorage, crypto, matchers

#### ✅ Dependencias Instaladas

```json
{
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.3.1",
  "@testing-library/user-event": "^14.6.1",
  "@vitest/ui": "^4.0.16"
}
```

✅ **Stack moderno** - Todo lo necesario instalado

### 2.3 Análisis de Tests Existentes

#### ✅ **useEventsStore.test.ts** (8 tests - BUENA CALIDAD)

**Cobertura:**

- ✅ addEvent (creación básica)
- ✅ updateEvent (edición)
- ✅ removeEvent (eliminación con cascade)
- ❌ clearParticipantFromEventTransactions (no testeado)

**Puntos fuertes:**

- ✅ Reset de store en beforeEach
- ✅ Verifica IDs únicos (mock de crypto.randomUUID)
- ✅ Testea cascade delete de transacciones

**Mejoras propuestas:**

- 🔧 Añadir tests para clearParticipantFromEventTransactions
- 🔧 Testear persistencia en localStorage

---

#### ✅ **useTransactionsStore.pagination.test.ts** (13 tests - BUENA CALIDAD)

**Cobertura:**

- ✅ Paginación (loadMore, reset, límites)
- ✅ Filtrado por evento
- ❌ Cálculo de KPIs (no testeado)
- ❌ Operaciones CRUD (create, update, delete)

**Puntos fuertes:**

- ✅ Tests exhaustivos de paginación
- ✅ Verifica edge cases (límite de transacciones)

**Mejoras propuestas:**

- 🔧 Crear archivo separado para KPIs: `useTransactionsStore.kpis.test.ts`
- 🔧 Crear archivo separado para CRUD: `useTransactionsStore.crud.test.ts`

---

#### ✅ **formatAmount.test.ts** (12 tests - EXCELENTE CALIDAD)

**Cobertura:**

- ✅ Formatos por locale (es, en, ca)
- ✅ Monedas (EUR, USD, GBP)
- ✅ Grouping (con/sin separador de miles)
- ✅ Edge cases (0, negativos, decimales)

**Puntos fuertes:**

- ✅ Cobertura completa
- ✅ Tests de i18n

---

#### ✅ **formatDateLong.test.ts** (12 tests - EXCELENTE CALIDAD)

**Cobertura:**

- ✅ Formatos por locale
- ✅ Edge cases (fechas inválidas)

---

#### ✅ **TransactionItem.test.tsx** (13 tests - EXCELENTE CALIDAD)

**Cobertura:**

- ✅ Rendering (todos los payment types)
- ✅ Interacción (click, keyboard)
- ✅ Accesibilidad (roles, aria-labels)
- ✅ Pot expenses (caso especial)

**Puntos fuertes:**

- ✅ Mock de i18next
- ✅ Mock de formatAmount
- ✅ Tests de accesibilidad (role, tabIndex, aria-label)
- ✅ Tests de memoization

**Patrón a seguir:**

- ✅ **Este es el gold standard** para component tests

---

### 2.4 Gaps Críticos (Lo que falta)

#### 🔴 **ALTA PRIORIDAD**

1. **Store Tests:**
   - ❌ useTransactionsStore - CRUD operations
   - ❌ useTransactionsStore - KPI calculations
   - ❌ useThemeStore

2. **Component Tests:**
   - ❌ EventForm (forms complejos)
   - ❌ EventFormModal (modals)
   - ❌ ParticipantsInput (input dinámico)
   - ❌ TransactionForm (forms + validación)
   - ❌ TransactionsList (listas + paginación)
   - ❌ KPIBox (navegación)

3. **Page Tests:**
   - ❌ Home (evento list + modal)
   - ❌ EventDetail (orquestación)
   - ❌ KPIDetail (cálculos + drill-down)

#### 🟡 **MEDIA PRIORIDAD**

4. **Integration Tests:**
   - ❌ Event creation flow
   - ❌ Transaction management flow
   - ❌ Navigation flow
   - ❌ LocalStorage persistence

5. **Utility Tests:**
   - ❌ isPotExpense (helper)
   - ❌ cn (class merging)

#### 🟢 **BAJA PRIORIDAD**

6. **UI Components:**
   - ❌ dropdown-menu (Radix UI - ya testeado por librería)
   - ❌ ConfirmDialog
   - ❌ FloatingActionButton

---

## 3. Plan Detallado de Implementación

### 3.1 Roadmap General

**Fases:**

1. **Fase 1** (2 semanas) - Unit Tests (Stores + Utils)
2. **Fase 2** (3 semanas) - Component Tests (Forms + Lists)
3. **Fase 3** (2 semanas) - Integration Tests (Flujos críticos)
4. **Fase 4** (1 semana) - Pages + CI/CD

**Objetivo de cobertura:**

- ✅ **80%** cobertura en stores
- ✅ **70%** cobertura en componentes críticos
- ✅ **60%** cobertura en páginas
- ✅ **Global: 70%+** cobertura total

---

### 3.2 Fase 1: Unit Tests (Stores + Utils) - 2 semanas

#### 📁 **1.1 useTransactionsStore - KPI Calculations**

**Archivo:** `apps/frontend/src/features/transactions/store/useTransactionsStore.kpis.test.ts`

**Tests a implementar:**

```typescript
describe('useTransactionsStore - KPI Calculations', () => {
  describe('getTotalExpensesByEvent', () => {
    it('should calculate total expenses for an event');
    it('should exclude pot expenses from participant expenses');
    it('should return 0 when no expenses exist');
  });

  describe('getTotalContributionsByEvent', () => {
    it('should calculate total contributions for an event');
    it('should return 0 when no contributions exist');
  });

  describe('getPotBalanceByEvent', () => {
    it('should calculate pot balance (contributions - compensations - expenses)');
    it('should handle negative balances correctly');
  });

  describe('getPendingToCompensateByEvent', () => {
    it('should calculate pending compensations (expenses - compensations)');
    it('should return 0 when fully compensated');
  });

  describe('getTotalExpensesByParticipant', () => {
    it('should calculate expenses by participant in an event');
    it('should exclude compensations');
  });

  describe('getTotalContributionsByParticipant', () => {
    it('should calculate contributions by participant in an event');
  });

  describe('getBalanceByParticipant', () => {
    it('should calculate balance (contributions - expenses + compensations received - paid)');
    it('should handle participants with only contributions');
    it('should handle participants with only expenses');
  });

  describe('getPendingToCompensateByParticipant', () => {
    it('should calculate pending by participant (expenses - compensations)');
  });

  describe('getPotExpensesData', () => {
    it('should return pot expenses data');
    it('should return null when no pot expenses exist');
  });
});
```

**Prioridad:** 🔴 ALTA  
**Esfuerzo:** 1 día  
**Dependencias:** Ninguna

---

#### 📁 **1.2 useTransactionsStore - CRUD Operations**

**Archivo:** `apps/frontend/src/features/transactions/store/useTransactionsStore.crud.test.ts`

**Tests a implementar:**

```typescript
describe('useTransactionsStore - CRUD Operations', () => {
  describe('addTransaction', () => {
    it('should add a contribution transaction');
    it('should add an expense transaction');
    it('should add a compensation transaction');
    it('should add a pot expense');
    it('should generate unique ID');
    it('should use current date if not provided');
  });

  describe('updateTransaction', () => {
    it('should update transaction fields');
    it('should not update non-existent transaction');
    it('should preserve ID and eventId');
  });

  describe('deleteTransaction', () => {
    it('should delete transaction by ID');
    it('should not throw on non-existent transaction');
  });

  describe('deleteTransactionsByEvent', () => {
    it('should delete all transactions for an event');
    it('should not delete transactions from other events');
  });

  describe('clearParticipantFromTransactions', () => {
    it('should remove participant ID from all their transactions');
    it('should affect only specified participant');
  });
});
```

**Prioridad:** 🔴 ALTA  
**Esfuerzo:** 1 día  
**Dependencias:** Ninguna

---

#### 📁 **1.3 useThemeStore**

**Archivo:** `apps/frontend/src/shared/store/useThemeStore.test.ts`

**Tests a implementar:**

```typescript
describe('useThemeStore', () => {
  describe('setTheme', () => {
    it('should set theme to light');
    it('should set theme to dark');
    it('should set theme to system');
  });

  describe('initializeTheme', () => {
    it('should use system theme if no localStorage value');
    it('should use stored theme from localStorage');
    it('should apply dark class to document.documentElement');
    it('should remove dark class for light theme');
  });

  describe('system theme detection', () => {
    it('should detect system dark mode');
    it('should detect system light mode');
    it('should update when system preference changes');
  });
});
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 0.5 días  
**Dependencias:** Ninguna

---

#### 📁 **1.4 Utility Functions**

**Archivo:** `apps/frontend/src/shared/utils/isPotExpense.test.ts`

**Tests a implementar:**

```typescript
describe('isPotExpense', () => {
  it('should return true for pot expenses', () => {
    const transaction = {
      id: 't1',
      participantId: POT_PARTICIPANT_ID,
      paymentType: 'expense',
      // ...
    };
    expect(isPotExpense(transaction)).toBe(true);
  });

  it('should return false for participant expenses', () => {
    const transaction = {
      id: 't2',
      participantId: 'p1',
      paymentType: 'expense',
      // ...
    };
    expect(isPotExpense(transaction)).toBe(false);
  });

  it('should return false for pot contributions', () => {
    const transaction = {
      id: 't3',
      participantId: POT_PARTICIPANT_ID,
      paymentType: 'contribution',
      // ...
    };
    expect(isPotExpense(transaction)).toBe(false);
  });
});
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 0.5 días  
**Dependencias:** Crear función isPotExpense si no existe

---

### 3.3 Fase 2: Component Tests (Forms + Lists) - 3 semanas

#### 📁 **2.1 EventForm Component**

**Archivo:** `apps/frontend/src/features/events/components/EventForm.test.tsx`

**Tests a implementar:**

```typescript
describe('EventForm', () => {
  describe('Rendering', () => {
    it('should render form fields (title, date, participants)');
    it('should show initial values when editing');
    it('should disable submit when form is invalid');
  });

  describe('Validation', () => {
    it('should require title');
    it('should require date');
    it('should require at least 1 participant');
    it('should prevent duplicate participant names');
  });

  describe('Submission', () => {
    it('should call onSubmit with form data');
    it('should not submit invalid form');
    it('should reset form after successful submit');
  });

  describe('Participants Management', () => {
    it('should add new participant');
    it('should remove participant');
    it('should update participant name');
  });

  describe('Dirty State', () => {
    it('should track unsaved changes');
    it('should reset dirty state after submit');
  });

  describe('Accessibility', () => {
    it('should have accessible form labels');
    it('should show error messages');
  });
});
```

**Prioridad:** 🔴 ALTA  
**Esfuerzo:** 1.5 días  
**Dependencias:** Ninguna

---

#### 📁 **2.2 EventFormModal Component**

**Archivo:** `apps/frontend/src/features/events/components/EventFormModal.test.tsx`

**Tests a implementar:**

```typescript
describe('EventFormModal', () => {
  describe('Rendering', () => {
    it('should render modal when open is true');
    it('should not render modal when open is false');
    it('should show create title when creating');
    it('should show edit title when editing');
  });

  describe('Interaction', () => {
    it('should call onClose when cancel button clicked');
    it('should call onSubmit when form submitted');
    it('should show confirmation dialog on unsaved changes');
    it('should close without confirmation if no changes');
  });

  describe('Animation', () => {
    it('should animate on open');
    it('should animate on close');
  });

  describe('Accessibility', () => {
    it('should trap focus inside modal');
    it('should close on Escape key');
    it('should return focus after close');
  });
});
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 1 día  
**Dependencias:** EventForm.test.tsx

---

#### 📁 **2.3 ParticipantsInput Component**

**Archivo:** `apps/frontend/src/features/events/components/ParticipantsInput.test.tsx`

**Tests a implementar:**

```typescript
describe('ParticipantsInput', () => {
  describe('Rendering', () => {
    it('should render list of participants');
    it('should show add button');
    it('should show empty state');
  });

  describe('Add Participant', () => {
    it('should add new participant on button click');
    it('should focus new input field');
    it('should prevent duplicate names');
  });

  describe('Edit Participant', () => {
    it('should update participant name');
    it('should call onChange with updated list');
  });

  describe('Remove Participant', () => {
    it('should remove participant');
    it('should call onChange with updated list');
    it('should not remove last participant');
  });

  describe('Validation', () => {
    it('should show error for empty names');
    it('should show error for duplicate names');
  });

  describe('Accessibility', () => {
    it('should have accessible labels');
    it('should support keyboard navigation');
  });
});
```

**Prioridad:** 🔴 ALTA  
**Esfuerzo:** 1 día  
**Dependencias:** Ninguna

---

#### 📁 **2.4 TransactionForm Component**

**Archivo:** `apps/frontend/src/features/transactions/components/TransactionForm.test.tsx`

**Tests a implementar:**

```typescript
describe('TransactionForm', () => {
  describe('Rendering', () => {
    it('should render all form fields');
    it('should show initial values when editing');
    it('should show pot option only for expenses');
  });

  describe('Payment Type Selection', () => {
    it('should change form layout based on payment type');
    it('should show participant dropdown for contribution');
    it('should show participant dropdown + pot for expense');
    it('should show participant dropdown for compensation');
  });

  describe('Validation', () => {
    it('should require title');
    it('should require amount');
    it('should require participant');
    it('should validate amount is positive');
  });

  describe('Submission', () => {
    it('should call onSubmit with form data');
    it('should not submit invalid form');
  });

  describe('Accessibility', () => {
    it('should have accessible labels');
    it('should show error messages');
  });
});
```

**Prioridad:** 🔴 ALTA  
**Esfuerzo:** 1.5 días  
**Dependencias:** TransactionTypeSelector.test.tsx

---

#### 📁 **2.5 TransactionTypeSelector Component**

**Archivo:** `apps/frontend/src/features/transactions/components/TransactionTypeSelector.test.tsx`

**Tests a implementar:**

```typescript
describe('TransactionTypeSelector', () => {
  describe('Rendering', () => {
    it('should render all payment type buttons');
    it('should show icons and labels');
    it('should highlight selected type');
  });

  describe('Selection', () => {
    it('should call onChange when type clicked');
    it('should update selected state');
  });

  describe('Accessibility', () => {
    it('should have role="radiogroup"');
    it('should support keyboard navigation (arrow keys)');
    it('should have aria-checked on selected button');
  });
});
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 0.5 días  
**Dependencias:** Ninguna

---

#### 📁 **2.6 TransactionsList Component**

**Archivo:** `apps/frontend/src/features/transactions/components/TransactionsList.test.tsx`

**Tests a implementar:**

```typescript
describe('TransactionsList', () => {
  describe('Rendering', () => {
    it('should render list of transactions');
    it('should show empty state when no transactions');
    it('should group transactions by date');
  });

  describe('Pagination', () => {
    it('should show initial page of transactions');
    it('should load more on button click');
    it('should hide button when all loaded');
  });

  describe('Interaction', () => {
    it('should open edit modal on transaction click');
  });

  describe('Accessibility', () => {
    it('should have accessible list structure');
    it('should support keyboard navigation');
  });
});
```

**Prioridad:** 🔴 ALTA  
**Esfuerzo:** 1 día  
**Dependencias:** TransactionItem.test.tsx (ya existe)

---

#### 📁 **2.7 EventsList Component**

**Archivo:** `apps/frontend/src/features/events/components/EventsList.test.tsx`

**Tests a implementar:**

```typescript
describe('EventsList', () => {
  describe('Rendering', () => {
    it('should render list of events');
    it('should show empty state when no events');
    it('should display event title and date');
  });

  describe('Navigation', () => {
    it('should navigate to event detail on click');
  });

  describe('Accessibility', () => {
    it('should have accessible list structure');
    it('should support keyboard navigation');
  });
});
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 0.5 días  
**Dependencias:** Ninguna

---

#### 📁 **2.8 KPIBox Component**

**Archivo:** `apps/frontend/src/features/events/components/KPIBox.test.tsx`

**Tests a implementar:**

```typescript
describe('KPIBox', () => {
  describe('Rendering', () => {
    it('should display label and value');
    it('should apply color classes');
  });

  describe('Interaction', () => {
    it('should call onClick when clicked');
    it('should show pointer cursor when clickable');
  });

  describe('Accessibility', () => {
    it('should have role="button" when clickable');
    it('should support keyboard interaction');
  });
});
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 0.5 días  
**Dependencias:** Ninguna

---

#### 📁 **2.9 KPI Feature Components**

**Archivo:** `apps/frontend/src/features/kpi/components/KPIParticipantsList.test.tsx`

**Tests a implementar:**

```typescript
describe('KPIParticipantsList', () => {
  describe('Rendering', () => {
    it('should render list of participants');
    it('should highlight pot with special styling');
    it('should apply color classes');
  });

  describe('Empty State', () => {
    it('should show empty message when no items');
  });

  describe('Accessibility', () => {
    it('should have accessible list structure');
  });
});
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 0.5 días  
**Dependencias:** Ninguna

---

### 3.4 Fase 3: Integration Tests (Flujos críticos) - 2 semanas

#### 📁 **3.1 Event Creation Flow**

**Archivo:** `apps/frontend/src/__tests__/integration/eventCreationFlow.test.tsx`

**Tests a implementar:**

```typescript
describe('Event Creation Flow (Integration)', () => {
  it('should create event and navigate to detail', async () => {
    const user = userEvent.setup();

    render(<App />);

    // 1. Click FAB to open modal
    const fab = screen.getByLabelText(/add event/i);
    await user.click(fab);

    // 2. Fill form
    await user.type(screen.getByLabelText(/title/i), 'Summer Trip');
    await user.type(screen.getByLabelText(/date/i), '2026-06-15');
    await user.type(screen.getByLabelText(/participant/i), 'Alice');
    await user.click(screen.getByText(/add participant/i));
    await user.type(screen.getAllByLabelText(/participant/i)[1], 'Bob');

    // 3. Submit
    await user.click(screen.getByText(/create/i));

    // 4. Verify navigation to detail page
    expect(screen.getByText('Summer Trip')).toBeInTheDocument();
    expect(screen.getByText(/pot balance/i)).toBeInTheDocument();
  });

  it('should persist event in localStorage', async () => {
    // ... test localStorage persistence
  });
});
```

**Prioridad:** 🔴 ALTA  
**Esfuerzo:** 1 día  
**Dependencias:** Component tests completados

---

#### 📁 **3.2 Transaction Management Flow**

**Archivo:** `apps/frontend/src/__tests__/integration/transactionFlow.test.tsx`

**Tests a implementar:**

```typescript
describe('Transaction Management Flow (Integration)', () => {
  it('should add transaction and update KPI', async () => {
    // Setup: Create event first
    // 1. Navigate to event detail
    // 2. Add contribution transaction
    // 3. Verify KPI updated (pot balance increased)
    // 4. Verify transaction appears in list
  });

  it('should edit transaction and recalculate KPIs', async () => {
    // Setup: Event + transaction
    // 1. Click transaction to edit
    // 2. Change amount
    // 3. Submit
    // 4. Verify KPIs recalculated
  });

  it('should delete transaction and update KPIs', async () => {
    // Setup: Event + transaction
    // 1. Delete transaction
    // 2. Verify KPIs updated
    // 3. Verify not in list
  });
});
```

**Prioridad:** 🔴 ALTA  
**Esfuerzo:** 1.5 días  
**Dependencias:** Component tests completados

---

#### 📁 **3.3 Navigation Flow**

**Archivo:** `apps/frontend/src/__tests__/integration/navigationFlow.test.tsx`

**Tests a implementar:**

```typescript
describe('Navigation Flow (Integration)', () => {
  it('should navigate Home → EventDetail → KPIDetail → EventDetail → Home', async () => {
    const user = userEvent.setup();

    render(<App />);

    // 1. Click event to go to detail
    await user.click(screen.getByText('Summer Trip'));
    expect(screen.getByText(/pot balance/i)).toBeInTheDocument();

    // 2. Click KPI to go to drill-down
    await user.click(screen.getByText(/pot balance/i));
    expect(screen.getByText(/participants/i)).toBeInTheDocument();

    // 3. Click back to event detail
    await user.click(screen.getByLabelText(/back/i));
    expect(screen.getByText('Summer Trip')).toBeInTheDocument();

    // 4. Click back to home
    await user.click(screen.getByLabelText(/back/i));
    expect(screen.getByText(/your events/i)).toBeInTheDocument();
  });
});
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 1 día  
**Dependencias:** Ninguna

---

#### 📁 **3.4 LocalStorage Persistence**

**Archivo:** `apps/frontend/src/__tests__/integration/localStorage.test.tsx`

**Tests a implementar:**

```typescript
describe('LocalStorage Persistence (Integration)', () => {
  it('should persist events across page reloads', async () => {
    // 1. Create event
    // 2. Verify in localStorage
    // 3. Simulate page reload (remount app)
    // 4. Verify event still exists
  });

  it('should persist transactions across page reloads', async () => {
    // Similar to events test
  });

  it('should persist theme preference', async () => {
    // 1. Change theme to dark
    // 2. Verify in localStorage
    // 3. Reload
    // 4. Verify dark theme applied
  });
});
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 1 día  
**Dependencias:** Ninguna

---

### 3.5 Fase 4: Pages + CI/CD - 1 semana

#### 📁 **4.1 Home Page**

**Archivo:** `apps/frontend/src/pages/Home.test.tsx`

**Tests a implementar:**

```typescript
describe('Home Page', () => {
  describe('Rendering', () => {
    it('should render logo and language menu');
    it('should render events list');
    it('should render FAB');
  });

  describe('Modal State', () => {
    it('should open modal on FAB click');
    it('should close modal on cancel');
  });

  describe('Event Management', () => {
    it('should create event and close modal');
  });
});
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 0.5 días  
**Dependencias:** Component tests completados

---

#### 📁 **4.2 EventDetail Page**

**Archivo:** `apps/frontend/src/pages/EventDetail.test.tsx`

**Tests a implementar:**

```typescript
describe('EventDetail Page', () => {
  describe('Rendering', () => {
    it('should render header with title');
    it('should render KPI grid');
    it('should render transactions list');
  });

  describe('Modal State', () => {
    it('should open edit modal');
    it('should open transaction modal');
    it('should show delete confirmation');
  });

  describe('Event Management', () => {
    it('should update event');
    it('should delete event and navigate to home');
  });
});
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 1 día  
**Dependencias:** Component tests completados

---

#### 📁 **4.3 KPIDetail Page**

**Archivo:** `apps/frontend/src/pages/KPIDetail.test.tsx`

**Tests a implementar:**

```typescript
describe('KPIDetail Page', () => {
  describe('Rendering', () => {
    it('should render header with event title');
    it('should render KPI box');
    it('should render participants list');
    it('should render explanation');
  });

  describe('KPI Calculations', () => {
    it('should display correct balance values');
    it('should display correct contributions');
    it('should display correct expenses (including pot)');
    it('should display correct pending amounts');
  });

  describe('Pot Integration', () => {
    it('should show pot in expenses KPI');
    it('should not show pot in contributions KPI');
  });
});
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 1 día  
**Dependencias:** Component tests completados

---

#### 📁 **4.4 CI/CD Integration**

**Archivo:** `.github/workflows/test.yml` (actualizar existente)

**Configuración a añadir:**

```yaml
name: Test Frontend

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.27.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm --filter @friends/frontend test:run

      - name: Generate coverage
        run: pnpm --filter @friends/frontend test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./apps/frontend/coverage/coverage-final.json
          flags: frontend
          fail_ci_if_error: true

      - name: Check coverage threshold
        run: |
          # Fail if coverage < 70%
          pnpm --filter @friends/frontend test:coverage --reporter=json | \
          jq '.total.lines.pct < 70' | \
          xargs -I {} test {} = false
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 0.5 días  
**Dependencias:** Coverage configurado

---

### 3.6 Checklist de Implementación

#### ✅ Fase 1: Unit Tests (2 semanas)

- [ ] **useTransactionsStore - KPI Calculations** (1 día)
  - [ ] getTotalExpensesByEvent
  - [ ] getTotalContributionsByEvent
  - [ ] getPotBalanceByEvent
  - [ ] getPendingToCompensateByEvent
  - [ ] Per-participant KPI calculations
  - [ ] getPotExpensesData

- [ ] **useTransactionsStore - CRUD Operations** (1 día)
  - [ ] addTransaction (all types)
  - [ ] updateTransaction
  - [ ] deleteTransaction
  - [ ] deleteTransactionsByEvent
  - [ ] clearParticipantFromTransactions

- [ ] **useThemeStore** (0.5 días)
  - [ ] setTheme (light/dark/system)
  - [ ] initializeTheme
  - [ ] System theme detection

- [ ] **Utility Functions** (0.5 días)
  - [ ] isPotExpense

---

#### ✅ Fase 2: Component Tests (3 semanas)

- [ ] **EventForm** (1.5 días)
  - [ ] Rendering + Validation
  - [ ] Submission
  - [ ] Participants management
  - [ ] Dirty state tracking

- [ ] **EventFormModal** (1 día)
  - [ ] Rendering (create/edit modes)
  - [ ] Interaction (close, submit)
  - [ ] Unsaved changes confirmation

- [ ] **ParticipantsInput** (1 día)
  - [ ] Add/Edit/Remove participants
  - [ ] Validation (duplicates, empty)

- [ ] **TransactionForm** (1.5 días)
  - [ ] Rendering (all payment types)
  - [ ] Pot option for expenses
  - [ ] Validation

- [ ] **TransactionTypeSelector** (0.5 días)
  - [ ] Rendering + Selection
  - [ ] Accessibility (keyboard)

- [ ] **TransactionsList** (1 día)
  - [ ] Rendering + Pagination
  - [ ] Empty state
  - [ ] Interaction (click to edit)

- [ ] **EventsList** (0.5 días)
  - [ ] Rendering + Navigation

- [ ] **KPIBox** (0.5 días)
  - [ ] Rendering + Click interaction

- [ ] **KPIParticipantsList** (0.5 días)
  - [ ] Rendering + Pot styling

---

#### ✅ Fase 3: Integration Tests (2 semanas)

- [ ] **Event Creation Flow** (1 día)
  - [ ] Create event → Navigate to detail
  - [ ] LocalStorage persistence

- [ ] **Transaction Management Flow** (1.5 días)
  - [ ] Add transaction → Update KPI
  - [ ] Edit transaction → Recalculate
  - [ ] Delete transaction → Update KPI

- [ ] **Navigation Flow** (1 día)
  - [ ] Home → Detail → KPI → Back navigation

- [ ] **LocalStorage Persistence** (1 día)
  - [ ] Events persistence
  - [ ] Transactions persistence
  - [ ] Theme persistence

---

#### ✅ Fase 4: Pages + CI/CD (1 semana)

- [ ] **Home Page** (0.5 días)
  - [ ] Rendering + Modal state

- [ ] **EventDetail Page** (1 día)
  - [ ] Rendering + Modals
  - [ ] Event management (edit/delete)

- [ ] **KPIDetail Page** (1 día)
  - [ ] Rendering + KPI calculations
  - [ ] Pot integration

- [ ] **CI/CD Integration** (0.5 días)
  - [ ] Setup GitHub Actions workflow
  - [ ] Configure Codecov
  - [ ] Add coverage threshold

---

### 3.7 Métricas de Éxito

**Cobertura objetivo:**

- ✅ **Stores**: 80%+ (actualmente ~30%)
- ✅ **Components**: 70%+ (actualmente ~5%)
- ✅ **Pages**: 60%+ (actualmente 0%)
- ✅ **Utilities**: 80%+ (actualmente ~50%)
- ✅ **Global**: 70%+ (actualmente desconocido)

**Número de tests objetivo:**

- ✅ **Unit Tests**: ~80 tests (actualmente 33)
- ✅ **Component Tests**: ~100 tests (actualmente 13)
- ✅ **Integration Tests**: ~15 tests (actualmente 0)
- ✅ **Pages Tests**: ~20 tests (actualmente 0)
- ✅ **Total**: ~215 tests (actualmente 58)

**Velocidad de ejecución:**

- ✅ Unit tests: < 5 segundos
- ✅ Component tests: < 15 segundos
- ✅ Integration tests: < 30 segundos
- ✅ Total: < 1 minuto

**CI/CD:**

- ✅ Tests ejecutados en cada PR
- ✅ Coverage report automático
- ✅ Bloquear merge si coverage < 70%

---

## 4. Recursos y Herramientas

### 4.1 Documentación

**Testing Library:**

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

**Vitest:**

- [Vitest Guide](https://vitest.dev/guide/)
- [Vitest API](https://vitest.dev/api/)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)

**React Testing:**

- [React Testing Recipes](https://react.dev/reference/react/testing)
- [Testing React Hooks](https://react-hooks-testing-library.com/)

### 4.2 Herramientas Adicionales

**Coverage Reporting:**

- [Codecov](https://codecov.io/) - Coverage tracking (free para open source)
- [Coveralls](https://coveralls.io/) - Alternativa a Codecov

**Visual Testing (Opcional):**

- [Storybook](https://storybook.js.org/) - Component documentation
- [Chromatic](https://www.chromatic.com/) - Visual regression testing

**Accessibility Testing:**

- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [jest-axe](https://github.com/nickcolley/jest-axe) - Automated a11y tests

### 4.3 Convenciones de Testing

**Naming:**

```typescript
// ✅ Good
describe('ComponentName', () => {
  describe('Feature', () => {
    it('should do something specific', () => {
      // test
    });
  });
});

// ❌ Bad
test('works', () => {
  /* ... */
});
```

**Arrange-Act-Assert Pattern:**

```typescript
it('should add event to store', () => {
  // Arrange - Setup test data
  const participants = [{ id: 'p1', name: 'Alice' }];

  // Act - Execute action
  useEventsStore.getState().addEvent('Trip', participants);

  // Assert - Verify result
  const { events } = useEventsStore.getState();
  expect(events).toHaveLength(1);
  expect(events[0].title).toBe('Trip');
});
```

**Mock Best Practices:**

```typescript
// ✅ Mock external dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ✅ Reset mocks in beforeEach
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useEventsStore.setState({ events: [] });
});

// ❌ Don't mock implementation details
// Mock at the boundary (stores, APIs, not internal functions)
```

**User-Centric Testing:**

```typescript
// ✅ Good - Test like a user
const button = screen.getByRole('button', { name: /add event/i });
await user.click(button);

// ❌ Bad - Test implementation details
const button = container.querySelector('.add-button');
button.click();
```

---

## 5. Conclusiones y Recomendaciones

### 5.1 Resumen Ejecutivo

**Estado actual:**

- ✅ Infraestructura sólida (Vitest + Testing Library)
- ✅ 58 tests existentes (buena base)
- ❌ Cobertura baja (~30% estimado)
- ❌ Gaps críticos en componentes y flujos

**Plan propuesto:**

- 📅 **8 semanas** de implementación
- 🎯 **215 tests** objetivo (+157 nuevos)
- 📊 **70%+ cobertura** global
- 🚀 **CI/CD** con coverage tracking

**Inversión:**

- ⏱️ **8 semanas** de desarrollo
- 💰 **ROI alto** - Detecta bugs temprano, reduce regresiones
- 🛡️ **Confianza** para refactors y nuevas features

### 5.2 Próximos Pasos Inmediatos

1. **✅ Aprobar este plan** (revisar y ajustar si necesario)
2. **🚀 Fase 1** - Empezar con unit tests de stores (2 semanas)
3. **📊 Baseline** - Ejecutar coverage actual: `pnpm test:coverage`
4. **📝 Tracking** - Crear GitHub Project para seguimiento

### 5.3 Riesgos y Mitigaciones

**Riesgo 1: Falta de tiempo**

- ✅ Mitigation: Priorizar tests de alta prioridad primero
- ✅ Mitigation: Implementar tests en paralelo al desarrollo de features

**Riesgo 2: Tests frágiles (flaky)**

- ✅ Mitigation: Evitar timeouts arbitrarios
- ✅ Mitigation: Usar waitFor de Testing Library
- ✅ Mitigation: Reset state en beforeEach

**Riesgo 3: Bajo coverage en CI**

- ✅ Mitigation: Empezar con threshold bajo (50%) y aumentar gradualmente
- ✅ Mitigation: Excluir archivos de bajo valor (configs, demo data)

### 5.4 Mantenimiento Continuo

**Después de la implementación:**

- ✅ **Regla**: Todo nuevo componente debe incluir tests
- ✅ **Regla**: Todo bug fix debe incluir regression test
- ✅ **Regla**: Mantener coverage > 70% en CI
- ✅ **Review**: Revisión mensual de tests obsoletos/duplicados

---

**Documento creado por:** GitHub Copilot  
**Fecha:** 3 de enero de 2026  
**Versión:** 1.0  
**Estado:** 📋 Propuesta - Pendiente de aprobación
