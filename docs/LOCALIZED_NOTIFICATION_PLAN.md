# Multi-Channel Notification Architecture Plan

## Overview
Instead of maintaining a separate Svelte component for every single email, notifications are modeled as data-generating objects (classes or constant definitions). This architecture centrally defines how a single notification event (e.g., `DocumentExpiring`) translates into various channels (Email, SMS, WebPush, In-App) using localized messages.

This drastically reduces boilerplate, keeps related channel messages together, and allows a central notification service to handle user preferences, priority filtering, and routing.

## 1. Directory Structure

```
src/lib/server/notifications/
├── index.ts                     # Main exports
├── types.ts                     # Interfaces (Priority, Channel types, Notification definition)
├── service.ts                   # Core logic: routing, preferences, dispatch
├── channels/
│   ├── GenericNotificationMail.svelte # Shared email layout
│   ├── emailTransport.ts        # (Future) Extracted Nodemailer integration
│   ├── smsTransport.ts          # (Future) SMS sender
│   └── pushTransport.ts         # (Future) FCM WebPush sender
├── driver/
│   ├── documentExpiredNotification.ts
│   ├── documentExpiringNotification.ts
│   └── ...
├── admin/
│   ├── vehicleInsuranceExpiringNotification.ts
│   ├── vehicleTechnicalExpiringNotification.ts
│   └── ...
└── localized/                     
    ├── localizedMailerMessages.ts # Localized message index & interface (no Paraglide)
    ├── localizedMailer.ts         # render & inject _messages
    ├── LocalizedMailWrapper.svelte
    └── messages/                  # Raw localized strings (pl, en, uk, etc.)
```

## 2. Core Interfaces (`types.ts`)

```typescript
import type { MessageStructure } from './localized/localizedMailerMessages';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

// Context provided by the service to the generators
export interface NotificationContext {
    title: string;
    body: string;
    title_pl: string;
    body_pl: string;
    locale: App.Locale;
    m: MessageStructure; // Localized dictionary for the specific notification
    m_pl: MessageStructure; // Forced Polish dictionary for internal/incident logging
    user: App.BaseContact | null; // Recipient data (null if no primary recipient)
}

export interface EmailPayload {
    subject: string;
    htmlBody: string; // Rendered into GenericNotificationMail.svelte
    component?: any;  // Optional custom component
    props?: any;      // Optional custom props
}

export interface WebPushPayload {
    title: string;
    body: string;
    icon?: string;
    click_action?: string;
}

export interface IncidentPayload {
    title: string;
    description: string;
    category: App.Incident.Category;
    source?: App.Incident.Source;
    type?: App.NotificationType;
}

interface BaseMessage {
    title: string;
    body: string;
}

export interface NotificationDefinition<TData> {
    id: App.NotificationType; // e.g., 'driver_document_expiring'
    priority: NotificationPriority;
    client: boolean; // Determines if this is sent to the client (driver)
    admin: boolean;  // Determines if this is sent to admins
    
    // Optional. Automatically falls back to general getBaseMessage using title and body
    getBaseMessage?: (m: MessageStructure, data: TData) => BaseMessage;
    
    // Optional channels
    email?: (data: TData, ctx: NotificationContext) => EmailPayload | Promise<EmailPayload>;
    push?: (data: TData, ctx: NotificationContext) => WebPushPayload | Promise<WebPushPayload>;
    sms?: (data: TData, ctx: NotificationContext) => string | Promise<string>;
    inapp?: (data: TData, ctx: NotificationContext) => string | Promise<string>;
    webhook?: (data: TData, ctx: NotificationContext) => any;
    incident?: (data: TData, ctx: NotificationContext) => IncidentPayload | false | Promise<IncidentPayload | false>;
}
```

## 3. Example Notification Definition

This is how a notification is defined easily. By utilizing `prepareNotificationChannels`, you don't need to manually write boilerplate for SMS, Push, In-App, and Incidents. The core `title` and `body` are automatically extracted and localized using the `getBaseMessage` method.

### Recipient Targeting & Action Links
Notifications can be targeted at drivers (`client: true`), administrators (`admin: true`), or both. Because drivers and admins interact with different parts of the application, push notification action links must be routed accordingly. 

By default, the `prepareNotificationChannels` factory assumes an admin preset link (e.g., `/admin/fleet`). However, when a notification is marked `client: true`, the underlying system automatically rewrites the push notification's action link to route the driver to the correct interface (e.g., `/driver`) rather than the admin dashboard.

```typescript
// src/lib/server/notifications/driver/pushEnabledNotification.ts
import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { PUBLIC_URL } from '$env/static/public';
import { prepareNotificationChannels } from '../general/prepareNotificationChannels';

export interface PushEnabledData {
    deviceDetails?: string;
}

// Automatically generates sms, push, inapp, and incident using ctx.title and ctx.body
// Every time a push notification is intended for a client, its action link is rewritten to '/driver' instead of the preset admin action link.
const channels = prepareNotificationChannels({
    action: PUBLIC_URL + '/admin/fleet', // Default admin link
    channels: ['push'] // optionally restrict which channels to generate
});

export const pushEnabledNotification: NotificationDefinition<PushEnabledData> = {
    id: 'push_enabled',
    priority: 'low',
    client: true,
    admin: false,
    ...channels
};

/** Strictly typed export */
export async function sendPushEnabledNotification(
    user: App.BaseContact | null, 
    data: PushEnabledData = {}, 
    incidentSource: App.Incident.Source = 'system'
): Promise<void> {
    return sendNotification(user, pushEnabledNotification, data, incidentSource);
}
```

## 4. Generic Dispatcher (`service.ts`)

Instead of a class, a pure function coordinates routing:

```typescript
// src/lib/server/notifications/service.ts
export async function sendNotification<TData>(
    user: App.BaseContact | null, 
    notification: NotificationDefinition<TData>, 
    data: TData
): Promise<void> {
    // 1. Resolve Preferences (fallback to default if user is null)
    const locale = user?.preferredLanguage || 'pl';
    const prefs = user ? await getUserPreferences(user.id) : getDefaultPreferences();
    
    if (user && !shouldSend(notification.priority, prefs)) return;

    // 2. Setup Context
    const ctx: NotificationContext = { locale, m: getEmailMessages(locale), user };

    const promises: Promise<void>[] = [];

    // 3. Dispatch to specific channels (parallelized)
    // Only dispatch to client channels if user is present
    if (user && user.email && prefs.channels.email !== false) {
        promises.push(sendEmail(user.email, notification, data, ctx));
    }
    // ... handles sms, push, inapp ...

    await Promise.allSettled(promises);
}
```

## 5. Contact Independence

To ensure the notification service is flexible, it depends on `App.BaseContact` rather than `App.UserBase`.

```typescript
// src/app.d.ts
interface BaseContact {
    id: string;
    email: string;
    name: string;
    preferredLanguage: Locale;
    phone?: string;
}

interface UserBase extends BaseContact {
    role: AdminRole | 'driver' | 'revoked';
    // ...
}
```

## Advantages of this Architecture
1. **DRY (Don't Repeat Yourself)**: You don't need 50 Svelte components. You just need 1 generic component, and 50 plain-text generators.
2. **Channel Parity**: When defining a notification, you immediately see and define how it looks on Email, SMS, and Push. No hunting across different services.
3. **Strict Typings without Boilerplate**: `sendDocumentExpiredNotification(user, { documentName, expiryDate })` guarantees data shape for callers while the underlying service handles generic abstraction.
4. **Target agnostic**: Because generators consume `App.BaseContact`, notifications can trigger for drivers, admins, managers, or third-party contacts.
5. **Localization Integration**: Bypasses Paraglide entirely. It uses exact dictionary objects (`m`) based on the contact's `preferredLanguage`, ensuring safety outside request contexts.

## 6. Incident Logging System

The notification system acts as the central mechanism for generating persistent Incident Logs (e.g., accidents, suspensions, compliance violations). This keeps business logic inside the notification definitions and completely automates incident generation.

### 7.1 Schema

All entity data is stored strictly in the `metadata` record. `resolvedBy` is the Admin's UID, and `resolvedByName` is their name.

```typescript
namespace Incident {
    type Severity = 'low' | 'medium' | 'high' | 'critical';
    type Status = 'info' | 'open' | 'resolved';
    
    type Category = 'safety' | 'platform_account' | 'compliance' | 'driver_conduct' | 'vehicle_issue' | 'data_sync' | 'financial';
    type Source = 'webhook' | 'health_check' | 'admin_manual' | 'driver_app' | 'cron_job' | 'system';
    
    interface IncidentLog {
        id: string;
        title: string;
        description: string;
        category: Category;
        severity: Severity;
        status: Status;
        source: Source;
        metadata: Record<string, any>; // driverId, vehicleId, documentName, etc.
        notes: string;
        createdAt: string;
        resolvedAt?: string;
        resolvedBy?: string;     // Admin ID
        resolvedByName?: string; // Admin Name
    }
}
```

### 7.2 Incident Generation in Notifications

The `NotificationDefinition` includes an optional `incident` generator. If defined, the dispatcher will *always* create an incident log (unless the generator explicitly returns `false`). The `prepareNotificationChannels` factory automatically wires this up for you using `ctx.title_pl` and `ctx.body_pl`.

**Incident Rules:**
1. **Always use Polish**: Incident logs are strict internal records. The context provides `ctx.title_pl` and `ctx.body_pl` which are guaranteed to be generated using the Polish dictionary (`m_pl`), regardless of the recipient's preferred locale.
2. **Dynamic Source via Dispatcher**: Do NOT hardcode the `source` (e.g., `health_check`) inside the generator. The source is passed dynamically at dispatch time to the wrapper function (e.g., `sendDocumentExpiredNotification(user, data, 'cron_job')`) which forwards it directly to the DB layer.

```typescript
// Context provides forced Polish strings for internal logging
export interface NotificationContext {
    title_pl: string;
    body_pl: string;
    // ...
}

export interface IncidentPayload {
    title: string;
    description: string;
    category: App.Incident.Category;
    source?: App.Incident.Source; 
}
```

### 7.3 Auto-Logging via Dispatcher

The core `sendNotification` service automatically invokes `logIncident` when an incident is generated, safely executing it in parallel with other channel dispatches.

**Primary Recipient (`user`) can be `null`:** 
The `user` parameter (the first argument) is always present but may be `null` (e.g., a vehicle expiration notification for a vehicle with no assigned driver). 
- When `user` is `null`, no `client: true` messages (Email, SMS, Push) will be sent to any primary recipient.
- However, notifications to administrators (`admin: true`) via the Incident Matrix and the generation of `incident` logs will still proceed normally.

To ensure notifications behave correctly based on their target audience:
- **Client Delivery:** Channel messages (Email, SMS, Push) are ONLY sent to the primary user if `client: true` AND `user` is not null. If `client: false` or `user` is null, the system will quietly skip sending direct messages to the primary user.
- **Incident Guard:** Incidents are always logged if the `incident` generator is defined and returns a payload, regardless of `client` or `admin` flags, and regardless of whether a `user` was provided.

> **Note on Required Receivers:** While the core dispatcher allows `user` to be `null`, specific business logic or notification types might still effectively require a recipient for the communication to fulfill its purpose (e.g., password resets or personal onboarding). If `user` is `null`, the system ensures that no "ghost" messages are sent to the client side, while maintaining visibility for admins and audit logs.

Additionally, if a notification has `admin: true` and the context is not already an admin copy (`!ctx.isAdminCopy`), the system will query the Incidents Matrix (located at `/incidents/matrix`) for the specific notification type. If recipients are registered for that notification type in the matrix, the system will automatically dispatch the exact same notification message to those registered administrators by internally calling a private recursive dispatch function with an `isAdminCopy` flag set to `true`. This ensures admins receive a carbon copy of the notification without triggering duplicate incident logs or infinite loops, and keeps the public `sendNotification` signature clean.

```typescript
// src/lib/server/notifications/service.ts
export async function sendNotification<TData>(
    user: App.BaseContact | null, 
    notification: NotificationDefinition<TData>, 
    data: TData,
    incidentSource: App.Incident.Source = 'system'
): Promise<void> {
    return _dispatchNotification(user, notification, data, incidentSource, false);
}

async function _dispatchNotification<TData>(
    user: App.BaseContact | null, 
    notification: NotificationDefinition<TData>, 
    data: TData,
    incidentSource: App.Incident.Source,
    isAdminCopy: boolean
): Promise<void> {
    // ... setup context with isAdminCopy ...

    // Only dispatch to channels if this is an admin copy or explicitly meant for the client (and user exists)
    const shouldDispatchChannels = isAdminCopy || (notification.client && user !== null);
    if (shouldDispatchChannels) {
        // ... dispatch emails, sms, push ...
    }

    // ALWAYS log incident if defined and doesn't return false (skip for admin copies)
    if (notification.incident && !ctx.isAdminCopy) {
        promises.push((async () => {
            try {
                const inc = await notification.incident!(data, ctx);
                if (inc) {
                    await logIncident(
                        notification.id, 
                        inc, 
                        notification.priority, 
                        user, 
                        data, 
                        incidentSource // Dynamic runtime source passed down
                    );
                }
            } catch (err) {
                // error handling
            }
        })());
    }
    
    // Dispatch to registered matrix admins (skip for admin copies to prevent loops)
    if (notification.admin && !ctx.isAdminCopy) {
        promises.push((async () => {
            try {
                const admins = await getIncidentMatrixRecipients(notification.id);
                if (admins && admins.length > 0) {
                    const adminPromises = admins.map(admin => {
                        return _dispatchNotification(admin, notification, data, incidentSource, true);
                    });
                    await Promise.allSettled(adminPromises);
                }
            } catch (err) {
                // error handling
            }
        })());
    }
}
```

## 8. WebPush Click Action Handling

The `sendWebPush` function in `src/lib/server/services/webpush.service.ts` handles the `click_action` URL normalization:

- If `click_action` is a relative path starting with `/` (e.g., `/admin/fleet`, `/driver`), it is automatically prepended with `PUBLIC_URL` from the environment.
- If `click_action` is not provided or is empty, it defaults to `PUBLIC_URL` (the root of the application).
- Absolute URLs (starting with `http://` or `https://`) are passed through unchanged.

This ensures that notification definitions can use convenient relative paths (e.g., `/admin/fleet`) while the actual FCM payload contains fully qualified URLs ready for the client to handle.

## 7. Implementation Progress Updates

*   **Greeting Fields Removed**: To unify incident logs and cross-channel formatting, the `greeting` property (e.g., "Dear {driverName}") has been entirely stripped from `localizedMailerMessages.ts` definitions and all language JSON files (`messages/*.json`). Notifications are now direct and actionable without salutations.
*   **Incident Matrix Migration**: The `healthMatrix` concept has been generalized and migrated to `incidentMatrix`. It is now accessible via `/incidents/matrix` instead of `/health/matrix`. It stores recipient maps keyed by generic `App.NotificationType` (e.g., `vehicle_document_expiring`) rather than specific `HealthCheckProblem` enums, allowing any system event to broadcast to an admin distribution list.
*   **Empty Metadata Handling**: UIs displaying incident logs, such as `IncidentMetadata.svelte`, will selectively hide the metadata `<pre>` container if the associated `metadata` payload is empty or undefined, reducing visual clutter on the admin details page.
*   **Strict Audience Targeting**: The `client` and `admin` boolean flags in `NotificationDefinition` have been made strictly required, forcing every notification definition to explicitly state its intended audience, ensuring precise push notification action link routing and matrix distribution without fallback ambiguities.
*   **Typed Matrix Exclusions**: The incidents matrix specifically relies on `App.MatrixNotificationType`, which explicitly uses TypeScript's `Exclude` utility to remove system/internal notifications (like `push_enabled`, `reset_password`, or `common`) from the matrix management interface, preventing administrators from accidentally subscribing to internal operational noise.
*   **In-App Notifications Implementation**: Implemented Firestore collection `userNotifications` (using the same structure for both admins and drivers as they share a Firebase auth `id`). `sendInApp` channel uses `InAppNotification` interface containing a `read` property (either `false` or read timestamp). Implemented unified API endpoints (`/api/notifications`) and notification UI pages (`/driver/notifications` and `/admin/notifications`) with `InAppNotificationItem.svelte` component.

## 8. Flat Category Key Pattern for Document Expiration Notifications

For document expiration notifications (driver & vehicle), use **flat keys** in message JSON instead of nested objects.

### Structure

```json
"driver_document_expiring": {
  "title": "Document {documentName} expiring soon",
  "body": "Document {categoryName} ({documentName}) expires in {daysUntilExpiry} days ({expiryDate}).",
  "driving_license_category": "driving license",
  "taxi_authorization_category": "taxi authorization",
  "identification_category": "identity document",
  "medical_category": "medical certificate"
}
```

**Not nested:**
```json
"categories": { "driving_license": "..." }  // ❌ avoid
```

### Why flat keys

1. **TypeScript compatibility** - `MessageStructure` index signature only allows `string` values: `[key: string]: string`
2. **Simple runtime lookup** - `m[\`${documentType}_category\`]` 
3. **Consistency** - Works identically across all 11 locales (en, pl, uk, be, hi, ne, uz, ka, tl, ro, sr)

### Document type mapping

| Notification | Code `documentType` | Message key suffix |
|-------------|---------------------|-------------------|
| Driver | `driving_license` | `driving_license_category` |
| Driver | `taxi_authorization` | `taxi_authorization_category` |
| Driver | `identification` | `identification_category` |
| Driver | `medical` | `medical_category` |
| Vehicle | `registration` | `registration_category` |
| Vehicle | `insurance` | `insurance_category` |
| Vehicle | `technical` | `technical_category` |
| Vehicle | `taxi_license` | `taxi_license_category` |
| Vehicle | `platform` | `platform_category` |
| Vehicle | `equipment` | `equipment_category` |
| Vehicle | `handover` | `handover_category` |

### Implementation

In `driverDocumentNotifications.ts` and `vehicleDocumentNotifications.ts`:

```typescript
function createDriverGetBaseMessage(notificationId: App.NotificationType) {
    return (m: { title: string; body: string; [key: string]: string }, data: DriverDocumentExpiredData | DriverDocumentExpiringData) => {
        const categoryKey = `${data.documentType}_category`;
        const categoryName = m[categoryKey] ?? data.documentType;
        // ... interpolate {categoryName} with categoryName
    };
}
```

The notification definition overrides `getBaseMessage`:
```typescript
driverDocumentExpiredNotification.getBaseMessage = createDriverGetBaseMessage('driver_document_expired');
```

Callers pass raw document types (e.g., `driving_license_front`), which are auto-mapped to categories via `getDocumentCategory()` helper.

## 9. Observability & Logging

**Separate plan:** [`docs/NOTIFICATION_LOGGING_PLAN.md`](NOTIFICATION_LOGGING_PLAN.md)

Covers:
- Structured dispatch logs (`notificationDispatchLogs` collection)
- Provider message ID capture (SMTP `messageId`, FCM `messageId`, Firestore `docId`)
- Delivery webhook endpoints (email bounces/opens, FCM delivery receipts)
- Admin query UI (`/admin/notifications/logs`)
- Retention & GDPR considerations