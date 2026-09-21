import type { NotificationDefinition } from '../types';
import { interpolate } from '$lib/server/notifications/localized/localizedMailerMessages';
import { sendNotification } from '../service';

export interface DocumentExpiredData {
    documentName: string;
    expiryDate: string;
}

export const documentExpiredNotification: NotificationDefinition<DocumentExpiredData> = {
    id: 'driver.document_expired',
    priority: 'critical',

    email: (data, { m, user }) => {
        const t = m.document_expired;
        
        return {
            subject: t.title,
            htmlBody: `
                <p style="font-size: 16px; margin-bottom: 16px;">
                    ${interpolate(t.greeting, { driverName: user.name })}
                </p>
                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                    ${interpolate(t.body, { 
                        documentName: data.documentName, 
                        expiryDate: data.expiryDate 
                    })}
                </p>
                <p style="color: #d32f2f; font-weight: 500; font-size: 15px; margin-bottom: 16px;">
                    ${t.consequence}
                </p>
                <p style="font-size: 14px; color: #666;">
                    ${t.footer}
                </p>
            `
        };
    },

    sms: (data, { m }) => {
        const bodyText = interpolate(m.document_expired.body, { 
            documentName: data.documentName, 
            expiryDate: data.expiryDate 
        });
        
        return `EISG: ${bodyText} ${m.document_expired.consequence}`;
    },

    push: (data, { m }) => {
        return {
            title: m.document_expired.title,
            body: interpolate(m.document_expired.body, { 
                documentName: data.documentName, 
                expiryDate: data.expiryDate 
            }),
            icon: '/icons/alert-critical.png',
            click_action: '/driver/documents'
        };
    },
    
    inapp: (data, { m }) => {
        return `
            <strong>${m.document_expired.title}</strong><br/>
            ${interpolate(m.document_expired.body, { 
                documentName: `<b>${data.documentName}</b>`, 
                expiryDate: data.expiryDate 
            })}
        `;
    }
};

/**
 * Dispatch the Document Expired notification through all preferred channels.
 */
export async function sendDocumentExpiredNotification(user: App.BaseContact, data: DocumentExpiredData): Promise<void> {
    return sendNotification(user, documentExpiredNotification, data);
}