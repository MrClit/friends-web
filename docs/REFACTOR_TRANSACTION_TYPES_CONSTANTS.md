# Refactor: Centralizar constantes de tipos de transacción

## 📋 Objetivo

Centralizar la configuración de los tipos de transacción (iconos, colores) en un único archivo de constantes para eliminar duplicación y mejorar la mantenibilidad.

## 🔍 Análisis de la situación actual

### Duplicación detectada

**TransactionTypeSelector.tsx** (línea 11-15):
```typescript
const TRANSACTION_TYPES: { key: PaymentType; icon: JSX.Element }[] = [
  { key: 'contribution', icon: <FaHandHoldingUsd className="text-blue-700 dark:text-blue-200" /> },
  { key: 'expense', icon: <FaWallet className="text-red-700 dark:text-red-200" /> },
  { key: 'compensation', icon: <FaHandshake className="text-green-700 dark:text-green-200" /> },
];
```

**TransactionsList.tsx** (línea 14-26):
```typescript
const ICONS: Record<PaymentType, JSX.Element> = {
  contribution: <FaHandHoldingUsd className="text-blue-800 dark:text-blue-200" />,
  expense: <FaWallet className="text-red-800 dark:text-red-200" />,
  compensation: <FaHandshake className="text-green-800 dark:text-green-200" />,
};

const TEXT_COLOR_CLASSES: Record<PaymentType, string> = {
  contribution: 'text-blue-800 dark:text-blue-200',
  expense: 'text-red-800 dark:text-red-200',
  compensation: 'text-green-800 dark:text-green-200',
};
```

### Diferencias importantes

- **TransactionTypeSelector**: usa `text-*-700` (iconos en botones con fondo)
- **TransactionsList**: usa `text-*-800` (iconos sobre fondo blanco)

## 🎯 Solución propuesta

### 1. Crear archivo de constantes centralizado

**Ubicación**: `src/features/transactions/constants.ts`

**Contenido**:
```typescript
import { FaHandHoldingUsd, FaWallet, FaHandshake, FaPiggyBank } from 'react-icons/fa';
import type { PaymentType } from './types';
import type { ComponentType } from 'react';

/**
 * Array of all payment types for iteration
 */
export const PAYMENT_TYPES: readonly PaymentType[] = [
  'contribution',
  'expense',
  'compensation',
] as const;

/**
 * Centralized configuration for payment types
 * Includes icon components and color variants for different contexts
 */
export const PAYMENT_TYPE_CONFIG: Record<
  PaymentType,
  {
    IconComponent: ComponentType<{ className?: string }>;
    colorLight: string; // 700 shade - for colored backgrounds (buttons, chips)
    colorStrong: string; // 800 shade - for white/transparent backgrounds
  }
> = {
  contribution: {
    IconComponent: FaHandHoldingUsd,
    colorLight: 'text-blue-700 dark:text-blue-200',
    colorStrong: 'text-blue-800 dark:text-blue-200',
  },
  expense: {
    IconComponent: FaWallet,
    colorLight: 'text-red-700 dark:text-red-200',
    colorStrong: 'text-red-800 dark:text-red-200',
  },
  compensation: {
    IconComponent: FaHandshake,
    colorLight: 'text-green-700 dark:text-green-200',
    colorStrong: 'text-green-800 dark:text-green-200',
  },
};

/**
 * Configuration for pot (bote) expenses
 * Used when a transaction is made by the common pot
 */
export const POT_CONFIG = {
  IconComponent: FaPiggyBank,
  colorClass: 'text-orange-800 dark:text-orange-200',
} as const;
```

### 2. Actualizar TransactionTypeSelector.tsx

**Cambios**:

1. **Imports** (línea 1-4):
```typescript
// ANTES
import type { PaymentType } from '../types';
import type { JSX } from 'react/jsx-runtime';
import { FaHandHoldingUsd, FaWallet, FaHandshake } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// DESPUÉS
import type { PaymentType } from '../types';
import { useTranslation } from 'react-i18next';
import { PAYMENT_TYPES, PAYMENT_TYPE_CONFIG } from '../constants';
```

2. **Eliminar constante local** (línea 11-15):
```typescript
// ELIMINAR ESTO
const TRANSACTION_TYPES: { key: PaymentType; icon: JSX.Element }[] = [
  { key: 'contribution', icon: <FaHandHoldingUsd className="text-blue-700 dark:text-blue-200" /> },
  { key: 'expense', icon: <FaWallet className="text-red-700 dark:text-red-200" /> },
  { key: 'compensation', icon: <FaHandshake className="text-green-700 dark:text-green-200" /> },
];
```

3. **Actualizar render** (línea 22-35):
```typescript
// ANTES
{TRANSACTION_TYPES.map(tType => (
  <button
    key={tType.key}
    className={`flex-1 flex  items-center justify-center gap-2 px-2 py-2 rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:z-10 text-xs sm:text-sm
      ${value === tType.key
        ? 'bg-white dark:bg-teal-600 text-teal-700 dark:text-white shadow-md scale-105'
        : 'bg-transparent text-teal-500 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-700'}`}
    onClick={() => onChange(tType.key)}
    type="button"
    style={{ minWidth: 0 }}
  >
    <span className="text-base flex items-center">{tType.icon}</span>
    <span>{t(`transactionTypeSelector.${tType.key}`)}</span>
  </button>
))}

// DESPUÉS
{PAYMENT_TYPES.map(type => {
  const config = PAYMENT_TYPE_CONFIG[type];
  const IconComponent = config.IconComponent;
  return (
    <button
      key={type}
      className={`flex-1 flex  items-center justify-center gap-2 px-2 py-2 rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:z-10 text-xs sm:text-sm
        ${value === type
          ? 'bg-white dark:bg-teal-600 text-teal-700 dark:text-white shadow-md scale-105'
          : 'bg-transparent text-teal-500 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-700'}`}
      onClick={() => onChange(type)}
      type="button"
      style={{ minWidth: 0 }}
    >
      <span className="text-base flex items-center">
        <IconComponent className={config.colorLight} />
      </span>
      <span>{t(`transactionTypeSelector.${type}`)}</span>
    </button>
  );
})}
```

### 3. Actualizar TransactionsList.tsx

**Cambios**:

1. **Imports** (línea 1-12):
```typescript
// ANTES
import { FaHandHoldingUsd, FaWallet, FaHandshake, FaPiggyBank } from 'react-icons/fa';
import type { Transaction } from '../types';
import type { PaymentType } from '../types';
import type { JSX } from 'react/jsx-runtime';
import type { Event } from '../../events/types';
import TransactionModal from './TransactionModal';
import { useState } from 'react';
import { formatAmount } from '../../../shared/utils/formatAmount';
import { formatDateLong } from '../../../shared/utils/formatDateLong';
import { useTranslation } from 'react-i18next';
import { useTransactionsStore } from '../store/useTransactionsStore';

// DESPUÉS
import type { Transaction } from '../types';
import type { Event } from '../../events/types';
import TransactionModal from './TransactionModal';
import { useState } from 'react';
import { formatAmount } from '../../../shared/utils/formatAmount';
import { formatDateLong } from '../../../shared/utils/formatDateLong';
import { useTranslation } from 'react-i18next';
import { useTransactionsStore } from '../store/useTransactionsStore';
import { PAYMENT_TYPE_CONFIG, POT_CONFIG } from '../constants';
```

2. **Eliminar constantes locales** (línea 14-26):
```typescript
// ELIMINAR ESTO
const ICONS: Record<PaymentType, JSX.Element> = {
  contribution: <FaHandHoldingUsd className="text-blue-800 dark:text-blue-200" />,
  expense: <FaWallet className="text-red-800 dark:text-red-200" />,
  compensation: <FaHandshake className="text-green-800 dark:text-green-200" />,
};

const TEXT_COLOR_CLASSES: Record<PaymentType, string> = {
  contribution: 'text-blue-800 dark:text-blue-200',
  expense: 'text-red-800 dark:text-red-200',
  compensation: 'text-green-800 dark:text-green-200',
};
```

3. **Actualizar render del icono** (línea 71-73):
```typescript
// ANTES
<span className={`text-xl ${isPotExpense(trx) ? 'text-orange-800 dark:text-orange-200' : TEXT_COLOR_CLASSES[trx.paymentType]}`}>
  {isPotExpense(trx) ? <FaPiggyBank className="text-orange-800 dark:text-orange-200" /> : ICONS[trx.paymentType]}
</span>

// DESPUÉS
<span className="text-xl">
  {isPotExpense(trx) ? (
    <POT_CONFIG.IconComponent className={POT_CONFIG.colorClass} />
  ) : (
    (() => {
      const config = PAYMENT_TYPE_CONFIG[trx.paymentType];
      const IconComponent = config.IconComponent;
      return <IconComponent className={config.colorStrong} />;
    })()
  )}
</span>
```

4. **Actualizar clase de texto del monto** (línea 85):
```typescript
// ANTES
<div className={`font-bold text-lg tabular-nums ${isPotExpense(trx) ? 'text-orange-800 dark:text-orange-200' : TEXT_COLOR_CLASSES[trx.paymentType]}`}>
  {formatAmount(trx.amount)}
</div>

// DESPUÉS
<div className={`font-bold text-lg tabular-nums ${isPotExpense(trx) ? POT_CONFIG.colorClass : PAYMENT_TYPE_CONFIG[trx.paymentType].colorStrong}`}>
  {formatAmount(trx.amount)}
</div>
```

### 4. Exportar en index.ts

**Archivo**: `src/features/transactions/index.ts`

```typescript
// Añadir estas líneas
export { PAYMENT_TYPES, PAYMENT_TYPE_CONFIG, POT_CONFIG } from './constants';
export type { PaymentType } from './types';
```

## ✅ Checklist de implementación

### Paso 1: Crear archivo de constantes
- [x] 1.1. Crear `src/features/transactions/constants.ts` con `PAYMENT_TYPES`, `PAYMENT_TYPE_CONFIG` y `POT_CONFIG`

### Paso 2: Refactorizar TransactionTypeSelector.tsx
- [x] 2.1. Actualizar imports (eliminar react-icons, añadir constantes)
- [x] 2.2. Eliminar constante local `TRANSACTION_TYPES`
- [x] 2.3. Actualizar render del map para usar `PAYMENT_TYPES` y `PAYMENT_TYPE_CONFIG`
- [x] 2.4. Renderizar iconos dinámicamente con `IconComponent` y `colorLight`

### Paso 3: Refactorizar TransactionsList.tsx
- [x] 3.1. Actualizar imports (eliminar react-icons excepto FaPiggyBank temporalmente, añadir constantes con POT_CONFIG)
- [x] 3.2. Eliminar constantes locales `ICONS` y `TEXT_COLOR_CLASSES`
- [x] 3.3. Actualizar render del icono usando `POT_CONFIG` para pot expenses y `PAYMENT_TYPE_CONFIG` para el resto
- [x] 3.4. Actualizar clase de texto del monto usando las constantes centralizadas
- [x] 3.5. Eliminar import de FaPiggyBank una vez confirmado que POT_CONFIG funciona

### Paso 4: Exportar API pública
- [x] 4.1. Actualizar `src/features/transactions/index.ts` para exportar `PAYMENT_TYPES`, `PAYMENT_TYPE_CONFIG` y `POT_CONFIG`

### Paso 5: Verificación
- [x] 5.1. Ejecutar `pnpm build` y verificar que no hay errores TypeScript
- [x] 5.2. Probar visualmente `TransactionTypeSelector` en light y dark mode
- [x] 5.3. Probar visualmente `TransactionsList` con transacciones normales
- [x] 5.4. Probar visualmente `TransactionsList` con pot expenses (icono naranja)
- [x] 5.5. Verificar que todos los colores se mantienen correctos (700 vs 800)

## 🧪 Verificación

### Tests visuales

1. **TransactionTypeSelector**:
   - ✓ Los iconos se muestran correctamente
   - ✓ Los colores son 700/200 (más suaves)
   - ✓ El botón activo cambia de apariencia
   - ✓ Dark mode funciona correctamente

2. **TransactionsList**:
   - ✓ Los iconos se muestran correctamente
   - ✓ Los colores son 800/200 (más intensos)
   - ✓ El pot expense mantiene su icono naranja
   - ✓ Dark mode funciona correctamente
   - ✓ Los montos tienen el color correcto

### Build & type checking

```bash
pnpm build  # Debe compilar sin errores TypeScript
```

## 📊 Beneficios del refactor

✅ **Single source of truth**: Toda la metadata de payment types en un solo lugar  
✅ **Type safety**: TypeScript garantiza que todos los tipos están cubiertos  
✅ **Mantenibilidad**: Cambiar un icono o color se hace en un solo sitio  
✅ **Escalabilidad**: Fácil añadir nuevos payment types en el futuro  
✅ **Consistencia**: Garantiza que los mismos tipos usan los mismos iconos  
✅ **Reducción de duplicación**: ~30 líneas de código menos

## 🔮 Futuras mejoras posibles

- Añadir método helper `getPaymentTypeIcon(type, variant)` si se necesitan más variantes
- Crear un componente `<PaymentTypeIcon type={type} variant="light|strong" />` para mayor reutilización
- Añadir tests unitarios para las constantes exportadas
