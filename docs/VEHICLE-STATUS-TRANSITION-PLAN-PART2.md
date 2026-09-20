# Vehicle Status Transition Plan (v2)

> **Status**: Active implementation plan
> **Archived plan**: `@docs/archive/VEHICLE-STATUS-TRANSITION-PLAN.md` (v1, closed)
> **Reference**: Implementation status from v1 — transition validation ✅, audit trail ✅, API endpoints ✅

---

## Open Tasks from v1 (Carried Forward)

### 1. Auto-Transition from Health Issues
**Problem**: Health checks (`checkVehicleExpirationDates`) create `HealthIssue` records with `severity: 'critical'` for expired insurance/technical inspection, but **no automatic status change** occurs.

**Required**: Scheduled job (Firebase Cloud Function or cron) that:
- Runs daily
- Queries `healthIssues` for `entityType: 'vehicle'` + `severity: 'critical'` + types `insurance_expiring` / `technical_expiring` where `expirationDate < now()`
- For each vehicle: calls `changeVehicleStatus(vehicleId, 'under_maintenance', { reason: 'Auto-transition: expired insurance/technical', source: 'health_check' }, systemUser)`
- Logs transition in `vehicleStatusChange` with `extraData.source: 'auto_health_check'`

**Files to create/modify**:
- `src/lib/server/jobs/vehicleHealthAutoTransition.ts` — new job
- `src/lib/server/auth/firebaseAdmin.ts` — add system user for automated transitions
- Firebase scheduled function config or `package.json` cron script

---

### 2. Role-Based Transition Permissions
**Current**: `restrictAdmin` only (any admin role: admin/manager/moderator)

**Required**: Granular permissions per transition:

| Transition | Admin | Manager | Moderator |
|------------|-------|---------|-----------|
| `precheck` → `available` | ✅ | ✅ | ❌ (read-only) |
| `available` → `under_maintenance` / `broken` | ✅ | ✅ | ❌ |
| `available` → `retired` | ✅ | ❌ | ❌ |
| `assigned` → `available` (via handover) | ✅ | ✅ | ❌ |
| `under_maintenance` → `available` | ✅ | ✅ | ❌ |
| `broken` → `available` / `under_maintenance` | ✅ | ✅ | ❌ |
| `unmovable` → `available` / `under_maintenance` | ✅ | ❌ | ❌ |
| Any → `retired` | ✅ | ❌ | ❌ |
| Auto-transition (system) | N/A | N/A | N/A |

**Implementation**:
- Extend `adminAuth.ts` with `requireTransitionPermission(locals, fromStatus, toStatus)`
- Add `TransitionPermission` map in `vehicleStatus.service.ts` or `adminAuth.ts`
- Apply in `changeVehicleStatus()` before validation
- Apply in `PATCH /vehicles/[id]/status/+server.ts`

---

### 3. Composite Firestore Indexes
**Required** for efficient status-based queries:

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "vehicles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "technicalExpiration", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "vehicles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "insuranceExpiration", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "vehicles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "assignedDriverId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "vehicleStatusChange",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "vehicleId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Deploy**: `firebase deploy --only firestore:indexes`

---

## New Tasks (Not in v1)

### 4. Maintenance Record Integration
**Gap**: Status changes to/from `under_maintenance` have no associated maintenance record.

**Required**: 
- New collection `maintenanceRecords` with:
  ```typescript
  interface MaintenanceRecord {
    id: string;
    vehicleId: string;           // registration number
    type: 'scheduled' | 'repair' | 'inspection' | 'damage';
    status: 'open' | 'in_progress' | 'completed' | 'cancelled';
    description: string;
    estimatedCost?: number;      // grosze
    actualCost?: number;         // grosze
    startedAt: number;
    completedAt?: number;
    performedBy: string;         // garage/vendor
    odometer?: number;
    documents: string[];         // Firebase Storage URLs (invoices, reports)
    createdBy: string;           // admin userId
    createdAt: number;
    updatedAt: number;
  }
  ```
- Link `maintenanceRecordId` in `extraData` when transitioning to/from `under_maintenance`
- UI: Maintenance tab in vehicle detail, create/edit maintenance records

### 5. Damage Incident Workflow
**Gap**: Transition to `broken` mentions `DAMAGE_INCIDENT_REPORT` but no structured workflow.

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
    estimatedRepairCost?: number;
    actualRepairCost?: number;
    insuranceClaimId?: string;
    status: 'reported' | 'assessing' | 'approved' | 'in_repair' | 'repaired' | 'written_off';
    photos: string[];            // Firebase Storage URLs
    documents: string[];         // Police report, insurance forms
    resolvedAt?: number;
  }
  ```
- Transition `available`/`assigned` → `broken` requires creating damage incident
- Transition `broken` → `available`/`under_maintenance` requires linking repair completion

### 6. Platform Status Sync (Uber/Bolt/FreeNow/iTaxi)
**Gap**: Vehicle has `platformStatus` per provider (pending/approved/rejected/suspended/not_applicable) but no sync with vehicle status.

**Required**:
- When `platformStatus.uber` = `rejected`/`suspended` → auto-transition to `under_maintenance` or `broken` (configurable)
- When all platforms `approved` + vehicle `available` → eligible for assignment
- Webhook handlers in `src/routes/(webhooks)/uber/`, `bolt/`, etc. to update platform status

### 7. Lease/Contract Expiry Handling
**Gap**: No handling for lease end → auto-retire or alert.

**Required**:
- Add `leaseEndDate` to vehicle (from v1 plan `leaseInfo` subcollection)
- Scheduled job: 90/60/30 days before lease end → create `alert` record
- On lease end: transition to `retired` (or `precheck` if renewing)

### 8. Status Change Notifications
**Gap**: No notifications on status changes.

**Required** (integrate with notifications plan):
- In-app: Real-time badge update via Firestore listener
- Email: Admin notifications for `broken`/`unmovable`/`retired`
- Push (PWA): Driver notified if their assigned vehicle changes status
- Slack/Webhook: Ops channel for critical transitions

---

## Implementation Priority

| Priority | Task | Effort | Dependencies |
|----------|------|--------|--------------|
| **P0** | Auto-transition from health issues | Medium | Health checks exist |
| **P0** | Role-based transition permissions | Medium | Auth system complete |
| **P1** | Composite indexes | Low | Independent |
| **P1** | Maintenance record integration | Medium | New collection |
| **P2** | Damage incident workflow | Medium | New collection |
| **P2** | Platform status sync | High | Bolt/Uber webhooks |
| **P2** | Lease expiry handling | Low | Lease data model |
| **P3** | Status change notifications | Medium | Notifications plan |

---

## Current Implementation Reference

**Working (from v1)**:
- `statusTransitions` matrix in `vehicleStatus.service.ts:205-252`
- `changeVehicleStatus()` with validation + audit log at line 283
- `assignVehicleAndCloseHandover()` / `returnVehicle()` / `releaseVehicle()` — atomic transactions
- `PATCH /vehicles/[id]/status` endpoint with `restrictAdmin`
- `vehicleStatusChange` collection for audit trail
- Health checks: `checkVehicleExpirationDates` → `HealthIssue` records

**Files**:
- `src/lib/server/services/vehicleStatus.service.ts` — core logic
- `src/lib/server/db/firebase/vehicleStatusChange.fdb.ts` — audit log
- `src/routes/(admin)/vehicles/[id]/status/+server.ts` — API
- `src/lib/server/services/health/vehicleExpirationDates.health.ts` — health checks
- `src/lib/server/services/health/healthCheck.service.ts` — orchestrator