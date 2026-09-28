import type { NotificationContext } from '../types';
import { PUBLIC_URL } from '$env/static/public';
import { NOTIFICATION_ICON } from '$lib/assets/constants';

export interface ChannelConfig {
    pushIcon?: string;
    incidentCategory?: App.Incident.Category;
    action?: string;
}

export function prepareNotificationChannels(
    config: ChannelConfig
) {
    return {
        sms: (_: unknown, ctx: NotificationContext) => {
            return `EISG: ${ctx.body}`;
        },
        push: (_: unknown, ctx: NotificationContext) => {
            return {
                title: ctx.title,
                body: ctx.body,
                icon: config.pushIcon ?? NOTIFICATION_ICON,
                click_action: config.action ?? PUBLIC_URL
            };
        },
        inapp: (_: unknown, ctx: NotificationContext) => {
            return `<strong>${ctx.title}</strong><br/>${ctx.body}`;
        },
        incident: (_: unknown, ctx: NotificationContext) => {
            return {
                title: ctx.title,
                description: ctx.body,
                category: config.incidentCategory || 'compliance',
                source: ctx.incidentSource,
                metadata: new Error("EVIL")
            };
        }
    };
}