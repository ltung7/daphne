import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { PUBLIC_URL } from '$env/static/public';
import { NOTIFICATION_ICON } from '$lib/assets/constants';

export interface PushEnabledData {
    deviceDetails?: string;
}

export const pushEnabledNotification: NotificationDefinition<PushEnabledData> = {
    id: 'driver.push_enabled',
    priority: 'low',

    push: (_data, { m }) => {
        return {
            title: m.push_enabled.title,
            body: m.push_enabled.body,
            icon: NOTIFICATION_ICON,
            click_action: PUBLIC_URL + '/driver'
        };
    },
};

/**
 * Dispatch the Push Enabled notification through all preferred channels.
 */
export async function sendPushEnabledNotification(user: App.BaseContact, data: PushEnabledData = {}): Promise<void> {
    return sendNotification(user, pushEnabledNotification, data);
}
