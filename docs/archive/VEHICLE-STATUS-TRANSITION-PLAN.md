# Vehicle Status Transition Plan

## Overview

This document defines the valid state transitions for vehicle statuses in the fleet management system. Vehicles follow a defined lifecycle from acquisition (`precheck`) through active operations to retirement.

**Default initial status**: `precheck` (set when vehicle is added via `addNewVehicle` in `vehicles.fdb.ts:48`)

## Status Definitions

| Status | Key | Description | UI Color |
|--------|-----|-------------|----------|
| Precheck | `precheck` | Vehicle awaiting initial inspection/verification before entering service | #8b5cf6 (purple) |
| Available | `available` | Vehicle is operational and ready for driver assignment | #22c55e (green) |
| Assigned | `assigned` | Vehicle currently assigned to a driver | #3b82f6 (blue) |
| Under Maintenance | `under_maintenance` | Vehicle in scheduled service/repair | #f59e0b (amber) |
| Broken | `broken` | Vehicle damaged/non-operational, needs repair | #ef4444 (red) |
| Unmovable | `unmovable` | Vehicle cannot be moved (severe damage, legal hold, etc.) | #b91c1c (dark red) |
| Retired | `retired` | Permanently removed from fleet | #6b7280 (gray) |

## Valid State Transitions

```
PRECHECK (initial)
    │
    ├─── pass inspection ───► AVAILABLE
    │
    ├─── fail inspection ───► BROKEN / UNDER_MAINTENANCE
    │
    └─── severe issue ───► UNMOVABLE

AVAILABLE
    │
    ├─── assign to driver ───► ASSIGNED
    │
    ├─── schedule maintenance ───► UNDER_MAINTENANCE
    │
    ├─── damage reported ───► BROKEN
    │
    ├─── severe issue ───► UNMOVABLE
    │
    └─── retire vehicle ───► RETIRED

ASSIGNED
    │
    ├─── driver returns vehicle ───► AVAILABLE
    │
    ├─── damage during assignment ───► BROKEN
    │
    ├─── maintenance due during assignment ───► UNDER_MAINTENANCE (after return)
    │
    ├─── severe issue ───► UNMOVABLE
    │
    └─── retire vehicle ───► RETIRED

UNDER_MAINTENANCE
    │
    ├─── repair complete ───► AVAILABLE
    │
    ├─── repair failed / needs more work ───► BROKEN
    │
    ├─── irreparable ───► UNMOVABLE
    │
    └─── retire vehicle ───► RETIRED

BROKEN
    │
    ├─── repair complete ───► AVAILABLE
    │
    ├─── send to maintenance ───► UNDER_MAINTENANCE
    │
    ├─── irreparable ───► UNMOVABLE
    │
    └─── retire vehicle ───► RETIRED

UNMOVABLE
    │
    ├─── issue resolved (rare) ───► AVAILABLE / UNDER_MAINTENANCE
    │
    └─── retire vehicle ───► RETIRED

RETIRED (terminal)
    │
    └─── (no transitions - end state)
```

## Transition Triggers & Business Rules

### Precheck → Available
- **Trigger**: Vehicle passes all verification checks in `VehicleVerification.svelte`
- **Requirements**: All required documents uploaded, technical inspection valid, insurance valid, platform approvals (Uber/Bolt) obtained
- **Action**: Admin updates status via UI or API after verification completion

### Precheck → Broken / Under Maintenance
- **Trigger**: Initial inspection reveals defects
- **Action**: Direct status change based on severity

### Available → Assigned
- **Trigger**: `assignVehicleAndCloseHandover()` in `vehicleStatus.service.ts:24`
- **Requirements**: Valid handover document, driver has valid documents
- **Side effects**: Sets `assignedDriverId`, `assignedDriverName`, creates assignment record

### Assigned → Available
- **Trigger**: `returnVehicle()` in `vehicleStatus.service.ts:149` or `releaseVehicle()` at line 100
- **Requirements**: Return handover completed
- **Side effects**: Clears `assignedDriverId`, `assignedDriverName`, creates return assignment record

### Available/Assigned → Under Maintenance
- **Trigger**: Scheduled maintenance (technical inspection due, insurance renewal) or reported issue
- **Action**: Admin sets status, optionally creates maintenance record

### Under Maintenance → Available
- **Trigger**: Maintenance completed, all checks pass
- **Requirements**: Updated technical inspection, insurance if renewed

### Available/Assigned/Under Maintenance → Broken
- **Trigger**: Damage report, accident, mechanical failure
- **Action**: Create damage incident report document (`DAMAGE_INCIDENT_REPORT`)

### Broken → Under Maintenance
- **Trigger**: Vehicle sent to repair shop
- **Action**: Status change + repair tracking

### Broken/Under Maintenance → Unmovable
- **Trigger**: Total loss, legal seizure, catastrophic failure
- **Action**: Admin decision with documentation

### Any → Retired
- **Trigger**: End of lease, sale, total loss, fleet reduction
- **Requirements**: Final settlement, document archival
- **Side effects**: Vehicle removed from active fleet queries, preserved for history

### Unmovable → Available/Under Maintenance (Exceptional)
- **Trigger**: Legal hold lifted, recovery from catastrophic state
- **Requirements**: Full re-verification (equivalent to precheck)

## Implementation Notes

### Current Implementation Status

| Item | Status | Details |
|------|--------|---------|
| **Explicit transition validation** | ✅ **Implemented** | `statusTransitions` matrix (lines 205-252) + `changeVehicleStatus()` (lines 254-284) enforce valid transitions with custom handlers per transition |
| **Audit trail for status changes** | ✅ **Implemented** | `addVehicleStatusChange()` writes to `vehicleStatusChange` collection (called in `changeVehicleStatus:283`). Captures: `vehicleId`, `status`, `timestamp`, `userId`, `userName`, `extraData` |
| **Automated transitions** | 🟡 **Partial** | Health checks exist: `checkVehicleExpirationDates` (insurance/technical expiry) → creates `HealthIssue` with `severity: warning\|critical`. **But**: no auto-status change (e.g., expired insurance → `under_maintenance`). Requires scheduled job to call `changeVehicleStatus` based on health issues |
| **Transition permissions** | ❌ **Not implemented** | Only `restrictAdmin` on status endpoint. No role-based granularity (admin vs manager vs moderator) |
| **Direct status change API** | ✅ **Exists** | `PATCH /vehicles/[id]/status` (`src/routes/(admin)/vehicles/[id]/status/+server.ts`) — calls `changeVehicleStatus` with validation |
| **Indexes for status queries** | ❌ **Not implemented** | No `firestore.indexes.json`. Need composites: `status + technicalExpiration`, `status + insuranceExpiration`, `status + assignedDriverId` |

---

### Actual API Endpoints (Implemented)

| Transition | Endpoint | Method | Notes |
|------------|----------|--------|-------|
| Any → Any (validated) | `PATCH /vehicles/[id]/status` | Manual admin action | Validated via `statusTransitions` matrix |
| Available → Assigned | Via `assignVehicleAndCloseHandover` | Handover flow | Atomic transaction: vehicle+driver+assignment+handover |
| Assigned → Available | Via `returnVehicle` / `releaseVehicle` | Handover flow | `returnVehicle` needs handoverId; `releaseVehicle` doesn't |
| Any → Maintenance/Broken/Retired | `PATCH /vehicles/[id]/status` | Manual admin action | Validated via matrix |

---

### Gaps vs. Plan

1. **Auto-transition from health issues** — Health checks create `HealthIssue` records but don't call `changeVehicleStatus`. Need: scheduled job that reads critical issues (expired insurance/technical) → transitions to `under_maintenance` or `broken`
2. **Role-based transition permissions** — Only `restrictAdmin` (any admin role). Plan wants: admin=all, manager=limited, moderator=read-only
3. **Composite indexes** — Not defined in `firestore.indexes.json`

## Related Files

- `src/lib/misc/VehicleStatus.svelte` - UI component displaying status
- `src/lib/assets/enums.ts` - `VEHICLE_STATUS` enum (line 17-25)
- `src/app.d.ts` - `Vehicle.Status` type (line 111)
- `src/lib/server/services/vehicleStatus.service.ts` - Assignment/return logic
- `src/lib/server/db/firebase/vehicles.fdb.ts` - Vehicle CRUD, default status set to `precheck`
- `src/routes/(admin)/panel/api/+server.ts` - Dashboard stats by status