import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { PUBLIC_URL } from '$env/static/public';
import { prepareNotificationChannels } from '../general/prepareNotificationChannels';
import { getCategorizedBaseMessage } from '../localized/localizedMailerMessages';

export interface HandoverDocumentCreatedData {
    registrationNumber: string;
    documentType: Vehicle.HandoverDocumentType;
    userId: string;
    userName: string;
    handoverId: string;
}

export interface HandoverDocumentClosedData extends HandoverDocumentCreatedData {
    newStatus: Vehicle.Status;
}

const handoverChannels = prepareNotificationChannels({
    action: PUBLIC_URL + '/admin/handovers',
    incidentCategory: 'vehicle_issue',
    channels: [ 'sms', 'push', 'inapp', 'incident' ]
});

export const handoverDocumentCreatedNotification: NotificationDefinition<HandoverDocumentCreatedData> = {
    id: 'handover_document_created',
    priority: 'medium',
    client: true,
    admin: true,
    getBaseMessage: (m, data) => {
        const base = getCategorizedBaseMessage(m, { ...data });
        return {
            ...base,
            title: data.registrationNumber && !base.title.includes(data.registrationNumber)
                ? `${base.title} (${data.registrationNumber})`
                : base.title
        };
    },
    email: (data, ctx) => ({
        subject: ctx.title,
        htmlBody: `
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                ${ctx.body}
            </p>
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                <strong><a href="${PUBLIC_URL}/handovers/${data.handoverId}">${ctx.m.consequence}</a></strong>
            </p>
            <p style="font-size: 13px; color: #666; margin-top: 24px;">
                ${ctx.m.footer.replace('{userName}', data.userName).replace('{userId}', data.userId)}
            </p>
        `
    }),
    ...handoverChannels,
};

export const handoverDocumentClosedNotification: NotificationDefinition<HandoverDocumentClosedData> = {
    id: 'handover_document_closed',
    priority: 'low',
    client: false,
    admin: true,
    getBaseMessage: (m, data) => {
        const base = getCategorizedBaseMessage(m, { ...data });
        return {
            ...base,
            title: data.registrationNumber && !base.title.includes(data.registrationNumber)
                ? `${base.title} (${data.registrationNumber})`
                : base.title
        };
    },
    email: (data, ctx) => ({
        subject: ctx.title,
        htmlBody: `
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                ${ctx.body}
            </p>
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                <strong><a href="${PUBLIC_URL}/handovers/${data.handoverId}">${ctx.m.consequence.replace('{vehicleStatus}', data.newStatus)}</a></strong>
            </p>
            <p style="font-size: 13px; color: #666; margin-top: 24px;">
                ${ctx.m.footer.replace('{userName}', data.userName).replace('{userId}', data.userId)}
            </p>
        `
    }),
    ...handoverChannels,
};

export async function sendHandoverDocumentCreatedNotification(
    user: App.BaseContact,
    data: HandoverDocumentCreatedData,
    incidentSource: App.Incident.Source = 'system'
): Promise<void> {
    return sendNotification(user, handoverDocumentCreatedNotification, data, incidentSource);
}

export async function sendHandoverDocumentClosedNotification(
    user: App.BaseContact,
    data: HandoverDocumentClosedData,
    incidentSource: App.Incident.Source = 'system'
): Promise<void> {
    return sendNotification(user, handoverDocumentClosedNotification, data, incidentSource);
}