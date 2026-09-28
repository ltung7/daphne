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
    user: App.BaseContact; // Recipient data
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
    
    // Generates the base title/body upfront to inject into context
    getBaseMessage: (m: MessageStructure, data: TData) => BaseMessage;
    
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

```typescript
// src/lib/server/notifications/driver/pushEnabledNotification.ts
import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { PUBLIC_URL } from '$env/static/public';
import { getBaseMessage } from '../localized/localizedMailerMessages';
import { prepareNotificationChannels } from '../general/prepareNotificationChannels';

export interface PushEnabledData {
    deviceDetails?: string;
}

// Automatically generates sms, push, inapp, and incident using ctx.title and ctx.body
const channels = prepareNotificationChannels({
    action: PUBLIC_URL + '/driver',
    channels: ['push'] // optionally restrict which channels to generate
});

export const pushEnabledNotification: NotificationDefinition<PushEnabledData> = {
    id: 'push_enabled',
    priority: 'low',
    getBaseMessage,
    ...channels
};

/** Strictly typed export */
export async function sendPushEnabledNotification(
    user: App.BaseContact, 
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
    user: App.BaseContact, 
    notification: NotificationDefinition<TData>, 
    data: TData
): Promise<void> {
    // 1. Resolve Preferences & filter out based on minPriority
    const prefs = await getUserPreferences(user.id);
    if (!shouldSend(notification.priority, prefs)) return;

    // 2. Setup Context
    const locale = user.preferredLanguage || 'pl';
    const ctx: NotificationContext = { locale, m: getEmailMessages(locale), user };

    const promises: Promise<void>[] = [];

    // 3. Dispatch to specific channels (parallelized)
    if (user.email && prefs.channels.email !== false) {
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

```typescript
// src/lib/server/notifications/service.ts
export async function sendNotification<TData>(
    // ...
    incidentSource: App.Incident.Source = 'system'
) {
    // ... setup context ...

    // ALWAYS log incident if defined and doesn't return false
    if (notification.incident) {
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
}
```