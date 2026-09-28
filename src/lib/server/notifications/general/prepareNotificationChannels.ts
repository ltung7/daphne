import type { NotificationContext, NotificationDefinition } from '../types';
import { PUBLIC_URL } from '$env/static/public';
import { NOTIFICATION_ICON } from '$lib/assets/constants';

type ChannelType = 'sms' | 'push' | 'inapp' | 'incident';

export interface ChannelConfig {
    pushIcon?: string;
    incidentCategory?: App.Incident.Category | false;
    action?: string;
    channels?: Array<ChannelType>;
}

export function prepareNotificationChannels(
    config: ChannelConfig = {}
): Partial<NotificationDefinition<any>> {
    const requestedChannels = config.channels || [ 'sms', 'push', 'inapp', 'incident' ];
    const result: Partial<NotificationDefinition<any>> = {};

    if (requestedChannels.includes('sms')) {
        result.sms = (_: unknown, ctx: NotificationContext) => {
            return `EISG: ${ctx.body}`;
        };
    }

    if (requestedChannels.includes('push')) {
        result.push = (_: unknown, ctx: NotificationContext) => {
            return {
                title: ctx.title,
                body: ctx.body,
                icon: config.pushIcon ?? NOTIFICATION_ICON,
                click_action: config.action ?? PUBLIC_URL
            };
        };
    }

    if (requestedChannels.includes('inapp')) {
        result.inapp = (_: unknown, ctx: NotificationContext) => {
            return `<strong>${ctx.title}</strong><br/>${ctx.body}`;
        };
    }

    if (requestedChannels.includes('incident') && config.incidentCategory !== false) {
        result.incident = (_: unknown, ctx: NotificationContext) => {
            return {
                title: ctx.title_pl,
                description: ctx.body_pl,
                category: config.incidentCategory || 'compliance'
            };
        };
    }

    return result;
}