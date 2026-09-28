# Vehicle Status Transition Plan (v2)

> **Status**: Active implementation plan
> **Archived plan**: `@docs/archive/VEHICLE-STATUS-TRANSITION-PLAN.md` (v1, closed)
> **Reference**: Implementation status from v1 — transition validation ✅, audit trail ✅, API endpoints ✅

---

## Open Tasks from v1 (Carried Forward)

### 1. Auto-Transition to Unmovable (Expired Documents)
**Problem**: Health checks (`checkVehicleExpirationDates`) create `HealthIssue` records with `severity: 'critical'` for expired insurance/technical inspection, but **no automatic status change** occurs.

**Required**: Scheduled job (Firebase Cloud Function or cron) that:
- Runs daily
- Queries `healthIssues` for `entityType: 'vehicle'` + `severity: 'critical'` + types `insurance_expiring` / `technical_expiring` where `expirationDate < now()`
- For each vehicle: calls `changeVehicleStatus(vehicleId, 'unmovable', { reason: 'Auto-transition: expired insurance/technical', source: 'health_check' }, { id: 'system', name: 'Auto Health Check', role: 'system' })`
- Logs transition in `vehicleStatusChange` with `extraData.source: 'auto_health_check'` and `changedBy: 'system'`
- **Note**: A vehicle in `unmovable` status cannot be assigned and requires manual intervention (Manager/Admin) to return to `available`.

**Files to create/modify**:
- `src/lib/server/jobs/vehicleHealthAutoTransition.ts` — new job *(deferred to Job Scheduling Plan)*
- Firebase scheduled function config or `package.json` cron script *(deferred to Job Scheduling Plan)*

---

### 2. Role-Based Transition Permissions
**Structure**:
- **Moderator**: Day-to-day operators for small decisions. Handle standard maintenance cycles, availability, and reporting broken vehicles.
- **Manager**: Responsible for company assets and signing off important documents. Handles "unmovable" flags, asset retirement, and status recovery.
- **Admin**: Technical superuser. Has technical abilities over other users and will technically have all permissions to "fix" data inconsistencies or bypass blocks.

**Transition Matrix** (Simplified):

| Transition | Admin | Manager | Moderator |
|------------|-------|---------|-----------|
| `any` → `available` | ✅ | ✅ | ✅ |
| `available` → `under_maintenance` / `broken` | ✅ | ✅ | ✅ |
| `available` → `unmovable` | ✅ | ✅ | ✅ |
| `unmovable` → `available` | ✅ | ✅ | ✅ |
| `any` → `retired` | ✅ | ✅ | ❌ (Asset disposal) |
| Auto-transition (system) | ✅ | N/A | N/A |

**Implementation** (simplified — single check in `handleChangeVehicleStatus`):
- Remove `retired` from `statusTransitions` matrix (except `retired` → `precheck` for recovery)
- Add moderator check: `if (user.role === 'moderator' && newStatus === 'retired') throw 403`
- No separate permission map, no handler signature changes

## New Tasks (Not in v1)

### 3. Damage Incident Workflow
**Gap**: Transition to `broken` or `unmovable` due to accidents requires a structured audit trail.

**Required**:
- New collection `damageIncidents`:
  ```typescript
  interface DamageIncident {
    id: string;
    vehicleId: string;
    driverId?: string;           // if during assignment
    reportedAt: number;
    reportedBy: string;
    description: string;
    location?: { lat: number; lng: number; address: string };
    severity: 'minor' | 'major' | 'total_loss';
    status: 'reported' | 'assessing' | 'approved' | 'in_repair' | 'repaired' | 'written_off';
    photos: string[];            // Firebase Storage URLs
    documents: string[];         // Police report, insurance forms
    resolvedAt?: number;
  }
  ```
- Transition `available`/`assigned` → `broken` requires creating damage incident
- Transition `broken` → `available`/`under_maintenance` requires linking repair completion
- **Note**: Financial cost tracking for repairs is handled by the **Finance/Incomes & Costs** module; this workflow is for operational status and safety documentation only.

### 4. Status Change Notifications
**Gap**: No notifications on status changes.

**Required** (integrate with notifications plan):
- In-app: Real-time badge update via Firestore listener
- Email/Alert: Notify Managers if a vehicle becomes `unmovable` or `retired`.
- Push (PWA): Notify assigned drivers if their vehicle is flagged as `under_maintenance` or `unmovable`.
- Slack/Webhook: Ops channel for critical transitions

### 5. Handover Return & Unilateral Return Workflow
**Gap**: Vehicle return flows (voluntary and unilateral) exist as PDF templates and a `returnVehicle()` function, but **no API endpoints, no status transition, and no unilateral implementation**.

**Current State**:
- `returnVehicle(registrationNumber, driverId, handoverId)` — transactional function in `vehicleStatus.service.ts:151` that clears assignment, creates `vehicleAssignment` record type `'return'`, updates handover with `returnedAt`. **Does not change vehicle status** (stays `'assigned'`).
- `generateHandoverReturnDocument` — PDF template for voluntary return (driver + manager signatures)
- `generateHandoverUnilateralDocument` — PDF template for unilateral return (manager + witness, no driver)
- Types support: `HandoverDocumentType = 'assign' | 'return' | 'unilateral'`, `VehicleAssignmentData.type` includes all three
- **No API endpoints** for return/unilateral actions
- **No `unilateralReturnVehicle()` function**
- **No status transition** on return (`assigned` → `available`/`under_maintenance`/`broken`/`unmovable`)
- **Handover record `type` field** never updated from `'assign'`
- **Unilateral-specific fields missing** from `HandoverDocumentRecord` (`recoveryLocation`, `witness`, `reasonForRecovery`, `retriever`)

**Required**:

#### 5.1 Voluntary Return (`assigned` → `available` | `under_maintenance` | `broken` | `unmovable`)
- API: `POST /handovers/[id]/return` — body: `{ targetStatus: 'available' | 'under_maintenance' | 'broken' | 'unmovable', mileage?, fuel?, notes? }`
- Calls `returnVehicle()` + `handleChangeVehicleStatus(vehicleId, targetStatus, ...)`
- Updates handover record: `type: 'return'`, `returnedAt`, `mileage`, `fuel`, `visual` (condition notes)
- Generates return PDF (DocuSign or printed)
- Audit trail via `vehicleStatusChange` + `vehicleAssignment`

#### 5.2 Unilateral Return (`assigned` → `available` | `under_maintenance` | `broken` | `unmovable`)
- New function: `unilateralReturnVehicle(registrationNumber, driverId, handoverId, recoveryData)` 
  - `recoveryData`: `{ recoveryLocation, witness, reasonForRecovery, retriever, mileage, fuel, visual }`
- API: `POST /handovers/[id]/unilateral` — body: `{ targetStatus, recoveryData }`
- Creates `vehicleAssignment` type `'unilateral'`
- Updates handover record: `type: 'unilateral'`, unilateral fields, `returnedAt`
- Generates unilateral PDF (manager + witness signatures)
- Same status transition as voluntary

#### 5.3 Shared Requirements
- Validation: only allowed if handover `closed: true` (vehicle currently assigned)
- Vehicle status transition uses existing `handleChangeVehicleStatus` with role checks (moderator can return to available/under_maintenance/broken/unmovable)
- Manager/Admin choose target status based on vehicle condition at return
- Notification: driver notified of return completion; managers notified if vehicle goes to `unmovable`/`broken`

**Files to create/modify**:
- `src/lib/server/services/vehicleStatus.service.ts` — add `unilateralReturnVehicle()`, add status transition in `returnVehicle()` or new wrapper
- `src/routes/(admin)/handovers/[id]/api/+server.ts` — add `action: 'return'` and `action: 'unilateral'` cases
- `src/app.d.ts` — extend `HandoverDocumentRecord` with unilateral fields (`recoveryLocation`, `witness`, `reasonForRecovery`, `retriever`, `returnedAt`, `mileage`, `fuel`)
- `src/lib/server/db/firebase/vehicleHandovers.fdb.ts` — ensure update supports new fields

---

## Implementation Progress (New Section)

### ✅ Completed: Checker/Resolver Architecture Refactor

**Checker/Resolver separation** — Implemented to separate detection (pure) from resolution (effectful):

| Layer | Files | Responsibility |
|-------|-------|----------------|
| **Checkers** | `src/lib/server/services/health/checkers/*.checker.ts` | Read-only detection → emit `HealthIssue` records |
| **Resolvers** | `src/lib/server/services/health/resolvers/*.resolver.ts` | Consume issues → change status + notify |
| **Orchestrator** | `src/lib/server/services/health/healthCheck.service.ts` | Runs checkers → saves issues → runs resolvers |

**Files created/modify**:
- `src/lib/server/services/health/checkers/vehicleExpirationDates.checker.ts` (moved from `.health.ts`)
- `src/lib/server/services/health/checkers/driverExpirationDates.checker.ts` (moved from `.health.ts`)
- `src/lib/server/services/health/resolvers/vehicleExpirationDates.resolver.ts` (new — **implemented**)
- `src/lib/server/services/health/resolvers/driverExpirationDates.resolver.ts` (new — **implemented**)
- `src/lib/server/services/health/healthCheck.service.ts` (updated: runs resolvers after checkers, separate try/catch per resolver)

**Driver resolver implementation** (`driverExpirationDates.resolver.ts`):
- **Warning (expiring)**: Sends `documentExpiringNotification` via email/SMS/push/in-app
- **Critical (expired)**: Sends `documentExpiredNotification` + updates driver status to `'documents_expired'`
- Uses `params.drivers` from `HealthCheckParams` for contact info (falls back to DB query)

**Vehicle resolver implementation** (`vehicleExpirationDates.resolver.ts`):
- **Critical (expired)**: Auto-transitions vehicle to `'unmovable'` via `updateVehicle()` + logs audit trail via `addVehicleStatusChange()` with `userId: 'system'`, `source: 'auto_health_check'`
- Idempotent: skips if already `unmovable`
- Uses `params.vehicles` from `HealthCheckParams` for vehicle data (falls back to DB query)
- **Warning (expiring)**: TODO — notification only (not yet implemented)
- **Notifications**: TODO — notify managers/admins + assigned driver (not yet implemented)

**Idempotency strategy**: Notifications tied to actual status change — resolver only fires when status actually changes (checked via current status before update).

---

## Notes & Deferred Items

### Deferred/Externalized
- **Maintenance Records & Costs**: The structured tracking of maintenance costs has been moved to the centralized **Finance/Income-Cost Module**. This plan only tracks the *status* of the vehicle (`under_maintenance`).
- **Platform Status Sync (Uber/Bolt)**: Not being implemented at this stage. Internal fleet status takes precedence.
- **Lease/Contract Expiry**: Not being implemented at this stage unless explicitly requested.
- **Firestore Indexes**: Already implemented as required by the environment; no further action needed in this plan.
- **General Fleet Incidents**: Incident types not directly tied to vehicle status transitions (e.g., license/permit expiry, driver deactivation, GPS offline, unauthorized movement, fuel anomalies, provision mismatches, tax invoice issues, police seizures, platform warnings) are **out of scope** for this plan. These will be addressed in a separate **Fleet Incident Management Plan**.
- **Job Scheduling Infrastructure**: The scheduled job for auto-transition (daily cron/Cloud Function) is deferred to a separate **Job Scheduling & Infrastructure Plan**. This plan only defines the resolver logic; invocation mechanism is external.

---

## Implementation Priority

| Priority | Task | Effort | Dependencies | Status |
|----------|------|--------|--------------|--------|
| **P0** | Auto-transition to `unmovable` (resolver) | Medium | Health checks exist | ✅ Resolver implemented |
| **P0** | Role-based transition permissions | Medium | Auth system complete | ✅ Implemented (simplified) |
| **P1** | Damage incident workflow | Medium | New collection | ⏳ Not started |
| **P1** | Voluntary return workflow (API + status transition) | Medium | `returnVehicle()` exists | ⏳ Not started |
| **P1** | Unilateral return workflow (function + API + status transition) | Medium | PDF template exists | ⏳ Not started |
| **P2** | Status change notifications | Medium | Notifications plan | 🔄 Driver notifications done |

> **Deferred to separate plans**: Auto-transition scheduled job (Job Scheduling Plan), General fleet incidents (Fleet Incident Management Plan)

---

## Current Implementation Reference

**Working (from v1)**:
- `statusTransitions` matrix in `vehicleStatus.service.ts:205-252`
- `changeVehicleStatus()` with validation + audit log at line 283
- `assignVehicleAndCloseHandover()` / `returnVehicle()` / `releaseVehicle()` / `unilateralReturnVehicle()` — atomic transactions
- `PATCH /vehicles/[id]/status` endpoint with `restrictAdmin`
- `vehicleStatusChange` collection for audit trail
- Health checks: `checkVehicleExpirationDates` → `HealthIssue` records
- Handover PDF templates: assign, return, unilateral

**New (this plan)**:
- Checker/Resolver separation in `src/lib/server/services/health/`
- Driver expiration resolver with notifications + status update
- Vehicle expiration resolver with auto-transition to `unmovable` + audit log
- Role-based transition permissions (moderator cannot retire vehicles)
- Voluntary return API + status transition (`assigned` → target status)
- Unilateral return function + API + status transition

> **Not in this plan**: Scheduled job invocation (see Job Scheduling Plan), General fleet incident types (see Fleet Incident Management Plan)

**Files**:
- `src/lib/server/services/vehicleStatus.service.ts` — core logic (incl. `returnVehicle`, `unilateralReturnVehicle`)
- `src/lib/server/db/firebase/vehicleStatusChange.fdb.ts` — audit log
- `src/routes/(admin)/vehicles/[id]/status/+server.ts` — API
- `src/routes/(admin)/handovers/[id]/api/+server.ts` — handover actions (assign, return, unilateral)
- `src/lib/server/services/health/checkers/vehicleExpirationDates.checker.ts` — vehicle checker
- `src/lib/server/services/health/checkers/driverExpirationDates.checker.ts` — driver checker
- `src/lib/server/services/health/resolvers/vehicleExpirationDates.resolver.ts` — vehicle resolver (**implemented**)
- `src/lib/server/services/health/resolvers/driverExpirationDates.resolver.ts` — driver resolver (**implemented**)
- `src/lib/server/services/health/healthCheck.service.ts` — orchestrator
- `src/app.d.ts` — `HandoverDocumentRecord` extensions (unilateral fields, return data)