import admin from 'firebase-admin';

/**
 * Sends a push notification to a specific device via Firebase Cloud Messaging.
 * @param fcmToken The Firebase Cloud Messaging token of the target device.
 * @param title The title of the notification.
 * @param body The body/content of the notification.
 * @param data Optional payload data.
 */
export async function sendWebPush(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
    if (!fcmToken) {
        throw new Error('FCM token is required to send a web push notification.');
    }

    if (!admin.apps.length) {
        throw new Error('Firebase admin is not initialized. Cannot send push notification.');
    }

    const message = {
        notification: {
            title,
            body
        },
        data: data || undefined,
        token: fcmToken
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        return response;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}
