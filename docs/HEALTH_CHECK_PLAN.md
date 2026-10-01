# Health Check & Automation System Plan

## 1. Overview
The Health Check system (`src/lib/server/services/health/healthCheck.service.ts`) replaces the older "Alert Engine" concept. Instead of a monolithic alert evaluator, the system is split into **Checkers** (which identify issues) and **Resolvers** (which take automated actions, such as status transitions and dispatching notifications/incidents).

## 2. Architecture
- **Checkers**: Pure evaluator functions that take parameters and return an array of `HealthIssue` objects (`critical`, `warning`, `info`).
- **Resolvers**: Action functions that take `HealthIssue`s and perform state mutations (e.g., auto-transitioning a vehicle to `unmovable`) and trigger notifications (which auto-log incidents via the multi-channel notification architecture).
- **Storage**: Issues are saved to the `healthIssues` Firestore collection for dashboard reporting (`getFleedProblemsSummary`).
- **Triggers**: Executed by scheduled cron jobs (as defined in `JOB_SCHEDULING_PLAN.md`) or manually via the admin UI.

## 3. Current Implementation Status
- ✅ **Core Engine**: `checkFleetProblems` and `getFleedProblemsSummary` are implemented.
- ✅ **Driver Document Expiry**: `checkDriverExpirationDates` (Checker) and `resolveDriverExpirationIssues` (Resolver) exist.
- ✅ **Vehicle Document Expiry**: `checkVehicleExpirationDates` (Checker) and `resolveVehicleExpirationIssues` (Resolver) exist.

## 4. Planned Checkers & Resolvers (Future Expansion)
To fully deprecate the conceptual "Alert Engine" outlined in older plans, the following must be implemented within the Health Check framework:

### 4.1 Integration & Sync Health
- **Bolt Sync Checker**: Identifies vehicles/drivers with failed Bolt API syncs (`bolt_sync_failed`).
  - *Resolver*: Dispatches admin sync failure notification/incident.
- **Telemetry Offline Checker**: Identifies vehicles where the telemetry device has been offline > 24h.
  - *Resolver*: Dispatches admin telemetry offline notification/incident.

### 4.2 Financial & Operational Health
- **Fuel Anomaly Checker**: Detects sudden spikes or mismatches in fuel card transactions.
  - *Resolver*: Logs `fuel_anomaly` incident.
- **Provision Anomaly Checker**: Detects discrepancies between expected and actual driver payouts.
  - *Resolver*: Logs `provision_anomaly` incident.
- **Settlement Ready Checker**: Checks if period settlements are calculated and ready for admin review.
  - *Resolver*: Dispatches `settlement_ready` notification to admins.

### 4.3 Operational Compliance
- **Missing Daily Report Checker**: Identifies drivers who failed to submit their end-of-shift report.
  - *Resolver*: Sends `daily_report.missing` notification to driver and admin.
- **Inspection Overdue Checker**: Identifies vehicles past their physical inspection date.
  - *Resolver*: Transitions vehicle to `unmovable` if critical, or sends warnings if approaching.

## 5. Integration Points
- **Notifications & Incidents (`LOCALIZED_NOTIFICATION_PLAN.md`)**: Resolvers must use the multi-channel notification service (`sendNotification`). This automatically handles locale preferences, email/push routing, and incident logging (using the Incident Matrix). Resolvers no longer need to manually write to an incident database.
- **Job Scheduling (`JOB_SCHEDULING_PLAN.md`)**: Health checks are triggered by specialized cron jobs (e.g., daily at 02:00 UTC for vehicles, 03:00 UTC for drivers) rather than a single monolithic 6h cron.
