import type { NotificationDefinition } from '../types';
import { sendNotification } from '../service';
import { PUBLIC_URL } from '$env/static/public';
import { prepareNotificationChannels } from '../general/prepareNotificationChannels';
import { getVehicleStatusBaseMessage, interpolate } from '../localized/localizedMailerMessages';

export interface VehicleStatusChangedData {
    registrationNumber: string;
    previousStatus: Vehicle.Status;
    newStatus: Vehicle.Status;
    reason: string;
    userId: string;
    userName: string;
}

const channels = prepareNotificationChannels({
    action: PUBLIC_URL + '/admin/vehicles',
    incidentCategory: 'vehicle_issue'
});

export const vehicleStatusChangedNotification: NotificationDefinition<VehicleStatusChangedData> = {
    id: 'vehicle_status_changed',
    priority: 'high',
    client: true,
    admin: true,
    getBaseMessage: getVehicleStatusBaseMessage,
    email: (data, ctx) => {
        const localizedData = { 
            ...data, 
            previousStatus: ctx.m[`${data.previousStatus}_status`] ?? data.previousStatus,
            newStatus: ctx.m[`${data.newStatus}_status`] ?? data.newStatus 
        };
        
        return {
            subject: ctx.title,
            htmlBody: `
                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                    ${ctx.body}
                </p>
                <p style="font-size: 13px; color: #666; margin-top: 24px;">
                    ${interpolate(ctx.m.footer, localizedData)}
                </p>
            `
        };
    },
    ...channels,
};

export async function sendVehicleStatusChangedNotification(
    user: App.BaseContact | null,
    data: VehicleStatusChangedData,
    isCritical: boolean,
    incidentSource: App.Incident.Source = 'system'
): Promise<void> {
    const notification: NotificationDefinition<VehicleStatusChangedData> = {
        ...vehicleStatusChangedNotification,
        priority: isCritical ? 'high' : 'low',
        client: isCritical,
        admin: isCritical
    };
    return sendNotification(user, notification, data, incidentSource);
}
