import type { NotificationDefinition } from '../types';
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

export function createDocumentExpiredDefinition<TData extends BaseDocumentExpiredData>(
    messageKey: Extract<App.NotificationType, 'driver_document_expired' | 'vehicle_document_expired'>,
    action: string = PUBLIC_URL
): NotificationDefinition<TData> {
    const channels = prepareNotificationChannels({
        incidentCategory: 'compliance',
        action,
    });

    return {
        id: messageKey,
        priority: 'critical',
        getBaseMessage,
        email: (data, ctx) => {
            return {
                subject: ctx.title,
                htmlBody: `
                    <p style="font-size: 16px; margin-bottom: 16px;">
                        ${interpolate(ctx.m.greeting, { driverName: ctx.user.name, userName: ctx.user.name })}
                    </p>
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

export function createDocumentExpiringDefinition<TData extends BaseDocumentExpiringData>(
    messageKey: Extract<App.NotificationType, 'driver_document_expiring' | 'vehicle_document_expiring'>,
    action: string = PUBLIC_URL
): NotificationDefinition<TData> {
    const channels = prepareNotificationChannels({
        incidentCategory: 'compliance',
        action,
    });

    return {
        id: messageKey,
        priority: 'high',
        getBaseMessage,
        email: (data, ctx) => {
            return {
                subject: ctx.title,
                htmlBody: `
                    <p style="font-size: 16px; margin-bottom: 16px;">
                        ${interpolate(ctx.m.greeting, { driverName: ctx.user.name, userName: ctx.user.name })}
                    </p>
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
