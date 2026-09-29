import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { PUBLIC_URL } from '$env/static/public';
import { getBaseMessage } from '../localized/localizedMailerMessages';
import { prepareNotificationChannels } from '../general/prepareNotificationChannels';

export interface EarlySettlementRequestedData {
    driverName: string;
    requestedAmount: number;
}

const channels = prepareNotificationChannels({
    action: PUBLIC_URL + '/earlysettlements',
    incidentCategory: 'financial'
});

export const earlySettlementRequestedNotification: NotificationDefinition<EarlySettlementRequestedData> = {
    id: 'early_settlement_requested',
    priority: 'medium',
    getBaseMessage,
    email: (data, ctx) => {
        return {
            subject: ctx.title,
            htmlBody: `
                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                    ${ctx.body}
                </p>
                <p style="color: #1976d2; font-weight: 500; font-size: 15px; margin-bottom: 16px;">
                    ${ctx.m.action_required}
                </p>
            `
        };
    },
    ...channels
};

export async function sendEarlySettlementRequestedNotification(
    user: App.BaseContact, 
    data: EarlySettlementRequestedData,
    incidentSource: App.Incident.Source = 'system'
): Promise<void> {
    return sendNotification(user, earlySettlementRequestedNotification, data, incidentSource);
}
