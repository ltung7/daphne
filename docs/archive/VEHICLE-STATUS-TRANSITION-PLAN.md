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

### Current Implementation Gaps
1. **No explicit transition validation** - Status can be set to any value via `updateVehicle()` in `vehicles.fdb.ts:10`
2. **No audit trail for status changes** - Only assignment changes create records in `vehicleAssignment` collection
3. **No automated transitions** - e.g., insurance expiry doesn't auto-move to `broken`/`under_maintenance`

### Recommended Enhancements
1. **Add transition validation service** - Enforce valid transitions server-side
2. **Add status change audit log** - Record: `fromStatus`, `toStatus`, `changedBy`, `timestamp`, `reason`
3. **Add automated checks** - Scheduled job to flag vehicles with expiring documents for `under_maintenance`
4. **Add transition permissions** - Role-based: admin can do all, managers limited transitions

## API Endpoints for Status Changes

| Transition | Endpoint | Method |
|------------|----------|--------|
| Precheck → Available | `PATCH /api/vehicles/:id/status` | Manual admin action |
| Available → Assigned | `POST /api/vehicles/assign` | Via handover flow |
| Assigned → Available | `POST /api/vehicles/return` | Via return handover |
| Any → Maintenance/Broken | `PATCH /api/vehicles/:id/status` | Admin action |
| Any → Retired | `PATCH /api/vehicles/:id/status` | Admin action |

## Database Indexes Needed

```javascript
// For efficient status-based queries
vehicles: [
  ['status', 'technicalExpiration'],
  ['status', 'insuranceExpiration'],
  ['status', 'assignedDriverId']
]
```

## Related Files

- `src/lib/misc/VehicleStatus.svelte` - UI component displaying status
- `src/lib/assets/enums.ts` - `VEHICLE_STATUS` enum (line 17-25)
- `src/app.d.ts` - `Vehicle.Status` type (line 111)
- `src/lib/server/services/vehicleStatus.service.ts` - Assignment/return logic
- `src/lib/server/db/firebase/vehicles.fdb.ts` - Vehicle CRUD, default status set to `precheck`
- `src/routes/(admin)/panel/api/+server.ts` - Dashboard stats by status