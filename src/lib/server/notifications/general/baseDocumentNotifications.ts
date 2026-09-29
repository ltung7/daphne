import type { NotificationDefinition, NotificationPriority } from '../types';
import { interpolate, getBaseMessage } from '../localized/localizedMailerMessages';
import { prepareNotificationChannels } from './prepareNotificationChannels';
import { PUBLIC_URL } from '$env/static/public';

export interface BaseDocumentExpiredData {
    documentName: string;
    expiryDate: string;
}

export interface BaseDocumentExpiringData extends BaseDocumentExpiredData {
    daysUntilExpiry: number;
}

function createBaseDocumentNotificationDefinition<TData extends BaseDocumentExpiredData>(
    id: App.NotificationType,
    priority: NotificationPriority,
    action: string = PUBLIC_URL
): NotificationDefinition<TData> {
    const channels = prepareNotificationChannels({
        incidentCategory: 'compliance',
        action,
    });

    return {
        id,
        priority,
        getBaseMessage,
        email: (data, ctx) => {
            return {
                subject: ctx.title,
                htmlBody: `
                    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                        ${ctx.body}
                    </p>
                    <p style="color: #d32f2f; font-weight: 500; font-size: 15px; margin-bottom: 16px;">
                        ${ctx.m.consequence}
                    </p>
                    <p style="font-size: 14px; color: #666;">
                        ${ctx.m.footer}
                    </p>
                `
            };
        },
        ...channels
    };
}

export function createDocumentExpiredDefinition<TData extends BaseDocumentExpiredData>(
    messageKey: Extract<App.NotificationType, 'driver_document_expired' | 'vehicle_document_expired'>,
    action: string = PUBLIC_URL
): NotificationDefinition<TData> {
    return createBaseDocumentNotificationDefinition(messageKey, 'critical', action);
}

export function createDocumentExpiringDefinition<TData extends BaseDocumentExpiringData>(
    messageKey: Extract<App.NotificationType, 'driver_document_expiring' | 'vehicle_document_expiring'>,
    action: string = PUBLIC_URL
): NotificationDefinition<TData> {
    return createBaseDocumentNotificationDefinition(messageKey, 'high', action);
}
