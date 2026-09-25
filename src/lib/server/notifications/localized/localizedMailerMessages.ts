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

/** Supported notification types (keys in JSON files) */
export type NotificationType =
    | 'reset_password'
    | 'settlement'
    | 'vehicle_assignment'
    | 'vehicle_return'
    | 'document_expiring'
    | 'document_expired'
    | 'balance_negative'
    | 'penalty_added'
    | 'inspection_due'
    | 'inspection_overdue'
    | 'onboarding_approved'
    | 'onboarding_rejected'
    | 'push_enabled'
    | 'common';

/** Type-safe interface for all notification messages - mirrors notifications_pl.json structure */
export interface NotificationMessages {
    reset_password: {
        title: string;
        contents: string;
        footer: string;
        button_text: string;
    };
    settlement: {
        title: string;
        greeting: string;
        summary: string;
        gross_earnings: string;
        platform_commission: string;
        fleet_provision: string;
        cost_deductions: string;
        net_payout: string;
        footer: string;
    };
    vehicle_assignment: {
        title: string;
        greeting: string;
        body: string;
        handover_date: string;
        footer: string;
    };
    vehicle_return: {
        title: string;
        greeting: string;
        body: string;
        return_date: string;
        footer: string;
    };
    document_expiring: {
        title: string;
        greeting: string;
        body: string;
        action_required: string;
        footer: string;
    };
    document_expired: {
        title: string;
        greeting: string;
        body: string;
        consequence: string;
        footer: string;
    };
    balance_negative: {
        title: string;
        greeting: string;
        body: string;
        footer: string;
    };
    penalty_added: {
        title: string;
        greeting: string;
        body: string;
        footer: string;
    };
    inspection_due: {
        title: string;
        greeting: string;
        body: string;
        footer: string;
    };
    inspection_overdue: {
        title: string;
        greeting: string;
        body: string;
        consequence: string;
        footer: string;
    };
    onboarding_approved: {
        title: string;
        greeting: string;
        body: string;
        footer: string;
    };
    onboarding_rejected: {
        title: string;
        greeting: string;
        body: string;
        footer: string;
    };
    push_enabled: {
        title: string;
        greeting: string;
        body: string;
    };
    common: {
        app_name: string;
        footer_app_link: string;
        footer_confidential: string;
        unsubscribe: string;
        unsubscribe_link: string;
    };
}

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

/**
 * Simple variable interpolation for message templates.
 * 
 * @example
 * interpolate(messages.settlement.title, { period: '01.2024' })
 * // => "Rozliczenie za okres 01.2024"
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
    return template.replace(/{(\w+)}/g, (_, key) => String(vars[key] ?? ''));
}

/** Get messages for a specific notification type */
export function getSpecificNotificationMessages<K extends NotificationType>(
    locale: App.Locale,
    type: K
): NotificationMessages[K] {
    return getNotificationMessages(locale)[type];
}

// Backward compatibility for any remaining imports
export type EmailMessages = NotificationMessages;
export type EmailNotificationType = NotificationType;
export const getEmailMessages = getNotificationMessages;