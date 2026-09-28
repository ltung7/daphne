# Job Scheduling & Infrastructure Plan

> **Status**: New plan — consolidates all periodic/scheduled jobs from existing plans
> **Related**: `VEHICLE-STATUS-TRANSITION-PLAN-PART2.md` (health check resolver), `FLEET_PROFIT_SETTLEMENT_PLAN.md` (settlement runner), `FLEET_PLAN.md` (sync, telemetry, alerts), `DRIVER-STATUS-TRANSITION-PLAN.md` (leave transitions, document expiry), `EMAIL_NOTIFICATIONS_PLAN.md` (mail queue worker)

---

## Job Categories Overview

| Category | Jobs | Frequency |
|----------|------|-----------|
| **Health & Compliance** | Vehicle document expiry → `unmovable`, Driver document expiry → `documents_expired`, Driver leave start/end transitions | Daily |
| **Uber/Bolt Sync** | Earnings/pull reports, Driver/vehicle status sync, Document sync | Daily (earnings), Hourly (status) |
| **Settlement & Finance** | Period settlement run (weekly/monthly), Insurance proration, Cost allocation (fuel, maintenance, fines) | Weekly / Monthly / Event-driven |
| **Telemetry** | Daily vehicle stats computation, Device offline alerts, Harsh event alerts | Daily / Hourly / Real-time |
| **Alerts & Notifications** | Document expiry warnings (30/14/7d), Inspection overdue, Settlement ready, Sync failures, Fuel anomalies, Provision anomalies | Every 6h / Daily |
| **Email/Queue Workers** | Queued mail processing (retry/backoff), Dead letter alerting | Continuous (cron every 5min) |
| **Reporting** | Monthly P&L per vehicle, Fleet aggregate, Driver performance, Compliance audit | Monthly / On-demand |

---

## Detailed Job Specifications

### 1. Health & Compliance Jobs (Daily)

#### 1.1 Vehicle Document Expiry Auto-Transition
- **Source**: `VEHICLE-STATUS-TRANSITION-PLAN-PART2.md` §1, `vehicleExpirationDates.resolver.ts`
- **Trigger**: Daily cron (02:00 UTC)
- **Logic**: Query `healthIssues` for `entityType: 'vehicle'` + `severity: 'critical'` + types `insurance_expiring` / `technical_expiring` where `expirationDate < now()`
- **Action**: For each vehicle → `changeVehicleStatus(vehicleId, 'unmovable', { reason: 'Auto-transition: expired insurance/technical', source: 'health_check' }, { id: 'system', name: 'Auto Health Check', role: 'system' })`
- **Idempotency**: Resolver skips if already `unmovable`
- **Audit**: `vehicleStatusChange` with `extraData.source: 'auto_health_check'`, `changedBy: 'system'`
- **File**: `src/lib/server/jobs/vehicleHealthAutoTransition.job.ts` (new)

#### 1.2 Driver Document Expiry → `documents_expired`
- **Source**: `DRIVER-STATUS-TRANSITION-PLAN.md` §4, `driverExpirationDates.resolver.ts`
- **Trigger**: Daily cron (03:00 UTC)
- **Logic**: `checkDriverExpirationDates` via `healthCheck.service.ts` → finds expired docs (severity `critical`)
- **Action**: Resolver sends `documentExpiredNotification` + updates driver status to `'documents_expired'`
- **Cascade**: If driver `active` → forced handover return (vehicle → `available`)
- **File**: `src/lib/server/jobs/driverDocumentExpiryTransition.job.ts` (new)

#### 1.3 Driver Leave Transitions (`on_leave` start/end)
- **Source**: `DRIVER-STATUS-TRANSITION-PLAN.md` §3.2
- **Trigger**: Daily cron (01:00 UTC)
- **Logic**: Query `driverLeaves` where `dateFrom == today` → set driver status `on_leave`; where `dateEnd == today` → set driver status `available` (if docs valid) or `documents_expired`
- **Precondition**: If `dateFrom` and driver `active` → vehicle must be returned first (handover return)
- **File**: `src/lib/server/jobs/driverLeaveTransitions.job.ts` (new)

---

### 2. Uber/Bolt Sync Jobs

#### 2.1 Daily Earnings Sync
- **Source**: `FLEET_PLAN.md` §3.2, `FLEET_PROFIT_SETTLEMENT_PLAN.md` §3
- **Trigger**: Daily cron (04:00 UTC) — after platform payouts finalize
- **Logic**: 
  - Uber: `incomeReporting.ingestUberReport()` → creates `income_uber` ledger events (idempotency key: `u:{driverId}:{YYYY}W{WW}`)
  - Bolt: `incomeReporting.ingestBoltReport()` → creates `income_bolt` ledger events (idempotency key: `b:{driverId}:{YYYY}W{WW}`)
- **Fallback**: Sheet import UI for manual CSV/Excel upload
- **File**: `src/lib/server/jobs/dailyEarningsSync.job.ts` (new)

#### 2.2 Hourly Platform Status Sync
- **Source**: `FLEET_PLAN.md` §3.2
- **Trigger**: Hourly cron
- **Logic**: `boltSync.syncDrivers()`, `boltSync.syncVehicles()` — push/pull driver & vehicle status
- **File**: `src/lib/server/jobs/hourlyPlatformSync.job.ts` (new)

#### 2.3 Document Sync to Platforms
- **Source**: `FLEET_PLAN.md` §3.2
- **Trigger**: Daily cron (05:00 UTC)
- **Logic**: `boltSync.syncDocuments(driverId)` — push missing docs, handle rejections
- **File**: `src/lib/server/jobs/dailyDocumentSync.job.ts` (new)

---

### 3. Settlement & Finance Jobs

#### 3.1 Period Settlement Run
- **Source**: `FLEET_PROFIT_SETTLEMENT_PLAN.md` §5, `settlementRunner.service.ts`
- **Trigger**: 
  - **Weekly** (matching Uber/Bolt payout): Monday 06:00 UTC
  - **Monthly** (calendar): 1st of month 06:00 UTC
- **Logic**: `settlementRunner.runPeriodSettlement(period)` 
  - Get all active drivers in period
  - For each: compute `SettlementBreakdown` via `driverSettlement.service`
  - Write ledger events atomically (batch): `settlement` per driver
  - Return summary: `{ processed, failed, totalPayout, totalProvision }`
- **Idempotency**: Key `s:{driverId}:{period}`
- **File**: `src/lib/server/jobs/periodSettlementRunner.job.ts` (new)

#### 3.2 Insurance Proration (Monthly)
- **Source**: `FLEET_PROFIT_SETTLEMENT_PLAN.md` §4, `costAllocation.service.ts`
- **Trigger**: Monthly cron (2nd of month 02:00 UTC)
- **Logic**: `costAllocation.allocateInsurancePremium(policy)` → splits premium across period, creates `penalty` ledger events per driver per month
- **File**: `src/lib/server/jobs/monthlyInsuranceProration.job.ts` (new)

#### 3.3 Fuel Transaction Allocation (Event-driven, batched daily)
- **Source**: `FLEET_PROFIT_SETTLEMENT_PLAN.md` §4, `costAllocation.service.ts`
- **Trigger**: Daily cron (06:00 UTC) + webhook on new transaction
- **Logic**: `costAllocation.allocateFuelTransaction(txn)` → finds driver assigned at `txn.date` → creates `cash_collection` (negative) event
- **Idempotency**: Key `c:{driverId}:{YYYY}{MM}{DD}`
- **File**: `src/lib/server/jobs/dailyFuelAllocation.job.ts` (new)

#### 3.4 Maintenance/Fines Allocation (Event-driven)
- **Source**: `FLEET_PROFIT_SETTLEMENT_PLAN.md` §4
- **Trigger**: On record creation (webhook/admin action)
- **Logic**: `costAllocation.allocateMaintenance(record)`, `costAllocation.allocateFine(fine)` → creates `penalty` events
- **Idempotency**: Key `p:{maintenanceId}` / `p:{fineId}`

---

### 4. Telemetry Jobs

#### 4.1 Daily Vehicle Stats Computation
- **Source**: `FLEET_PLAN.md` §4.3
- **Trigger**: Daily cron (03:00 UTC)
- **Logic**: Aggregate `telemetryEvents` per vehicle per day → compute:
  - `distance`, `drivingTime`, `idleTime`, `fuelConsumed`, `harshEvents`, `maxSpeed`, `avgSpeed`
  - Store to `dailyVehicleStats` collection
- **File**: `src/lib/server/jobs/dailyVehicleStats.job.ts` (new)

#### 4.2 Device Offline Alert
- **Source**: `FLEET_PLAN.md` §4.3, §7.1
- **Trigger**: Hourly cron
- **Logic**: Check `telemetryEvents` — if no event for vehicle > 24h → create `alert` record (type `telemetry_offline`, severity `high`) + notify via alert engine
- **File**: `src/lib/server/jobs/hourlyTelemetryOfflineCheck.job.ts` (new)

#### 4.3 Scheduled Telemetry Pull (for non-webhook providers)
- **Source**: `FLEET_PLAN.md` §4.2
- **Trigger**: Hourly cron
- **Logic**: For vehicles with `telemetryProvider` lacking webhook → `provider.fetchTrips(last24h)` → normalize → store
- **File**: `src/lib/server/jobs/hourlyTelemetryPull.job.ts` (new)

---

### 5. Alerts & Notifications Jobs

#### 5.1 Scheduled Alert Evaluation
- **Source**: `FLEET_PLAN.md` §7.1, `LOCALIZED_NOTIFICATION_PLAN.md` §6
- **Trigger**: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
- **Logic**: `alertEngine.evaluate()` checks:
  - Document expiry (30d, 14d, 7d, expired) → `document_expiring` / `document_expired` alerts
  - Inspection overdue → `inspection_overdue`
  - Settlement ready for review → `settlement_ready`
  - Bolt sync failed → `bolt_sync_failed`
  - Telemetry offline > 24h → `telemetry_offline`
  - Fuel anomaly (sudden spike) → `fuel_anomaly`
  - Provision anomaly (driver payout ≠ calc) → `provision_anomaly`
- **Channels**: In-app, Email, Slack, Push (PWA)
- **Escalation**: Unacknowledged critical > 24h → notify superadmin
- **File**: `src/lib/server/jobs/scheduledAlertEvaluation.job.ts` (new)

#### 5.2 Document Expiry Warning Notifications
- **Source**: `VEHICLE-STATUS-TRANSITION-PLAN-PART2.md` (vehicle resolver TODO), `DRIVER-STATUS-TRANSITION-PLAN.md` §4
- **Trigger**: Daily cron (07:00 UTC)
- **Logic**: Query expiring docs (30d, 14d, 7d windows) → send `documentExpiringNotification` via email/SMS/push/in-app
- **File**: `src/lib/server/jobs/dailyDocumentExpiryWarnings.job.ts` (new)

---

### 6. Email/Queue Workers

#### 6.1 Queued Mail Processor
- **Source**: `EMAIL_NOTIFICATIONS_PLAN.md` §1.4
- **Trigger**: Every 5 minutes (cron)
- **Logic**: Process `queuedMails` collection:
  - Filter `status: 'pending'` AND `scheduledAt <= now()`
  - Send via Nodemailer
  - On success: `status: 'sent'`, `sentAt: now()`
  - On failure: `attempts++`, `error`, schedule retry with exponential backoff (5min, 15min, 1hr, 6hr, 24hr)
  - Max 5 attempts → `status: 'dead_letter'` → alert admin via Slack
- **File**: `src/lib/server/jobs/mailQueueProcessor.job.ts` (new)

---

### 7. Reporting Jobs

#### 7.1 Monthly Report Generation
- **Source**: `FLEET_PLAN.md` §5.1, §7.2
- **Trigger**: Monthly cron (3rd of month 02:00 UTC)
- **Logic**: Generate and store:
  - Fleet P&L per vehicle (`fleetProfit.service`)
  - Fleet aggregate P&L
  - Driver P&L
  - Vehicle utilization
  - Fuel efficiency
  - Compliance audit matrix
- **Output**: Excel + PDF stored in Firebase Storage, linked in `reports` collection
- **File**: `src/lib/server/jobs/monthlyReportGeneration.job.ts` (new)

---

## Infrastructure

### Scheduler Options

| Option | Pros | Cons | Recommended For |
|--------|------|------|-----------------|
| **Firebase Cloud Functions (scheduled)** | Native, serverless, scales, integrated auth | Cold starts, 540s timeout, pricing per invocation | Most jobs (daily/hourly) |
| **Cloud Scheduler + Cloud Run** | Longer timeout (3600s), more control | More infra management | Long-running jobs (settlement, reports) |
| **SvelteKit + node-cron (self-hosted)** | Full control, no vendor lock-in | Requires always-running process | Dev/simple deployments |

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Google Cloud Scheduler                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Daily Jobs  │ │ Hourly Jobs │ │ 5m Jobs     │           │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘           │
│         │               │               │                   │
│         ▼               ▼               ▼                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SvelteKit HTTP Endpoint Router                     │   │
│  │  POST /api/jobs/[job]/+server.ts                    │   │
│  │  - Looks up job in `jobRegistry`                    │   │
│  │  - Calls `wrapJob(runJob(...))`                     │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                                               │
│         ▼                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Job Wrapper (`wrapJob`)                            │   │
│  │  - Authenticates via header secret                  │   │
│  │  - Executes job logic                               │   │
│  │  - Catches errors                                   │   │
│  │  - Writes flat log record to BigQuery               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Job Registry & Router Pattern

Instead of creating a separate `+server.ts` file for every job, a single dynamic route `src/routes/api/jobs/[job]/+server.ts` handles all requests.

```typescript
// src/lib/server/jobs/index.ts
import { runVehicleHealthAutoTransition } from './vehicleHealthAutoTransition.job';
import { runDailyEarningsSync } from './dailyEarningsSync.job';
// ...

export const jobRegistry: Record<string, () => Promise<JobResult>> = {
  'vehicle-health-auto-transition': runVehicleHealthAutoTransition,
  'daily-earnings-sync': runDailyEarningsSync,
  // ...
};
```

```typescript
// src/routes/api/jobs/[job]/+server.ts
import { json } from '@sveltejs/kit';
import { jobRegistry } from '$lib/server/jobs';
import { wrapJob } from '$lib/server/jobs/wrapper';

export const POST: RequestHandler = async ({ params, request }) => {
  const jobFn = jobRegistry[params.job];
  
  if (!jobFn) {
    return json({ error: 'Job not found' }, { status: 404 });
  }

  // wrapJob handles auth, execution, error catching, and BigQuery logging
  const result = await wrapJob(params.job, request, jobFn);
  
  return json(result, { status: result.success ? 200 : 500 });
};
```

### Monitoring & Logging (BigQuery)

All job executions must be logged to BigQuery for analytics and auditing. The schema must be **flat** (no nested arrays or objects).

```typescript
// BigQuery Schema / Interface
interface FlatJobRunLog {
  jobId: string;             // e.g., 'vehicle-health-auto-transition'
  timestamp: string;         // ISO string
  durationMs: number;
  success: boolean;
  processedCount: number;
  failedCount: number;
  errorMessage: string;      // Concatenated errors or main error message, empty if success
  triggerType: string;       // 'scheduled' | 'manual'
}
```

- **Wrapper Responsibility (`wrapJob`)**:
  - Check `Authorization` / Secret header.
  - Start timer.
  - `await jobFn()`.
  - Catch any exceptions (mark `success: false`, populate `errorMessage`).
  - Calculate `durationMs`.
  - Format `FlatJobRunLog` and insert into BigQuery `job_logs` table.
- **Alerting**: A separate monitor (or BigQuery scheduled query) alerts admins via Slack if critical jobs fail consecutively.

---

## Implementation Tasks

| Done | Priority | Job | Effort | Dependencies | Plan Reference |
|---|----------|-----|--------|--------------|----------------|
| [ ] | **P0** | Vehicle Health Auto-Transition (daily) | Medium | Resolver done | VEHICLE-STATUS-TRANSITION-PART2 §1 |
| [ ] | **P0** | Driver Document Expiry Transition (daily) | Medium | Resolver done | DRIVER-STATUS-TRANSITION §4 |
| [ ] | **P0** | Mail Queue Processor (5min) | Low | Queue exists | EMAIL_NOTIFICATIONS_PLAN §1.4 |
| [ ] | **P1** | Daily Earnings Sync (Uber/Bolt) | High | Income reporting service | FLEET_PROFIT_SETTLEMENT §3, FLEET_PLAN §3.2 |
| [ ] | **P1** | Period Settlement Run (weekly/monthly) | High | Settlement runner service | FLEET_PROFIT_SETTLEMENT §5 |
| [ ] | **P1** | Scheduled Alert Evaluation (6h) | Medium | Alert engine service | FLEET_PLAN §7.1 |
| [ ] | **P1** | Daily Document Expiry Warnings | Low | Notification service | VEHICLE-STATUS-TRANSITION-PART2, DRIVER-STATUS-TRANSITION |
| [ ] | **P2** | Driver Leave Transitions (daily) | Low | Leave collection exists | DRIVER-STATUS-TRANSITION §3.2 |
| [ ] | **P2** | Hourly Platform Status Sync | Medium | Bolt sync service | FLEET_PLAN §3.2 |
| [ ] | **P2** | Daily Vehicle Stats Computation | Medium | Telemetry events exist | FLEET_PLAN §4.3 |
| [ ] | **P2** | Monthly Insurance Proration | Low | Cost allocation service | FLEET_PROFIT_SETTLEMENT §4 |
| [ ] | **P3** | Hourly Telemetry Offline Check | Low | Telemetry events exist | FLEET_PLAN §4.3 |
| [ ] | **P3** | Monthly Report Generation | Medium | Reporting services | FLEET_PLAN §5.1, §7.2 |
| [ ] | **P3** | Daily Fuel Allocation | Low | Cost allocation service | FLEET_PROFIT_SETTLEMENT §4 |
| [ ] | **P3** | Document Sync to Platforms | Medium | Bolt sync service | FLEET_PLAN §3.2 |

---

## Files to Create

### Job Service Layer (`src/lib/server/jobs/`)
- `index.ts` (Registry definition)
- `wrapper.ts` (Authentication and BigQuery logging wrapper)
- `vehicleHealthAutoTransition.job.ts`
- `driverDocumentExpiryTransition.job.ts`
- `driverLeaveTransitions.job.ts`
- `dailyEarningsSync.job.ts`
- `hourlyPlatformSync.job.ts`
- `dailyDocumentSync.job.ts`
- `periodSettlementRunner.job.ts`
- `monthlyInsuranceProration.job.ts`
- `dailyFuelAllocation.job.ts`
- `dailyVehicleStats.job.ts`
- `hourlyTelemetryOfflineCheck.job.ts`
- `hourlyTelemetryPull.job.ts`
- `scheduledAlertEvaluation.job.ts`
- `dailyDocumentExpiryWarnings.job.ts`
- `mailQueueProcessor.job.ts`
- `monthlyReportGeneration.job.ts`

### HTTP Endpoints (`src/routes/api/jobs/[job]/+server.ts`)
- Single dynamic route handling all jobs via the registry.

### Infrastructure
- `src/lib/server/db/bigquery/jobLogs.bq.ts` — BigQuery insert logic for flat job logs
- Google Cloud Scheduler configurations (Terraform or gcloud scripts)

---

## Notes & Deferred

- **Job Orchestration Framework**: Consider `bullmq` / `firebase-functions-scheduler` for retries, concurrency control, dead-letter handling — start simple with direct HTTP calls
- **Timezone**: All crons in UTC; Poland is UTC+1/UTC+2 (DST) — adjust user-facing times in UI
- **Idempotency**: Every job must be safely re-runnable (use idempotency keys in ledger, check current state before transition)
- **Manual Trigger**: Admin UI must allow manual job execution for debugging/re-processing
- **Dead Letter Queue**: Jobs that fail repeatedly → alert + manual intervention page