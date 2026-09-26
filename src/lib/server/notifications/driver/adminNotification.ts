import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';

export interface AdminNotificationData {
    subject?: string;
    message: string;
    channels?: ('email' | 'sms' | 'push')[];
}

export const adminNotification: NotificationDefinition<AdminNotificationData> = {
    id: 'driver.admin_notification',
    priority: 'medium',

    email: (data, { m }) => {
        return {
            subject: data.subject || m.admin_notification.email_subject,
            htmlBody: data.message.replace(/\n/g, '<br>'),
        };
    },

    sms: (data) => {
        return data.message.substring(0, 160);
    },

    push: (data, { m }) => {
        return {
            title: data.subject || m.admin_notification.push_title,
            body: data.message.substring(0, 100),
            icon: '/icon.png',
            click_action: '/'
        };
    },
};

export async function sendAdminNotification(
    user: App.BaseContact,
    data: AdminNotificationData
): Promise<void> {
    const channels = data.channels || ['email', 'sms', 'push'];
    const notification = {
        ...adminNotification,
        email: channels.includes('email') ? adminNotification.email : undefined,
        sms: channels.includes('sms') ? adminNotification.sms : undefined,
        push: channels.includes('push') ? adminNotification.push : undefined,
    };
    return sendNotification(user, notification, data);
}