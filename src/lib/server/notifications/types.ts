import type { NotificationMessages } from './localized/localizedMailerMessages';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationContext {
    locale: App.Locale;
    m: NotificationMessages;
    user: App.BaseContact;
}

export interface EmailPayload {
    subject: string;
    htmlBody: string;
    component?: any;
    props?: any;
}

export interface WebPushPayload {
    title: string;
    body: string;
    icon?: string;
    click_action?: string;
}

export interface NotificationDefinition<TData> {
    id: string;
    priority: NotificationPriority;
    email?: (data: TData, ctx: NotificationContext) => EmailPayload | Promise<EmailPayload>;
    push?: (data: TData, ctx: NotificationContext) => WebPushPayload | Promise<WebPushPayload>;
    sms?: (data: TData, ctx: NotificationContext) => string | Promise<string>;
    inapp?: (data: TData, ctx: NotificationContext) => string | Promise<string>;
    webhook?: (data: TData, ctx: NotificationContext) => any;
}