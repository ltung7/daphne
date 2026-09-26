import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDriver } from '$lib/server/db/firebase/drivers.fdb';
import { sendAdminNotification, type AdminNotificationData } from '$lib/server/notifications';

const ALLOWED_TYPES = [ 'push', 'email', 'sms' ] as const;

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
    const { subject, message, type } = body as AdminNotificationData & { type: string };

    if (!message || typeof message !== 'string') {
        throw error(400, 'Message is required');
    }

    if (!type || !ALLOWED_TYPES.includes(type as typeof ALLOWED_TYPES[number])) {
        throw error(400, `Invalid type: ${type}. Allowed: ${ALLOWED_TYPES.join(', ')}`);
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
            channels: [ type as 'push' | 'email' | 'sms' ],
        });

        return json({ 
            success: true, 
            message: 'Notification sent',
            type
        });
    } catch (err) {
        console.error('Failed to send admin notification:', err);
        throw error(500, 'Failed to send notification');
    }
};