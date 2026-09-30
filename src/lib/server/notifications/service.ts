import { getNotificationMessageNode, getBaseMessage as defaultGetBaseMessage } from './localized/localizedMailerMessages';
import type { NotificationDefinition, NotificationContext, NotificationPriority, IncidentPayload } from './types';
import { sendLocalizedRenderedEmail } from './localized/localizedMailer';
import GenericNotificationMail from './channels/GenericNotificationMail.svelte';
import { sendWebPush, type WebPushPayload } from '../services/webpush.service';
import { logger, LOGGER_COLORS } from '$lib/utils/logger';
import { isDev } from '$lib/utils/isDev';
import { getIncidentMatrixRecipients } from '../db/firebase/incidentMatrix.fdb';

// eslint-disable-next-line no-constant-binary-expression
const DUMP_MESSAGES = true && isDev;

type UserPreferences = {
    channels: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    minPriority: NotificationPriority;
};

const PRIORITY_ORDER: Record<NotificationPriority, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3
};

export async function sendNotification<TData>(
    user: App.BaseContact, 
    notification: NotificationDefinition<TData>, 
    data: TData,
    incidentSource: App.Incident.Source = 'system'
): Promise<void> {
    return _dispatchNotification(user, notification, data, incidentSource, false);
}

async function _dispatchNotification<TData>(
    user: App.BaseContact, 
    notification: NotificationDefinition<TData>, 
    data: TData,
    incidentSource: App.Incident.Source,
    isAdminCopy: boolean
): Promise<void> {
    // 1. Resolve Preferences
    const prefs = await getUserPreferences(user.id);
    if (!shouldSend(notification.priority, prefs)) {
        logger.log(`Notification ${notification.id} dropped for user ${user.id} due to preferences`);
        return;
    }

    // 2. Setup Context
    const locale = user.preferredLanguage || 'pl';
    const m = getNotificationMessageNode(locale, notification.id);
    const m_pl = getNotificationMessageNode('pl', notification.id);
    const getBaseMsg = notification.getBaseMessage ?? defaultGetBaseMessage;
    const baseMessage = getBaseMsg(m, data);
    const baseMessagePl = getBaseMsg(m_pl, data);
    const ctx: NotificationContext = {
        title: baseMessage.title,
        body: baseMessage.body,
        title_pl: baseMessagePl.title,
        body_pl: baseMessagePl.body,
        locale,
        m,
        m_pl,
        user,
        isAdminCopy
    };

    // 3. Dispatch to Channels in parallel
    const promises: Promise<void>[] = [];

    const shouldDispatchChannels = ctx.isAdminCopy || notification.client;

    if (shouldDispatchChannels) {
        // --- EMAIL ---
        if (user.email && notification.email && prefs.channels.email !== false) {
            promises.push(sendEmail(user.email, notification, data, ctx));
        }

        // --- SMS ---
        if (notification.sms && user.phone && prefs.channels.sms !== false) {
            promises.push(sendSms(user.phone, notification, data, ctx));
        }

        // --- PUSH ---
        if (notification.push && user.fcmToken && prefs.channels.push !== false) {
            promises.push(sendPush(user.fcmToken, notification, data, ctx));
        }

        // --- IN-APP ---
        if (notification.inapp) {
            promises.push(sendInApp(user.id, notification, data, ctx));
        }
    }

	// 4. Incident Logging (if defined)
	if (notification.incident && !ctx.isAdminCopy) {
		promises.push((async () => {
			try {
				const incident = await notification.incident!(data, ctx);
				if (incident) {
					await logIncident(notification.id, incident, notification.priority, user, data, incidentSource);
				}
			} catch (err) {
				logger.error(`Incident logging failed for ${notification.id}:`, err);
			}
		})());
	}

	// 5. Dispatch to registered matrix admins
	if (notification.admin && !ctx.isAdminCopy) {
		promises.push((async () => {
			try {
				const admins = await getIncidentMatrixRecipients(notification.id);
				if (admins && admins.length > 0) {
					const adminPromises = admins.map(admin => {
						return _dispatchNotification(admin, notification, data, incidentSource, true);
					});
					await Promise.allSettled(adminPromises);
				}
			} catch (err) {
				logger.error(`Failed to dispatch to matrix admins for ${notification.id}:`, err);
			}
		})());
	}

	if (promises.length) await Promise.allSettled(promises);
}

async function sendEmail<TData>(
    email: string,
    notification: NotificationDefinition<TData>,
    data: TData,
    ctx: NotificationContext
): Promise<void> {
    try {
        const emailData = await notification.email!(data, ctx);
        
        if (DUMP_MESSAGES) {
            logger.log(`[DUMP EMAIL] ${notification.id} -> ${email}`, LOGGER_COLORS.MAGENTA);
            logger.inspect({ subject: emailData.subject, htmlBody: emailData.htmlBody, component: emailData.component?.name, props: emailData.props });
            return;
        }

        // Use generic component for standard emails
        const component = emailData.component || GenericNotificationMail;
        const props = emailData.props || { 
            subject: emailData.subject, 
            htmlBody: emailData.htmlBody 
        };

        await sendLocalizedRenderedEmail(
            email,
            component,
            { ...props, locale: ctx.locale } as any
        );
    } catch (err) {
        console.error(`Email send failed for ${notification.id}:`, err);
    }
}

async function sendSms<TData>(
    phone: string,
    notification: NotificationDefinition<TData>,
    data: TData,
    ctx: NotificationContext
): Promise<void> {
    try {
        const smsText = await notification.sms!(data, ctx);
        
        if (DUMP_MESSAGES) {
            logger.log(`[DUMP SMS] ${notification.id} -> ${phone}`, LOGGER_COLORS.MAGENTA);
            logger.inspect(smsText);
            return;
        }

        // TODO: Implement SMS transport
        console.log(`[SMS to ${phone}] ${smsText}`);
    } catch (err) {
        console.error(`SMS send failed for ${notification.id}:`, err);
    }
}

async function sendPush<TData>(
    fcmToken: string,
    notification: NotificationDefinition<TData>,
    data: TData,
    ctx: NotificationContext
): Promise<void> {
    try {
        const pushData = await notification.push!(data, ctx);
        
        if (DUMP_MESSAGES) {
            logger.log(`[DUMP PUSH] ${notification.id} -> ${fcmToken.substring(0, 20)}...`, LOGGER_COLORS.MAGENTA);
            logger.inspect(pushData);
            // return; TODO: DELETE TEST
        }

        if (pushData) sendWebPush(fcmToken, pushData as WebPushPayload)
    } catch (err) {
        console.error(`Push send failed for ${notification.id}:`, err);
    }
}

import { addNotification } from '../db/firebase/userNotifications.fdb';

async function sendInApp<TData>(
    userId: string,
    notification: NotificationDefinition<TData>,
    data: TData,
    ctx: NotificationContext
): Promise<void> {
    try {
        const body = await notification.inapp!(data, ctx);
        
        if (DUMP_MESSAGES) {
            logger.log(`[DUMP IN-APP] ${notification.id} -> ${userId}`, LOGGER_COLORS.MAGENTA);
            logger.inspect(body);
            return;
        }

        const newNotification: Omit<App.InAppNotification, 'id'> = {
            userId,
            type: notification.id,
            title: ctx.title,
            body,
            metadata: data as any,
            read: false,
            timestamp: Date.now()
        };

        await addNotification(newNotification);
    } catch (err) {
        console.error(`In-app save failed for ${notification.id}:`, err);
    }
}

async function getUserPreferences(_userId: string): Promise<UserPreferences> {
    // TODO: Fetch from Firestore
    return { 
        channels: { email: true, sms: true, push: true }, 
        minPriority: 'low' 
    };
}

function shouldSend(priority: NotificationPriority, prefs: UserPreferences): boolean {
    return PRIORITY_ORDER[priority] >= PRIORITY_ORDER[prefs.minPriority];
}

import { addIncident } from '../db/firebase/incidents.fdb';

async function logIncident<TData>(
    notificationId: App.NotificationType,
    incident: IncidentPayload,
    severity: NotificationPriority,
    user: App.BaseContact,
    data: TData,
    incidentSource: App.Incident.Source
): Promise<void> {
    const newIncident: Omit<App.Incident.IncidentLog, 'id'> = {
        title: incident.title,
        type: incident.type || notificationId,
        description: incident.description,
        category: incident.category,
        severity: severity,
        status: 'open',
        source: incident.source || incidentSource,
        metadata: {
            userId: user.id,
            userName: user.name,
            ...data
        },
        notes: '',
        timestamp: Date.now()
    };
    
    if (DUMP_MESSAGES) {
        logger.log(`[DUMP INCIDENT] ${notificationId} - ${incident.title}`, LOGGER_COLORS.MAGENTA);
        logger.inspect(newIncident);
        return;
    }

    try {
        const id = await addIncident(newIncident);
        logger.log(`[INCIDENT LOG] Created incident ${id} - ${incident.title}`);
    } catch (err) {
        logger.error(`[INCIDENT LOG] Failed to save incident:`, err);
    }
}