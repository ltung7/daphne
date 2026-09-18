# Driver Balance Ledger System - Implementation Plan

## Overview
Append-only event ledger for driver financial balance tracking. Each event represents a balance change (income, penalty, settlement, etc.) with running balance stored for O(1) current balance lookup.

---

## Data Model

### Collection: `driverBalanceEvents` (Firestore)

```typescript
namespace DriverBalance {
  type EventType = 
    | 'income_uber_weekly' 
    | 'income_bolt_weekly'
    | 'penalty' 
    | 'monthly_settlement' 
    | 'repayments' 
    | 'early_settlement_discount'
    | 'cash_collection'      // Driver collected cash from trips (negative = owes fleet)
    | 'cash_deposit'         // Driver deposited cash to office (positive = reduces debt)
    | 'cash_adjustment';     // Dispute resolution, write-off (signed)

  type EventStatus = 'pending' | 'confirmed' | 'cancelled' | 'reversed';

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
    referenceId?: string;          // External ref (Uber report ID, penalty ID, etc.)
    referenceType?: string;        // 'uber_report' | 'bolt_report' | 'penalty' | 'settlement' | 'cash'
    metadata: Record<string, any>; // { period: '2026-W01', trips: 45, grossEarnings: 3000.00, ... }
    
    // Audit
    timestamp: number;             // epoch ms (was createdAt)
    createdBy: string;             // user/system ID
    confirmedAt?: number;
    confirmedBy?: string;
    
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
 | `income_uber_weekly` | `u:{driverId}:{YYYY}{W}` | `u:drv123:2026W01` |
 | `income_bolt_weekly` | `b:{driverId}:{YYYY}{W}` | `b:drv123:2026W01` |
 | `penalty` | `p:{penaltyId}` | `p:pen456` |
 | `monthly_settlement` | `m:{driverId}:{YYYY}{MM}` | `m:drv123:202601` |
 | `repayments` | `r:{txnId}` | `r:txn789` |
 | `early_settlement_discount` | `e:{requestId}` | `e:req999` |
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
 | Uber weekly sync | `income_uber_weekly` with `idempotencyKey: "u:{driverId}:{YYYY}W{W}"` |
 | Bolt weekly sync | `income_bolt_weekly` with `idempotencyKey: "b:{driverId}:{YYYY}W{W}"` |
 | Admin adds penalty | `penalty` with `idempotencyKey: "p:{penaltyId}"` |
 | Monthly settlement run | `monthly_settlement` per driver with `idempotencyKey: "m:{driverId}:{YYYY}{MM}"` |
 | Fuel card repay | `repayments` with `idempotencyKey: "r:{txnId}"` |
 | Driver requests early payout | `early_settlement_discount` (5% fee) + `monthly_settlement` (payout) |
 | Daily report cash submitted | `cash_collection` (amount = -cashCollected) with `idempotencyKey: "c:{driverId}:{YYYY}{MM}{DD}"` |
 | Cash handed to office | `cash_deposit` (amount = +deposited) with `idempotencyKey: "d:{depositId}"` |
 | Cash dispute resolved | `cash_adjustment` (signed) with `idempotencyKey: "a:{adjustmentId}"` |
 
 **Early Settlement Logic:**
 ```
 requestedAmount = X PLN
 fee = roundPLN(X * 0.05)
 actualPayout = roundPLN(X - fee)
 
 Create TWO events:
   1. early_settlement_discount: amount = -fee, metadata: { requested: X, fee, payout: actualPayout }
   2. monthly_settlement: amount = -actualPayout
 ```
 
 **Cash Position Logic:**
 - Net cash = sum(`cash_collection` + `cash_deposit` + `cash_adjustment`)
 - If negative at `monthly_settlement` → deducted from payout (create `monthly_settlement` with reduced amount)
 - Reconciliation report: Bolt/Uber reported cash vs driver reported vs deposits
 
 **TODO:** In `income_uber_weekly` / `income_bolt_weekly` metadata, include `cashCollected` from Uber/Bolt report for reconciliation:
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
  type: 'monthly_settlement',
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

## Implementation Progress

### Completed (this session)
- **Admin UI Component**: Created `src/lib/components/finance/DriverBalanceLedger.svelte` with:
  - Current balance display (large, color-coded: green/red/black)
  - Cash balance display (smaller, color-coded)
  - CTA buttons for ledger actions: Kara (penalty), Potrącenie (deduction), Wypłata (payout), Wcześniejsze rozliczenie (early settlement), Korekta gotówki (cash adjustment)
  - "Historia" button opening Offcanvas with timeline of latest 20 events
  - Timeline shows: event type badge/icon/color, signed amount, timestamp, running balance, reference ID
  - Pagination with "Załaduj więcej" button
- **API Endpoint**: Created `src/routes/(admin)/drivers/[id]/balance/+server.ts` for fetching paginated balance events
- **Integration**: Added component to driver detail page (`src/routes/(admin)/drivers/[id]/+page.svelte`) with data loaded in `+page.server.ts`
- **Type Safety**: Updated `DriverBalanceLedger.svelte` with local `BalanceEvent` interface and event type labels/icons/colors

### Code Changes
- `src/app.d.ts`: Updated `BalanceEventType` union - changed `'fuel_repayments'` → `'repayments'`
- `src/lib/components/finance/DriverBalanceLedger.svelte`: Updated event type labels/icons/colors - `'fuel_repayments'` → `'repayments'`
- `docs/FLEET_PLAN.md`: Updated reference in fuel card management task
- `docs/LEDGER_SETTLEMENT_PLAN.md`: Updated all references:
  - EventType union
  - Idempotency key format table
  - Integration points table