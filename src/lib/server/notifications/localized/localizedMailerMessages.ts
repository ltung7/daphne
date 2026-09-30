import pl from './messages/notifications_pl.json';
import en from './messages/notifications_en.json';
import hi from './messages/notifications_hi.json';
import ne from './messages/notifications_ne.json';
import uk from './messages/notifications_uk.json';
import be from './messages/notifications_be.json';
import uz from './messages/notifications_uz.json';
import ka from './messages/notifications_ka.json';
import tl from './messages/notifications_tl.json';
import ro from './messages/notifications_ro.json';
import sr from './messages/notifications_sr.json';

export interface BaseMessage {
    title: string;
    body: string;
}

export interface MessageStructure extends BaseMessage {
    [key: string]: string;
}

/** Type-safe interface for all notification messages - mirrors notifications_pl.json structure */
export type NotificationMessages = Record<App.NotificationType, MessageStructure>;

/** Runtime locale map - English is default fallback */
const localeMap: Partial<Record<App.Locale, NotificationMessages>> = {
    pl: pl as NotificationMessages,
    en: en as NotificationMessages,
    hi: hi as NotificationMessages,
    ne: ne as NotificationMessages,
    uk: uk as NotificationMessages,
    be: be as NotificationMessages,
    uz: uz as NotificationMessages,
    ka: ka as NotificationMessages,
    tl: tl as NotificationMessages,
    ro: ro as NotificationMessages,
    sr: sr as NotificationMessages,
};

/**
 * Get notification messages for a locale.
 * Falls back to English if locale not supported.
 * 
 * @param locale - App locale from user preferences (driver.preferredLanguage, etc.) or frontend
 * @returns NotificationMessages for the locale
 * 
 * @example
 * const _messages = getNotificationMessages(locale);
 * const title = _messages.reset_password.title;
 */
export function getNotificationMessages(locale: App.Locale): NotificationMessages {
    return localeMap[locale] ?? localeMap.en!;
}

export function getNotificationMessageNode(locale: App.Locale, key: App.NotificationType): MessageStructure {
    const m = getNotificationMessages(locale)
    return m[key];
}

/**
 * Simple variable interpolation for message templates.
 * 
 * @example
 * interpolate(messages.reset_password.title, { period: '01.2024' })
 * // => "Zresetuj swoje hasło"
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
    return template.replace(/{(\w+)}/g, (_, key) => String(vars[key] ?? ''));
}

    
export function getBaseMessage (m: MessageStructure, data: any): BaseMessage {
    return { title: m.title, body: interpolate(m.body, data) };
}

/** Get messages for a specific notification type */
export function getSpecificNotificationMessages<K extends App.NotificationType>(
    locale: App.Locale,
    type: K
): NotificationMessages[K] {
    return getNotificationMessages(locale)[type];
}

// Backward compatibility for any remaining imports
export type EmailMessages = NotificationMessages;
export type EmailNotificationType = App.NotificationType;
export const getEmailMessages = getNotificationMessages;