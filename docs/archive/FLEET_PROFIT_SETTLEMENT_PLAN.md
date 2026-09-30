# Fleet Profit & Driver Settlement System - Implementation Plan (ARCHIVED)

> **Status: ARCHIVED** — Superseded by and fused into `MONTHLY_COMPANY_LEDGER_PLAN.md`
> 
> Automated weekly settlement batching and automated cost allocation services are DEFERRED.
> All operational accounting, weekly ride ingestion, monthly driver settlements, and 3-tier P&L reporting (Company, Vehicle, Driver) are unified under `MONTHLY_COMPANY_LEDGER_PLAN.md` with full manual entry/failsafe support.
> 
> Key rules established:
> - Ride platforms (Uber/Bolt) report and settle weekly (`YYYY-Www`).
> - Company makes driver payouts monthly (`YYYY-MM`), except for early settlement requests which are paid out ad-hoc at any time.
> - Cash handling options are deferred.

## Overview
Profit calculation engine for the fleet. Turns raw income (Uber/Bolt), costs (fuel, maintenance, insurance, fines), and driver provisions into:
- **Per-driver settlement** (what driver owes fleet / fleet pays driver)
- **Fleet P&L** (profitability per vehicle, per driver, aggregate)
- **Cost allocation** (matching costs to responsible driver/vehicle)

Uses the existing `driverBalanceEvents` ledger as the immutable audit trail. All outputs written back as ledger events.

---

## Current State (UI & Infrastructure)

### ✅ Implemented (Ledger Infrastructure)
| Component | Location | Status |
|-----------|----------|--------|
| **Driver Balance Ledger UI** | `src/lib/components/finance/DriverBalanceLedger.svelte` | Complete — shows current balance, action buttons (penalty, deduction, payout, early settlement), paginated history offcanvas |
| **Ledger API (admin)** | `src/routes/(admin)/drivers/[id]/balance/+server.ts` | Complete — GET paginated events, POST direct events, POST early settlement requests |
| **Early Settlement Flow** | `src/lib/server/services/earlySettlements.service.ts` + admin pages | Complete — request → approve (atomic 2-event transaction: settlement + discount) / reject / cancel |
| **Idempotency Keys** | `src/lib/server/services/ledger.service.ts` | Complete — all event types, DB-level dedup via doc ID |
| **Firestore CRUD** | `src/lib/server/db/firebase/driverBalanceEvents.fdb.ts` | Complete — queries, current balance (O(1)), batch writes |

### ✅ Data Model (Finalized in `src/app.d.ts`)
```typescript
namespace DriverBalance {
  type BalanceEventType = 
    | 'income_uber' | 'income_bolt'
    | 'penalty' | 'settlement' | 'repayments'
    | 'early_settlement_discount';

  type BalanceEventStatus = 'confirmed' | 'cancelled' | 'reversed';

  interface BalanceEvent {
    id: string;                    // idempotency key (doc ID)
    driverId: string;
    type: BalanceEventType;
    status: BalanceEventStatus;
    amount: number;                // PLN, 2dp, signed (+income, -expense)
    runningBalance: number;        // balance AFTER event
    referenceId?: string;
    referenceType?: 'uber_report' | 'bolt_report' | 'penalty' | 'settlement';
    metadata: Record<string, any>; // { period, trips, grossEarnings, ... }
    timestamp: number;
    createdBy: string;
    createdByName: string;
    reversedByEventId?: string;
    reversalReason?: string;
  }

  interface EarlySettlement {
    id: string;
    driverId: string;
    driverName: string;
    requestedAmount: number;
    fee: number;
    actualPayout: number;
    status: 'requested' | 'approved' | 'rejected' | 'cancelled';
    createdAt: number;
    createdBy: string;
    createdByName: string;
    approvedAt?: number;
    approvedBy?: string;
    approvedByName?: string;
    rejectedAt?: number;
    rejectedBy?: string;
    rejectedByName?: string;
    rejectionReason?: string;
    metadata?: Record<string, any>;
  }
}
```

---

## What's Missing (This Plan)

### The Gap
**No calculation layer exists.** Current UI only records manual admin actions. No automated:
- Uber/Bolt income ingestion → provision calculation → settlement events
- Cost allocation (fuel card, maintenance, insurance) → driver charge events
- Fleet P&L reporting
- Period-end batch settlement run

---

## Architecture

```
src/lib/server/services/
├── fleetProfit.service.ts          # Core: fleet P&L, per-vehicle/driver profitability
├── driverSettlement.service.ts     # Core: compute driver net payout per period
├── incomeReporting.service.ts      # Uber/Bolt report ingestion → ledger events
├── costAllocation.service.ts       # Match costs to driver/vehicle → ledger events
├── settlementRunner.service.ts     # Orchestrator: periodic batch settlement
└── ledger.service.ts               # (existing) idempotency key generation
```

> **Naming convention:** `*.service.ts` in `src/lib/server/services/` — pure business logic, no HTTP, testable.

---

## Data Inputs (Sources)

| Source | Collection/Table | Key Fields |
|--------|------------------|------------|
| Uber trips/earnings | `uberReports` (BigQuery/Firestore) | driverId, period, grossEarnings, platformCommission, trips |
| Bolt trips/earnings | `boltReports` | driverId, period, grossEarnings, platformCommission, trips |
| Fuel cards | `fuelTransactions` | vehicleId, driverId, amount, date, station |
| Maintenance | `maintenanceRecords` | vehicleId, cost, date, description |
| Insurance | `insurancePolicies` | vehicleId, premium, periodStart, periodEnd |
| Fines/penalties | `fines` | vehicleId, driverId, amount, date, type |
| Vehicle assignments | `vehicles` (Firestore) | driverId, registrationNumber, assignedAt |

---

## Core Calculations (Pure Functions)

### 1. Driver Settlement (`driverSettlement.service.ts`)

```typescript
// Input: driverId, period (e.g., '2026-W01' or '2026-01')
// Output: SettlementBreakdown
interface SettlementBreakdown {
  driverId: string;
  period: string;
  
  // Income (from Uber/Bolt reports)
  uberGross: number;
  uberPlatformCommission: number;
  boltGross: number;
  boltPlatformCommission: number;
  totalGross: number;
  totalPlatformCommission: number;
  
  // Fleet provision (configurable per driver/vehicle)
  provisionRate: number;           // e.g., 0.15 = 15%
  provisionAmount: number;         // totalGross * provisionRate
  
  // Costs allocated to this driver in period
  fuelCost: number;
  maintenanceCost: number;
  insuranceCost: number;           // prorated
  finesCost: number;
  totalCosts: number;
  
  // Final
  netPayout: number;               // totalGross - platformCommission - provision - totalCosts
  
  // Ledger events to create (idempotent)
  ledgerEvents: Omit<BalanceEvent, 'id' | 'runningBalance' | 'timestamp' | 'createdBy' | 'createdByName'>[];
}
```

**Policy decisions needed (deferred):**
- Provision rate: per driver? per vehicle? tiered by tenure?
- Cost allocation: fuel → assigned driver at transaction date? maintenance → driver at time of service?
- Insurance proration: daily? monthly? per-km?

### 2. Fleet P&L (`fleetProfit.service.ts`)

```typescript
interface FleetPnL {
  period: string;
  
  // Revenue
  totalUberGross: number;
  totalBoltGross: number;
  totalPlatformCommissions: number;
  totalFleetProvision: number;     // sum of all driver provisions
  
  // Costs
  totalFuel: number;
  totalMaintenance: number;
  totalInsurance: number;
  totalFines: number;
  totalOtherCosts: number;
  
  // Net
  grossProfit: number;             // totalFleetProvision - totalCosts
  profitMargin: number;            // grossProfit / totalFleetProvision
  
  // Per-vehicle breakdown
  byVehicle: VehiclePnL[];
  
  // Per-driver breakdown
  byDriver: DriverPnL[];
}

interface VehiclePnL {
  registrationNumber: string;
  driverId: string | null;
  revenue: number;                 // provision from assigned driver(s)
  fuel: number;
  maintenance: number;
  insurance: number;
  fines: number;
  net: number;
}

interface DriverPnL {
  driverId: string;
  driverName: string;
  grossEarnings: number;
  provisionPaid: number;
  costsCharged: number;
  netPayout: number;
}
```

### 3. Income Reporting (`incomeReporting.service.ts`)

```typescript
// Ingest Uber/Bolt report → create ledger events (idempotent)
async function ingestUberReport(report: UberReport): Promise<BalanceEvent[]> {
  // 1. Validate report completeness
  // 2. For each driver in report:
  //    - Create income_uber event (idempotency: u:{driverId}:{YYYY}W{WW})
  //    - metadata: { period, trips, grossEarnings, platformCommission }
  // 3. Return created events
}

async function ingestBoltReport(report: BoltReport): Promise<BalanceEvent[]> {
  // Same pattern, idempotency: b:{driverId}:{YYYY}W{WW}
}
```

### 4. Cost Allocation (`costAllocation.service.ts`)

```typescript
// Fuel card transaction → repayments event
async function allocateFuelTransaction(txn: FuelTransaction): Promise<BalanceEvent> {
  // Find driver assigned to vehicle at txn.date
  // Create repayments (deduction from driver balance)
  // Idempotency: r:{txnId}
}

// Maintenance record → penalty event
async function allocateMaintenance(record: MaintenanceRecord): Promise<BalanceEvent> {
  // Find driver at record.date
  // Create penalty event
  // Idempotency: p:{maintenanceId}
}

// Insurance proration → periodic penalty events
async function allocateInsurancePremium(policy: InsurancePolicy): Promise<BalanceEvent[]> {
  // Split premium across period, create penalty per driver per month
}

// Fine → penalty event
async function allocateFine(fine: Fine): Promise<BalanceEvent> {
  // Direct to driver/vehicle
}
```

### 5. Settlement Runner (`settlementRunner.service.ts`)

```typescript
// Orchestrator: run monthly batch
async function runPeriodSettlement(period: string): Promise<SettlementRunResult> {
  // 1. Get all active drivers in period
  // 2. For each: compute SettlementBreakdown via driverSettlement.service
  // 3. Write ledger events atomically (batch)
  // 4. Return summary: { processed, failed, totalPayout, totalProvision }
}

// Early settlement already handled by earlySettlements.service.ts
```

---

## Integration Points (Ledger Events Created)

| Trigger | Service | Creates Event(s) |
|---------|---------|------------------|
| Uber report ingested | `incomeReporting.service.ts` | `income_uber` (per driver/week) |
| Bolt report ingested | `incomeReporting.service.ts` | `income_bolt` (per driver/week) |
| Period settlement run | `settlementRunner.service.ts` | `settlement` (per driver/month) |
| Fuel transaction | `costAllocation.service.ts` | `repayments` (deduction) |
| Maintenance done | `costAllocation.service.ts` | `penalty` |
| Insurance prorated | `costAllocation.service.ts` | `penalty` (monthly) |
| Fine issued | `costAllocation.service.ts` | `penalty` |
| Early settlement approved | `earlySettlements.service.ts` | `settlement` + `early_settlement_discount` (atomic) |

---

## Admin UI (Future)

| Page | Purpose | Status |
|------|---------|--------|
| `/finance/settlements` | Run period settlement, review batch results | **NOT BUILT** |
| `/finance/fleet-pnl` | Fleet P&L dashboard (per vehicle, per driver) | **NOT BUILT** |
| `/finance/income-reports` | Upload/ingest Uber/Bolt reports | **NOT BUILT** |
| `/finance/costs` | Review cost allocations, manual overrides | **NOT BUILT** |
| `/finance/drivers/[id]/settlement` | Per-driver settlement detail (breakdown) | **NOT BUILT** |

> Current driver detail page (`/drivers/[id]`) shows ledger only — no settlement breakdown.

---

## Configuration (Policy) — **NEEDS DECISIONS**

| Parameter | Where Defined | Status |
|-----------|---------------|--------|
| Default provision rate | `src/lib/assets/constants.ts` | **UNDEFINED** |
| Per-driver provision overrides | Driver document? | **UNDEFINED** |
| Cost allocation rules | Config object / DB | **UNDEFINED** |
| Settlement frequency | Monthly driver payouts, weekly platform ingestion | Resolved in `MONTHLY_COMPANY_LEDGER_PLAN.md` |
| Cash reconciliation policy | Deferred | Deferred |
| Insurance proration method | Daily / monthly / per-km | **UNDEFINED** |

---

## Implementation Order

### Phase 1: Core Calculation Services (Pure Logic)
1. `driverSettlement.service.ts` — `computeDriverSettlement(driverId, period)`
2. `fleetProfit.service.ts` — `computeFleetPnL(period)`
3. Unit tests for both (pure functions, no DB)

### Phase 2: Ingestion & Allocation Services
4. `incomeReporting.service.ts` — `ingestUberReport()`, `ingestBoltReport()`
5. `costAllocation.service.ts` — `allocateFuel()`, `allocateMaintenance()`, `allocateInsurance()`, `allocateFine()`

### Phase 3: Orchestration & API
6. `settlementRunner.service.ts` — `runPeriodSettlement(period)`
7. Admin API endpoints: `POST /api/finance/settlement/run`, `GET /api/finance/pnl`
8. Admin UI pages (settlements list, fleet P&L, income reports upload)

### Phase 4: Integration with Existing Ledger
9. Wire settlement runner → creates `settlement` events via existing `setBalanceEvent`
10. Verify idempotency: re-running same period produces no duplicates
11. Add `verifyBalance()` audit tool (already designed in archived plan)

---

## Testing Strategy

| Layer | Approach |
|-------|----------|
| Pure calculations (`driverSettlement`, `fleetProfit`) | Unit tests with fixed inputs → expected breakdowns |
| Ingestion/Allocation services | Mock Firestore, test idempotency keys, event shapes |
| Settlement runner | Integration test: seed reports + costs → run → verify ledger events |
| Admin UI | Playwright: upload report → run settlement → check driver balance |

---

## Open Questions (Resolved in `MONTHLY_COMPANY_LEDGER_PLAN.md`)

1. **Provision model**: Flat % of gross configured per driver or per batch entry.
2. **Cost allocation**: Fuel → driver at pump date; maintenance → vehicle overhead or driver penalty; insurance → vehicle overhead.
3. **Settlement period**: Ride platform reports ingested weekly; driver payouts executed monthly.
4. **Cash handling**: Deferred.
5. **Historical data**: Start fresh from go-live date.

---

## File Structure (Target)

```
src/lib/server/services/
├── fleetProfit.service.ts           # Fleet P&L, per-vehicle/driver
├── driverSettlement.service.ts      # Per-driver period settlement
├── incomeReporting.service.ts       # Uber/Bolt → ledger
├── costAllocation.service.ts        # Costs → ledger
├── settlementRunner.service.ts      # Batch orchestration
└── ledger.service.ts                # (existing) idempotency keys

src/routes/api/finance/
├── settlement/
│   ├── run/+server.ts               # POST: trigger period settlement
│   └── status/+server.ts            # GET: last run status
├── pnl/+server.ts                   # GET: fleet P&L
├── income-reports/
│   ├── uber/+server.ts              # POST: ingest Uber report
│   └── bolt/+server.ts              # POST: ingest Bolt report
└── costs/
    ├── fuel/+server.ts              # POST: allocate fuel
    ├── maintenance/+server.ts       # POST: allocate maintenance
    └── insurance/+server.ts         # POST: allocate insurance

src/routes/(admin)/finance/
├── settlements/                     # Settlement runs list + detail
├── fleet-pnl/                       # Fleet P&L dashboard
├── income-reports/                  # Upload/ingest reports
└── costs/                           # Cost allocation review
```

---

## Notes

- **Money**: All amounts in PLN grosze (integer) or `round()` to 2dp — no floats
- **Idempotency**: Every ledger write uses `ledger.service.ts` key generators + `merge: false`
- **Audit**: Every settlement run produces verifiable ledger events; `verifyBalance()` detects drift
- **Uber/Bolt sync**: Not implemented — this plan assumes reports are uploaded manually or via future API sync
- **No migration needed**: Ledger starts empty; historical balances not imported