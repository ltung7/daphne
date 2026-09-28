import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { NOTIFICATION_ICON } from '$lib/assets/constants';
import { PUBLIC_URL } from '$env/static/public';

export interface AdminNotificationData {
    subject?: string;
    message: string;
    channels?: ('email' | 'sms' | 'push')[];
}

export const adminNotification: NotificationDefinition<AdminNotificationData> = {
    id: 'admin_notification',
    priority: 'medium',

    getBaseMessage: (m, data) => ({ title: data.subject || m.title, body: data.message }),

    email: (data, { m }) => {
        return {
            subject: data.subject || m.email_subject,
            htmlBody: data.message.replace(/\n/g, '<br>'),
        };
    },

    sms: (data) => {
        return data.message.substring(0, 160);
    },

    push: (data, { m }) => {
        return {
            title: data.subject || m.push_title,
            body: data.message.substring(0, 100),
            icon: NOTIFICATION_ICON,
            click_action: PUBLIC_URL
        };
    },
};

export async function sendAdminNotification(
    user: App.BaseContact,
    data: AdminNotificationData
): Promise<void> {
    const channels = data.channels || [ 'email', 'sms', 'push' ];
    const notification = {
        ...adminNotification,
        email: channels.includes('email') ? adminNotification.email : undefined,
        sms: channels.includes('sms') ? adminNotification.sms : undefined,
        push: channels.includes('push') ? adminNotification.push : undefined,
    };
    return sendNotification(user, notification, data);
}