# CREATE_NOTIFICATION Skill

This skill provides instructions for creating new multi-channel notifications in the application's backend.

## Context
The application uses a centralized, data-driven notification architecture. Instead of separate Svelte components per email, a single notification definition handles formatting for Email, SMS, WebPush, and In-App channels simultaneously.

## Instructions for Creating a New Notification

When asked to "create a notification", "add the [X] notification", or "implement [X] event":

### 1. Define the Types
- Determine the required data payload for the notification.
- Create an interface `[Name]Data` (e.g., `SettlementData`).

### 2. Update Translations First
- Add the necessary translation keys to the English base file first (`src/lib/server/notifications/localized/messages/notifications_en.json`).
- Provide translations for all other supported locales using the [TRANSLATE](./TRANSLATE.md) skill.
- Update the `NotificationType` and `NotificationMessages` interfaces in `src/lib/server/notifications/localized/localizedMailerMessages.ts` to include the new keys.

### 3. Create the Notification Definition
- Create a new file in `src/lib/server/notifications/driver/` or `src/lib/server/notifications/admin/`.
- Export a constant of type `NotificationDefinition<[Name]Data>`.
- Define the `id` (e.g., `driver.settlement_calculated`) and `priority` (`low`, `medium`, `high`, `critical`).
- Implement the channel generators:
  - `email`: Return `{ subject, htmlBody }`. Use `interpolate(t.key, vars)` and standard inline HTML styling.
  - `push`: Return `{ title, body, icon, click_action }`.
  - `sms` (optional): Return a plain text string.
  - `inapp` (optional): Return an HTML string for the in-app feed.

### 4. Create the Dispatcher Function
- Export a strictly typed function:
  ```typescript
  export async function send[Name]Notification(user: App.BaseContact, data: [Name]Data): Promise<void> {
      return sendNotification(user, [name]Notification, data);
  }
  ```

### 5. Export from Index
- Export the notification definition, the dispatcher function, and the data interface from `src/lib/server/notifications/index.ts`.

## Reference Materials
- [Notification Types](../../src/lib/server/notifications/types.ts)
- [Dispatcher Service](../../src/lib/server/notifications/service.ts)
- Example implementation: [documentExpiredNotification.ts](../../src/lib/server/notifications/driver/documentExpiredNotification.ts)
