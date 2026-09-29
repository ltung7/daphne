import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { PUBLIC_URL } from '$env/static/public';
import { getBaseMessage, interpolate } from '../localized/localizedMailerMessages';
import { prepareNotificationChannels } from '../general/prepareNotificationChannels';

export interface EarlySettlementInfoData {
    driverName: string;
    requestedAmount: number;
    status: 'approved' | 'rejected';
}

const channels = prepareNotificationChannels({
    action: PUBLIC_URL + '/driver/balance',
    incidentCategory: false // Just an info to driver, no incident needed
});

export const earlySettlementInfoNotification: NotificationDefinition<EarlySettlementInfoData> = {
    id: 'early_settlement_info',
    priority: 'low',
    getBaseMessage,
    email: (data, ctx) => {
        return {
            subject: ctx.title,
            htmlBody: `
                <p style="font-size: 16px; margin-bottom: 16px;">
                    ${interpolate(ctx.m.greeting, { driverName: ctx.user.name })}
                </p>
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

export async function sendEarlySettlementInfoNotification(
    user: App.BaseContact, 
    data: EarlySettlementInfoData,
    incidentSource: App.Incident.Source = 'system'
): Promise<void> {
    return sendNotification(user, earlySettlementInfoNotification, data, incidentSource);
}
