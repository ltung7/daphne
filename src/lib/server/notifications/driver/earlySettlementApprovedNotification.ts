import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { PUBLIC_URL } from '$env/static/public';
import { getBaseMessageAndTitle } from '../localized/localizedMailerMessages';
import { prepareNotificationChannels } from '../general/prepareNotificationChannels';

export interface EarlySettlementApprovedData {
    driverName: string;
    requestedAmount: number;
}

const channels = prepareNotificationChannels({
    action: PUBLIC_URL + '/driver/balance',
    incidentCategory: false // Just an info to driver, no incident needed
});

export const earlySettlementApprovedNotification: NotificationDefinition<EarlySettlementApprovedData> = {
    id: 'early_settlement_approved',
    priority: 'low',
    client: true,
    admin: false,
    getBaseMessage: getBaseMessageAndTitle,
    email: (data, ctx) => {
        return {
            subject: ctx.title,
            htmlBody: `
                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                    ${ctx.body}
                </p>
                <p style="font-size: 14px; color: #666;">
                    ${ctx.m.footer}
                </p>
            `
        };
    },
    ...channels
};

export async function sendEarlySettlementApprovedNotification(
    user: App.BaseContact, 
    data: EarlySettlementApprovedData,
    incidentSource: App.Incident.Source = 'system'
): Promise<void> {
    return sendNotification(user, earlySettlementApprovedNotification, data, incidentSource);
}