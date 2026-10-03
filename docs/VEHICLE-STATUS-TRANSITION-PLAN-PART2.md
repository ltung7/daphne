# Vehicle Status Transition Plan (v2)

> **Status**: Completed (Core status refactor, handover extraction, criticality policy, notifications, and UI integration complete; deferred items tracked in dedicated plans)
> **Archived plan**: `@docs/archive/VEHICLE-STATUS-TRANSITION-PLAN.md` (v1, closed)
> **Reference**: Implementation status from v1 — transition validation ✅, audit trail ✅, API endpoints ✅

---

## Overview & Completed Architecture

This plan covers the vehicle status state machine, separation of concerns for vehicle handovers, a boolean-driven criticality policy in the status transition matrix, unified vehicle status change notifications, and incident UI visualization.

---

## 1. Handover Logic Extraction

**Goal:** Separate handover-specific logic from `vehicleStatus.service.ts` into a dedicated `vehicleHandover.service.ts`.

**Implementation:**
- Created `src/lib/server/services/vehicleHandover.service.ts`.
- Encapsulated atomic Firestore transaction functions:
  - `assignVehicleAndCloseHandover`: Assigns vehicle to driver, sets status to `'assigned'`, links `handoverId`, and closes the handover record.
  - `returnVehicleAndCloseHandover`: Handles voluntary driver return. Deterministic status: transitions `'assigned'` → `'available'`, while preserving operational statuses (`'under_maintenance'`, `'broken'`, `'unmovable'`).
  - `unilateralReturnVehicleAndCloseHandover`: Handles unilateral fleet repossession/return using the same deterministic status logic.
  - `closeReturnHandover`: Shared transaction implementation for returns.
- Updated all referencing endpoints and webhook services:
  - `src/lib/server/services/docusign/docusignWebhook.service.ts`
  - `src/routes/(admin)/handovers/new/api/+server.ts`
  - `src/routes/(admin)/handovers/[id]/api/+server.ts`
  - `src/routes/(admin)/handovers/[id]/return/api/+server.ts`
  - `src/routes/(admin)/handovers/[id]/unilateral/api/+server.ts`

---

## 2. Status Transition Matrix & Criticality Policy

**Goal:** Modify the `statusTransitions` matrix in `src/lib/server/services/vehicleStatus.service.ts` so that the boolean result indicates whether a transition is **critical** rather than merely whether it is allowed.

**Policy:**
- Return `true`: Transition allowed AND **critical** (triggers manager/driver notifications via email, push, in-app; high priority).
- Return `false`: Transition allowed BUT **non-critical** (logged as incident/audit trail; low priority; no outbound alerts to drivers/managers).
- Throw error / undefined: Blocked / invalid transition.

### Criticality Mapping in `statusTransitions`:
- `precheck`:
  - `available`: `false` (validates required verification checklist nodes, non-critical)
  - `broken`: `true` (critical)
  - `under_maintenance`: `false` (non-critical)
  - `unmovable`: `true` (critical)
- `available`:
  - `under_maintenance`: `false` (non-critical)
  - `broken`: `true` (critical)
  - `unmovable`: `true` (critical)
  - `retired`: `false` (non-critical)
- `assigned`:
  - `broken`: `true` (critical)
  - `unmovable`: `true` (critical)
- `under_maintenance`:
  - `available`: `false` (non-critical)
  - `broken`: `false` (deliberately non-critical)
  - `unmovable`: `true` (critical)
- `broken`:
  - `available`: `true` (critical recovery)
  - `under_maintenance`: `false` (deliberately non-critical)
  - `unmovable`: `true` (critical)
- `unmovable`:
  - `available`: `true` (critical recovery)
  - `under_maintenance`: `false` (non-critical)
  - `broken`: `true` (critical)
- `retired`:
  - `precheck`: `false` (non-critical fleet recovery)

### Smart Driver-Assigned Fallback:
- When the requested change target is `'available'` and the vehicle has an assigned driver (`vehicle.assignedDriverId` is present), the status is transitioned to `'assigned'` instead of `'available'`.
- This ensures vehicles returning from repairs or maintenance immediately resume active assignment without clearing or conflicting with driver allocations.

---

## 3. Role-Based Transition Permissions

**Structure:**
- **Moderator**: Day-to-day operators for standard maintenance cycles, availability, and reporting broken vehicles. Cannot retire vehicles (`user.role === 'moderator' && newStatus === 'retired'` throws 403).
- **Manager**: Responsible for company assets and signing off important documents. Handles "unmovable" flags, asset retirement, and status recovery.
- **Admin**: Technical superuser with full permissions.

**Permission Summary:**
| Transition | Admin | Manager | Moderator |
|------------|-------|---------|-----------|
| `any` → `available` / `assigned` | ✅ | ✅ | ✅ |
| `available` → `under_maintenance` / `broken` | ✅ | ✅ | ✅ |
| `available` → `unmovable` | ✅ | ✅ | ✅ |
| `unmovable` → `available` | ✅ | ✅ | ✅ |
| `any` → `retired` | ✅ | ✅ | ❌ (Asset disposal) |
| Auto-transition (system) | ✅ | N/A | N/A |

---

## 4. Notifications Architecture (Unified Single Message Type)

**Goal:** A single, clean notification definition `vehicle_status_changed` rather than fragmented critical/normal message types.

### Definition & Configuration (`src/lib/server/notifications/vehicle/vehicleStatusNotifications.ts`):
- **Single Definition ID:** `vehicle_status_changed`
- **Payload (`VehicleStatusChangedData`):**
  - `registrationNumber: string`
  - `previousStatus: Vehicle.Status`
  - `newStatus: Vehicle.Status`
  - `reason: string`
  - `userId: string`
  - `userName: string` (replaces legacy `changedBy`)
- **Fused Channels:** Uses `prepareNotificationChannels({ action: PUBLIC_URL + '/admin/vehicles', incidentCategory: 'vehicle_issue' })`.
- **Dynamic Priority & Targeting:**
  - Critical (`isCritical === true`): `priority: 'high'`, `client: true` (dispatches to assigned driver), `admin: true` (dispatches to matrix managers).
  - Non-critical (`isCritical === false`): `priority: 'low'`, `client: false`, `admin: false` (persists incident log and in-app updates only).
- **Driver Contact Hook:** Driver contact is resolved automatically from `vehicle.assignedDriverId` when `isCritical` is true.

### Status Localization:
- Implemented `getStatusBaseMessage` in `src/lib/server/notifications/localized/localizedMailerMessages.ts`.
- Automatically maps status codes (e.g. `under_maintenance`, `assigned`) to localized names (e.g. `W naprawie`, `Przypisany`) via `{status}_status` dictionary entries.
- Translations synchronized across all supported language JSON files (`notifications_*.json`).

---

## 5. UI Integration

- **Incident Metadata (`src/routes/(admin)/incidents/[id]/IncidentMetadata.svelte`):**
  - Displays vehicle status transitions with `<VehicleStatus status={...} />` component.
  - Dedicated display for `Status (przed)` (`metadata.previousStatus`), `Status (po)` (`metadata.newStatus`), and `Powód` (`metadata.reason`).
  - Added to `EXCLUDED_FIELDS` to avoid redundant raw rendering in the generic metadata table.
- **Vehicle Status Changer (`src/lib/components/vehicle/VehicleStatusChanger.svelte`):**
  - Modularized actions with `<VehicleStatusQuickActions>` and `<VehicleStatusRequests>`.
- **Vehicle Status Quick Actions (`src/lib/components/vehicle/VehicleStatusQuickActions.svelte`):**
  - Dynamically updates client state with `res.status || status` to stay in sync when the backend returns `'assigned'` for a vehicle with an assigned driver.

---

## 6. Health Checks & Resolver Architecture

**Checker/Resolver separation** in `src/lib/server/services/health/`:

| Layer | Files | Responsibility |
|-------|-------|----------------|
| **Checkers** | `src/lib/server/services/health/checkers/*.checker.ts` | Read-only detection → emit `HealthIssue` records |
| **Resolvers** | `src/lib/server/services/health/resolvers/*.resolver.ts` | Consume issues → change status + notify |
| **Orchestrator** | `src/lib/server/services/health/healthCheck.service.ts` | Runs checkers → saves issues → runs resolvers |

- **Driver Expiration Resolver** (`driverExpirationDates.resolver.ts`):
  - Warning (expiring): Sends `documentExpiringNotification`.
  - Critical (expired): Sends `documentExpiredNotification` + updates driver status to `'documents_expired'`.
- **Vehicle Expiration Resolver** (`vehicleExpirationDates.resolver.ts`):
  - Critical (expired): Auto-transitions vehicle to `'unmovable'` via `updateVehicle()` + logs audit trail via `addVehicleStatusChange()` with `userId: 'system'`, `source: 'auto_health_check'`.
  - Sends specific `vehicle_document_expired` notification (no redundant generic status notification).
  - Idempotent: Skips if vehicle is already `unmovable`.

---

## Implementation Status Summary

| Priority | Task | Status | Notes |
|----------|------|--------|-------|
| **P0** | Handover logic extraction | ✅ Completed | Moved to `vehicleHandover.service.ts` |
| **P0** | Criticality policy in `statusTransitions` | ✅ Completed | Boolean return indicates criticality |
| **P0** | Smart driver assignment fallback | ✅ Completed | Target `available` with driver becomes `assigned` |
| **P0** | Role-based transition permissions | ✅ Completed | Moderator restriction on `retired` |
| **P0** | Auto-transition to `unmovable` (resolver) | ✅ Completed | Resolver in `vehicleExpirationDates.resolver.ts` |
| **P1** | Voluntary & Unilateral return workflows | ✅ Completed | See `PLAN_HANDOVER_DOCUMENTS.md` |
| **P1** | Unified vehicle status notification | ✅ Completed | `vehicle_status_changed` with dynamic priority |
| **P1** | Notification localization across all locales | ✅ Completed | All `{status}_status` keys in translation files |
| **P2** | UI incident metadata & status changer updates | ✅ Completed | `IncidentMetadata.svelte`, `VehicleStatusQuickActions.svelte` |
| **P3** | Damage incident workflow | ⏳ Deferred | Tracked in Fleet Incident Management Plan |
| **P3** | Job scheduling infrastructure (daily cron) | ⏳ Deferred | Tracked in Job Scheduling Plan |

---

## File Reference

- `src/lib/server/services/vehicleStatus.service.ts` — Core status transition state machine, criticality validation, driver assignment fallback, and notification triggers.
- `src/lib/server/services/vehicleHandover.service.ts` — Atomic handover assignments, voluntary returns, and unilateral returns.
- `src/lib/server/db/firebase/vehicleStatusChange.fdb.ts` — Audit log persistence for all status transitions.
- `src/lib/server/notifications/vehicle/vehicleStatusNotifications.ts` — Unified `vehicle_status_changed` notification definition.
- `src/lib/server/notifications/localized/localizedMailerMessages.ts` — Localization parser for status names and messages.
- `src/lib/server/services/health/resolvers/vehicleExpirationDates.resolver.ts` — Auto-transition to `unmovable` for expired documents.
- `src/routes/(admin)/vehicles/[id]/status/+server.ts` — Status change API endpoint.
- `src/routes/(admin)/incidents/[id]/IncidentMetadata.svelte` — Status change display in incident views.
- `src/lib/components/vehicle/VehicleStatusQuickActions.svelte` — Quick action UI component with server-response sync.
- `src/lib/components/vehicle/VehicleStatusRequests.svelte` — Modal-based status change request component.
