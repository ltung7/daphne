import { sendRenderedEmail } from '$lib/mails/mailer';
import type { Component } from 'svelte';
import nodemailer from 'nodemailer';
import { 
    getNotificationMessages, 
    interpolate, 
    type NotificationMessages, 
    type NotificationType 
} from './localizedMailerMessages';

/** Props injected into every localized email component */
export interface LocalizedEmailProps {
    _messages: NotificationMessages;
    locale: App.Locale;
}

/**
 * Send email with explicit locale - renders Svelte component with localized messages.
 * Uses original sendRenderedEmail under the hood.
 * 
 * @param to - Recipient email(s)
 * @param component - Svelte component accepting { _messages: NotificationMessages, locale: App.Locale, ...props }
 * @param args - Component props + locale
 * @param options - Nodemailer options (attachments, etc.)
 */
export const sendLocalizedRenderedEmail = async <T extends Record<string, any>>(
    to: string | string[],
    component: Component<T & LocalizedEmailProps>,
    args: Omit<T, '_messages'> & { locale: App.Locale },
    options: nodemailer.SendMailOptions = {}
) => {
    const { locale } = args;
    const _messages = getNotificationMessages(locale);

    const componentArgs = {
        ...args,
        _messages
    } as T & LocalizedEmailProps;

    return await sendRenderedEmail(to, component, componentArgs, options);
};

// Re-export for convenience
export { getNotificationMessages, interpolate };
export type { NotificationMessages, NotificationType };