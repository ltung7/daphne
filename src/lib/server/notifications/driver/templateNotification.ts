import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { PUBLIC_URL } from '$env/static/public';
import { prepareNotificationChannels } from '../general/prepareNotificationChannels';

export interface TemplateNotificationData {
    customField: string;
}

const channels = prepareNotificationChannels({
    action: PUBLIC_URL + '/driver',
    incidentCategory: false
});

export const templateNotification: NotificationDefinition<TemplateNotificationData> = {
    id: 'template_notification',
    priority: 'low',
    client: true,
    admin: false,
    email(data, ctx) {
        return {
            subject: ctx.title,
            htmlBody: `<h1>${data.customField}</h1>`
        }
    },
    ...channels
};

/**
 * Dispatch the Template notification through all preferred channels.
 */
export async function sendTemplateNotification(
    user: App.BaseContact, 
    data: TemplateNotificationData,
    incidentSource: App.Incident.Source = 'system'
): Promise<void> {
    return sendNotification(user, templateNotification, data, incidentSource);
}