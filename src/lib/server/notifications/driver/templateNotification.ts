import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { PUBLIC_URL } from '$env/static/public';
import { getBaseMessage } from '../localized/localizedMailerMessages';
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
    getBaseMessage,
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

export const sendTestTemplateNotification = async (customField: string) => {
    const user: App.BaseContact = {
        email: 'tomasz.le@finnergroup.com',
        id: '',
        name: 'Tomasz',
        preferredLanguage: 'en',
        fcmToken: 'eNdK0UbOtIoDf8CGrgKLXX:APA91bEQymLhGKpGRbvtp1vcncOdBNvro4bH6m6ajQu8o7TGrDNbBoPgvrzm9ZekxCFAi1T90h3l64_q2TckoAagbZ143uD1lQQoyNDAEQ7iU38csNwr_Dc',
        phone: '+48506349870'
    }
    return sendTemplateNotification(user, { customField })
}