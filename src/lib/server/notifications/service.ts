import { getNotificationMessages } from './localized/localizedMailerMessages';
import type { NotificationDefinition, NotificationContext, NotificationPriority } from './types';
import { sendLocalizedRenderedEmail } from './localized/localizedMailer';
import GenericNotificationMail from './channels/GenericNotificationMail.svelte';
import { sendWebPush } from '../services/webpush.service';

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
    data: TData
): Promise<void> {
    // 1. Resolve Preferences
    const prefs = await getUserPreferences(user.id);
    if (!shouldSend(notification.priority, prefs)) {
        console.log(`Notification ${notification.id} dropped for user ${user.id} due to preferences`);
        return;
    }

    // 2. Setup Context
    const locale = user.preferredLanguage || 'pl';
    const ctx: NotificationContext = {
        locale,
        m: getNotificationMessages(locale),
        user
    };

    // 3. Dispatch to Channels in parallel
    const promises: Promise<void>[] = [];

    // --- EMAIL ---
    if (user.email && prefs.channels.email !== false) {
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

    await Promise.allSettled(promises);
}

async function sendEmail<TData>(
    email: string,
    notification: NotificationDefinition<TData>,
    data: TData,
    ctx: NotificationContext
): Promise<void> {
    try {
        const emailData = await notification.email!(data, ctx);
        
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
        if (pushData) sendWebPush(fcmToken, pushData.title, pushData.body)
    } catch (err) {
        console.error(`Push send failed for ${notification.id}:`, err);
    }
}

async function sendInApp<TData>(
    userId: string,
    notification: NotificationDefinition<TData>,
    data: TData,
    ctx: NotificationContext
): Promise<void> {
    try {
        const inappHtml = await notification.inapp!(data, ctx);
        // TODO: Implement Firestore insert for in-app notifications
        console.log(`[IN-APP for ${userId}]`, inappHtml);
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