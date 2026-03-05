# Pot Balance KPI Detail Breakdown Plan

**Date:** 2026-03-05  
**Status:** Proposal (analysis only, no implementation included)

## 1. Table of Contents

1. [Table of Contents](#1-table-of-contents)
2. [Motivation and Objectives](#2-motivation-and-objectives)
3. [System Overview and Requirements](#3-system-overview-and-requirements)
4. [Solution Design](#4-solution-design)
   - [4.1. Detailed Flow](#41-detailed-flow)
   - [4.2. Folder/File Structure and Affected Areas](#42-folderfile-structure-and-affected-areas)
   - [4.3. Data Models and Migrations](#43-data-models-and-migrations)
   - [4.4. API Contracts](#44-api-contracts)
   - [4.5. Security, Roles, and Validations](#45-security-roles-and-validations)
   - [4.6. Error Handling and Logging](#46-error-handling-and-logging)
5. [External Configuration and Prerequisites](#5-external-configuration-and-prerequisites)
6. [Step-by-Step Implementation Plan](#6-step-by-step-implementation-plan)
7. [Detailed Checklist](#7-detailed-checklist)
8. [Testing and Validation](#8-testing-and-validation)
9. [Deployment Notes and Environment Variables](#9-deployment-notes-and-environment-variables)
10. [References and Resources](#10-references-and-resources)
11. [Improvements and Lessons Learned](#11-improvements-and-lessons-learned)
12. [Why This Structure](#why-this-structure)

## 2. Motivation and Objectives

### Problem statement

The current KPI detail page for **Balance** shows participant rows based on `participantBalances`, while the main KPI value is `potBalance`.

This creates a semantic mismatch:

- `potBalance` represents **pot cash balance**.
- `participantBalances` mixes participant-level values (`contributions + participant expenses - compensations`) that do not directly explain pot cash flows.

As a consequence, users can see a valid top-level number but still fail to understand where that number comes from.

### Goals

1. Make `KPIDetail(balance)` self-explanatory without mental reconciliation.
2. Provide a transparent and auditable breakdown of the pot balance.
3. Keep existing KPI detail behaviors unchanged for `contributions`, `expenses`, and `pending`.
4. Preserve API backward compatibility to avoid breaking current consumers.

### Out of scope

- No database schema changes.
- No redesign of non-balance KPI pages.
- No behavior change in transaction creation/editing flows.

## 3. System Overview and Requirements

### Current behavior summary

Backend:

- `potBalance = totalContributions - totalCompensations - potExpenses`
- `participantBalances` is currently built independently for participant-level totals.

Frontend:

- For KPI `balance`, the UI uses `participantBalances` list for the detail rows.
- This list does not map 1:1 to pot inflows/outflows.

### Product requirement for the new balance detail

When a user opens the balance detail page, they must understand:

1. **What entered the pot** (contributions).
2. **What left the pot as reimbursements** (compensations).
3. **What left the pot as direct pot expenses** (transactions paid by pot participant `id = '0'`).
4. Why the final equation equals the displayed `potBalance`.

### Non-functional requirements

- Maintain current endpoint (`GET /api/events/:id/kpis`).
- Keep response backwards compatible.
- Keep UI aligned with existing design system and component style.

## 4. Solution Design

### 4.1. Detailed Flow

The balance detail should be rendered from explicit pot cash-flow buckets.

Core equation:

```text
potBalance = inflows.total - outflows.total
where:
inflows.total = Σ participant contributions
outflows.total = compensations.total + potExpenses.total
```

Per-participant relation with pot (optional supporting detail):

```text
participantNetWithPot[participantId] = contributionsByParticipant[participantId] - compensationsByParticipant[participantId]
```

Operational flow:

1. Fetch event transactions.
2. Aggregate contribution amounts by participant.
3. Aggregate compensation amounts by participant.
4. Collect pot expense transactions (`participantId === '0'` and `paymentType === 'expense'`).
5. Build reconciliation object and consistency flag.
6. Return enriched KPI payload.
7. In frontend, render dedicated balance breakdown sections instead of `participantBalances` for this page.

### 4.2. Folder/File Structure and Affected Areas

#### Backend

- `apps/backend/src/modules/events/dto/event-kpis.dto.ts`
  - Extend DTO with a new `balanceBreakdown` block.
- `apps/backend/src/modules/events/services/event-kpis.service.ts`
  - Build and return `balanceBreakdown` fields.
- `apps/backend/src/modules/events/services/event-kpis.service.spec.ts`
  - Add reconciliation and breakdown expectations.

#### Frontend

- `apps/frontend/src/api/types.ts`
  - Extend `EventKPIs` with `balanceBreakdown`.
- `apps/frontend/src/features/kpi/components/KPIDetailView.tsx`
  - Conditional branch for `kpi === 'balance'` with dedicated data mapping.
- `apps/frontend/src/features/kpi/components/KPIDetailContent.tsx`
  - Support specialized balance detail sections.
- `apps/frontend/src/features/kpi/components/` (new or adapted presentational components)
  - Add compact section blocks for inflows/outflows/reconciliation.
- `apps/frontend/src/i18n/locales/{es,en,ca}/translation.json`
  - Add explicit labels and empty states for balance breakdown.

### 4.3. Data Models and Migrations

### Database migrations

No database migration is required.

### DTO model addition (example)

```ts
interface BalanceBreakdownDto {
  inflows: {
    total: number;
    contributionsByParticipant: Record<string, number>;
  };
  outflows: {
    total: number;
    compensationsTotal: number;
    compensationsByParticipant: Record<string, number>;
    potExpensesTotal: number;
    potExpensesTransactions: Array<{
      id: string;
      title: string;
      amount: number;
      date: string;
    }>;
  };
  participantNetWithPot: Record<string, number>;
  reconciliation: {
    inflows: number;
    outflows: number;
    potBalance: number;
    isConsistent: boolean;
  };
}
```

### 4.4. API Contracts

### Endpoint

- `GET /api/events/:id/kpis` (unchanged)

### Response contract (partial example)

```json
{
  "data": {
    "totalExpenses": 220,
    "totalContributions": 300,
    "totalCompensations": 40,
    "potBalance": 180,
    "pendingToCompensate": 90,
    "participantBalances": { "u1": 80, "u2": 30 },
    "participantContributions": { "u1": 200, "u2": 100 },
    "participantExpenses": { "u1": 120, "u2": 30 },
    "participantCompensations": { "u1": 40, "u2": 0 },
    "participantPending": { "u1": 80, "u2": 30 },
    "potExpenses": 80,
    "balanceBreakdown": {
      "inflows": {
        "total": 300,
        "contributionsByParticipant": { "u1": 200, "u2": 100 }
      },
      "outflows": {
        "total": 120,
        "compensationsTotal": 40,
        "compensationsByParticipant": { "u1": 40, "u2": 0 },
        "potExpensesTotal": 80,
        "potExpensesTransactions": [
          { "id": "tx-1", "title": "Hotel", "amount": 60, "date": "2026-02-10" },
          { "id": "tx-2", "title": "Taxi", "amount": 20, "date": "2026-02-11" }
        ]
      },
      "participantNetWithPot": { "u1": 160, "u2": 100 },
      "reconciliation": {
        "inflows": 300,
        "outflows": 120,
        "potBalance": 180,
        "isConsistent": true
      }
    }
  }
}
```

### Error responses

- `404 NotFoundException`: event not found.
- `500 InternalServerErrorException`: KPI computation failure.

### 4.5. Security, Roles, and Validations

- Reuse current event access rules and guards (no new role model required).
- Validate all numeric aggregations with `Number.isFinite` before returning values.
- Ensure only event-scoped transactions are included.
- Do not expose internal stack traces in API responses.

### 4.6. Error Handling and Logging

- Keep existing `NotFoundException` behavior unchanged.
- Keep current `InternalServerErrorException('Failed to calculate KPIs')` fallback.
- Add structured debug logs for reconciliation mismatches:
  - `eventId`
  - `inflows`
  - `outflows`
  - `potBalance`
- In frontend, if `isConsistent === false`, show a non-blocking warning message and still render available breakdown data.

## 5. External Configuration and Prerequisites

No new external services or environment variables are required.

Prerequisites:

- Backend and frontend already running with current monorepo setup.
- Existing i18n locale files available (`es`, `en`, `ca`).

## 6. Step-by-Step Implementation Plan

1. **Backend contract extension**
   - Add `balanceBreakdown` to event KPI DTO.
   - Keep existing properties unchanged.

2. **Backend computation update**
   - Aggregate contributions and compensations by participant.
   - Extract pot expense transactions list from participant `id='0'` expenses.
   - Build reconciliation block and consistency check.

3. **Backend tests update**
   - Add assertions for inflows/outflows/reconciliation consistency.
   - Add edge-case coverage (no transactions, only pot expenses, only contributions).

4. **Frontend types update**
   - Extend `EventKPIs` with typed `balanceBreakdown`.

5. **Frontend balance detail rendering**
   - Add branch in KPI detail flow for `balance`.
   - Render dedicated sections:
     - How this balance is calculated
     - Inflows by participant
     - Compensation outflows by participant
     - Pot direct expense transactions

6. **Frontend i18n updates**
   - Add translation keys for section titles, labels, and empty states.

7. **Regression verification**
   - Confirm non-balance KPI detail pages behave exactly as before.

## 7. Detailed Checklist

### Analysis and contract

- [ ] Confirm semantic mismatch between `participantBalances` and `potBalance` is documented.
- [ ] Approve the `balanceBreakdown` response schema.
- [ ] Approve reconciliation rules and consistency flag behavior.

### Backend

- [ ] Extend DTO with `balanceBreakdown` and Swagger metadata.
- [ ] Implement contribution aggregation by participant.
- [ ] Implement compensation aggregation by participant.
- [ ] Implement pot expense transaction extraction.
- [ ] Compute inflows/outflows totals and reconciliation block.
- [ ] Preserve existing KPI fields for backward compatibility.

### Frontend

- [ ] Extend API type definitions.
- [ ] Add dedicated `balance` detail rendering path.
- [ ] Keep existing rendering path for other KPIs.
- [ ] Add empty states for each breakdown section.
- [ ] Add/adjust translation keys in `es`, `en`, and `ca`.

### Testing and QA

- [ ] Add/adjust backend unit tests for breakdown integrity.
- [ ] Verify equation in UI always matches displayed top KPI.
- [ ] Verify sorting and formatting rules for list rows.
- [ ] Verify no regression in non-balance KPI detail pages.

## 8. Testing and Validation

### Backend unit tests (required)

1. Standard mixed case:
   - contributions + compensations + pot expenses
   - assert `inflows - outflows === potBalance`
2. Empty transactions:
   - all totals zero
3. Contributions only:
   - outflows zero, pot balance equals inflows
4. Pot expenses only:
   - negative or zero balance depending on existing inflows
5. Compensations only:
   - verify outflows and consistency logic

### Frontend behavior tests (recommended)

1. `balance` route shows reconciliation card and three breakdown sections.
2. `contributions|expenses|pending` routes remain unchanged.
3. Empty sections render user-friendly text.
4. Formatted totals match backend values.

### Acceptance criteria

- A user can understand the pot balance origin by reading only the balance detail page.
- Every displayed subtotal is traceable to a list directly below it.
- The top KPI value and reconciliation formula are always consistent.

## 9. Deployment Notes and Environment Variables

- No new environment variables.
- Deploy strategy: backend first (backward compatible), then frontend.
- Rollback strategy: frontend can continue using existing fields if needed.

## 10. References and Resources

Relevant project files:

- `apps/backend/src/modules/events/services/event-kpis.service.ts`
- `apps/backend/src/modules/events/dto/event-kpis.dto.ts`
- `apps/backend/src/modules/events/services/event-kpis.service.spec.ts`
- `apps/frontend/src/features/kpi/components/KPIDetailView.tsx`
- `apps/frontend/src/features/kpi/constants.ts`
- `apps/frontend/src/features/kpi/utils/utils.ts`
- `apps/frontend/src/api/types.ts`
- `apps/frontend/src/pages/KPIDetail.tsx`

Relevant existing docs:

- `docs/20260111_MOVE_KPI_CALCULATION_TO_BACKEND.md`
- `docs/REFACTOR_KPI_DETAIL.md`

## 11. Improvements and Lessons Learned

### Future improvements

1. Move KPI API contracts to `@friends/shared-types` to avoid duplication.
2. Add reusable backend aggregation helpers for KPI consistency.
3. Consider a dedicated ledger endpoint if balance explanation grows in complexity.

### Lessons learned

- KPI names are not enough; users need data grouped by financial meaning.
- A valid aggregate can still fail UX if source breakdown is not semantically aligned.
- Reconciliation-first UI patterns reduce confusion in money-related products.

## Why This Structure

This structure is intentionally designed to support both implementation safety and review speed:

- The **analysis** sections explain the current mismatch and target behavior.
- The **technical definition** sections give an unambiguous contract and flow.
- The **checklist and testing** sections convert design intent into verifiable execution steps.

Using this format allows engineers and AI agents to implement the change with minimal context switching and with clear acceptance boundaries before coding starts.
