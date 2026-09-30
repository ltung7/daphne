import { logger } from '$lib/utils/logger';
import admin from 'firebase-admin';
import { initialize } from '$lib/server/db/firebase/firebase';
import { PUBLIC_URL } from '$env/static/public';
import type { TokenMessage } from './fcm-message.types';

export interface WebPushPayload {
    title: string;
    body: string;
    icon?: string;
    click_action?: string;
}

/**
 * Sends a push notification to a specific device via Firebase Cloud Messaging.
 * Uses data-only message to avoid duplicate notifications (FCM auto + service worker).
 * @param fcmToken The Firebase Cloud Messaging token of the target device.
 * @param payload The notification payload including title, body, icon, click_action.
 */
export async function sendWebPush(fcmToken: string, payload: WebPushPayload) {
    if (!fcmToken) {
        throw new Error('FCM token is required to send a web push notification.');
    }

    initialize();

    const { title, body, icon, click_action } = payload;

    // Prepend PUBLIC_URL to click_action if it's a relative path (starts with "/")
    // If click_action is not provided or empty, default to PUBLIC_URL
    const processedClickAction = click_action && click_action.startsWith('/')
        ? PUBLIC_URL + click_action
        : click_action || PUBLIC_URL;

    const message: TokenMessage = {
        data: {
            title,
            body,
            ...(icon && { icon }),
            ...(processedClickAction && { click_action: processedClickAction }),
        },
        token: fcmToken
    };

    try {
        const response = await admin.messaging().send(message);
        logger.log('Successfully sent message: ' + response);
        return response;
    } catch (error) {
        logger.error(error);
        throw error;
    }
}
