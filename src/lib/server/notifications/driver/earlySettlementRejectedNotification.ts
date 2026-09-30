import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { PUBLIC_URL } from '$env/static/public';
import { prepareNotificationChannels } from '../general/prepareNotificationChannels';

export interface EarlySettlementRejectedData {
    driverName: string;
    requestedAmount: number;
}

const channels = prepareNotificationChannels({
    action: PUBLIC_URL + '/driver/balance',
    incidentCategory: false // Just an info to driver, no incident needed
});

export const earlySettlementRejectedNotification: NotificationDefinition<EarlySettlementRejectedData> = {
    id: 'early_settlement_rejected',
    priority: 'high',
    client: true,
    admin: false,
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

export async function sendEarlySettlementRejectedNotification(
    user: App.BaseContact, 
    data: EarlySettlementRejectedData,
    incidentSource: App.Incident.Source = 'system'
): Promise<void> {
    return sendNotification(user, earlySettlementRejectedNotification, data, incidentSource);
}