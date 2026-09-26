import type { NotificationDefinition } from '../types';
import { interpolate } from '$lib/server/notifications/localized/localizedMailerMessages';
import { sendNotification } from '../service';

export interface DocumentExpiringData {
    documentName: string;
    expiryDate: string;
    daysUntilExpiry: number;
}

export const documentExpiringNotification: NotificationDefinition<DocumentExpiringData> = {
    id: 'driver.document_expiring',
    priority: 'high',

    email: (data, { m, user }) => {
        const t = m.document_expiring;

        return {
            subject: t.title,
            htmlBody: `
                <p style="font-size: 16px; margin-bottom: 16px;">
                    ${interpolate(t.greeting, { driverName: user.name })}
                </p>
                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                    ${interpolate(t.body, {
                        documentName: data.documentName,
                        expiryDate: data.expiryDate,
                        days: data.daysUntilExpiry
                    })}
                </p>
                <p style="color: #ed6c02; font-weight: 500; font-size: 15px; margin-bottom: 16px;">
                    ${t.action_required}
                </p>
                <p style="font-size: 14px; color: #666;">
                    ${t.footer}
                </p>
            `
        };
    },

    sms: (data, { m }) => {
        const bodyText = interpolate(m.document_expiring.body, {
            documentName: data.documentName,
            expiryDate: data.expiryDate,
            days: data.daysUntilExpiry
        });

        return `EISG: ${bodyText} ${m.document_expiring.action_required}`;
    },

    push: (data, { m }) => {
        return {
            title: m.document_expiring.title,
            body: interpolate(m.document_expiring.body, {
                documentName: data.documentName,
                expiryDate: data.expiryDate,
                days: data.daysUntilExpiry
            }),
            icon: '/icons/alert-warning.png',
            click_action: '/driver/documents'
        };
    },

    inapp: (data, { m }) => {
        return `
            <strong>${m.document_expiring.title}</strong><br/>
            ${interpolate(m.document_expiring.body, {
                documentName: `<b>${data.documentName}</b>`,
                expiryDate: data.expiryDate,
                days: data.daysUntilExpiry
            })}
        `;
    }
};

/**
 * Dispatch the Document Expiring notification through all preferred channels.
 */
export async function sendDocumentExpiringNotification(user: App.BaseContact, data: DocumentExpiringData): Promise<void> {
    return sendNotification(user, documentExpiringNotification, data);
}