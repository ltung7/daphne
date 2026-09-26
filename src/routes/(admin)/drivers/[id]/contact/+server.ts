import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDriver } from '$lib/server/db/firebase/drivers.fdb';
import { sendAdminNotification, type AdminNotificationData } from '$lib/server/notifications';

const ALLOWED_CHANNELS = ['email', 'sms', 'push'] as const;

export const POST: RequestHandler = async ({ params, request }) => {
    const driverId = params.id;
    
    if (!driverId) {
        throw error(400, 'Driver ID is required');
    }

    const driver = await getDriver(driverId);
    
    if (!driver) {
        throw error(404, 'Driver not found');
    }

    const body = await request.json();
    const { subject, message, channels } = body as AdminNotificationData;

    if (!message || typeof message !== 'string') {
        throw error(400, 'Message is required');
    }

    if (channels && !Array.isArray(channels)) {
        throw error(400, 'Channels must be an array');
    }

    if (channels) {
        const invalidChannels = channels.filter(c => !ALLOWED_CHANNELS.includes(c as typeof ALLOWED_CHANNELS[number]));
        if (invalidChannels.length > 0) {
            throw error(400, `Invalid channels: ${invalidChannels.join(', ')}. Allowed: ${ALLOWED_CHANNELS.join(', ')}`);
        }
    }

    const baseContact = {
        id: driver.id,
        email: driver.email,
        name: driver.name,
        preferredLanguage: driver.preferredLanguage,
        phone: driver.phone,
        fcmToken: driver.fcmToken,
    };

    try {
        await sendAdminNotification(baseContact, {
            subject,
            message,
            channels,
        });

        return json({ 
            success: true, 
            message: 'Notification sent',
            channels: channels || ALLOWED_CHANNELS
        });
    } catch (err) {
        console.error('Failed to send admin notification:', err);
        throw error(500, 'Failed to send notification');
    }
};