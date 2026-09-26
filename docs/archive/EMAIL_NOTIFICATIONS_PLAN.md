# Email Notifications Plan (ARCHIVED)

> **⚠️ This plan was phased out in favor of [LOCALIZED_EMAIL_PLAN.md](../LOCALIZED_EMAIL_PLAN.md).**
> 
> The phased approach (email-only MVP → multi-channel later) was replaced by a unified multi-channel architecture from day one. The new approach uses:
> - Data-driven notification definitions (one object per notification, all channels together)
> - A single generic email template (`GenericNotificationMail.svelte`) + plain-text generators for SMS/push/in-app
> - Locale dictionaries passed in context (bypassing Paraglide for server-side rendering)
> - Channel parity: email, SMS, push, in-app, webhook defined together
>
> This archived plan remains for historical reference — its 53-event catalog and priority mappings informed the new architecture.

---

> **Original constraint**: Only email is implemented (password reset only, sent to hardcoded test address). This plan designs for multi-channel from the start (email → SMS → push → webhook) to avoid refactoring later. Phase 1 delivers email-only; Phase 2 adds the abstraction layer; Phase 3 implements additional channels when driver mobile app exists. Note: WebPush capability is currently implemented and being actively tested.

---

## Current State

The application currently has a basic email infrastructure built on **Nodemailer + Svelte 5 server-side rendering**:

- **`src/lib/mails/mailer.ts`** — Core email sending logic with SMTP transport
- **`src/lib/mails/mailTemplates.ts`** — Password reset email template
- **`src/lib/mails/NotificationMail.svelte`** — Base email layout wrapper
- **`src/lib/mails/MailWrapper.svelte`** — HTML email wrapper with logo
- **`src/lib/mails/ResetMail.svelte`** — Password reset email content
- **`src/lib/mails/FeedbackMail.svelte`** — Feedback email template (unused)
- **`src/routes/(auth)/password-reset/api/+server.ts`** — Password reset endpoint

**Only implemented notification**: Password reset emails (sent to hardcoded `tomasz.le@finnergroup.com` for testing).

---

## Phase 1: Core Notification Infrastructure (Email Only - MVP)

### 1.1 Notification Service Layer

Create a unified notification service that abstracts the transport:

```
src/lib/server/notifications/
├── index.ts                    # Public API
├── types.ts                    # Notification types, payloads, channels
├── email/
│   ├── email.service.ts        # Email-specific logic (wrap mailer.ts)
│   ├── templates/              # Svelte components per notification type
│   │   ├── base/               # Base layouts (MailWrapper, NotificationMail)
│   │   ├── driver/
│   │   │   ├── AssignmentNotification.svelte
│   │   │   ├── BalanceNotification.svelte
│   │   │   ├── DocumentExpiryNotification.svelte
│   │   │   ├── HandoverNotification.svelte
│   │   │   ├── InspectionNotification.svelte
│   │   │   ├── OnboardingNotification.svelte
│   │   │   ├── StatusChangeNotification.svelte
│   │   │   ├── LeaveNotification.svelte
│   │   │   ├── SettlementNotification.svelte
│   │   │   ├── EarlySettlementNotification.svelte
│   │   │   ├── PenaltyNotification.svelte
│   │   │   ├── CashMismatchNotification.svelte
│   │   │   ├── DocuSignNotification.svelte
│   │   │   ├── DailyReportNotification.svelte
│   │   │   └── AuthNotification.svelte
│   │   ├── admin/
│   │   │   ├── VehicleAlertNotification.svelte
│   │   │   ├── SettlementSummaryNotification.svelte
│   │   │   ├── SyncFailureNotification.svelte
│   │   │   ├── NewDriverNotification.svelte
│   │   │   ├── DailyReportNotification.svelte
│   │   │   ├── InspectionNotification.svelte
│   │   │   ├── TelemetryNotification.svelte
│   │   │   ├── FuelAnomalyNotification.svelte
│   │   │   └── DocuSignNotification.svelte
│   │   └── shared/
│   │       └── GenericNotification.svelte
│   └── email.transport.ts      # Nodemailer wrapper (refactor from mailer.ts)
├── channels.ts                 # Channel abstraction (email only for now)
└── preferences.ts              # User notification preferences
```

### 1.2 Complete Notification Event Catalog (52 Events)

Derived from all project plans: `FLEET_PLAN.md`, `LEDGER_SETTLEMENT_PLAN.md`, `VEHICLE-STATUS-TRANSITION-PLAN-PART2.md`, `archive/DRIVER-STATUS-TRANSITION-PLAN.md`, `archive/HANDOVER-RETURN-PLAN.md`, `archive/AUTH_REWORK_PLAN.md`.

#### Driver Lifecycle (11 events)

| Event ID | Trigger | Recipient | Source Plan | Priority |
|----------|---------|-----------|-------------|----------|
| `driver.onboarding_submitted` | New driver created, pending verification | Admin | DRIVER-STATUS-PLAN | Medium |
| `driver.onboarding_approved` | All docs verified → `available` | Driver | DRIVER-STATUS-PLAN | High |
| `driver.onboarding_rejected` | Admin rejects verification | Driver | DRIVER-STATUS-PLAN | High |
| `driver.status_changed` | Any status transition (except inactive) | Driver + Admin | DRIVER-STATUS-PLAN | High |
| `driver.suspended` | Admin suspends driver | Driver + Admin | DRIVER-STATUS-PLAN | High |
| `driver.banned` | Admin bans driver (revoked) | Driver + Admin | DRIVER-STATUS / AUTH_REWORK | **Critical** |
| `driver.documents_expiring` | 30/14/7 days before expiry | Driver + Admin | DRIVER-STATUS / FLEET_PLAN §7.1 | Medium |
| `driver.documents_expired` | Document expired → `documents_expired` | Driver + Admin | DRIVER-STATUS | **Critical** |
| `driver.leave_starting` | Leave `dateFrom` reached | Driver + Admin | DRIVER-STATUS-PLAN | Medium |
| `driver.leave_ending` | Leave `dateEnd` reached | Driver + Admin | DRIVER-STATUS-PLAN | Medium |
| `driver.archived` | Account closed | Driver + Admin | DRIVER-STATUS-PLAN | Low |

#### Vehicle Assignment / Handover (9 events)

| Event ID | Trigger | Recipient | Source Plan | Priority |
|----------|---------|-----------|-------------|----------|
| `vehicle.assigned` | Handover assignment completed | Driver + Admin | HANDOVER-RETURN / VEHICLE-STATUS | High |
| `vehicle.returned` | Handover return completed | Driver + Admin | HANDOVER-RETURN / VEHICLE-STATUS | High |
| `vehicle.unilateral_return` | Unilateral return (abandoned) | Admin | HANDOVER-RETURN | High |
| `vehicle.status_changed` | Any status transition | Admin | VEHICLE-STATUS-PART2 §8 | Medium |
| `vehicle.broken` | Damage reported → `broken` | Admin | VEHICLE-STATUS / HANDOVER-RETURN | **Critical** |
| `vehicle.under_maintenance` | Scheduled/unscheduled maintenance | Admin | VEHICLE-STATUS | Medium |
| `vehicle.retired` | Vehicle retired | Admin | VEHICLE-STATUS | Low |
| `vehicle.platform_rejected` | Uber/Bolt rejects vehicle | Admin | VEHICLE-STATUS-PART2 §6 | High |
| `vehicle.inspection_due` | Vehicle inspection due soon | Admin | VEHICLE-STATUS / FLEET_PLAN | Medium |
| `vehicle.inspection_overdue` | Vehicle inspection overdue | Admin | VEHICLE-STATUS / FLEET_PLAN | High |
| `vehicle.inspection_completed` | Inspection finished | Admin | VEHICLE-STATUS | Low |

#### Financial / Settlement (11 events)

| Event ID | Trigger | Recipient | Source Plan | Priority |
|----------|---------|-----------|-------------|----------|
| `settlement.calculated` | Monthly/weekly settlement run complete | Driver + Admin | LEDGER_SETTLEMENT / FLEET_PLAN §5 | High |
| `settlement.ready_for_review` | Settlement generated, pending admin review | Admin | LEDGER_SETTLEMENT / FLEET_PLAN §7.2 | Medium |
| `settlement.approved` | Admin approves settlement | Driver | LEDGER_SETTLEMENT | High |
| `settlement.paid` | Payout executed (bank transfer) | Driver | LEDGER_SETTLEMENT | **Critical** |
| `balance.updated` | Any ledger event changes balance | Driver | LEDGER_SETTLEMENT | Medium |
| `balance.negative_alert` | Balance goes negative | Driver + Admin | LEDGER_SETTLEMENT | High |
| `early_settlement.requested` | Driver requests early payout | Admin | LEDGER_SETTLEMENT | Medium |
| `early_settlement.approved` | Early settlement approved | Driver | LEDGER_SETTLEMENT | High |
| `penalty.added` | Admin adds penalty | Driver + Admin | LEDGER_SETTLEMENT | High |
| `cash_collection.mismatch` | Daily report cash ≠ Bolt/Uber reported | Driver + Admin | LEDGER_SETTLEMENT / FLEET_PLAN §5.3 | Medium |
| `repayment.added` | Fuel card repayment recorded | Driver | LEDGER_SETTLEMENT | Medium |

#### Document & Compliance (10 events)

| Event ID | Trigger | Recipient | Source Plan | Priority |
|----------|---------|-----------|-------------|----------|
| `document.expiring_30d` | 30 days before expiry | Driver + Admin | FLEET_PLAN §6.3 / DRIVER-STATUS | Medium |
| `document.expiring_14d` | 14 days before expiry | Driver + Admin | FLEET_PLAN §6.3 | High |
| `document.expiring_7d` | 7 days before expiry | Driver + Admin | FLEET_PLAN §6.3 | **Critical** |
| `document.expired` | Expiry date passed | Driver + Admin | DRIVER-STATUS / VEHICLE-STATUS | **Critical** |
| `document.renewed` | Expired doc renewed → status restored | Driver + Admin | DRIVER-STATUS | Medium |
| `docusign.sent` | DocuSign envelope sent for signing | Driver + Admin | FLEET_PLAN §6.3 | Medium |
| `docusign.signed` | Document signed | Admin | FLEET_PLAN §6.3 | Medium |
| `docusign.declined` | Signer declined | Admin | FLEET_PLAN §6.3 | Medium |
| `docusign.expired` | Envelope expired unsigned | Admin | FLEET_PLAN §6.3 | Medium |
| `handover.document_ready` | Handover PDF generated | Driver + Admin | HANDOVER-RETURN | Medium |

#### Integration / Sync (6 events)

| Event ID | Trigger | Recipient | Source Plan | Priority |
|----------|---------|-----------|-------------|----------|
| `bolt.sync_failed` | Bolt API sync fails | Admin | FLEET_PLAN §3.2 / §7.1 | High |
| `bolt.sync_completed` | Bolt sync successful (with stats) | Admin | FLEET_PLAN §3.2 | Low |
| `uber.sync_failed` | Uber API sync fails | Admin | FLEET_PLAN (future) | High |
| `telemetry.device_offline` | Telematics device offline > 24h | Admin | FLEET_PLAN §4.3 | Medium |
| `telemetry.harsh_event` | Harsh acceleration/braking threshold | Admin | FLEET_PLAN §4.3 | Low |
| `fuel.card_anomaly` | Fuel transaction anomaly detected | Admin | FLEET_PLAN §5.2 | Medium |

#### Auth & Security (5 events)

| Event ID | Trigger | Recipient | Source Plan | Priority |
|----------|---------|-----------|-------------|----------|
| `auth.password_reset_requested` | User requests password reset | User | AUTH_REWORK §8 | High |
| `auth.password_changed` | Password successfully changed | User | AUTH_REWORK | Medium |
| `auth.push_enabled` | WebPush successfully enabled | User | WebPush Impl | Low |
| `auth.google_signin` | New Google Sign-In | User | AUTH_REWORK | Low |
| `auth.revoked` | Account revoked (banned) | User | AUTH_REWORK §10 | **Critical** |
| `auth.suspicious_login` | Login from new device/location | User | AUTH_REWORK (future) | Medium |

#### Operational / Daily (5 events)

| Event ID | Trigger | Recipient | Source Plan | Priority |
|----------|---------|-----------|-------------|----------|
| `daily_report.submitted` | Driver submits daily report | Admin | FLEET_PLAN §2.3 | Medium |
| `daily_report.missing` | Driver hasn't submitted by deadline | Driver + Admin | FLEET_PLAN §2.3 | Medium |
| `inspection.due` | Vehicle inspection due soon | Admin | VEHICLE-STATUS / FLEET_PLAN | Medium |
| `inspection.overdue` | Vehicle inspection overdue | Admin | VEHICLE-STATUS / FLEET_PLAN | High |
| `inspection.completed` | Inspection finished | Admin | VEHICLE-STATUS | Low |

---

### Summary by Priority

| Priority | Count | Examples |
|----------|-------|----------|
| **Critical** | 6 | `driver.banned`, `driver.documents_expired`, `vehicle.broken`, `vehicle.platform_rejected`, `settlement.paid`, `auth.revoked` |
| **High** | 18 | `driver.onboarding_approved`, `vehicle.assigned`, `settlement.calculated`, `penalty.added`, `bolt.sync_failed` |
| **Medium** | 22 | `driver.documents_expiring_30d`, `settlement.ready_for_review`, `document.expiring_14d`, `daily_report.submitted` |
| **Low** | 6 | `driver.archived`, `vehicle.retired`, `bolt.sync_completed`, `inspection.completed` |

**Total: 53 distinct notification events**

---

### 1.3 Preferences & Opt-out

- Store preferences in Firestore (`users` collection or dedicated `notificationPreferences` subcollection)
- Per-user, per-notification-type opt-in/opt-out
- Default: all enabled for relevant role
- Unsubscribe link in every email footer (RFC 8058 one-click)

### 1.4 Queue & Retry

- Use Firestore `queuedMails` collection (see `mails.d.ts:QueuedMail`)
- Fields: `to`, `subject`, `html`, `type`, `priority`, `attempts`, `status`, `scheduledAt`, `sentAt`, `error`
- Background worker (cron / Cloud Scheduler) processes queue
- Exponential backoff: 5min, 15min, 1hr, 6hr, 24hr (max 5 attempts)
- Dead letter after max attempts → alert admin via Slack

---

## Phase 2: Multi-Channel Foundation (Preparation for SMS/Push)

### 2.1 Channel Abstraction

```typescript
// src/lib/server/notifications/channels.ts

type Channel = 'email' | 'sms' | 'push' | 'webhook';

interface NotificationChannel {
  send(notification: NotificationPayload): Promise<SendResult>;
  validateRecipient(recipient: Recipient): boolean;
}

interface NotificationPayload {
  type: string;
  recipient: Recipient;
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  channels?: Channel[]; // default: ['email']
}
```

### 2.2 Recipient Resolution

```typescript
interface Recipient {
  userId: string;
  role: 'driver' | 'admin';
  email?: string;
  phone?: string;      // For future SMS
  pushToken?: string;  // For future push
  preferences: NotificationPreferences;
}
```

**Resolution logic:**
- Admin events → all admins with relevant role (manager+ for finance, moderator+ for ops)
- Driver events → specific driver (by driverId)
- System events → configurable admin list

### 2.3 Template System

- Keep Svelte components for email (rich HTML)
- Plain text templates for SMS (character limits)
- JSON payloads for push notifications
- Shared data preparation logic per notification type
- i18n via `$i18n` (Paraglide) - driver locale from `preferredLanguage`

---

## Phase 3: Future Channels (Post-MVP)

### 3.1 SMS Notifications
- Provider: Twilio / Vonage / local Polish provider (Infobip, SMSAPI)
- Use cases: High-priority alerts only (handover, overdue inspection, urgent admin alerts)
- Template: Plain text, ≤160 chars (or concatenated)
- Cost tracking per message

### 3.2 Push Notifications
- Provider: Firebase Cloud Messaging (FCM) — already have Firebase
- Use cases: Real-time updates (assignment changes, balance updates)
- Requires driver mobile app (separate repo) to register tokens
- Web push for admin/driver portal (currently implemented and being tested)
  - Endpoint: `src/routes/(driver)/driver/push/+server.ts` (POST to save, DELETE to revoke)
  - Upon registering a new token, the backend dispatches a `push_enabled` notification to test the end-to-end flow.
  - Client component: `src/lib/components/WebPush.svelte`
  - Service: `src/lib/server/services/webpush.service.ts`
  - Configuration via `$env/static/public` for Firebase settings and `PUBLIC_VAPID_KEY`

### 3.3 In-App Notifications
- Firestore `notifications` collection per user
- Real-time listener in admin/driver UI
- Read/unread status, dismissal

### 3.4 Webhooks
- Outbound webhooks for external integrations
- Configurable per admin account
- Retry with backoff, signature verification

---

## Implementation Priority

### Sprint 1 (Week 1-2)
- [ ] Refactor `mailer.ts` → `email.transport.ts` + `email.service.ts`
- [ ] Create `NotificationService` with queue integration
- [ ] Implement **Critical + High** priority events first (~24 events):
  - Driver: onboarding_approved/rejected, banned, documents_expired, status_changed, suspended
  - Vehicle: assigned, returned, unilateral_return, broken, platform_rejected, inspection_overdue
  - Financial: settlement.calculated, settlement.paid, penalty.added, early_settlement.approved
  - Auth: password_reset_requested, revoked
- [ ] Add preferences UI in admin driver detail page

### Sprint 2 (Week 2-3)
- [ ] Complete remaining Medium priority events (~22 events)
- [ ] Background queue worker (Cloud Run Job / Cron)
- [ ] Admin notification dashboard (sent/failed/pending)
- [ ] Unsubscribe flow + preferences API

### Sprint 3 (Week 3-4)
- [ ] Channel abstraction layer (Phase 2)
- [ ] SMS provider evaluation + proof of concept
- [ ] Documentation & runbooks

---

## Configuration

Environment variables (add to `.env` / secret manager):

```bash
# Email (existing)
SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=

# Future SMS
SMS_PROVIDER=twilio|smsapi|infobip
SMS_API_KEY=
SMS_SENDER_ID=

# Future Push
FCM_SERVER_KEY=        # Already in Firebase Admin

# Queue
NOTIFICATION_QUEUE_BATCH_SIZE=50
NOTIFICATION_WORKER_INTERVAL_MS=30000
```

---

## Security & Compliance

- **GDPR**: Notification preferences = consent record. Log consent timestamp.
- **PII**: Never log full email content. Mask recipient in logs (`t***@example.com`).
- **Unsubscribe**: One-click unsubscribe per notification type (RFC 8058).
- **Rate limiting**: Max 10 emails/hour per user per type (configurable).
- **Encryption**: Encrypt queued email content at rest (Firestore automatic).
- **WebPush / FCM**: `fcmToken` is collected only after explicit browser permission and linked via `drivers.fdb.ts`. User can revoke consent anytime, sending an empty string to immediately delete the token.

---

## Testing Strategy

| Layer | Approach |
|-------|----------|
| Email rendering | Snapshot tests for Svelte components |
| Transport | Mock Nodemailer, verify `sendMail` called with correct args |
| Queue | Integration test: enqueue → worker processes → marks sent |
| Preferences | Unit tests for filtering logic |
| E2E | Test password reset flow + new notification triggers |

---

## Monitoring & Observability

- **Metrics**: Queue depth, send rate, failure rate, latency (p50/p95/p99)
- **Alerts**: Queue depth > 1000, failure rate > 5%, worker stalled > 5min
- **Logging**: Structured logs with `notificationId`, `type`, `channel`, `status`
- **Dashboards**: Grafana / Cloud Monitoring

---

## Mapping: Original 13 Types → 52 Events

| Original NOTIFICATIONS_PLAN Type | Expanded Events Covered |
|---------------------------------|------------------------|
| `driver.assigned` | `vehicle.assigned` |
| `driver.unassigned` | `vehicle.returned`, `vehicle.unilateral_return` |
| `driver.balance_updated` | `settlement.calculated`, `balance.updated`, `penalty.added`, `repayment.added` |
| `driver.document_expiring` | `document.expiring_30d`, `document.expiring_14d`, `document.expiring_7d` |
| `driver.document_expired` | `document.expired` |
| `driver.handover_created` | `vehicle.assigned` (handover created), `handover.document_ready` |
| `driver.handover_completed` | `vehicle.returned` |
| `driver.inspection_due` | `inspection.due`, `vehicle.inspection_due` |
| `driver.inspection_overdue` | `inspection.overdue`, `vehicle.inspection_overdue` |
| `admin.vehicle_alert` | `vehicle.broken`, `vehicle.under_maintenance`, `vehicle.platform_rejected`, `vehicle.retired`, `vehicle.status_changed` |
| `admin.settlement_ready` | `settlement.ready_for_review` |
| `admin.sync_failed` | `bolt.sync_failed`, `uber.sync_failed` |
| `admin.new_driver` | `driver.onboarding_submitted` |

**Additional events not in original 13 types but required by other plans:**
- `driver.onboarding_approved/rejected`, `driver.suspended/banned/archived`, `driver.leave_starting/ending`
- `settlement.approved/paid`, `early_settlement.requested/approved`, `cash_collection.mismatch`
- `document.renewed`, `docusign.*` (4 events)
- `telemetry.*` (2 events), `fuel.card_anomaly`
- `auth.*` beyond password reset (4 events)
- `daily_report.submitted/missing`, `inspection.completed`

---

## Driver-Facing App Integration Note

When the driver-facing app is built (separate repo), it will call:
- `POST /api/driver/notifications/preferences` — manage preferences
- `POST /api/driver/push-token` — register FCM push tokens
- `GET /api/driver/notifications` — fetch in-app notification history

This backend will serve those endpoints under the `(api)/driver/` route group with `requireDriverApi` auth.