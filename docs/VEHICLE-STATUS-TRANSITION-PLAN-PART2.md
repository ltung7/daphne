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
- For each vehicle: calls `changeVehicleStatus(vehicleId, 'unmovable', { reason: 'Auto-transition: expired insurance/technical', source: 'health_check' }, systemUser)`
- Logs transition in `vehicleStatusChange` with `extraData.source: 'auto_health_check'`
- **Note**: A vehicle in `unmovable` status cannot be assigned and requires manual intervention (Manager/Admin) to return to `available`.

**Files to create/modify**:
- `src/lib/server/jobs/vehicleHealthAutoTransition.ts` — new job
- `src/lib/server/auth/firebaseAdmin.ts` — add system user for automated transitions
- Firebase scheduled function config or `package.json` cron script

---

### 2. Role-Based Transition Permissions
**Structure**:
- **Moderator**: Day-to-day operators for small decisions. Handle standard maintenance cycles, availability, and reporting broken vehicles.
- **Manager**: Responsible for company assets and signing off important documents. Handles "unmovable" flags, asset retirement, and status recovery.
- **Admin**: Technical superuser. Has technical abilities over other users and will technically have all permissions to "fix" data inconsistencies or bypass blocks.

**Transition Matrix**:

| Transition | Admin | Manager | Moderator |
|------------|-------|---------|-----------|
| `any` → `available` | ✅ | ✅ | ✅ |
| `available` → `under_maintenance` / `broken` | ✅ | ✅ | ✅ |
| `available` → `unmovable` | ✅ | ✅ | ❌ |
| `unmovable` → `available` | ✅ | ✅ | ❌ (Requires sign-off) |
| `any` → `retired` | ✅ | ✅ | ❌ (Asset disposal) |
| Auto-transition (system) | ✅ | N/A | N/A |

**Implementation**:
- Extend `adminAuth.ts` with `requireTransitionPermission(locals, fromStatus, toStatus)`
- Add `TransitionPermission` map in `vehicleStatus.service.ts` or `adminAuth.ts`
- Apply in `changeVehicleStatus()` before validation
- Apply in `PATCH /vehicles/[id]/status/+server.ts`

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

---

## Implementation Progress (New Section)

### ✅ Completed: Checker/Resolver Architecture Refactor

**Checker/Resolver separation** — Implemented to separate detection (pure) from resolution (effectful):

| Layer | Files | Responsibility |
|-------|-------|----------------|
| **Checkers** | `src/lib/server/services/health/checkers/*.checker.ts` | Read-only detection → emit `HealthIssue` records |
| **Resolvers** | `src/lib/server/services/health/resolvers/*.resolver.ts` | Consume issues → change status + notify |
| **Orchestrator** | `src/lib/server/services/health/healthCheck.service.ts` | Runs checkers → saves issues → runs resolvers |

**Files created/modified**:
- `src/lib/server/services/health/checkers/vehicleExpirationDates.checker.ts` (moved from `.health.ts`)
- `src/lib/server/services/health/checkers/driverExpirationDates.checker.ts` (moved from `.health.ts`)
- `src/lib/server/services/health/resolvers/vehicleExpirationDates.resolver.ts` (new — skeleton)
- `src/lib/server/services/health/resolvers/driverExpirationDates.resolver.ts` (new — **implemented**)
- `src/lib/server/services/health/healthCheck.service.ts` (updated: runs resolvers after checkers, separate try/catch per resolver)

**Driver resolver implementation** (`driverExpirationDates.resolver.ts`):
- **Warning (expiring)**: Sends `documentExpiringNotification` via email/SMS/push/in-app
- **Critical (expired)**: Sends `documentExpiredNotification` + updates driver status to `'documents_expired'`
- Uses `params.drivers` from `HealthCheckParams` for contact info (falls back to DB query)

**Idempotency strategy**: Notifications tied to actual status change — resolver only fires when status actually changes (checked via current status before update).

---

## Notes & Deferred Items

### Deferred/Externalized
- **Maintenance Records & Costs**: The structured tracking of maintenance costs has been moved to the centralized **Finance/Income-Cost Module**. This plan only tracks the *status* of the vehicle (`under_maintenance`).
- **Platform Status Sync (Uber/Bolt)**: Not being implemented at this stage. Internal fleet status takes precedence.
- **Lease/Contract Expiry**: Not being implemented at this stage unless explicitly requested.
- **Firestore Indexes**: Already implemented as required by the environment; no further action needed in this plan.

---

## Implementation Priority

| Priority | Task | Effort | Dependencies | Status |
|----------|------|--------|--------------|--------|
| **P0** | Auto-transition to `unmovable` | Medium | Health checks exist | 🔄 Checker/Resolver ready |
| **P0** | Role-based transition permissions | Medium | Auth system complete | ⏳ Not started |
| **P1** | Damage incident workflow | Medium | New collection | ⏳ Not started |
| **P2** | Status change notifications | Medium | Notifications plan | 🔄 Driver notifications done |

---

## Current Implementation Reference

**Working (from v1)**:
- `statusTransitions` matrix in `vehicleStatus.service.ts:205-252`
- `changeVehicleStatus()` with validation + audit log at line 283
- `assignVehicleAndCloseHandover()` / `returnVehicle()` / `releaseVehicle()` — atomic transactions
- `PATCH /vehicles/[id]/status` endpoint with `restrictAdmin`
- `vehicleStatusChange` collection for audit trail
- Health checks: `checkVehicleExpirationDates` → `HealthIssue` records

**New (this plan)**:
- Checker/Resolver separation in `src/lib/server/services/health/`
- Driver expiration resolver with notifications + status update

**Files**:
- `src/lib/server/services/vehicleStatus.service.ts` — core logic
- `src/lib/server/db/firebase/vehicleStatusChange.fdb.ts` — audit log
- `src/routes/(admin)/vehicles/[id]/status/+server.ts` — API
- `src/lib/server/services/health/checkers/vehicleExpirationDates.checker.ts` — vehicle checker
- `src/lib/server/services/health/checkers/driverExpirationDates.checker.ts` — driver checker
- `src/lib/server/services/health/resolvers/vehicleExpirationDates.resolver.ts` — vehicle resolver (skeleton)
- `src/lib/server/services/health/resolvers/driverExpirationDates.resolver.ts` — driver resolver (implemented)
- `src/lib/server/services/health/healthCheck.service.ts` — orchestrator