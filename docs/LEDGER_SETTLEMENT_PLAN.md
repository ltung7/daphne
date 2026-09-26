# Driver Balance Ledger System - Implementation Plan

## Overview
Append-only event ledger for driver financial balance tracking. Each event represents a balance change (income, penalty, settlement, etc.) with running balance stored for O(1) current balance lookup.

---

## Data Model

### Collection: `driverBalanceEvents` (Firestore)

```typescript
namespace DriverBalance {
  type EventType = 
    | 'income_uber' 
    | 'income_bolt'
    | 'penalty' 
    | 'settlement' 
    | 'repayments' 
    | 'early_settlement_discount'
    | 'cash_collection'      // Driver collected cash from trips (negative = owes fleet)
    | 'cash_deposit'         // Driver deposited cash to office (positive = reduces debt)
    | 'cash_adjustment';     // Dispute resolution, write-off (signed)

  type EventStatus = 'confirmed' | 'cancelled' | 'reversed';

  interface BalanceEvent {
    // Document ID = idempotency key (see formats below)
    id: string;                    
    
    driverId: string;              // Denormalized for queries
    type: EventType;               // Full event type stored (not prefix)
    status: EventStatus;
    
    // Financial: PLN, 2 decimals, signed (+income, -expense)
    amount: number;                // e.g., 1234.56
    runningBalance: number;        // Balance AFTER this event, e.g., 5432.10
    
    // Traceability
    referenceId?: string;          // External ref (Uber report ID, penalty ID, early settlement ID, etc.)
    referenceType?: string;        // 'uber_report' | 'bolt_report' | 'penalty' | 'settlement' | 'cash'
    // referenceType groups by EXTERNAL SOURCE DOCUMENT, not by BalanceEventType.
    // Multiple event types can share a referenceType (e.g., all 3 cash events → 'cash').
    // referenceId + referenceType together identify the source record.
    metadata: Record<string, any>; // { period: '2026-W01', trips: 45, grossEarnings: 3000.00, ... }
    
    // Audit
    timestamp: number;             // epoch ms (was createdAt)
    createdBy: string;             // user/system ID
    createdByName: string;         // user/system display name (for UI)
    
    // Reversals/corrections
    reversedByEventId?: string;    // Links to reversal event
    reversalReason?: string;
  }
}
```

---

## Idempotency Key Formats (Used as Document ID)
 
 | Event Type | Key Format | Example |
 |------------|-----------|---------|
 | `income_uber` | `u:{driverId}:{YYYY}{W}` | `u:drv123:2026W01` |
 | `income_bolt` | `b:{driverId}:{YYYY}{W}` | `b:drv123:2026W01` |
 | `penalty` | `p:{penaltyId}` | `p:pen456` |
 | `settlement` (regular) | `s:{driverId}:{YYYY}{MM}` | `s:drv123:202601` |
 | `settlement` (early) | `s:early:{earlySettlementId}` | `s:early:es789` |
 | `repayments` | `r:{txnId}` | `r:txn789` |
 | `early_settlement_discount` | `e:{earlySettlementId}` | `e:es789` |
 | `cash_collection` | `c:{driverId}:{YYYY}{MM}{DD}` | `c:drv123:20260115` |
 | `cash_deposit` | `d:{depositId}` | `d:dep456` |
 | `cash_adjustment` | `a:{adjustmentId}` | `a:adj789` |
 
 **Length:** ~15-25 chars (well under Firestore 1500 byte limit)
 
 **DB-level idempotency:** Firestore rejects duplicate document IDs automatically. Write with `merge: false` to fail on duplicate.

---

## Amount Handling

- **All amounts in PLN (złoty), 2 decimal places**
- Rounding at write time: `Math.round(amount * 100) / 100`
- Signed: `+` for income, `-` for expenses
- Display: `amount.toFixed(2) + ' PLN'`

---

## Running Balance Calculation

Each event stores `runningBalance` computed atomically at write:

```typescript
// 1. Get last event for driver (by timestamp desc)
const lastEvent = await db.collection('driverBalanceEvents')
  .where('driverId', '==', driverId)
  .orderBy('timestamp', 'desc')
  .limit(1)
  .get();

const lastBalance = lastEvent.empty ? 0 : lastEvent.docs[0].data().runningBalance;

// 2. Compute new running balance
const newRunningBalance = roundPLN(lastBalance + amount);

// 3. Write new event with runningBalance
await db.collection('driverBalanceEvents').doc(idempotencyKey).set({
  ...data,
  driverId,
  amount: roundPLN(amount),
  runningBalance: newRunningBalance,
  timestamp: Date.now(),
}, { merge: false }); // Fails if key exists = idempotent
```

**Current balance = last event's `runningBalance`** (or 0 if none)

---

## Required Firestore Indexes

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "driverBalanceEvents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "driverId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "driverBalanceEvents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "driverId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Implementation Structure

```
src/lib/server/db/firebase/
├── driverBalanceEvents.fdb.ts    # CRUD + query functions
├── driverBalance.service.ts      # Business logic (idempotent writes, balance calc)
└── transactions.ts               # Firestore transaction helpers

src/lib/server/calculations/
├── driverBalance.ts              # Pure calculation functions (testable)
└── settlement.ts                 # Monthly settlement logic

src/routes/api/driver/balance/
├── +server.ts                    # GET /api/driver/balance/:driverId (current + history)
└── events/+server.ts             # POST /api/driver/balance/events (write events)

src/routes/finance/
├── drivers/[id]/+page.server.ts  # Admin: driver balance detail
└── settlements/+page.server.ts   # Admin: batch settlement processing
```

---

## Key Functions

### `driverBalance.service.ts`

```typescript
// Idempotent event creation (uses idempotencyKey as doc ID)
async function recordEvent(params: {
  driverId: string;
  type: EventType;
  amount: number;           // signed PLN
  idempotencyKey: string;   // Used as document ID
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, any>;
  createdBy: string;
}): Promise<BalanceEvent>

// Get current balance (O(1) - latest event by timestamp)
async function getCurrentBalance(driverId: string): Promise<number>

// Get full history (paginated, for audit)
async function getBalanceHistory(driverId: string, opts?: {
  from?: number; to?: number; limit?: number; offset?: number;
}): Promise<BalanceEvent[]>

// Recalculate & verify (for admin audit)
async function verifyBalance(driverId: string): Promise<{
  calculated: number;
  stored: number;
  mismatchedEvents: BalanceEvent[];
}>
```

### Verification Function

```typescript
async function verifyBalance(driverId: string) {
  const events = await getAllEvents(driverId); // Ordered by timestamp ASC
  let calculated = 0;
  const mismatched = [];
  
  for (const e of events) {
    calculated = roundPLN(calculated + e.amount);
    if (calculated !== e.runningBalance) {
      mismatched.push({ eventId: e.id, expected: calculated, stored: e.runningBalance });
    }
  }
  
  return {
    calculated,
    stored: events[events.length - 1]?.runningBalance ?? 0,
    mismatchedEvents: mismatched
  };
}
```

---

## Integration Points
 
 | Trigger | Creates Event |
 |---------|---------------|
 | Uber sync | `income_uber` with `idempotencyKey: "u:{driverId}:{YYYY}W{W}"` |
 | Bolt sync | `income_bolt` with `idempotencyKey: "b:{driverId}:{YYYY}W{W}"` |
 | Admin adds penalty | `penalty` with `idempotencyKey: "p:{penaltyId}"` (undisputed, confirmed immediately) |
 | Regular settlement run | `settlement` per driver with `idempotencyKey: "s:{driverId}:{YYYY}{MM}"` |
 | Fuel card repay | `repayments` with `idempotencyKey: "r:{txnId}"` |
 | Early settlement request approved | TWO events created atomically (see Early Settlement Logic below) |
 | Daily report cash submitted | `cash_collection` (amount = -cashCollected) with `idempotencyKey: "c:{driverId}:{YYYY}{MM}{DD}"` |
 | Cash handed to office | `cash_deposit` (amount = +deposited) with `idempotencyKey: "d:{depositId}"` |
 | Cash dispute resolved | `cash_adjustment` (signed) with `idempotencyKey: "a:{adjustmentId}"` (undisputed, confirmed immediately) |
 
 **Early Settlement Logic (separate flow/entity):**
 ```
 requestedAmount = X PLN
 fee = roundPLN(X * 0.05)
 actualPayout = roundPLN(X - fee)
 
 Early Settlement entity created (separate collection/table) with ID = earlySettlementId
 
 Create TWO ledger events atomically:
   1. settlement (payout):
        type: 'settlement'
        amount: -actualPayout
        idempotencyKey: "s:early:{earlySettlementId}"
        referenceId: earlySettlementId
        referenceType: 'settlement'
        metadata: { earlySettlement: true, requested: X, fee, payout: actualPayout }
   
   2. early_settlement_discount (fee):
        type: 'early_settlement_discount'
        amount: -fee
        idempotencyKey: "e:{earlySettlementId}"
        referenceId: earlySettlementId  // links to the settlement event above
        referenceType: 'settlement'
        metadata: { earlySettlement: true, requested: X, fee, payout: actualPayout }
 ```
 
 **Cash Position Logic:**
 - Net cash = sum(`cash_collection` + `cash_deposit` + `cash_adjustment`)
 - If negative at `settlement` → deducted from payout (create `settlement` with reduced amount)
 - Reconciliation report: Bolt/Uber reported cash vs driver reported vs deposits
 
 **TODO:** In `income_uber` / `income_bolt` metadata, include `cashCollected` from Uber/Bolt report for reconciliation:
 ```
 metadata: { period: '2026-W01', trips: 45, grossEarnings: 3000.00, cashCollected: 500.00, ... }
 ```

---

## Security Rules (Firestore)

```javascript
// firestore.rules
match /driverBalanceEvents/{eventId} {
  allow read: if request.auth != null && 
    (request.auth.token.role == 'admin' || 
     resource.data.driverId == request.auth.uid);
  allow create: if request.auth != null && request.auth.token.role == 'admin';
  allow update, delete: if false; // Immutable - only reversals via new events
}
```

---

## Migration from Current `Driver.balance`

One-time script to seed initial event per driver:

```typescript
// For each driver with balance != 0:
recordEvent({
  driverId: driver.id,
  type: 'settlement',
  amount: driver.balance,
  idempotencyKey: `initial_balance_${driver.id}`,
  metadata: { source: 'migration_from_driver_balance_field' },
  createdBy: 'system_migration'
})
// Then optionally clear Driver.balance field
```

---

## Admin UI Features

- **Driver detail page**: Current balance + paginated event history
- **Finance dashboard**: Aggregate balances, unsettled amounts
- **Audit tool**: "Verify Balance" button → runs `verifyBalance()` to detect drift
- **Correction flow**: Create reversal event (negative of original) + new corrected event

---

## Summary of Decisions
 
 | Decision | Choice |
 |----------|--------|
 | Storage | Firestore (real-time, per-driver queries) |
 | Document ID | Idempotency key (short format, DB-level dedup) |
 | Currency | PLN, 2 decimals, rounded at write |
 | Timestamp field | `timestamp` (epoch ms) |
 | Event type storage | Full type string (not prefix) |
 | Running balance | Stored on each event for O(1) lookup |
 | Idempotency | DB-level via document ID + app-layer transaction |
 | Cash events | `cash_collection` (negative), `cash_deposit` (positive), `cash_adjustment` (signed) |
 | Event statuses | `confirmed` | `cancelled` | `reversed` (no `pending` — all ledger events are final) |
 | Confirmed fields | Removed — all events confirmed at write; early settlement uses separate entity |
 | Created by name | Added `createdByName` field for UI display |
 | Early settlement | Separate flow/entity; creates 2 ledger events (settlement + discount) |
 | Settlement naming | Generic `settlement` (not monthly/weekly); early uses `s:early:{id}` idempotency key |

---

## Next Steps

1. Create `driverBalanceEvents.fdb.ts` with CRUD operations
2. Create `driverBalance.service.ts` with business logic
3. Add Firestore indexes
4. Create API endpoints
5. Build admin UI pages
6. Write unit tests for calculation logic
7. Run migration script for existing drivers

---

## Current State (Important Notes)

**Uber/Bolt integration NOT implemented yet** — income events (`income_uber_weekly`, `income_bolt_weekly`) exist only as test/mock data. Real sync from Uber/Bolt APIs is deferred.

**Payment/payout flow is symbolic only** — settlement events can be recorded but no actual bank transfer integration exists.

**No migration needed** — if a driver has no ledger events, `getCurrentBalance()` returns `0` naturally. The migration script in this plan is only relevant if you later decide to import historical balances from a legacy `Driver.balance` field (which doesn't exist in current schema).

---

## Implementation Progress

### Completed (this session)
- **Admin UI Component**: Created `src/lib/components/finance/DriverBalanceLedger.svelte` with:
  - Current balance display (large, color-coded: green/red/black)
  - Cash balance display (smaller, color-coded)
  - CTA buttons for ledger actions: Kara (penalty), Potrącenie (deduction), Wypłata (payout), Wpłata gotówki (cash deposit), Korekta gotówki (cash adjustment)
  - "Historia" button opening Offcanvas with timeline of latest 20 events
  - Timeline shows: event type badge/icon/color, signed amount, timestamp, running balance, reference ID
  - Pagination with "Załaduj więcej" button
- **API Endpoint**: Created `src/routes/(admin)/drivers/[id]/balance/+server.ts` for:
  - Fetching paginated balance events (GET)
  - Creating direct ledger events (POST)
  - Creating early settlement requests (POST - detects `requestedAmount`)
- **Integration**: Added component to driver detail page (`src/routes/(admin)/drivers/[id]/+page.svelte`) with data loaded in `+page.server.ts`
- **Type Safety**: Updated `DriverBalanceLedger.svelte` with local `BalanceEvent` interface and event type labels/icons/colors
- **Early Settlement Flow**:
  - **Type System**: Added `EarlySettlementStatus` and `EarlySettlement` interface (including `driverName`) to `DriverBalance` namespace in `src/app.d.ts`
  - **Database Layer**: Created `src/lib/server/db/firebase/earlySettlements.fdb.ts` with CRUD operations
  - **Service Layer**: Created `src/lib/server/services/earlySettlements.service.ts` with `createEarlySettlement`, `cancelEarlySettlement`, `rejectEarlySettlement`, and `approveEarlySettlement` (atomic 2-event transaction)
  - **Admin UI**: Created list page (`/earlysettlements`) and detail page (`/earlysettlements/[id]`) with approve/reject actions
  - **Security**: Locked down direct creation of `early_settlement_discount` ledger events; must go through approval flow
  - **Routing**: Updated `EarlySettlementRequest.svelte` and admin/driver endpoints to use standard `internal.post` and dynamic paths
- **Constants**: Added `EARLY_SETTLEMENT_FEE_RATE = 0.05` to `src/lib/assets/constants.ts`
- **Form Fix**: Updated `CustomFormNumeric.svelte` to dispatch change from buttons via `onChange` callback

### Code Changes
- `src/app.d.ts`: Updated `BalanceEventType` union, added `EarlySettlement` with `driverName`
- `src/lib/components/finance/DriverBalanceLedger.svelte`: Integrated `EarlySettlementRequest` component
- `src/routes/(admin)/drivers/[id]/balance/+server.ts`: Added support for early settlement requests
- `src/routes/(admin)/earlysettlements/`: Added list and detail pages with admin actions
- `docs/FLEET_PLAN.md`: Updated reference in fuel card management task
- `docs/LEDGER_SETTLEMENT_PLAN.md`: Updated all references to match new schema and naming conventions

---

## Todo List

### Type System & Schema
- [x] Update `src/app.d.ts` `DriverBalance` namespace:
  - [x] Change `BalanceEventType` union: `income_uber_weekly` → `income_uber`, `income_bolt_weekly` → `income_bolt`, `monthly_settlement` → `settlement`
  - [x] Change `BalanceEventStatus`: remove `'pending'`, keep `'confirmed' | 'cancelled' | 'reversed'`
  - [x] Remove `confirmedAt`, `confirmedBy`, `confirmedName` from `BalanceEvent` interface
  - [x] Update `BalanceIdempotencyKeyFormats` with new formats
  - [x] Add `EarlySettlementStatus` and `EarlySettlement` interface
  - [x] Add `driverName` to `EarlySettlement` interface

### Database Layer (`src/lib/server/db/firebase/`)
- [x] Update `driverBalanceEvents.fdb.ts` types to match new schema (no changes needed - uses namespace types)
- [x] Update `driverBalance.service.ts`:
  - [x] Remove `confirmedAt/By/Name` from `recordEvent`
  - [x] Default `status: 'confirmed'` always
  - [x] Update `createReversalEvent` to use new types
- [x] Create `earlySettlements.fdb.ts` with CRUD operations (add, get, find, set, delete, exists)

### Calculation Logic (`src/lib/server/calculations/`)
- [ ] Update `driverBalance.ts` pure functions for new event types
- [ ] Update `settlement.ts` - rename monthly → settlement, add early settlement logic

### Early Settlement Flow (New)
- [x] Create early settlement entity (separate collection: `earlySettlements`)
  - [x] Fields: id, driverId, driverName, requestedAmount, fee, actualPayout, status (requested/approved/rejected/cancelled), createdAt, approvedAt, approvedBy, rejectedAt, rejectedBy, rejectionReason, createdBy, createdByName
- [x] Service functions:
  - [x] `createEarlySettlement` - with balance validation and fee calculation
  - [x] `cancelEarlySettlement` - cancels requested settlements
  - [x] `rejectEarlySettlement` - rejects with reason
  - [x] `approveEarlySettlement` - atomically creates 2 ledger events (settlement + discount) in Firestore transaction
- [x] Admin UI: request list, approve/reject actions

### API Endpoints (`src/routes/api/driver/balance/`)
- [x] Update GET endpoint for new types
- [x] Update POST `/events` for new types
- [x] Add POST `/early-settlement` for request creation (Handled by admin `/drivers/[id]/balance` and driver `/driver/balance`)
- [x] Add POST `/early-settlement/{id}/approve` for approval flow
- [x] Add POST `/early-settlement/{id}/reject` for rejection flow
- [x] Add POST `/early-settlement/{id}/cancel` for cancellation flow

### Admin UI (`src/routes/finance/`, `src/routes/(admin)/drivers/[id]/`)
- [x] Update `DriverBalanceLedger.svelte` event type labels/icons/colors
- [x] Update `AddLedgerEventModal.svelte` config
- [x] Update `DriverBalanceHistory.svelte` (removed confirmedAt/confirmedName)
- [x] Update `constants.ts` balanceEventTypeConfig
- [x] Add early settlement request component (`EarlySettlementRequest.svelte`)
- [x] Add early settlement request/approval UI (list page for admins)
- [ ] Update settlement processing page (rename monthly → settlement)

### Firestore Config
- [ ] Update `firestore.rules` (no pending status)
- [ ] Note: Firestore indexes are managed implicitly by the project environment.

### Tests
- [ ] Unit tests for calculation logic with new types
- [ ] Integration tests for early settlement atomic write
- [ ] Idempotency tests for all key formats

### Documentation
- [x] Update any remaining references in `docs/FLEET_PLAN.md`
- [ ] Update component documentation