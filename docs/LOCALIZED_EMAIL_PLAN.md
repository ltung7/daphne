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
│   ├── vehicleAlertNotification.ts
│   └── ...
├── health/
│   ├── healthCheckRegistry.ts   # Registry of health problem -> recipients
│   └── healthCheckNotifications.ts # Notification definitions for health issues
└── localized/                     
    ├── localizedMailerMessages.ts # Localized message index & interface (no Paraglide)
    ├── localizedMailer.ts         # render & inject _messages
    ├── LocalizedMailWrapper.svelte
    └── messages/                  # Raw localized strings (pl, en, uk, etc.)
```

## 2. Core Interfaces (`types.ts`)

```typescript
import type { EmailMessages } from './localized/localizedMailerMessages';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

// Context provided by the service to the generators
export interface NotificationContext {
    locale: App.Locale;
    m: EmailMessages; // Localized dictionary
    user: App.BaseContact; // Recipient data
}

export interface EmailPayload {
    subject: string;
    htmlBody: string; // Rendered into GenericNotificationMail.svelte
    component?: any;  // Optional custom component
    props?: any;      # Optional custom props
}

export interface WebPushPayload {
    title: string;
    body: string;
    icon?: string;
    click_action?: string;
}

export interface NotificationDefinition<TData> {
    id: string; // e.g., 'driver.document_expiring'
    priority: NotificationPriority;
    
    // Required channel
    email: (data: TData, ctx: NotificationContext) => EmailPayload | Promise<EmailPayload>;
    
    // Optional channels
    push?: (data: TData, ctx: NotificationContext) => WebPushPayload | Promise<WebPushPayload>;
    sms?: (data: TData, ctx: NotificationContext) => string | Promise<string>;
    inapp?: (data: TData, ctx: NotificationContext) => string | Promise<string>;
    webhook?: (data: TData, ctx: NotificationContext) => any;
}
```

## 3. Example Notification Definition

This is how a notification is defined. It handles all channels in one place, relies on `App.BaseContact` (so it can send to drivers, admins, or external contacts), and provides a strictly-typed dispatcher.

```typescript
// src/lib/server/notifications/driver/documentExpiredNotification.ts
import type { NotificationDefinition } from '../types';
import { interpolate } from '../localized/localizedMailerMessages';
import { sendNotification } from '../service';

export interface DocumentExpiredData {
    documentName: string;
    expiryDate: string;
}

export const documentExpiredNotification: NotificationDefinition<DocumentExpiredData> = {
    id: 'driver.document_expired',
    priority: 'critical',

    email: (data, { m, user }) => {
        const t = m.document_expired;
        return {
            subject: t.title,
            htmlBody: `
                <p>${interpolate(t.greeting, { driverName: user.name })}</p>
                <p>${interpolate(t.body, { documentName: data.documentName, expiryDate: data.expiryDate })}</p>
                <p style="color: #d32f2f;">${t.consequence}</p>
                <p>${t.footer}</p>
            `
        };
    },

    sms: (data, { m }) => {
        const bodyText = interpolate(m.document_expired.body, { documentName: data.documentName, expiryDate: data.expiryDate });
        return `EISG: ${bodyText} ${m.document_expired.consequence}`;
    },

    push: (data, { m }) => ({
        title: m.document_expired.title,
        body: interpolate(m.document_expired.body, { documentName: data.documentName, expiryDate: data.expiryDate }),
        icon: '/icons/alert-critical.png',
        click_action: '/driver/documents'
    }),
    
    inapp: (data, { m }) => `
        <strong>${m.document_expired.title}</strong><br/>
        ${interpolate(m.document_expired.body, { documentName: `<b>${data.documentName}</b>`, expiryDate: data.expiryDate })}
    `
};

/** Strictly typed export */
export async function sendDocumentExpiredNotification(
    user: App.BaseContact, 
    data: DocumentExpiredData
): Promise<void> {
    return sendNotification(user, documentExpiredNotification, data);
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

## 6. Health Check Notification Registry

A registry mapping health check problem types to the users who should receive notifications about them. This registry is used by the health check notification service to determine recipients for each type of health issue.

### Registry Structure

```typescript
// src/lib/server/notifications/health/healthCheckRegistry.ts
import type { HealthCheckProblem } from '$lib/server/services/health/checkers/types';
import type { BaseContact } from '$app.d.ts';

export interface HealthCheckRecipientMap {
    [problem: HealthCheckProblem]: BaseContact[];
}

// Health check problem types (matching HealthCheck.HealthIssue.type)
export type HealthCheckProblem = 
    | 'insurance_expiring'
    | 'technical_expiring'
    | 'license_expiring'
    | 'taxi_authorization_expiring';

// Example registry - populated at runtime from admin configuration
export const healthCheckRecipientRegistry: HealthCheckRecipientMap = {
    insurance_expiring: [],
    technical_expiring: [],
    license_expiring: [],
    taxi_authorization_expiring: [],
};
```

### Usage
- Registry is populated from admin-configured notification preferences
- Each health check type can have multiple recipients (admins, managers, fleet operators)
- Recipients are `App.BaseContact` objects (id, email, name, preferredLanguage, phone, fcmToken)

## Advantages of this Architecture
1. **DRY (Don't Repeat Yourself)**: You don't need 50 Svelte components. You just need 1 generic component, and 50 plain-text generators.
2. **Channel Parity**: When defining a notification, you immediately see and define how it looks on Email, SMS, and Push. No hunting across different services.
3. **Strict Typings without Boilerplate**: `sendDocumentExpiredNotification(user, { documentName, expiryDate })` guarantees data shape for callers while the underlying service handles generic abstraction.
4. **Target agnostic**: Because generators consume `App.BaseContact`, notifications can trigger for drivers, admins, managers, or third-party contacts.
5. **Localization Integration**: Bypasses Paraglide entirely. It uses exact dictionary objects (`m`) based on the contact's `preferredLanguage`, ensuring safety outside request contexts.
6. **Health Check Registry**: Centralized mapping of health problems to notification recipients enables flexible routing without hardcoding recipients in checkers.