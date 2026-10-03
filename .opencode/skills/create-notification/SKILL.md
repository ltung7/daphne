---
name: create-notification
description: Provides instructions for creating and implementing new multi-channel notifications in the application's backend. Use this skill when asked to create a notification, add a new notification, or implement a notification event.
---

# Create Notification

This skill provides instructions for creating new multi-channel notifications in the application's backend.

## Context
The application uses a centralized, data-driven notification architecture. Instead of separate Svelte components per email, a single notification definition handles formatting for Email, SMS, WebPush, and In-App channels simultaneously.

## Instructions for Creating a New Notification

When asked to "create a notification", "add the [X] notification", or "implement [X] event":

### 1. Define the Types
- Determine the required data payload for the notification.
- Create an interface `[Name]Data` (e.g., `SettlementData`).
- **Note:** Use `userName` and `userId` to denote the requester or person responsible, but NOT the driver.

### 2. Update Translations First
- Add the necessary translation keys to the English base file first (`src/lib/server/notifications/localized/messages/notifications_en.json`).
- Provide translations for all other supported locales (use the `translate-paraglide` skill).
- Update the `NotificationType` and `NotificationMessages` interfaces in `src/lib/server/notifications/localized/localizedMailerMessages.ts` to include the new keys.

### 3. Create the Notification Definition
- Create a new file in `src/lib/server/notifications/driver/` or `src/lib/server/notifications/admin/`.
- Export a constant of type `NotificationDefinition<[Name]Data>`.
- Determine the `id` (e.g., `driver_settlement_calculated`) and `priority` (`low`, `medium`, `high`, `critical`).
- Use the `prepareNotificationChannels` factory (`src/lib/server/notifications/general/prepareNotificationChannels.ts`) to easily auto-generate the `sms`, `push`, `inapp`, and `incident` channels based on the localized title and body.
- Implement the `email` channel manually (if needed) to handle complex HTML layouts.

Example:
```typescript
import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { PUBLIC_URL } from '$env/static/public';
import { prepareNotificationChannels } from '../general/prepareNotificationChannels';

export interface SomeData {
    value: string;
}

const channels = prepareNotificationChannels({
    action: PUBLIC_URL + '/some-path',
    incidentCategory: 'compliance' // false to disable incident logging
});

export const someNotification: NotificationDefinition<SomeData> = {
    id: 'some_notification_id', // Must exist in App.NotificationType
    priority: 'medium',
    client: true,
    admin: false,
    email: (data, ctx) => ({
        subject: ctx.title,
        htmlBody: `
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                ${ctx.body}
            </p>
        `
    }),
    ...channels,
};
```

### 4. Create the Dispatcher Function
- Export a strictly typed function that passes through `incidentSource`.
  ```typescript
  export async function send[Name]Notification(
      user: App.BaseContact, 
      data: [Name]Data,
      incidentSource: App.Incident.Source = 'system'
  ): Promise<void> {
      return sendNotification(user, someNotification, data, incidentSource);
  }
  ```

### 5. Add Testing Data
- In `src/lib/server/notifications/testNotification.ts`, add a default payload for your new notification under `defaultTestData`.
- Precede the key with the comment `/** TODO: Test notification */`. This serves as a reminder that the notification still requires manual verification via the test endpoint before it can be considered production-ready. Once manually tested and verified, the `/** TODO: Test notification */` comment will be removed.

### 6. Export from Index
- Export the notification definition, the dispatcher function, and the data interface from `src/lib/server/notifications/index.ts`.

## Reference Materials
- [Notification Types](../../src/lib/server/notifications/types.ts)
- [Dispatcher Service](../../src/lib/server/notifications/service.ts)
- [Channel Factory](../../src/lib/server/notifications/general/prepareNotificationChannels.ts)
- Example implementation: [pushEnabledNotification.ts](../../src/lib/server/notifications/driver/pushEnabledNotification.ts)