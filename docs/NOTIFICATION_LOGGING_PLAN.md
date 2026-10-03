# Notification Logging & Observability Plan

## Overview
Centralized plan for capturing, storing, and querying notification delivery metrics. Separate from notification *definitions* and *dispatch logic*.

---

## 1. Current State (What Exists)

| Channel | Provider | Return Value Captured | Logged |
|---------|----------|----------------------|--------|
| Email | Nodemailer/SMTP | ❌ `messageId` discarded | Basic success/error |
| Push | FCM | ❌ `messageId` discarded | Basic success/error |
| In-App | Firestore | ❌ `docId` discarded | Basic success/error |
| SMS | Stub | N/A | Console log only |

**Logged today:** `logger.log` / `logger.error` strings in `service.ts` (lines 146, 179, 202, 226, 288, 295, 297)

---

## 2. Required Data Model

### NotificationDispatchLog (Firestore collection: `notificationDispatchLogs`)

```typescript
interface NotificationDispatchLog {
    id: string;                    // Auto-generated
    notificationId: App.NotificationType;  // e.g., 'driver_document_expiring'
    recipientId: string;           // user.id (BaseContact.id)
    recipientType: 'driver' | 'admin' | 'system';
    channel: 'email' | 'push' | 'inapp' | 'sms' | 'webhook';
    
    // Dispatch
    dispatchedAt: number;          // Date.now() at send attempt
    providerMessageId?: string;    // FCM messageId, SMTP messageId, Firestore docId
    providerResponse?: any;        // Raw provider response (optional, for debugging)
    
    // Outcome
    status: 'accepted' | 'failed' | 'pending';  // 'pending' for async channels
    error?: {
        code: string;
        message: string;
        stack?: string;
    };
    
    // Correlation
    batchId?: string;              // For multi-recipient sends
    incidentId?: string;           // If incident was generated
    
    // Context (minimal, no PII)
    priority: NotificationPriority;
    locale: App.Locale;
}
```

### NotificationDeliveryEvent (Firestore collection: `notificationDeliveryEvents`)

For async/webhook-delivered status updates (bounces, opens, clicks, FCM delivery receipts):

```typescript
interface NotificationDeliveryEvent {
    id: string;
    dispatchLogId: string;         // Links to NotificationDispatchLog
    eventType: 'delivered' | 'bounced' | 'opened' | 'clicked' | 'complained' | 'unsubscribed';
    eventAt: number;               // Provider timestamp
    providerEventId?: string;      // SES messageId, FCM delivery receipt ID
    metadata?: Record<string, any>; // e.g., { bounceType: 'Permanent', clickUrl: '...' }
}
```

---

## 3. Implementation Steps

### Phase 1: Capture Provider IDs (Code Changes Only)

| File | Change |
|------|--------|
| `src/lib/mails/mailer.ts` | Return `messageId` from `sendMailUsingSMTP` → `sendRenderedEmail` |
| `src/lib/server/notifications/localized/localizedMailer.ts` | Propagate returned `messageId` |
| `src/lib/server/notifications/service.ts:sendEmail` | Capture `messageId`, write `NotificationDispatchLog` |
| `src/lib/server/services/webpush.service.ts` | Return FCM `messageId` (already returned, line 48) |
| `src/lib/server/notifications/service.ts:sendPush` | Capture `messageId`, write `NotificationDispatchLog` |
| `src/lib/server/db/firebase/userNotifications.fdb.ts` | Return `docId` from `addNotification` |
| `src/lib/server/notifications/service.ts:sendInApp` | Capture `docId`, write `NotificationDispatchLog` |

### Phase 2: Structured Dispatch Logging

- Create `src/lib/server/notifications/logging.ts` with `logDispatch()` function
- Write to `notificationDispatchLogs` collection (batch writes for performance)
- Include `batchId` for multi-recipient (matrix admin copies)

### Phase 3: Delivery Webhooks (Infrastructure)

| Provider | Webhook Endpoint Needed | Events |
|----------|------------------------|--------|
| SMTP (SES/SendGrid/Postmark) | `/api/notifications/email/webhook` | delivered, bounced, opened, clicked, complained |
| FCM | `/api/notifications/push/webhook` (via FCM Data API / BigQuery) | delivered, opened |
| SMS Provider | `/api/notifications/sms/webhook` | delivered, failed |

### Phase 4: Query & Dashboard

- Admin page: `/admin/notifications/logs` — filter by notificationId, recipient, channel, date, status
- Aggregated metrics: delivery rate, failure rate, latency (dispatch → delivered)
- Alerting: failure rate spike, provider errors

---

## 4. Retention & Privacy

| Data | Retention | Notes |
|------|-----------|-------|
| `NotificationDispatchLog` | 90 days | No PII (recipientId only, no email/phone) |
| `NotificationDeliveryEvent` | 180 days | May contain click URLs — no user identifiers |

**GDPR:** `recipientId` is pseudonymous. Join to user table only in admin context with audit log.

---

## 5. Non-Goals

- Real-time streaming / live dashboards (use log aggregation instead)
- A/B testing framework
- Per-user preference analytics (separate product analytics)

---

## 6. Reference

> See `docs/LOCALIZED_NOTIFICATION_PLAN.md` for notification architecture, dispatch flow, and channel definitions.