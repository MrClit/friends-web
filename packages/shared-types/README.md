# @friends/shared-types

> Shared TypeScript types between frontend and backend

This package is the single source of truth for types shared across the Friends monorepo.
Both `@friends/frontend` and `@friends/backend` import from here.

---

## Exported types

### `EventStatus`

Const object + derived union type for event status values.

```ts
import { EventStatus } from '@friends/shared-types';

EventStatus.ACTIVE    // 'active'
EventStatus.ARCHIVED  // 'archived'

type EventStatus = 'active' | 'archived';
```

### `PaymentType`

Const object + derived union type for transaction payment types.

```ts
import { PaymentType } from '@friends/shared-types';

PaymentType.CONTRIBUTION  // 'contribution'
PaymentType.EXPENSE       // 'expense'
PaymentType.COMPENSATION  // 'compensation'

type PaymentType = 'contribution' | 'expense' | 'compensation';
```

### Participant types

```ts
import type { UserParticipant, GuestParticipant, PotParticipant, EventParticipant } from '@friends/shared-types';
```

- `UserParticipant` — participant linked to a registered user (`type: 'user'`)
- `GuestParticipant` — guest participant without an account (`type: 'guest'`)
- `PotParticipant` — shared pot participant (`type: 'pot'`, `id: '0'`)
- `EventParticipant` — union of the three above

---

## Package structure

```
src/
├── event.types.ts        # EventStatus
├── transaction.types.ts  # PaymentType
├── participant.types.ts  # Participant types
└── index.ts              # Barrel export

dist/                     # Compiled output (tsc, nodenext)
```

---

## Build

The package compiles to `dist/` via `tsc`. The `prepare` script runs automatically on `pnpm install`.

```bash
pnpm --filter @friends/shared-types build
pnpm --filter @friends/shared-types type-check
```

---

## Adding new shared types

1. Create or edit a file in `src/`
2. Export from `src/index.ts`
3. Run `pnpm --filter @friends/shared-types build`
4. Import in the consuming app — no extra config needed

> Part of the Friends monorepo • [Back to root](../../)
