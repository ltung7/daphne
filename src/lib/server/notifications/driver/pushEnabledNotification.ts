import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { PUBLIC_URL } from '$env/static/public';
import { prepareNotificationChannels } from '../general/prepareNotificationChannels';

export interface PushEnabledData {
    deviceDetails?: string;
}

const channels = prepareNotificationChannels({
    action: PUBLIC_URL + '/driver',
    channels: [ 'push' ]
});

export const pushEnabledNotification: NotificationDefinition<PushEnabledData> = {
    id: 'push_enabled',
    priority: 'low',
    client: true,
    admin: false,
    ...channels
};

/**
 * Dispatch the Push Enabled notification through all preferred channels.
 */
export async function sendPushEnabledNotification(user: App.BaseContact, data: PushEnabledData = {}, incidentSource: App.Incident.Source = 'system'): Promise<void> {
    return sendNotification(user, pushEnabledNotification, data, incidentSource);
}
