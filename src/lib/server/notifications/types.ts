import type { MessageStructure } from './localized/localizedMailerMessages';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationContext {
    title: string;
    body: string;
    title_pl: string;
    body_pl: string;
    locale: App.Locale;
    m: MessageStructure; // Localized dictionary for the specific notification
    m_pl: MessageStructure; // Forced Polish dictionary for internal/incident logging
    user: App.BaseContact | null; // Recipient data
    isAdminCopy?: boolean; // Determines if this notification is a carbon copy to admins
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

export interface IncidentPayload {
    title: string;
    description: string;
    category: App.Incident.Category;
    source?: App.Incident.Source;
    type?: App.NotificationType;
}

interface BaseMessage {
    title: string;
    body: string;
}

export interface NotificationDefinition<TData> {
    id: App.NotificationType;
    priority: NotificationPriority;
    admin: boolean;
    client: boolean;
    getBaseMessage?: (m: MessageStructure, data: TData) => BaseMessage;
    email?: (data: TData, ctx: NotificationContext) => EmailPayload | Promise<EmailPayload>;
    push?: (data: TData, ctx: NotificationContext) => WebPushPayload | Promise<WebPushPayload>;
    sms?: (data: TData, ctx: NotificationContext) => string | Promise<string>;
    inapp?: (data: TData, ctx: NotificationContext) => string | Promise<string>;
    webhook?: (data: TData, ctx: NotificationContext) => any;
    incident?: (data: TData, ctx: NotificationContext) => IncidentPayload | false | Promise<IncidentPayload | false>;
}