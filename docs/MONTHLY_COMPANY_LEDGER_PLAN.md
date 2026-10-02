# Company Monthly Ledger, Fleet Profit & Settlement Plan

## Executive Summary
This document is the unified master plan for company-level financial accounting, driver monthly settlements, operational cost allocation, and multi-tier profitability reporting (Company, Vehicle, Driver).

It fuses the macro financial tracking from the Company General Ledger (CGL) with the micro-settlement calculation logic from the Fleet Profit & Settlement System, while incorporating the operational realities of the fleet:

1. **Cadence Alignment (Weekly Ingestion vs. Monthly Payouts)**:
   * **Weekly Ingestion**: Ride platforms (Uber and Bolt) report and settle earnings on a **weekly** cycle (`YYYY-Www`).
   * **Monthly Settlement & Payouts**: The company settles and distributes standard payouts to drivers **monthly** on a calendar-month basis (`YYYY-MM`).
   * **Ad-hoc Early Settlements**: Drivers can request advance payouts against their running balance at any time during the month via the Early Settlement flow.
2. **Manual-First Operation (Immediate & Failsafe)**:
   * Automated API sync (Uber/Bolt direct clients, fuel card telematics) is deferred.
   * The system is built around a **bottom-up manual entry and CSV batch upload workflow**. This provides immediate operational capability while serving as a permanent failsafe when integrations break.
3. **Cash Option Deferred**:
   * All cash collection, deposit, and adjustment flows are deferred. Financial balances represent non-cash earnings, bank transfers, card invoices, and platform commissions.
4. **Three-Tier Profitability ("The Team Model")**:
   * Complete visibility across **Company P&L**, **Vehicle P&L**, and **Driver P&L** by dual-tagging company ledger events with both `driverId` and `vehicleId`.

---

## 1. Business Rules & Financial Flows

```
                   ┌────────────────────────────────────────┐
                   │          Uber / Bolt Platforms         │
                   └───────────────────┬────────────────────┘
                                       │ Weekly Gross Earnings
                                       ▼
                   ┌────────────────────────────────────────┐
                   │             Fleet Company              │
                   └─────────┬────────────────────┬─────────┘
                             │                    │
        Retained Provision % │                    │ Net Earnings Share
        (Company Revenue)    │                    │ (Credited Weekly)
                             ▼                    ▼
     ┌─────────────────────────────┐    ┌─────────────────────────────┐
     │     companyLedgerEvents     │    │     driverBalanceEvents     │
     │  type: platform_payout_*    │    │      type: income_*         │
     └──────────────┬──────────────┘    └──────────────┬──────────────┘
                    │                                  │
                    │ Operating Costs & Deductions     │
                    │ (Fuel, Maintenance, Tickets)    │
                    ▼                                  ▼
     ┌─────────────────────────────┐    ┌─────────────────────────────┐
     │     Company Expenses        │◄───┤    Driver Deductions        │
     │     type: expense           │    │    type: penalty/repayments │
     └──────────────┬──────────────┘    └──────────────┬──────────────┘
                    │                                  │
                    │ Monthly Aggregation              │ Monthly Settlement
                    │ (P&L Dashboard)                  │ (Bank Payout)
                    ▼                                  ▼
     ┌─────────────────────────────┐    ┌─────────────────────────────┐
     │   monthlyFinancialReports   │    │     type: settlement        │
     │   (Company / Car / Driver)  │    │     (Paid out once/month)   │
     └─────────────────────────────┘    └─────────────────────────────┘
```

### 1.1 Ride Platform Revenue & Fleet Provision
* Uber and Bolt calculate earnings on a weekly cycle (Monday 00:00 to Sunday 23:59).
* Payouts from platforms are remitted to the **company** bank account, not to individual drivers.
* Each driver operates under an agreed Fleet Provision structure (e.g., flat 10-15% commission or fixed weekly fleet fee).
* **Weekly Entry**: For every driver active in a given week:
  * Company Gross Profit (Provision) is credited to `companyLedgerEvents` (`platform_payout_uber` / `platform_payout_bolt`).
  * Driver Net Earnings (`Gross - Platform Commission - Fleet Provision`) are credited to `driverBalanceEvents` (`income_uber` / `income_bolt`).

### 1.2 Company-Fronted Operational Costs & Allocation
The company frequently pays operational expenses upfront. These fall into two distinct accounting treatments:

1. **Driver-Recoverable Costs** (Billed back to the driver):
   * **Fuel Cards**: Drivers use fleet fuel cards. The fuel distributor bills the company consolidated monthly/bi-weekly invoices. When individual fuel transactions are recorded, they are logged as:
     * An `expense` event in `companyLedgerEvents` (tagged with `vehicleId` and `driverId`).
     * A `repayments` or `penalty` deduction event in `driverBalanceEvents` (reducing the driver's payout balance).
   * **Traffic Tickets / Speed Camera Fines**: Tickets are mailed to the vehicle owner (the company). Once identified, the fine is logged as:
     * An `expense` event in `companyLedgerEvents` (`category: 'ticket'`).
     * A `penalty` deduction event in `driverBalanceEvents`.
   * **Driver-Fault Damage / Negligence**: Billed to company by repair shop; deducted from driver.

2. **Fleet / Vehicle Overhead Costs** (Absorbed by the company):
   * **Insurance Policies (OC/AC/NNW/Taxi)**: Annual/monthly company bill. Tagged with `vehicleId`, NOT deducted from driver.
   * **Vehicle Leases & Financing**: Monthly fleet expenditure per car. Tagged with `vehicleId`, NOT deducted from driver.
   * **Routine Scheduled Maintenance**: General servicing, oil changes, tire rotations. Tagged with `vehicleId`.
   * **Corporate Overhead**: Office rent, accounting fees, software licenses. Tagged with neither `vehicleId` nor `driverId`.

### 1.3 Driver Payouts: Monthly vs. Early Settlement
* **Monthly Regular Settlement (Standard)**:
  * Drivers do **not** receive weekly bank payouts.
  * Instead, net weekly income and deductions accumulate in their `driverBalanceEvents` running balance throughout the calendar month.
  * At month-end (e.g. 1st-5th of following month), the company executes a monthly settlement run:
    * The driver's accumulated balance is finalized and paid out via bank transfer.
    * A `settlement` event is logged in `driverBalanceEvents` (resetting running balance to 0 or carrying over negative debt).
    * A `driver_payouts_batch` expense event is logged in `companyLedgerEvents`.
* **Early Settlement (Ad-Hoc / On-Demand)**:
  * Drivers needing funds mid-month submit an early settlement request via `EarlySettlementRequest.svelte`.
  * Managed by `earlySettlements.service.ts`:
    * Fee is calculated (e.g. 5% fee rate: `requestedAmount * 0.05`).
    * Admin approves the payout.
    * Two ledger events are written atomically:
      1. `settlement` for `-actualPayout` (reduces driver balance).
      2. `early_settlement_discount` for `-fee` (retained by company).

---

## 2. Three-Tier Profitability Model

To provide actionable operational intelligence, financial metrics are calculated along three dimensions:

```
┌────────────────────────────────────────────────────────┐
│                      COMPANY P&L                       │
│  Fleet Provisions + Recovered Costs - Total Company Costs  │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│        VEHICLE P&L        │   │        DRIVER P&L         │
│  Vehicle Provisions       │   │  Driver Gross Earnings    │
│  Minus:                   │   │  Minus:                   │
│   - Fuel Costs            │   │   - Platform Commission   │
│   - Maintenance           │   │   - Company Provision     │
│   - Insurance             │   │   - Driver Deductions     │
│   - Lease / Amortization  │   │  Net Payout & Margin      │
└───────────────────────────┘   └───────────────────────────┘
```

### 2.1 The "Team" Link
Because vehicles and drivers operate as teams, events in `companyLedgerEvents` support optional dual-tagging:
* `driverId`: Responsible or active driver.
* `vehicleId`: Subject vehicle.

| Expense Example | `driverId` | `vehicleId` | Impact on P&L |
| :--- | :--- | :--- | :--- |
| **Office Rent** | `null` | `null` | Company overhead only |
| **Fleet Insurance (Car #1)** | `null` | `"veh_toyota_01"` | Vehicle #1 cost & Company cost |
| **Fuel Fill-up by Driver A** | `"drv_jan"` | `"veh_toyota_01"` | Driver A deduction, Vehicle #1 fuel, Company fuel |
| **Speeding Ticket (Driver A)** | `"drv_jan"` | `"veh_toyota_01"` | Driver A penalty, Vehicle #1 ticket, Company cost |
| **Brake Pad Replacement** | `null` | `"veh_toyota_01"` | Vehicle #1 maintenance & Company cost |

### 2.2 Profitability Formulas

1. **Company Net Profit (Month)**:
   $$\text{Gross Fleet Income} = \sum \text{Provision Cuts (Uber + Bolt)}$$
   $$\text{Recovered Costs} = \sum \text{Fuel/Ticket Deductions applied to drivers}$$
   $$\text{Company Expenses} = \sum \text{All Company Ledger Expenses (Fuel invoices, insurance, maintenance, tickets, rent)}$$
   $$\mathbf{Net\ Company\ Profit} = \text{Gross Fleet Income} - \text{Company Expenses} + \text{Recovered Costs}$$

2. **Vehicle Net Profit (Month)**:
   $$\mathbf{Vehicle\ Net} = \text{Provisions from rides in this vehicle} - (\text{Fuel} + \text{Maintenance} + \text{Insurance} + \text{Lease} + \text{Fines})$$

3. **Driver Profitability & Payout (Month)**:
   $$\text{Driver Gross} = \sum (\text{Uber Gross} + \text{Bolt Gross})$$
   $$\text{Driver Deductions} = \sum (\text{Fuel} + \text{Tickets} + \text{Repayments})$$
   $$\mathbf{Driver\ Net\ Payout} = \text{Driver Gross} - \text{Platform Fees} - \text{Company Provision} - \text{Driver Deductions} - \text{Early Settlements Paid}$$

---

## 3. Data Model

Two core collections in Firestore support macro-level financial reporting and reconcile with the existing `driverBalanceEvents`.

### 3.1 `companyLedgerEvents` (Firestore Collection)
Append-only log of money movements into and out of company accounts.

```typescript
namespace CompanyLedger {
  type LedgerEventType =
    | 'platform_payout_uber'       // Retained fleet provision from Uber
    | 'platform_payout_bolt'       // Retained fleet provision from Bolt
    | 'expense'                    // Operating invoice/cost (fuel, maintenance, tickets, etc.)
    | 'driver_payouts_batch';      // Batch monthly bank remittance to drivers

  type ExpenseCategory =
    | 'fuel'
    | 'maintenance'
    | 'insurance'
    | 'ticket'
    | 'cleaning'
    | 'towing'
    | 'lease'
    | 'office'
    | 'other';

  interface LedgerEvent {
    id: string;                    // Idempotency key (document ID)
    period: string;                // "YYYY-MM" (e.g., "2026-01")
    type: LedgerEventType;
    amount: number;                // PLN, 2 decimals (+ income, - expense)
    
    // The "Team" Link
    driverId?: string;             // Optional association with driver
    vehicleId?: string;            // Optional association with vehicle
    
    referenceId?: string;          // External invoice #, transaction ID, bank transfer #
    
    metadata: {
      week?: string;               // e.g., "2026-W05" (crucial for weekly ride data)
      expenseCategory?: ExpenseCategory;
      description?: string;
      isRecoverable?: boolean;     // True if billed back to driver as deduction
      driverEventId?: string;      // Links to corresponding driverBalanceEvents doc
      [key: string]: any;
    };
    
    timestamp: number;             // Epoch ms
    createdBy: string;             // User UID
    createdByName: string;
  }

  interface IdempotencyKeyFormats {
    platform_payout_uber: `up:${string}:${number}W${number}`; // up:driverId:2026W05
    platform_payout_bolt: `bp:${string}:${number}W${number}`; // bp:driverId:2026W05
    expense: `ex:${string}:${number}`;                        // ex:fuel:1710000000
    driver_payouts_batch: `dpb:${string}:${number}`;          // dpb:202601:1710000000
  }
}
```

### 3.2 `monthlyFinancialReports` (Firestore Collection)
Pre-aggregated snapshots generated at the end of each calendar month.

```typescript
namespace CompanyLedger {
  type ReportStatus = 'draft' | 'finalized';

  interface VehiclePnLSummary {
    registrationNumber: string;
    revenue: number;               // Provisions generated by this vehicle
    fuelCost: number;
    maintenanceCost: number;
    insuranceCost: number;
    ticketsCost: number;
    otherCosts: number;
    totalCosts: number;
    netProfit: number;
  }

  interface DriverPnLSummary {
    driverId: string;
    driverName: string;
    grossEarnings: number;
    platformCommission: number;
    provisionPaid: number;
    costsDeducted: number;
    earlySettlementsPaid: number;
    finalMonthlyPayout: number;
  }

  interface MonthlyReport {
    id: string;                    // e.g., "2026-01"
    period: string;                // "2026-01"
    
    // Macro Fleet Metrics
    totalGrossRevenue: number;         // Total driver ride earnings reported
    totalPlatformCommissions: number;  // Platform fees deducted by Uber/Bolt
    totalFleetProvision: number;       // Fleet company gross profit
    totalCompanyExpenses: number;      // Operating bills paid by company
    totalRecoveredCosts: number;       // Deductions collected from drivers
    totalDriverPayouts: number;        // Month-end payouts + early settlements
    companyNetProfit: number;          // totalFleetProvision - expenses + recovered
    profitMargin: number;              // companyNetProfit / totalFleetProvision
    
    // Breakdown by Category
    expenseBreakdown: Record<ExpenseCategory, number>;

    // Sub-Reports
    vehiclePnL: Record<string, VehiclePnLSummary>; // Keyed by vehicleId
    driverPnL: Record<string, DriverPnLSummary>;   // Keyed by driverId
    
    // Reconciliation Verification
    reconciliation: {
      fuelDiscrepancy: number;     // Company fuel invoices vs. Driver fuel deductions
      ticketDiscrepancy: number;   // Company tickets paid vs. Driver ticket deductions
      unrecoveredExpenses: number; // Invoices marked recoverable but not yet billed to driver
    };
    
    status: ReportStatus;
    generatedAt: number;
    generatedBy: string;
    generatedByName: string;
  }
}
```

### 3.3 BigQuery Storage (Statistical & Historical Data - Deferred)
While Firestore handles lean operational ledgers (running balances, payouts), **BigQuery** is designated for fat, analytical, and historical record-keeping. 

For details on the architecture, schema, and rollout plan for this split, see the [BigQuery Migration Plan](./BIGQUERY_MIGRATION_PLAN.md).

---

## 4. Manual-First Operational Workflows

Because automated API clients are deferred, the entire lifecycle is designed to run predictably via manual entry endpoints and bulk uploads.

### Workflow A: Ingesting Weekly Uber/Bolt Earnings
Admins receive weekly summary sheets or CSV files from Uber and Bolt. Rather than entering a single lumped total, admins use the **Bottom-Up Weekly Entry Tool**.

* **Endpoint**: `POST /api/finance/settlements/manual`
* **Payload**:
```json
{
  "period": "2026-01",
  "week": "2026-W04",
  "platform": "uber",
  "driverEntries": [
    {
      "driverId": "drv_kuba123",
      "grossEarnings": 2500.00,
      "platformCommission": 625.00,
      "provisionRate": 0.12,
      "trips": 54
    },
    {
      "driverId": "drv_adam456",
      "grossEarnings": 1800.00,
      "platformCommission": 450.00,
      "provisionRate": 0.12,
      "trips": 38
    }
  ]
}
```

* **Atomic Execution per Driver**:
  1. Calculate Fleet Cut: `2500.00 * 0.12 = 300.00 PLN`
  2. Calculate Driver Net: `2500.00 (Gross) - 625.00 (Platform Fee) - 300.00 (Fleet Cut) = 1575.00 PLN`
  3. Write to `driverBalanceEvents` (Lean Operational Record):
     * `type`: `'income_uber'`
     * `amount`: `+1575.00`
     * `id`: `"u:drv_kuba123:2026W04"`
     * `referenceId`: `"2026-W04"`
     * `metadata`: `{ period: "2026-01" }` *(Keep minimal, no stats)*
  4. Write to `companyLedgerEvents` (Lean Operational Record):
     * `type`: `'platform_payout_uber'`
     * `amount`: `+300.00`
     * `id`: `"up:drv_kuba123:2026W04"`
     * `driverId`: `"drv_kuba123"`
     * `referenceId`: `"2026-W04"`
     * `metadata`: `{ week: "2026-W04" }` *(Keep minimal, no stats)*
  5. **Deferred (BigQuery)**: Insert a statistical row into BigQuery `weekly_platform_earnings` containing the raw CSV data, gross amounts, trip counts, and hours online.

This guarantees that every złoty credited to the company's ledger directly reconciles with what was earned by the driver, while keeping Firestore lean.

### Workflow B: Logging Operating Expenses & Recoveries
When an invoice is paid (e.g. monthly Orlen fuel card bill of 15,000 PLN):
1. **Bulk Company Expense**:
   * Admin logs the invoice in `/finance/company-ledger/new`.
   * System creates an `expense` event in `companyLedgerEvents` for `-15000.00 PLN` (`category: 'fuel'`, `referenceId: 'FV/2026/01/1042'`).
2. **Itemized Driver Deductions (Fuel Transactions)**:
   * Admin enters or uploads the CSV of individual fuel card charges.
   * For each transaction (e.g. Driver Janek pumped 250 PLN in vehicle `KR-12345`):
     * A `repayments` deduction of `-250.00 PLN` is posted to `driverBalanceEvents` for Janek.
     * The `companyLedgerEvents` reconciliation counter increments recovered fuel by `+250.00 PLN`.

### Workflow C: Early Settlement Request (Ad-Hoc)
*(Already built & active in codebase)*
1. Driver requests early payout of e.g. 1000 PLN.
2. System computes 5% fee: 50 PLN; payout = 950 PLN.
3. Admin approves request via `/earlysettlements/[id]/approve`.
4. System posts atomic events:
   * `settlement`: `-950.00 PLN`
   * `early_settlement_discount`: `-50.00 PLN`
5. Driver running balance decreases by 1000.00 PLN immediately.

### Workflow D: Monthly Settlement Run (End-of-Month Driver Payouts)
On the 1st of the new month (e.g., February 1 for January 2026):
1. Admin opens `/finance/settlements`.
2. System displays a table of all drivers and their final January running balances (net weekly platform earnings - deductions - early settlements paid).
3. Admin clicks **"Approve & Execute Monthly Payouts"**:
   * For each driver with a positive balance (e.g. Driver Janek has +3,450.00 PLN):
     * System generates bank export (Elixir / SEPA format).
     * System writes `settlement` event for `-3450.00 PLN` to `driverBalanceEvents`.
     * Driver's running balance is now 0.00 PLN.
   * System writes a single summary batch event `driver_payouts_batch` to `companyLedgerEvents` for the total disbursed sum.

### Workflow E: Generating the Monthly Financial Report (P&L)
1. Admin navigates to `/finance/reports` and clicks **"Generate Report for 2026-01"**.
2. Service aggregates:
   * Total fleet provisions recorded.
   * Total operating expenses recorded in `companyLedgerEvents`.
   * Total deductions recovered from drivers.
   * Vehicle-by-vehicle and driver-by-driver P&L breakdowns.
3. Runs the **Reconciliation Engine**:
   * Compares total fuel invoices paid by company vs. total fuel deducted from drivers.
   * Flags any discrepancy: *e.g., "Warning: 450 PLN of fuel charges paid by company have not been allocated to any driver."*
4. Persists the `MonthlyReport` document as `'finalized'`.

---

## 5. Target File & Service Architecture

```
src/lib/server/
├── db/firebase/
│   ├── driverBalanceEvents.fdb.ts     # (Existing) Driver ledger CRUD
│   ├── earlySettlements.fdb.ts        # (Existing) Early settlement CRUD
│   ├── companyLedgerEvents.fdb.ts     # (New) Company ledger CRUD & queries
│   └── monthlyReports.fdb.ts          # (New) Monthly P&L report CRUD
│
└── services/
    ├── ledger.service.ts              # (Existing) Driver idempotency keys
    ├── earlySettlements.service.ts    # (Existing) Early settlement transactions
    │
    ├── companyLedger.service.ts       # (New) Company ledger writes & idempotency
    ├── manualSettlement.service.ts    # (New) Bottom-up weekly earnings ingestion
    ├── monthlySettlement.service.ts   # (New) Month-end driver payout batch run
    └── monthlyReport.service.ts       # (New) P&L aggregation & reconciliation logic

src/routes/(admin)/finance/
├── company-ledger/                    # View & add company expenses/income
│   ├── +page.svelte
│   └── new/+page.svelte
├── manual-settlement/                 # Weekly Uber/Bolt earnings input form
│   ├── +page.svelte
│   └── api/+server.ts
├── settlements/                       # Monthly driver payout execution
│   ├── +page.svelte
│   └── run/+server.ts
└── reports/                           # Monthly P&L Dashboard
    ├── +page.svelte
    └── [period]/+page.svelte          # Detailed month view (Company, Car, Driver)
```

---

## 6. Implementation Roadmap

### Phase 1: Data Model & Foundation (Immediate)
* [x] Verify `CompanyLedger` namespace in `src/app.d.ts` (complete, cash deposit removed).
* [x] Create `src/lib/server/db/firebase/companyLedgerEvents.fdb.ts` (CRUD, filtering by period/category/driver/vehicle).
* [x] Create `src/lib/server/services/companyLedger.service.ts` (idempotent writes, platform payout & expense logging, period summary).

### Phase 2: Manual Weekly Ingestion Engine
* [x] Create `weeklyIngestation.service.ts` with atomic transaction (driver net + company provision).
* [x] Create endpoint `POST /weeklyingestations/new/api`.
* [x] Build Admin UI `/weeklyingestations` & `/weeklyingestations/new` (with `CardForm` & `ClosableModal` driver picker) for submitting weekly Uber/Bolt sheets.
* [x] Add Finances section to sidebar (`Sidebar.svelte`).

### Phase 3: Cost Logging & Driver Recovery
* [ ] Implement expense logging modal/page with dual-tagging (`vehicleId`, `driverId`).
* [ ] Implement recoverable expense linkage (writes company `expense` + driver `repayments`/`penalty`).

### Phase 4: Monthly Driver Settlement Run
* [ ] Create `monthlySettlement.service.ts` to fetch all driver running balances at month end.
* [ ] Implement batch settlement execution (clears balances, logs `settlement` + `driver_payouts_batch`).
* [ ] Build UI at `/finance/settlements` to review and trigger monthly payouts.

### Phase 5: Monthly P&L Reporting & Reconciliation
* [ ] Create `monthlyReport.service.ts` to compute Company P&L, Vehicle P&L, and Driver P&L.
* [ ] Implement discrepancy checks (fuel invoice vs fuel deducted).
* [ ] Build Dashboard at `/finance/reports/[period]` with visual P&L breakdowns.
